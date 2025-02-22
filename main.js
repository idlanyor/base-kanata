import './global.js'
import { Sonata, clearMessages, sanitizeBotId } from './bot.js';
import { logger } from './helper/logger.js';
import { groupParticipants, groupUpdate } from './lib/group.js';
import { getMedia } from './helper/mediaMsg.js';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import readline from 'readline';
import { call } from './lib/call.js';
import { addMessageHandler } from './helper/message.js';
import { createSticker, StickerTypes } from 'wa-sticker-formatter';
import Database from './helper/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findJsFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat && stat.isDirectory()) {
            results = results.concat(findJsFiles(filePath));
        }
        else if (file.endsWith('.js')) {
            results.push(filePath);
        }
    });
    return results;
}

async function getPhoneNumber() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const namaSesiPath = path.join(__dirname, globalThis.sessionName);

    try {
        await fs.promises.access(namaSesiPath);
        rl.close();
    } catch {
        return new Promise(resolve => {
            const validatePhoneNumber = (input) => {
                const phoneRegex = /^62\d{9,15}$/;
                return phoneRegex.test(input);
            };
            const askForPhoneNumber = () => {
                logger.showBanner();
                rl.question(chalk.yellowBright("Masukkan nomor telepon (dengan kode negara, contoh: 628xxxxx): "), input => {
                    if (validatePhoneNumber(input)) {
                        logger.success("Nomor telepon valid!");
                        rl.close();
                        resolve(input);
                    } else {
                        logger.error("Nomor telepon tidak valid! Harus diawali '62' dan hanya berisi angka (minimal 10 digit).");
                        askForPhoneNumber();
                    }
                });
            };
            askForPhoneNumber();
        });
    }
}

async function prosesPerintah({ command, sock, m, id, sender, noTel, attf }) {
    try {
        if (!command) return;

        let cmd = '';
        let args = [];

        if (command.startsWith('!')) {
            cmd = command.toLowerCase().substring(1).split(' ')[0];
            args = command.split(' ').slice(1);
        } else {
            [cmd, ...args] = command.split(' ');
            cmd = cmd.toLowerCase();
        }

        // Load semua plugin
        const pluginsDir = path.join(__dirname, 'plugins');
        const plugins = {};

        const pluginFiles = findJsFiles(pluginsDir);
        for (const file of pluginFiles) {
            try {
                const plugin = await import(pathToFileURL(file).href);
                if (!plugin.handler) continue;

                const handlers = Array.isArray(plugin.handler.command) ? 
                    plugin.handler.command : 
                    [plugin.handler.command];

                handlers.forEach(h => {
                    if (typeof h === 'string') {
                        plugins[h.toLowerCase()] = plugin.handler;
                    } else if (h instanceof RegExp) {
                        plugins[h.source.toLowerCase()] = plugin.handler;
                    }
                });

            } catch (err) {
                logger.error(`Error loading plugin ${file}:`, err);
            }
        }

        // Coba proses dengan handler dulu
        const matchedHandler = plugins[cmd];

        if (matchedHandler) {
            // Validasi permission
            if (matchedHandler.isAdmin && !(await m.isAdmin)) {
                await m.reply('❌ *Akses ditolak*\nHanya admin yang dapat menggunakan perintah ini!');
                return;
            }

            if (matchedHandler.isBotAdmin && !(await m.isBotAdmin)) {
                await m.reply('❌ Bot harus menjadi admin untuk menggunakan perintah ini!');
                return;
            }

            if (matchedHandler.isOwner && !(await m.isOwner)) {
                await m.reply('❌ Perintah ini hanya untuk owner bot!');
                return;
            }

            if (matchedHandler.isGroup && !m.isGroup) {
                await m.reply('❌ Perintah ini hanya dapat digunakan di dalam grup!');
                return;
            }

            // Eksekusi handler
            logger.info(`Menjalankan perintah handler: ${cmd}`);
            await matchedHandler.exec({ 
                sock, m, id, 
                args: args.join(' '), 
                sender, noTel, 
                attf, cmd 
            });
            logger.success(`Perintah handler ${cmd} berhasil dijalankan`);
            return;
        }

        // Jika tidak ada handler yang cocok, coba dengan switch case
        logger.info(`Menjalankan perintah switch: ${cmd}`);
        switch(cmd) {
            case 'ping':
                await m.reply('Pong! 🏓');
                break;

            case 'sticker':
            case 's':
                if (!attf) {
                    await m.reply('Kirim gambar dengan caption !sticker atau reply gambar dengan !sticker');
                    return;
                }
                const sticker = await createSticker(attf, {
                    pack: 'Sonata Bot',
                    author: 'V2',
                    type: StickerTypes.FULL,
                    quality: 50
                });
                await sock.sendMessage(id, { sticker });
                break;

            case 'menu2':
                await m.reply(`
📝 *MENU UTAMA*
• !ping - Cek bot aktif
• !sticker - Buat sticker
• !menu - Tampilkan menu
                `);
                break;

            default:
                // Perintah tidak ditemukan
                break;
        }
        logger.success(`Perintah switch ${cmd} berhasil dijalankan`);

    } catch (error) {
        logger.error(`Kesalahan memproses pesan`, error);
    }
}

