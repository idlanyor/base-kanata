import './global.js'
import { Kanata, clearMessages, sanitizeBotId } from './bot.js';
import { logger } from './helper/logger.js';
import { getMedia } from './helper/mediaMsg.js';
import { cacheGroupMetadata } from './helper/caching.js'
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import readline from 'readline';
import { call } from './lib/call.js';
import { addMessageHandler } from './helper/message.js';
import Database from './helper/database.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { messageFilter } from './helper/cooldown.js';
import autoNotification from './helper/scheduler.js';
// import util from 'util';
// import { processMessageWithAI } from './helper/gemini.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

export function findJsFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        // Hanya ambil file .js dari direktori utama, tidak rekursif ke subfolder
        if (stat && stat.isFile() && file.endsWith('.js')) {
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


        // --- FITUR ANTILINK GRUP ---
        if (m.isGroup) {
            // Whitelist link pada media (image, video, audio)
            if (["image", "video", "audio"].includes(m.type)) {
                // Lewati pengecekan antilink untuk caption media
            } else if (messageFilter.isPlatformLink(command)) {
                // Whitelist link platform populer (YouTube, Facebook, TikTok, dll)
            } else {
                const group = await Database.getGroup(m.chat);
                const isAdmin = await m.isAdmin;
                const isBotAdmin = await m.isBotAdmin;
                const isOwner = await m.isOwner();
                // Jika fitur antilink aktif, bot admin, pengirim bukan admin/owner, dan pesan mengandung link
                if (group.antiLink && isBotAdmin && !isAdmin && !isOwner && messageFilter.isLink(command)) {
                    await m.reply(`🚫 *Link terdeteksi!*
Maaf, mengirim link di grup ini tidak diperbolehkan. Kamu akan dikeluarkan dari grup.`);
                    await sock.sendMessage(m.chat, { delete: m.key });
                    await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
                    return;
                }
            }
        }

        // --- FITUR ANTITOXIC GRUP ---
        if (m.isGroup) {
            const group = await Database.getGroup(m.chat);
            const isBotAdmin = await m.isBotAdmin;
            const isAdmin = await m.isAdmin;
            const isOwner = await m.isOwner();
            if (group.antiToxic && isBotAdmin && !isAdmin && !isOwner && messageFilter.isToxic(command)) {
                // Tambah warning
                const user = await Database.getUser(m.sender);
                const warnings = (user.warnings || 0) + 1;
                await Database.updateUser(m.sender, { warnings });
                if (warnings < 3) {
                    await m.reply(`🤬 *Kata kasar terdeteksi!*
Maaf, kata toxic tidak diperbolehkan di grup ini.
⚠️ Warning: ${warnings}/3
Jika mencapai 3 warning, kamu akan dikeluarkan dari grup.`);
                    await sock.sendMessage(m.chat, { delete: m.key });
                } else {
                    // Kick user
                    await Database.updateUser(m.sender, { warnings: 0 });
                    await m.reply(`🚫 Kamu telah dikeluarkan dari grup karena melanggar aturan toxic 3x!`);
                    await sock.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
                }
                return;
            }
        }

        // Log informasi pesan masuk
        // const msgType = Object.keys(m.message)[0]
        // const isGroup = id.endsWith('@g.us')
        // await new Promise(resolve => setTimeout(resolve, 2000));
        // const groupName = isGroup ? (await cacheGroupMetadata(sock, id)).subject : 'Private Chat';


        // logger.info('📩 INCOMING MESSAGE')
        // logger.info(`├ From    : ${m.pushName || 'Unknown'} (@${noTel})`)
        // logger.info(`├ Chat    : ${isGroup ? '👥 ' + groupName : '👤 Private'}`)
        // logger.info(`├ Type    : ${msgType}`)
        // logger.info(`└ Content : ${command}`)
        // logger.divider()

        // Cek mode bot
        const settings = await Database.getSettings()
        const isOwner = await m.isOwner

        if (settings.botMode === 'self-me' && !isOwner) {
            return
        }

        if (settings.botMode === 'self-private') {
            if (id.endsWith('@g.us')) {
                return
            }
        }

        // --- RESTRIKSI BOT ADMIN DI GRUP ---
        if (m.isGroup) {
            const isBotAdmin = await m.isBotAdmin;
            if (!isBotAdmin) {
                // Bot bukan admin di grup, blokir semua akses
                await m.reply(`🚫 *BOT TIDAK ADMIN*\n\nMaaf, bot harus menjadi admin di grup ini untuk dapat mengakses menu dan fitur.\n\nSilakan hubungi admin grup untuk menjadikan bot sebagai admin terlebih dahulu.`);
                return;
            }
        }

        // Coba proses dengan Gemini AI terlebih dahulu
        if (m.key.fromMe) return
        // const aiResult = await processMessageWithAI(command, m.sender);
        // if (aiResult) {
        //     command = '!' + aiResult.command + ' ' + aiResult.args;
        // }

        let cmd = '';
        let args = [];

        if (command.startsWith('.')) {
            cmd = command.toLowerCase().substring(1).split(' ')[0];
            args = command.split(' ').slice(1);

            // Log eksekusi command
            logger.info('⚡ EXECUTE COMMAND')
            logger.info(`├ Command : ${cmd}`)
            logger.info(`├ Args    : ${args.join(' ') || '-'}`)
            logger.info(`├ From    : ${m.pushName || 'Unknown'} (@${noTel})`)
            logger.info(`└ Chat    : ${id.endsWith('@g.us') ? '👥 Group' : '👤 Private'}`)
            logger.divider()
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

            await matchedHandler.exec({
                sock, m, id,
                args: args.join(' '),
                sender, noTel,
                attf, cmd
            });
            return;
        }

        // Jika tidak ada handler yang cocok, coba dengan switch case
        switch (cmd) {
            case 'menu2':
            case 'help2':
            case 'h2':
                try {
                    const botName = "Kanata Bot";
                    const owner = globalThis.owner;
                    const prefix = "!";
                    const settings = await Database.getSettings();

                    // Emoji dan deskripsi mode
                    const modeEmoji = {
                        'public': '📢',
                        'self-private': '👤',
                        'self-me': '👑'
                    };
                    const modeDesc = {
                        'public': 'Semua bisa menggunakan',
                        'self-private': 'Private chat & owner di grup',
                        'self-me': 'Hanya owner'
                    };

                    // Ambil semua plugin commands
                    const pluginsDir = path.join(__dirname, 'plugins')
                    const categories = {}

                    // Load plugin commands
                    const pluginFiles = findJsFiles(pluginsDir)
                    for (const file of pluginFiles) {
                        try {
                            const plugin = await import(pathToFileURL(file).href)
                            if (!plugin.handler) continue

                            // Gunakan handler.category atau 'main' sebagai default
                            const category = plugin.handler.category || 'main'
                            if (category.toUpperCase() === 'HIDDEN') continue

                            if (!categories[category]) {
                                categories[category] = []
                            }

                            const commands = Array.isArray(plugin.handler.command) ?
                                plugin.handler.command :
                                [plugin.handler.command]

                            categories[category].push({
                                commands,
                                tags: plugin.handler.tags || []
                            })
                        } catch (err) {
                            logger.error(`Error loading plugin ${file}:`, err)
                        }
                    }

                    // Buat menu text
                    let menuText = `╭─「 ${botName} 」
│
│ 👋 Hai @${m.sender.split("@")[0]}!
│ 
│ 📱 *INFO BOT*
│ ▸ Nama: ${botName}
│ ▸ Owner: ${owner}
│ ▸ Prefix: ${prefix}
│ ▸ Mode: ${modeEmoji[settings.botMode]} ${settings.botMode} 
│ ▸ Status: ${modeDesc[settings.botMode]}
│ ▸ Runtime: ${await runtime()}
│\n`;

                    // Tambahkan commands per kategori
                    for (const [category, plugins] of Object.entries(categories)) {
                        if (plugins.length === 0) continue

                        menuText += `│ ${category.toUpperCase()}\n`;
                        for (const plugin of plugins) {
                            const cmdList = plugin.commands.map(cmd => `${prefix}${cmd}`).join(', ')
                            menuText += `│ ▸ ${cmdList}\n`
                        }
                        menuText += '│\n'
                    }

                    menuText += `╰────────────⭐\n\n` +
                        `*Note:* \n` +
                        `• Mode saat ini: ${modeEmoji[settings.botMode]} ${settings.botMode}\n` +
                        `• ${modeDesc[settings.botMode]}\n` +
                        `• Gunakan bot dengan bijak!`;

                    await m.reply({
                        text: menuText,
                        mentions: [m.sender],
                        contextInfo: {
                            externalAdReply: {
                                title: "乂 Menu List 乂",
                                body: botName,
                                thumbnailUrl: `${globalThis.ppUrl}`,
                                sourceUrl: "https://whatsapp.com/channel/0029VagADOLLSmbaxFNswH1m",
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    });

                } catch (error) {
                    console.error('Error in menu:', error);
                    await m.reply('❌ Terjadi kesalahan saat menampilkan menu');
                }
                break;

            case '#': // Untuk exec
                try {
                    if (!await m.isOwner) {
                        await m.reply('❌ Perintah ini hanya untuk owner bot!');
                        return;
                    }

                    const execCommand = args.join(' ');
                    if (!execCommand) {
                        await m.reply('❌ Masukkan perintah yang akan dieksekusi!');
                        return;
                    }

                    const { stdout, stderr } = await execAsync(execCommand);
                    let result = '';

                    if (stdout) result += `📤 *STDOUT*\n\n${stdout}\n`;
                    if (stderr) result += `⚠️ *STDERR*\n\n${stderr}\n`;

                    if (!result) result = '✅ Executed with no output';

                    await m.reply(result);
                } catch (error) {
                    await m.reply(`❌ *ERROR*\n\n${error.message}`);
                }
                break;

            case '=>': // Untuk eval - DEPRECATED for security
                try {
                    if (!await m.isOwner) {
                        await m.reply('❌ Perintah ini hanya untuk owner bot!');
                        return;
                    }

                    // Redirect to safer eval plugin
                    await m.reply('❌ *DEPRECATED FOR SECURITY*\n\nEval functionality in main.js has been disabled due to security concerns. Please use the safer ">" command from the eval plugin instead.');
                } catch (error) {
                    await m.reply(`❌ *ERROR*\n\n${error.message}`);
                }
                break;

            case 'bass': // Efek bass boost
                try {
                    if (!m.quoted || !m.quoted.message?.audioMessage) {
                        await m.reply('❌ Reply audio yang ingin diberi efek bass!');
                        return;
                    }

                    await m.reply('⏳ Sedang memproses audio...');
                    const audio = await m.quoted.download();
                    const inputPath = `./temp/${m.chat}_input.mp3`;
                    const outputPath = `./temp/${m.chat}_bass.mp3`;

                    await fs.promises.writeFile(inputPath, audio);
                    await execAsync(`ffmpeg -i ${inputPath} -af "bass=g=15:f=110:w=0.6" ${outputPath}`);

                    await sock.sendMessage(m.chat, {
                        audio: { url: outputPath },
                        mimetype: 'audio/mp4',
                        ptt: false
                    }, { quoted: m });

                    // Hapus file temporary
                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);
                } catch (error) {
                    await m.reply(`❌ Error: ${error.message}`);
                }
                break;

            case 'nightcore': // Efek nightcore (pitch up + tempo up)
                try {
                    if (!m.quoted || !m.quoted.message?.audioMessage) {
                        await m.reply('❌ Reply audio yang ingin diberi efek nightcore!');
                        return;
                    }

                    await m.reply('⏳ Sedang memproses audio...');
                    const audio = await m.quoted.download();
                    const inputPath = `./temp/${m.chat}_input.mp3`;
                    const outputPath = `./temp/${m.chat}_nightcore.mp3`;

                    await fs.promises.writeFile(inputPath, audio);
                    await execAsync(`ffmpeg -i ${inputPath} -af "asetrate=44100*1.25,aresample=44100,atempo=1.05" ${outputPath}`);

                    await sock.sendMessage(m.chat, {
                        audio: { url: outputPath },
                        mimetype: 'audio/mp4',
                        ptt: false
                    }, { quoted: m });

                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);
                } catch (error) {
                    await m.reply(`❌ Error: ${error.message}`);
                }
                break;

            case 'slow': // Efek slow motion
                try {
                    if (!m.quoted || !m.quoted.message?.audioMessage) {
                        await m.reply('❌ Reply audio yang ingin diberi efek slow!');
                        return;
                    }

                    await m.reply('⏳ Sedang memproses audio...');
                    const audio = await m.quoted.download();
                    const inputPath = `./temp/${m.chat}_input.mp3`;
                    const outputPath = `./temp/${m.chat}_slow.mp3`;

                    await fs.promises.writeFile(inputPath, audio);
                    await execAsync(`ffmpeg -i ${inputPath} -af "atempo=0.8" ${outputPath}`);

                    await sock.sendMessage(m.chat, {
                        audio: { url: outputPath },
                        mimetype: 'audio/mp4',
                        ptt: false
                    }, { quoted: m });

                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);
                } catch (error) {
                    await m.reply(`❌ Error: ${error.message}`);
                }
                break;

            case 'robot': // Efek suara robot
                try {
                    if (!m.quoted || !m.quoted.message?.audioMessage) {
                        await m.reply('❌ Reply audio yang ingin diberi efek robot!');
                        return;
                    }

                    await m.reply('⏳ Sedang memproses audio...');
                    const audio = await m.quoted.download();
                    const inputPath = `./temp/${m.chat}_input.mp3`;
                    const outputPath = `./temp/${m.chat}_robot.mp3`;

                    await fs.promises.writeFile(inputPath, audio);
                    await execAsync(`ffmpeg -i ${inputPath} -af "afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75" ${outputPath}`);

                    await sock.sendMessage(m.chat, {
                        audio: { url: outputPath },
                        mimetype: 'audio/mp4',
                        ptt: false
                    }, { quoted: m });

                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);
                } catch (error) {
                    await m.reply(`❌ Error: ${error.message}`);
                }
                break;

            case 'reverse':
                try {
                    if (!m.quoted || !m.quoted.message?.audioMessage) {
                        await m.reply('❌ Reply audio yang ingin direverse!');
                        return;
                    }

                    await m.reply('⏳ Sedang memproses audio...');
                    const audio = await m.quoted.download();
                    const inputPath = `./temp/${m.chat}_input.mp3`;
                    const outputPath = `./temp/${m.chat}_reverse.mp3`;

                    await fs.promises.writeFile(inputPath, audio);
                    await execAsync(`ffmpeg -i ${inputPath} -af "areverse" ${outputPath}`);

                    await sock.sendMessage(m.chat, {
                        audio: { url: outputPath },
                        mimetype: 'audio/mp4',
                        ptt: false
                    }, { quoted: m });

                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);
                } catch (error) {
                    await m.reply(`❌ Error: ${error.message}`);
                }
                break;

            case 'tovn': // Konversi audio ke voice note
                try {
                    if (!m.quoted || !m.quoted.message?.audioMessage) {
                        await m.reply('❌ Reply audio yang ingin dikonversi ke voice note!');
                        return;
                    }

                    await sock.sendMessage(m.chat, {
                        react: { text: '⏳', key: m.key }
                    });

                    const audio = await m.quoted.download();
                    const inputPath = `./temp/${m.chat}_input.mp3`;
                    const outputPath = `./temp/${m.chat}_vn.ogg`;

                    await fs.promises.writeFile(inputPath, audio);
                    // Konversi ke format OGG dengan codec opus
                    await execAsync(`ffmpeg -i ${inputPath} -af "silenceremove=1:0:-50dB" -c:a libopus -b:a 128k ${outputPath}`);

                    await sock.sendMessage(m.chat, {
                        audio: { url: outputPath },
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt: true // Set true untuk mengirim sebagai voice note
                    }, { quoted: m });

                    // Hapus file temporary
                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);

                    await sock.sendMessage(m.chat, {
                        react: { text: '✅', key: m.key }
                    });
                } catch (error) {
                    console.error('Error in tovn:', error);
                    await m.reply(`❌ Error: ${error.message}`);
                    await sock.sendMessage(m.chat, {
                        react: { text: '❌', key: m.key }
                    });
                }
                break;

            case 'tomp3': // Konversi voice note ke MP3
                try {
                    if (!m.quoted || !m.quoted.message?.audioMessage) {
                        await m.reply('❌ Reply voice note yang ingin dikonversi ke MP3!');
                        return;
                    }

                    await sock.sendMessage(m.chat, {
                        react: { text: '⏳', key: m.key }
                    });

                    const audio = await m.quoted.download();
                    const inputPath = `./temp/${m.chat}_input.opus`;
                    const outputPath = `./temp/${m.chat}_audio.mp3`;

                    await fs.promises.writeFile(inputPath, audio);
                    // Konversi ke format MP3 dengan kualitas yang lebih baik
                    await execAsync(`ffmpeg -i ${inputPath} -acodec libmp3lame -ab 320k ${outputPath}`);

                    await sock.sendMessage(m.chat, {
                        audio: { url: outputPath },
                        mimetype: 'audio/mp4',
                        ptt: false // Set false untuk mengirim sebagai MP3
                    }, { quoted: m });

                    // Hapus file temporary
                    fs.unlinkSync(inputPath);
                    fs.unlinkSync(outputPath);

                    await sock.sendMessage(m.chat, {
                        react: { text: '✅', key: m.key }
                    });
                } catch (error) {
                    console.error('Error in tomp3:', error);
                    await m.reply(`❌ Error: ${error.message}`);
                    await sock.sendMessage(m.chat, {
                        react: { text: '❌', key: m.key }
                    });
                }
                break;

            case 'getpp': // Get Profile Picture
                try {
                    let who;
                    if (m.quoted) {
                        who = m.quoted.sender;
                    } else if (args[0]) {
                        who = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                    } else {
                        who = m.sender;
                    }

                    await sock.sendMessage(m.chat, {
                        react: { text: '⏳', key: m.key }
                    });

                    try {
                        let pp = await sock.profilePictureUrl(who, 'image');
                        await sock.sendMessage(m.chat, {
                            image: { url: pp },
                            caption: `*Profile Picture*\n ${m.quoted?.pushName || m.pushName || who.split('@')[0]}`,
                            mentions: [who],
                            contextInfo: {
                                externalAdReply: {
                                    title: '乂 Profile Picture 乂',
                                    body: `@${who.split('@')[0]}`,
                                    thumbnailUrl: pp,
                                    sourceUrl: pp,
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        }, { quoted: m });
                    } catch {
                        // Jika tidak ada PP, kirim pesan error
                        await m.reply(`❌ User tidak memiliki foto profil atau foto profil private`);
                    }

                    await sock.sendMessage(m.chat, {
                        react: { text: '✅', key: m.key }
                    });
                } catch (error) {
                    console.error('Error in getpp:', error);
                    await m.reply(`❌ Error: ${error.message}`);
                    await sock.sendMessage(m.chat, {
                        react: { text: '❌', key: m.key }
                    });
                }
                break;

            case 'getppgc': // Get Group Profile Picture
                try {
                    if (!m.isGroup) {
                        await m.reply('❌ Perintah ini hanya bisa digunakan di dalam grup!');
                        return;
                    }

                    await sock.sendMessage(m.chat, {
                        react: { text: '⏳', key: m.key }
                    });

                    try {
                        let pp = await sock.profilePictureUrl(m.chat, 'image');
                        await sock.sendMessage(m.chat, {
                            image: { url: pp },
                            caption: `*Group Profile Picture*\n${(await cacheGroupMetadata(sock, m.chat)).subject}`,
                            contextInfo: {
                                externalAdReply: {
                                    title: '乂 Group Profile Picture 乂',
                                    body: (await cacheGroupMetadata(sock, m.chat)).subject,
                                    thumbnailUrl: pp,
                                    sourceUrl: pp,
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        }, { quoted: m });
                    } catch {
                        await m.reply(`❌ Grup tidak memiliki foto profil atau foto profil private`);
                    }

                    await sock.sendMessage(m.chat, {
                        react: { text: '✅', key: m.key }
                    });
                } catch (error) {
                    console.error('Error in getppgc:', error);
                    await m.reply(`❌ Error: ${error.message}`);
                    await sock.sendMessage(m.chat, {
                        react: { text: '❌', key: m.key }
                    });
                }
                break;


            case 'catalog':
            case 'katalog':
                try {
                    const { catalogCmd } = await import('./plugins/misc/store.js');
                    await catalogCmd(sock, m);
                } catch (error) {
                    logger.error('Error in catalog command:', error);
                    await m.reply('❌ Terjadi kesalahan saat menampilkan katalog.');
                }
                break;

            case 'order':
                try {
                    const { orderCmd } = await import('./plugins/misc/store.js');
                    await orderCmd(sock, m);
                } catch (error) {
                    logger.error('Error in order command:', error);
                    await m.reply('❌ Terjadi kesalahan saat memproses pesanan.');
                }
                break;

            case 'order-status':
                try {
                    const { orderStatusCmd } = await import('./plugins/misc/store.js');
                    await orderStatusCmd(sock, m);
                } catch (error) {
                    logger.error('Error in order status command:', error);
                    await m.reply('❌ Terjadi kesalahan saat mengecek status pesanan.');
                }
                break;

            case 'my-orders':
                try {
                    const { myOrdersCmd } = await import('./plugins/misc/store.js');
                    await myOrdersCmd(sock, m);
                } catch (error) {
                    logger.error('Error in my orders command:', error);
                    await m.reply('❌ Terjadi kesalahan saat mengambil daftar pesanan.');
                }
                break;

            case 'payment-done':
                try {
                    const { paymentDoneCmd } = await import('./plugins/misc/store.js');
                    await paymentDoneCmd(sock, m);
                } catch (error) {
                    logger.error('Error in payment done command:', error);
                    await m.reply('❌ Terjadi kesalahan saat memproses konfirmasi pembayaran.');
                }
                break;

            case 'payment-cancel':
                try {
                    const { paymentCancelCmd } = await import('./plugins/misc/store.js');
                    await paymentCancelCmd(sock, m);
                } catch (error) {
                    logger.error('Error in payment cancel command:', error);
                    await m.reply('❌ Terjadi kesalahan saat membatalkan pembayaran.');
                }
                break;

            // Premium Commands
            case 'premium-catalog':
                try {
                    const { premiumCatalogCmd } = await import('./plugins/misc/premium.js');
                    await premiumCatalogCmd(sock, m);
                } catch (error) {
                    logger.error('Error in premium catalog command:', error);
                    await m.reply('❌ Terjadi kesalahan saat menampilkan katalog premium.');
                }
                break;

            case 'premium-order':
                try {
                    const { premiumOrderCmd } = await import('./plugins/misc/premium.js');
                    await premiumOrderCmd(sock, m);
                } catch (error) {
                    logger.error('Error in premium order command:', error);
                    await m.reply('❌ Terjadi kesalahan saat memproses pesanan premium.');
                }
                break;

            case 'premium-status':
                try {
                    const { premiumStatusCmd } = await import('./plugins/misc/premium.js');
                    await premiumStatusCmd(sock, m);
                } catch (error) {
                    logger.error('Error in premium status command:', error);
                    await m.reply('❌ Terjadi kesalahan saat mengecek status pesanan premium.');
                }
                break;

            case 'my-premium-orders':
                try {
                    const { myPremiumOrdersCmd } = await import('./plugins/misc/premium.js');
                    await myPremiumOrdersCmd(sock, m);
                } catch (error) {
                    logger.error('Error in my premium orders command:', error);
                    await m.reply('❌ Terjadi kesalahan saat mengambil daftar pesanan premium.');
                }
                break;

            case 'premium-payment-done':
                try {
                    const { premiumPaymentDoneCmd } = await import('./plugins/misc/premium.js');
                    await premiumPaymentDoneCmd(sock, m);
                } catch (error) {
                    logger.error('Error in premium payment done command:', error);
                    await m.reply('❌ Terjadi kesalahan saat memproses konfirmasi pembayaran premium.');
                }
                break;

            case 'premium-payment-cancel':
                try {
                    const { premiumPaymentCancelCmd } = await import('./plugins/misc/premium.js');
                    await premiumPaymentCancelCmd(sock, m);
                } catch (error) {
                    logger.error('Error in premium payment cancel command:', error);
                    await m.reply('❌ Terjadi kesalahan saat membatalkan pembayaran premium.');
                }
                break;

            default:
                // Perintah tidak ditemukan
                break;
        }

    } catch (error) {
        logger.error(`Kesalahan memproses pesan`, error);
    }
}

export async function startBot() {
    try {
        logger.showBanner();
        const phoneNumber = await getPhoneNumber();
        const bot = new Kanata({
            phoneNumber,
            sessionId: globalThis.sessionName,
            useStore: false
        });

        bot.start().then(async (sock) => {
            logger.success('Bot berhasil dimulai!');
            logger.divider();
            
            // Initialize auto notification scheduler
            autoNotification.init(sock);
            
            const checkAndFollowChannel = async () => {
                try {
                    const nl = await sock.newsletterMetadata('jid', '120363305152329358@newsletter')
                    if (nl.viewer_metadata?.view_role === 'GUEST') {
                        await sock.newsletterFollow('120363305152329358@newsletter')
                    }
                } catch (error) {
                    logger.error('Gagal mengecek/follow channel:', error)
                }
            }
            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect } = update;

                if (connection === 'close') {
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;

                    logger.error(`🔴 Koneksi terputus! ${lastDisconnect.error}`);
                    
                    // Stop scheduler when connection is lost
                    autoNotification.stop();

                    if (shouldReconnect) {
                        logger.info(`♻️ Mencoba menyambungkan kembali...`);
                    } else {
                        logger.error(`🚫 Sesi kadaluarsa. Harap login Ulang.`);
                        await fs.remove(`./${globalThis.sessionName}`);
                        await startBot();
                        process.exit(1);
                    }
                }

                if (connection === 'open') {
                    await checkAndFollowChannel();
                    // Restart scheduler when connection is restored
                    autoNotification.init(sock);
                }
            });

            sock.ev.on('messages.upsert', async chatUpdate => {
                try {
                    let m = chatUpdate.messages[0];
                    m = addMessageHandler(m, sock);
                    await Database.addMessage();

                    if (m.type === 'text' && m.message?.conversation?.startsWith('!')) {
                        await Database.addCommand();
                    }
                    
                    

                    const { remoteJid } = m.key;
                    const sender = m.pushName || remoteJid;
                    const id = remoteJid;
                    const noTel = (id.endsWith('@g.us')) ? m.key.participant?.split('@')[0]?.replace(/[^0-9]/g, '') : id.split('@')[0]?.replace(/[^0-9]/g, '');
                    const mediaTypes = ['image', 'video', 'audio'];

                    // Cek tipe chat dan sender
                    // if (m.isGroup) {
                    //     logger.info(`Pesan grup di: ${remoteJid}\nDari: ${m.senderNumber}`);
                    // } else {
                    //     logger.info(`Pesan private dari: ${m.senderNumber}`);
                    // }

                    // Cek apakah pesan dari bot sendiri
                    const botId = sanitizeBotId(sock.user.id);

                    if (mediaTypes.includes(m.type)) {
                        const messageType = `${m.type}Message`;
                        const buffer = m.message[messageType] ||
                            m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[messageType];

                        if (buffer) {
                            const mediaBuffer = await getMedia({ message: { [messageType]: buffer } });
                            const caption = buffer.caption || m.message?.extendedTextMessage?.text;
                            const mime = buffer.mime || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[messageType]?.mime;

                            // Check if this is a payment proof image
                            // if (m.type === 'image' && !caption) {
                            //     try {
                            //         const { handlePaymentProof } = await import('./plugins/misc/store.js');
                            //         await handlePaymentProof(sock, m);
                            //     } catch (error) {
                            //         logger.error('Error handling payment proof:', error);
                            //     }
                                
                            //     // Check if this is a premium payment proof image
                            //     try {
                            //         const { handlePremiumPaymentProof } = await import('./plugins/misc/premium.js');
                            //         await handlePremiumPaymentProof(sock, m);
                            //     } catch (error) {
                            //         logger.error('Error handling premium payment proof:', error);
                            //     }
                            // }

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

            sock.ev.on('call', (callEv) => {
                call(callEv, sock)
            })

            // Event handler untuk welcome dan leave message
            sock.ev.on('group-participants.update', async (update) => {
                try {
                    const { id, participants, action } = update;

                    // Cek apakah bot adalah admin untuk mengirim pesan
                    const groupMetadata = await cacheGroupMetadata(sock, id);
                    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
                    const botIsAdmin = groupMetadata.participants.find(p => p.id === botNumber)?.admin;

                    if (!botIsAdmin) return; // Skip jika bot bukan admin

                    for (const participant of participants) {
                        // Skip jika participant adalah bot sendiri
                        if (participant === botNumber) continue;

                        if (action === 'add') {
                            // Welcome message
                            try {
                                // Ambil setting grup
                                const group = await Database.getGroup(id);
                                if (!group.welcome) continue;
                                // Ambil profile picture member baru
                                let ppUrl;
                                try {
                                    ppUrl = await sock.profilePictureUrl(participant, 'image');
                                } catch {
                                    ppUrl = 'https://i.ibb.co/3Fh9V6p/avatar-default.png';
                                }

                                // Ambil nama member
                                const contact = await sock.onWhatsApp(participant);
                                const memberName = contact[0]?.notify || participant.split('@')[0];

                                // Pesan welcome custom jika ada
                                let welcomeMessage = group.welcomeMessage && group.welcomeMessage.trim() !== ''
                                    ? group.welcomeMessage
                                        .replace(/@user/gi, `@${participant.split('@')[0]}`)
                                        .replace(/@group/gi, groupMetadata.subject)
                                    : `👋 *SELAMAT DATANG!*\n\n` +
                                        `Halo @${participant.split('@')[0]}! 🎉\n` +
                                        `Selamat datang di grup *${groupMetadata.subject}*\n\n` +
                                        `📝 *Silakan perkenalkan diri kamu:*\n` +
                                        `• Nama lengkap :\n` +
                                        `• Umur :\n` +
                                        `• Hobi atau minat :\n` +
                                        `• Jenis Kelamin :\n\n` +
                                        `🤝 Mari berkenalan dan saling mengenal!\n` +
                                        `Jangan lupa baca deskripsi grup ya~\n\n` +
                                        `Semoga betah dan enjoy ! ✨`;

                                await sock.sendMessage(id, {
                                    text: welcomeMessage,
                                    mentions: [participant],
                                    contextInfo: {
                                        externalAdReply: {
                                            title: `Welcome ${memberName}! 🎉`,
                                            body: `Selamat datang di ${groupMetadata.subject}`,
                                            thumbnailUrl: ppUrl,
                                            sourceUrl: globalThis.newsletterUrl || "https://whatsapp.com/channel/0029VagADOLLSmbaxFNswH1m",
                                            mediaType: 1,
                                            renderLargerThumbnail: true
                                        }
                                    }
                                });

                                logger.info(`👋 Welcome message sent to ${memberName} in ${groupMetadata.subject}`);

                            } catch (error) {
                                logger.error('Error sending welcome message:', error);
                            }

                        } else if (action === 'remove') {
                            // Leave message
                            try {
                                // Ambil setting grup
                                const group = await Database.getGroup(id);
                                if (!group.leave) continue;
                                // Ambil nama member yang keluar
                                const contact = await sock.onWhatsApp(participant);
                                const memberName = contact[0]?.notify || participant.split('@')[0];

                                // Pesan leave custom jika ada
                                let leaveMessage = group.leaveMessage && group.leaveMessage.trim() !== ''
                                    ? group.leaveMessage
                                        .replace(/@user/gi, `@${participant.split('@')[0]}`)
                                        .replace(/@group/gi, groupMetadata.subject)
                                    : `👋 *SELAMAT TINGGAL!*\n\n` +
                                        `@${participant.split('@')[0]} telah meninggalkan grup 😢\n\n` +
                                        `🌟 Terima kasih sudah menjadi bagian dari *${groupMetadata.subject}*\n` +
                                        `🤝 Semoga kita bisa bertemu lagi di lain waktu\n` +
                                        `🚪 Pintu grup ini selalu terbuka untukmu\n\n` +
                                        `Sampai jumpa dan semoga sukses selalu! 🙏✨`;

                                await sock.sendMessage(id, {
                                    text: leaveMessage,
                                    mentions: [participant],
                                    contextInfo: {
                                        externalAdReply: {
                                            title: `Goodbye ${memberName} 👋`,
                                            body: `Sampai jumpa dari ${groupMetadata.subject}`,
                                            thumbnailUrl: globalThis.ppUrl || 'https://i.ibb.co/3Fh9V6p/avatar-default.png',
                                            sourceUrl: globalThis.newsletterUrl || "https://whatsapp.com/channel/0029VagADOLLSmbaxFNswH1m",
                                            mediaType: 1,
                                            renderLargerThumbnail: true
                                        }
                                    }
                                });

                                logger.info(`👋 Leave message sent for ${memberName} in ${groupMetadata.subject}`);

                            } catch (error) {
                                logger.error('Error sending leave message:', error);
                            }
                        }
                    }

                } catch (error) {
                    logger.error('Error in group-participants.update:', error);
                }
            });
        }).catch(error => logger.error('Kesalahan fatal memulai bot:', error));

    } catch (error) {
        logger.error('Gagal memulai bot:', error);
        process.exit(1);
    }
}

// Fungsi untuk menghitung runtime bot
async function runtime() {
    const uptime = process.uptime();
    const days = Math.floor(uptime / (24 * 60 * 60));
    const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((uptime % (60 * 60)) / 60);
    const seconds = Math.floor(uptime % 60);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

startBot();
