import { downloadContentFromMessage } from "@whiskeysockets/baileys"

export const getMedia = async (msg) => {
    const messageType = Object.keys(msg?.message)[0]
    const stream = await downloadContentFromMessage(msg.message[messageType], messageType.replace('Message', ''))
    let buffer = Buffer.from([])
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
    }

    return buffer
}