export async function startBot() {
    try {
        logger.showBanner();
        const phoneNumber = await getPhoneNumber();
        const bot = new Sonata({ phoneNumber, sessionId: globalThis.sessionName });

        bot.start().then(sock => {
            logger.success('Bot berhasil dimulai!');
            logger.divider();
            sock.ev.on('messages.upsert', async chatUpdate => {
                try {
                    let m = chatUpdate.messages[0];
                    m = addMessageHandler(m, sock);
                    
                    // Track message stats
                    await Database.addMessage();
                    
                    if (m.type === 'text' && m.message?.conversation?.startsWith('!')) {
                        await Database.addCommand();
                    }

                    const { remoteJid } = m.key;
                    const sender = m.pushName || remoteJid;
                    const id = remoteJid;
                    const noTel = (id.endsWith('@g.us')) ? m.key.participant.split('@')[0].replace(/[^0-9]/g, '') : remoteJid.split('@')[0].replace(/[^0-9]/g, '');
                    const mediaTypes = ['image', 'video', 'audio'];
                    
                    // Cek tipe chat dan sender
                    if (m.isGroup) {
                        logger.info(`Pesan grup di: ${remoteJid}\nDari: ${m.senderNumber}`);
                    } else {
                        logger.info(`Pesan private dari: ${m.senderNumber}`);
                    }

                    // Cek apakah pesan dari bot sendiri
                    const botId = sanitizeBotId(sock.user.id);
                    if (m.sender === botId) {
                        logger.info('Pesan dari bot sendiri, abaikan');
                        return;
                    }
                    
                    if (mediaTypes.includes(m.type)) {
                        const messageType = `${m.type}Message`;
                        const buffer = m.message[messageType] || 
                                     m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[messageType];
                        
                        if (buffer) {
                            const mediaBuffer = await getMedia({ message: { [messageType]: buffer } });
                            const caption = buffer.caption || m.message?.extendedTextMessage?.text;
                            const mime = buffer.mime || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[messageType]?.mime;
                            
                            await prosesPerintah({ 
                                command: caption,
                                sock,
                                m,
                                id,
                                sender,
                                noTel,
                                attf: mediaBuffer,
                                mime
                            });
                        }
                    }

                    const buttonTypes = {
                        interactiveResponseMessage: m => JSON.parse(m.nativeFlowResponseMessage?.paramsJson)?.id,
                        templateButtonReplyMessage: m => m.selectedId,
                        buttonsResponseMessage: m => m.selectedButtonId
                    };

                    for (const [type, getCmd] of Object.entries(buttonTypes)) {
                        if (m.message?.[type]) {
                            const cmd = getCmd(m.message[type]);
                            await prosesPerintah({ command: `!${cmd}`, sock, m, id, sender, noTel });
                            break;
                        }
                    }

                    const chat = await clearMessages(m);
                    if (chat) {
                        const parsedMsg = chat.chatsFrom === "private" ? chat.message : chat.participant?.message;

                        await prosesPerintah({ command: parsedMsg, sock, m, id, sender, noTel });
                    }

                } catch (error) {
                    logger.error('Kesalahan menangani pesan:', error);
                }
            });

            sock.ev.on('group-participants.update', ev => groupParticipants(ev, sock));
            sock.ev.on('groups.update', ev => groupUpdate(ev, sock));
            sock.ev.on('call', (callEv) => {
                call(callEv, sock)
            })
        }).catch(error => logger.error('Kesalahan fatal memulai bot:', error));

    } catch (error) {
        logger.error('Gagal memulai bot:', error);
        process.exit(1);
    }
}

startBot();
