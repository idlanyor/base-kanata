import { helpMessage } from '../../helper/help.js'
export const description = "List All Menu Sederhana";
export const handler = "allmenu"
export default async ({ sock, id, m, noTel, sender, psn }) => {
    const { caption } = await helpMessage()
    // console.log(caption)


    await sock.sendMessage(id, {
        text: caption,
    }

        , {
            quoted: {
                key: {
                    remoteJid: '0@s.whatsapp.net',
                    participant: '0@s.whatsapp.net'
                },
                message: {
                    newsletterAdminInviteMessage: {
                        newsletterJid: '120363305152329358@newsletter',
                        newsletterName: 'Kanata Bot',
                        caption: `${sender}: ${psn}`
                    }
                }
            }
        })
}