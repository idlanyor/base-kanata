import { cacheGroupMetadata } from '../../helper/caching.js';

export const handler = {
    command: ['getpp', 'getppgc'],
    help: 'Mendapatkan foto profil\n\nPerintah:\n!getpp [@user] - Mendapatkan foto profil user\n!getppgc - Mendapatkan foto profil grup',
    tags: ['tools'],
    
    async exec({ m, args, sock }) {
        try {
            // Cek apakah command getppgc digunakan di grup
            if (m.command === 'getppgc' && !m.isGroup) {
                await m.reply('❌ Perintah ini hanya bisa digunakan di dalam grup!');
                return;
            }

            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            let who;
            if (m.command === 'getpp') {
                if (m.quoted) {
                    who = m.quoted.sender;
                } else if (args[0]) {
                    who = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                } else {
                    who = m.sender;
                }
            } else {
                who = m.chat;
            }

            try {
                let pp = await sock.profilePictureUrl(who, 'image');
                let caption = m.command === 'getpp' 
                    ? `*Profile Picture*\n ${m.quoted?.pushName || m.pushName || who.split('@')[0]}`
                    : `*Group Profile Picture*\n${(await cacheGroupMetadata(sock, m.chat)).subject}`;

                await sock.sendMessage(m.chat, {
                    image: { url: pp },
                    caption: caption,
                    mentions: m.command === 'getpp' ? [who] : undefined,
                    contextInfo: {
                        externalAdReply: {
                            title: `乂 ${m.command === 'getpp' ? 'Profile Picture' : 'Group Profile Picture'} 乂`,
                            body: m.command === 'getpp' ? `@${who.split('@')[0]}` : (await cacheGroupMetadata(sock, m.chat)).subject,
                            thumbnailUrl: pp,
                            sourceUrl: pp,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: m });
            } catch {
                await m.reply(`❌ ${m.command === 'getpp' ? 'User' : 'Grup'} tidak memiliki foto profil atau foto profil private`);
            }

            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error(`Error in ${m.command}:`, error);
            await m.reply(`❌ Error: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    }
}; 