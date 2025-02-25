import './global.js'
import { Sonata, clearMessages, sanitizeBotId } from './bot.js';
import { logger } from './helper/logger.js';
import { getMedia } from './helper/mediaMsg.js';
import { cacheGroupMetadata } from './helper/caching.js'
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import readline from 'readline';
import { call } from './lib/call.js';
import { addMessageHandler } from './helper/message.js';
import Database from './helper/database.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import util from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

export function findJsFiles(dir) {
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

        let cmd = '';
        let args = [];

        if (command.startsWith('!')) {
            cmd = command.toLowerCase().substring(1).split(' ')[0];
            args = command.split(' ').slice(1);

            // Log eksekusi command
            logger.info('⚡ EXECUTE COMMAND')
            logger.info(`├ Command : ${cmd}`)
            logger.info(`├ Args    : ${args.join(' ') || '-'}`)
            logger.info(`├ From    : ${m.pushName || 'Unknown'} (@${noTel})`)
            logger.info(`└ Chat    : ${isGroup ? '👥 ' + groupName : '👤 Private'}`)
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
                    const botName = "Sonata Bot";
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
                    const categories = {
                        'main': [],
                        ...Object.fromEntries(
                            fs.readdirSync(pluginsDir)
                                .filter(f => fs.statSync(path.join(pluginsDir, f)).isDirectory())
                                .map(dir => [dir, []])
                        )
                    }

                    // Load plugin commands
                    const pluginFiles = findJsFiles(pluginsDir)
                    for (const file of pluginFiles) {
                        try {
                            const plugin = await import(pathToFileURL(file).href)
                            if (!plugin.handler) continue

                            const category = path.basename(path.dirname(file))
                            if (!categories[category] || category.toUpperCase() === 'HIDDEN') continue

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

            case '=>': // Untuk eval
                try {
                    if (!await m.isOwner) {
                        await m.reply('❌ Perintah ini hanya untuk owner bot!');
                        return;
                    }

                    const evalCode = args.join(' ');
                    if (!evalCode) {
                        await m.reply('❌ Masukkan kode yang akan dieval!');
                        return;
                    }

                    // Buat context untuk eval
                    const context = {
                        sock, m, id: m.chat, sender, noTel,
                        console: {
                            ...console,
                            log: (...args) => {
                                sock.sendMessage(m.chat, {
                                    text: `📤 *CONSOLE.LOG*\n\n${args.join(' ')}`
                                });
                            }
                        }
                    };

                    // Format kode
                    let code = evalCode;
                    if (!code.includes('return')) {
                        if (!code.includes(';')) code = 'return ' + code;
                    }
                    code = `(async () => { try { ${code} } catch(e) { return e } })()`;

                    // Eval kode
                    const result = await eval(code);
                    let output = '✅ *RESULT*\n\n';

                    if (result?.stack) {
                        output = `❌ *ERROR*\n\n${result.stack}`;
                    } else if (typeof result === 'string') {
                        output += result;
                    } else if (typeof result === 'object') {
                        output += JSON.stringify(result, null, 2);
                    } else {
                        output += util.format(result);
                    }

                    await m.reply(output);
                } catch (error) {
                    await m.reply(`❌ *ERROR*\n\n${error.stack}`);
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
                    const outputPath = `./temp/${m.chat}_vn.mp3`;

                    await fs.promises.writeFile(inputPath, audio);
                    // Konversi ke format opus dengan bitrate yang sesuai untuk VN
                    await execAsync(`ffmpeg -i ${inputPath} -af "silenceremove=1:0:-50dB" -c:a libopus -b:a 128k ${outputPath}`);

                    await sock.sendMessage(m.chat, {
                        audio: { url: outputPath },
                        mimetype: 'audio/mp4',
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

            case 'qw':
                try {
                    if (!args[0]) {
                        await m.reply('❌ Masukkan pertanyaan!\n*Contoh:* !qw Siapa presiden Indonesia?');
                        return;
                    }

                    await sock.sendMessage(m.chat, {
                        react: { text: '⏳', key: m.key }
                    });

                    const question = encodeURIComponent(args);
                    const style = encodeURIComponent('Selalu Balas saya dalam bahasa indonesia,dengan bahasa yang nonformal dan penuh emote ceria');
                    const url = `https://fastrestapis.fasturl.cloud/aillm/superqwen?ask=${question}&style=${style}&sessionId=${m.chat}&model=qwen-max-latest&mode=search`;

                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'accept': 'application/json'
                        }
                    });

                    const data = await response.json();

                    if (data.status === 200) {
                        await m.reply({
                            text: `🤖 *QWEN AI*\n\n${data.result}`,
                            contextInfo: {
                                externalAdReply: {
                                    title: '乂 Qwen AI 乂',
                                    body: `Question: ${args.join(' ')}`,
                                    thumbnailUrl: 'https://s6.imgcdn.dev/YYoFZh.jpg',
                                    sourceUrl: `${globalThis.newsletterUrl}`,
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        });

                        await sock.sendMessage(m.chat, {
                            react: { text: '✅', key: m.key }
                        });
                    } else {
                        throw new Error('Gagal mendapatkan respons dari AI');
                    }

                } catch (error) {
                    console.error('Error in qw:', error);
                    await m.reply('❌ Terjadi kesalahan saat berkomunikasi dengan Qwen AI');
                    await sock.sendMessage(m.chat, {
                        react: { text: '❌', key: m.key }
                    });
                }
                break;

            case 'del':
            case 'delete':
            case 'd':
                try {
                    // Cek apakah pengirim adalah admin atau owner
                    if (!(await m.isAdmin) && !(await m.isOwner)) {
                        await m.reply('❌ *Akses ditolak*\nHanya admin & owner yang dapat menghapus pesan!');
                        return;
                    }

                    // Cek apakah bot adalah admin
                    if (!(await m.isBotAdmin)) {
                        await m.reply('❌ Bot harus menjadi admin untuk menghapus pesan!');
                        return;
                    }

                    // Cek apakah ada pesan yang di-reply
                    const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
                    if (!quoted) {
                        await m.reply('❌ Reply pesan yang ingin dihapus!');
                        return;
                    }

                    // Tambahkan reaksi proses
                    await sock.sendMessage(m.chat, {
                        react: { text: '⏳', key: m.key }
                    });

                    // Dapatkan key pesan yang di-reply
                    const key = {
                        remoteJid: m.chat,
                        fromMe: m.message.extendedTextMessage.contextInfo.participant === sock.user.id,
                        id: m.message.extendedTextMessage.contextInfo.stanzaId,
                        participant: m.message.extendedTextMessage.contextInfo.participant
                    };

                    // Hapus pesan
                    await sock.sendMessage(m.chat, { delete: key });

                    // Tambahkan reaksi sukses
                    await sock.sendMessage(m.chat, {
                        react: { text: '✅', key: m.key }
                    });

                } catch (error) {
                    console.error('Error in delete:', error);
                    await m.reply('❌ Gagal menghapus pesan!');

                    // Tambahkan reaksi error
                    await sock.sendMessage(m.chat, {
                        react: { text: '❌', key: m.key }
                    });
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
        const bot = new Sonata({
            phoneNumber,
            sessionId: globalThis.sessionName,
            useStore: false
        });

        bot.start().then(async (sock) => {
            logger.success('Bot berhasil dimulai!');
            logger.divider();
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

                    if (shouldReconnect) {
                        logger.info(`♻️ Mencoba menyambungkan kembali...`);
                    } else {
                        logger.error(`🚫 Sesi kadaluarsa. Harap login Ulang.`);
                        process.exit(1);
                    }
                }

                if (connection === 'open') {
                    await checkAndFollowChannel()
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
                    const noTel = (id.endsWith('@g.us')) ? m.key.participant.split('@')[0].replace(/[^0-9]/g, '') : remoteJid.split('@')[0].replace(/[^0-9]/g, '');
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
