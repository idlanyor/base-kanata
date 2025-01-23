import './global.js'
import { Kanata, clearMessages } from './bot.js';
import { groupParticipants, groupUpdate } from './lib/group.js';
import { checkAnswer, tebakSession } from './lib/tebak/index.js';
import { getMedia } from './helper/mediaMsg.js';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import readline from 'readline';
import { call } from './lib/call.js';

// Mendefinisikan __dirname untuk ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fungsi untuk mencari semua file .js secara rekursif
function findJsFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        // Jika itu folder, lakukan rekursi
        if (stat && stat.isDirectory()) {
            results = results.concat(findJsFiles(filePath));
        }
        // Jika itu file .js, tambahkan ke results
        else if (file.endsWith('.js')) {
            results.push(filePath);
        }
    });
    return results;
}

// Fungsi validasi nomor telepon
async function getPhoneNumber() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const namaSesiPath = path.join(__dirname, globalThis.sessionName);

    try {
        await fs.promises.access(namaSesiPath);
        rl.close();
    } catch {
        return new Promise(resolve => {
            const validatePhoneNumber = (input) => {
                const phoneRegex = /^62\d{9,15}$/; // Nomor kudu mulai karo '62' lan minimal 10 digit
                return phoneRegex.test(input);
            };
            const askForPhoneNumber = () => {
                rl.question(chalk.yellow("Masukkan nomor telepon (dengan kode negara, contoh: 628xxxxx): "), input => {
                    if (validatePhoneNumber(input)) {
                        rl.close();
                        resolve(input);
                    } else {
                        console.log(chalk.red("Nomor telepon ora valid! Pastikan dimulai dengan '62' lan isine hanya angka (minimal 10 digit)."));
                        askForPhoneNumber(); // Ulangi nek salah
                    }
                });
                console.log('...')
            };
            console.log("Selamat Datang di Kanata Bot")
            askForPhoneNumber(); // Mulai validasi
        });
    }
}

async function prosesPerintah({ command, sock, m, id, sender, noTel, attf }) {
    if (!command) return;
    let [cmd, ...args] = "";
    [cmd, ...args] = command.split(' ');
    cmd = cmd.toLowerCase();
    if (command.startsWith('!')) {
        cmd = command.toLowerCase().substring(1).split(' ')[0];
        args = command.split(' ').slice(1)
    }
    // console.log("cmd:", cmd)
    // console.log(args)
    // console.log(m)
    const pluginsDir = path.join(__dirname, 'plugins');
    const plugins = Object.fromEntries(
        await Promise.all(findJsFiles(pluginsDir).map(async file => {
            const { default: plugin, handler } = await import(pathToFileURL(file).href);
            if (Array.isArray(handler) && handler.includes(cmd)) {
                return [cmd, plugin];
            }
            return [handler, plugin];
        }))
    );
    if (plugins[cmd]) {
        await plugins[cmd]({ sock, m, id, psn: args.join(' '), sender, noTel, attf });
    }

}

export async function startBot() {
    const phoneNumber = await getPhoneNumber();
    const bot = new Kanata({ phoneNumber, sessionId: globalThis.sessionName });

    bot.start().then(sock => {
        sock.ev.on('messages.upsert', async chatUpdate => {
            try {
                const m = chatUpdate.messages[0];
                // console.log(m)
                const { remoteJid } = m.key;
                const sender = m.pushName || remoteJid;
                const id = remoteJid;
                const noTel = remoteJid.split('@')[0].replace(/[^0-9]/g, '');

                if (m.message?.imageMessage || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
                    const imageMessage = m.message.imageMessage || m.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
                    const imageBuffer = await getMedia({ message: { imageMessage } });
                    const commandImage = m.message.imageMessage?.caption || m.message.extendedTextMessage?.text;
                    await prosesPerintah({ command: commandImage, sock, m, id, sender, noTel, attf: imageBuffer });
                }

                if (m.message?.audioMessage || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage) {
                    const audioMessage = m.message.audioMessage || m.message.extendedTextMessage.contextInfo.quotedMessage.audioMessage;
                    // console.log(chatUpdate.type)
                    if (!m.message?.audioMessage?.contextInfo?.quotedMessage) return
                    const audioBuffer = await getMedia(audioMessage);
                    const commandAudio = m.message.audioMessage?.caption || m.message.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage?.caption;
                    await prosesPerintah({ command: commandAudio, sock, m: audioMessage, id, sender, noTel, attf: audioBuffer });
                }

                if (m.message?.videoMessage || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage) {
                    const videoMessage = m.message.videoMessage || m.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage;
                    const videoBuffer = await getMedia(videoMessage);
                    const commandVideo = m.message.videoMessage?.caption || m.message.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage?.caption;
                    await prosesPerintah({ command: commandVideo, sock, m: videoMessage, id, sender, noTel, attf: videoBuffer });
                }
                if (m.message?.interactiveResponseMessage?.nativeFlowResponseMessage) {
                    const cmd = JSON.parse(m.message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson);
                    // console.log(cmd.id)
                    await prosesPerintah({ command: `!${cmd.id}`, sock, m, id, sender, noTel });
                }
                // console.log("Ini obj nya", m.message?.templateButtonReplyMessage)
                if (m.message?.templateButtonReplyMessage) {
                    const cmd = m.message.templateButtonReplyMessage?.selectedId;
                    // console.log(cmd.id)
                    await prosesPerintah({ command: `!${cmd}`, sock, m, id, sender, noTel });
                }
                if (m.message?.buttonsResponseMessage) {
                    const cmd = m.message.buttonsResponseMessage?.selectedButtonId;
                    await prosesPerintah({ command: `!${cmd}`, sock, m, id, sender, noTel });
                }
                let botId = sock.user.id.replace(/:\d+/, '')
                let botMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid.includes(botId)
                    || m.message?.extendedTextMessage?.contextInfo?.participant.includes(botId)
                let fullmessage = m.message.conversation || m.message?.extendedTextMessage.text
                    || m.message?.extendedTextMessage?.contextInfo
                // auto AI mention
                if (botMentioned) {
                    try {
                        await sock.sendMessage(id, { text: await gpt4Hika({ prompt: fullmessage, id }) })
                    } catch (error) {
                        await sock.sendMessage(id, { text: 'ups,ada yang salah' })

                    }
                }

                const chat = await clearMessages(m);
                if (chat) {
                    const parsedMsg = chat.chatsFrom === "private" ? chat.message : chat.participant.message;
                    if (tebakSession.has(id)) {
                        await checkAnswer(id, parsedMsg.toLowerCase(), sock, m, noTel);
                    } else {
                        await prosesPerintah({ command: parsedMsg, sock, m, id, sender, noTel });
                    }
                }
            } catch (error) {
                console.log('Error handling message:', error);
            }
        });



        sock.ev.on('group-participants.update', ev => groupParticipants(ev, sock));
        sock.ev.on('groups.update', ev => groupUpdate(ev, sock));
        sock.ev.on('call', (callEv) => {
            call(callEv, sock)
        })
    }).catch(error => console.log("Error starting Bot:", error));
}

startBot();
