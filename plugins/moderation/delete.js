export const handler = {
    command: ['del', 'delete', 'd'],
    help: 'Menghapus pesan di grup\n\nCara penggunaan:\nReply pesan dengan !del\n\nNote: Hanya admin & owner yang dapat menggunakan perintah ini',
    tags: ['moderation'],
    
    isAdmin: true,
    isBotAdmin: true,
    
    async exec({ m, sock }) {
        try {
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
    }
}; 