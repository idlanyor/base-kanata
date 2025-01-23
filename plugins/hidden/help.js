import pkg from '@seaavey/baileys';
const { generateWAMessageFromContent, proto } = pkg;
import { helpMessage } from '../../helper/help.js'
export const handler = ["menu", "help", "h", "hai"]
export const description = "List All Menu";
export default async ({ sock, id, m, noTel, sender }) => {
    const { caption, plugins } = await helpMessage()
    let sections = []
    for (const plugin in plugins) {
        sections.push({
            header: 'Daftar Menu Kanata V2',
            highlight_label: 'V2',
            title: `❏┄┅━┅┄〈 〘 ${plugin.toUpperCase()} 〙`,
            rows: plugins[plugin].map((command) => {
                return {
                    title: Array.isArray(command.handler)
                        ? command.handler.map(h => h.toUpperCase()).join(', ')
                        : command.handler.toUpperCase(),
                    description: command.description,
                    id: `${command.handler}`
                }
            })
        })
    }
    await sock.sendMessage(id, {
        text: caption,
        footer: 'Kanata V2',
        buttons: [
            {
                buttonId: 'owner',
                buttonText: {
                    displayText: 'Owner'
                },
                type: 4,
                nativeFlowInfo: {
                    name: 'single_select',
                    paramsJson: JSON.stringify({
                        title: 'Daftar Menu Kanata V2',
                        sections
                    }),
                },
            },
            {
                buttonId: 'stats',
                buttonText: {
                    displayText: 'Test Ping'
                },
                type: 1,
            }
        ],
        headerType: 1,
        viewOnce: true
    }, {
        quoted: m,
    })

    return
    let listMessage = {
        title: 'List Menu Kanata',
        sections
    };

    let kanata = generateWAMessageFromContent(m.chat, {

        viewOnceMessage: {
            message: {
                "messageContextInfo": {
                    "deviceListMetadata": {},
                    "deviceListMetadataVersion": 2
                },

                interactiveMessage: proto.Message.InteractiveMessage.create({
                    contextInfo: {
                        mentionedJid: sender,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363305152329358@newsletter',
                            newsletterName: 'Powered By : Roy',
                            serverMessageId: -1
                        },
                        // businessMessageForwardInfo: { businessOwnerJid: sock.decodeJid(sock.user.id) },
                        forwardingScore: 256,
                        externalAdReply: {
                            title: 'Roidev',
                            thumbnailUrl: 'https://telegra.ph/file/a6f3ef42e42efcf542950.jpg',
                            sourceUrl: 'https://whatsapp.com/channel/0029ValMR7jDp2Q7ldcaNK1L',
                            mediaType: 2,
                            renderLargerThumbnail: false
                        }
                    },
                    body: proto.Message.InteractiveMessage.Body.create({
                        text: caption
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.create({
                        text: `© Roidev`
                    }),
                    header: proto.Message.InteractiveMessage.Header.create({
                        title: `Little Kanata by Roy`,
                        thumbnailUrl: "https://telegra.ph/file/8360caca1efd0f697d122.jpg",
                        gifPlayback: true,
                        subtitle: "Kanata List Menu",
                    }),
                    gifPlayback: true,
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                        buttons: [{
                            "name": "single_select",
                            "buttonParamsJson": JSON.stringify(listMessage)
                        }]
                    })
                })
            }
        }
    }, {
        quoted: { key: { participant: '0@s.whatsapp.net', remoteJid: "0@s.whatsapp.net" }, message: { conversation: sender } }
    });

    await sock.relayMessage(id, kanata.message, {
        messageId: kanata.key.id
    });
}