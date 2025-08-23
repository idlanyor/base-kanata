export const handler = {
    command: ['open', 'close', 'buka', 'tutup'],
    tags: ['group'],
    help: 'Buka atau tutup grup',
    isGroup: true,
    isAdmin: true,
    isBotAdmin: true,
    exec: async ({ sock, m, cmd }) => {
        try {
            // Ambil metadata grup
            const groupMetadata = await sock.groupMetadata(m.chat);
            
            // Set grup berdasarkan command
            const isClose = cmd === 'close' || cmd === 'tutup';

            try {
                await sock.groupSettingUpdate(m.chat, isClose ? 'announcement' : 'not_announcement');
            } catch (settingError) {
                console.error('Error updating group settings:', settingError);
                await m.reply('❌ Gagal mengubah pengaturan grup. Pastikan bot adalah admin!');
                return;
            }

            // Ambil foto grup
            const ppgroup = await sock.profilePictureUrl(m.chat, 'image').catch(_ => 'https://files.catbox.moe/2wynab.jpg');

            // Kirim pesan konfirmasi
            await sock.sendMessage(m.chat, {
                text: `*${isClose ? 'GRUP DITUTUP 🔒' : 'GRUP DIBUKA 🔓'}*\n\n` +
                    `Sekarang ${isClose ? 'hanya admin yang dapat mengirim pesan' : 'semua peserta dapat mengirim pesan'} di grup ini`,
                contextInfo: {
                    externalAdReply: {
                        title: `${groupMetadata.subject}`,
                        body: `${isClose ? 'Group Closed 🔒' : 'Group Opened 🔓'}`,
                        thumbnailUrl: ppgroup,
                        sourceUrl: `${globalThis.newsletterUrl}`,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            });

            // Kirim reaksi
            await sock.sendMessage(m.chat, {
                react: {
                    text: isClose ? '🔒' : '🔓',
                    key: m.key
                }
            });

        } catch (error) {
            console.error('Error in group control:', error);
            await m.reply('❌ Terjadi kesalahan saat mengubah pengaturan grup');
        }
    }
};