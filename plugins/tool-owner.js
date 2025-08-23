import { vcard } from "../lib/owner/ownerContact.js"

export const handler = {
    command: 'owner',
    tags: ['tools'],
    help: 'Menampilkan kontak owner bot',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m }) => {
        try {
            await sock.sendMessage(
                m.chat,
                {
                    contacts: {
                        displayName: 'Roy',
                        contacts: [{ vcard }]
                    }
                }
            )
        } catch (error) {
            console.error('Error in owner:', error)
            await m.reply('❌ Gagal menampilkan kontak owner')
        }
    }
}

export default handler