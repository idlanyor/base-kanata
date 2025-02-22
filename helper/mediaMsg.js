import { downloadContentFromMessage } from "@seaavey/baileys"

export const getMedia = async (msg) => {
    try {
        // Cek jika pesan adalah view once
        if (msg.message?.viewOnceMessageV2?.message) {
            const vo = msg.message.viewOnceMessageV2.message;
            const messageType = Object.keys(vo)[0];
            if (!messageType) return null;

            const stream = await downloadContentFromMessage(vo[messageType], messageType.replace('Message', ''));
            if (!stream) return null;
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            return buffer;
        }

        // Penanganan media normal
        const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'];
        let mediaMessage = null;
        let mediaType = null;

        for (const type of mediaTypes) {
            if (msg.message?.[type]) {
                mediaMessage = msg.message[type];
                mediaType = type;
                break;
            }
            // Cek dalam quoted message
            if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[type]) {
                mediaMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage[type];
                mediaType = type;
                break;
            }
        }

        if (!mediaMessage || !mediaType) return null;

        const stream = await downloadContentFromMessage(mediaMessage, mediaType.replace('Message', ''));
        if (!stream) return null;
        
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        return buffer;
    } catch (error) {
        console.error('Error in getMedia:', error);
        return null;
    }
}