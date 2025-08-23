import Database from '../helper/database.js'

export const handler = {
    command: ['self', 'switch'],
    tags: ['owner'],
    help: 'Mengubah mode bot (public/self-private/self-me)',
    isOwner: true,
    exec: async ({ sock, m, args }) => {
        try {
            // Jika tidak ada argumen, tampilkan list mode
            if (!args) {
                await sock.sendMessage(m.chat, {
                    text: "🤖 *BOT MODE SETTINGS*\n\n" +
                         "Pilih mode operasi bot:\n\n" +
                         "📢 Public Mode\n" +
                         "👤 Self-Private Mode\n" + 
                         "👑 Self-Me Mode\n\n" +
                         "Cara penggunaan:\n" +
                         "!switch [mode]\n\n" +
                         "Contoh:\n" +
                         "!switch public\n" +
                         "!switch self-private\n" +
                         "!switch self-me",
                    contextInfo: {
                        externalAdReply: {
                            title: '乂 Bot Mode Settings 乂',
                            body: 'Pilih mode operasi bot',
                            thumbnailUrl: `${globalThis.ppUrl}`,
                            sourceUrl: `${globalThis.newsletterUrl}`,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, { quoted: m })
                return
            }

            // Jika ada argumen, proses langsung perubahan mode
            const mode = args.toLowerCase()
            if (!['public', 'self-private', 'self-me'].includes(mode)) {
                await sock.sendMessage(m.chat, {
                    text: '❌ Mode tidak valid!\n\n' +
                         'Mode yang tersedia:\n' +
                         '- public\n' +
                         '- self-private\n' +
                         '- self-me\n\n' +
                         'Cara penggunaan:\n' +
                         '!switch [mode]\n\n' +
                         'Contoh:\n' +
                         '!switch public',
                    contextInfo: {
                        externalAdReply: {
                            title: '❌ Invalid Mode',
                            body: 'Mode tidak valid',
                            thumbnailUrl: `${globalThis.ppUrl}`,
                            sourceUrl: `${globalThis.newsletterUrl}`,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                })
                return
            }

            // Update mode di database
            await Database.updateSettings({ botMode: mode })
            
            // Kirim konfirmasi
            await sock.sendMessage(m.chat, {
                text: `✅ Berhasil mengubah mode bot ke: *${mode}*\n\n` +
                      `Mode saat ini:\n` +
                      `${mode === 'public' ? '📢' : mode === 'self-private' ? '👤' : '👑'} *${mode}*\n\n` +
                      `Keterangan:\n` +
                      `- Public: bisa digunakan di private dan group\n` +
                      `- Self-Private: Hanya di private chat kecuali owner\n` +
                      `- Self-Me: Hanya owner\n\n` +
                      `Cara penggunaan:\n` +
                      `!switch [mode]\n\n` +
                      `Contoh:\n` +
                      `!switch public`,
                contextInfo: {
                    externalAdReply: {
                        title: '✅ Mode Updated',
                        body: `Current Mode: ${mode}`,
                        thumbnailUrl: `${globalThis.ppUrl}`,
                        sourceUrl: `${globalThis.newsletterUrl}`,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            })

            // Tambahkan reaksi sukses
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            })

        } catch (error) {
            console.error('Error in switch:', error)
            
            // Kirim pesan error
            await sock.sendMessage(m.chat, {
                text: `❌ Terjadi kesalahan:\n${error.message}\n\n` +
                      `Cara penggunaan:\n` +
                      `!switch [mode]\n\n` +
                      `Contoh:\n` +
                      `!switch public`,
                contextInfo: {
                    externalAdReply: {
                        title: '❌ Error Occurred',
                        body: 'Terjadi kesalahan saat mengubah mode',
                        thumbnailUrl: `${globalThis.ppUrl}`,
                        sourceUrl: `${globalThis.newsletterUrl}`,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            })

            // Tambahkan reaksi error
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            })
        }
    }
}
