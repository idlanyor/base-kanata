import loadAssets from "../../helper/loadAssets.js";

export const handler = {
    command: ['p', 'oy'],
    tags: ['hidden'],
    help: 'Mengirim voice note anjay',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m, id }) => {
        try {
            await sock.sendMessage(id, { 
               text: 'anjay', 
            }, { quoted: m });

        } catch (error) {
            console.error('Error in p:', error)
            await m.reply('❌ Gagal mengirim voice note')
        }
    }
}

export default handler
