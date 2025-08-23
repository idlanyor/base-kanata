import { Catbox } from 'node-catbox'
import FormData from 'form-data'
import axios from 'axios'
import fs from 'fs'
import { fileTypeFromBuffer } from 'file-type'

export const handler = {
    command: ['upload', 'tourl'],
    tags: ['tools'],
    help: 'Upload file ke catbox.moe\n\nFormat: Kirim/Reply file dengan caption !upload',
    exec: async ({ sock, m }) => {
        const catbox = new Catbox();

        try {
            let buffer
            let fileName

            // Add waiting reaction
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            })

            // Handle different message types
            if (m.quoted) {
                const quotedMessage = m.quoted.message
                const messageType = Object.keys(quotedMessage)[0]

                if (messageType === 'imageMessage' ||
                    messageType === 'videoMessage' ||
                    messageType === 'documentMessage' ||
                    messageType === 'audioMessage') {
                    buffer = await m.quoted.download()
                    fileName = quotedMessage[messageType].fileName || 'file'
                } else {
                    throw new Error('Invalid file type!')
                }
            } else if (m.message) {
                const messageType = Object.keys(m.message)[0]

                if (messageType === 'imageMessage' ||
                    messageType === 'videoMessage' ||
                    messageType === 'documentMessage' ||
                    messageType === 'audioMessage') {
                    buffer = await m.download()
                    fileName = m.message[messageType].fileName || 'file'
                } else {
                    throw new Error('Please reply to a file or send file with caption !upload')
                }
            }

            if (!buffer) {
                throw new Error('No file detected!')
            }

            // Get file type
            const fileType = await fileTypeFromBuffer(buffer)
            if (!fileType) {
                throw new Error('Invalid file type!')
            }

            // Create form data
            const form = new FormData()
            form.append('reqtype', 'fileupload')
            form.append('fileToUpload', buffer, {
                filename: `${fileName}.${fileType.ext}`,
                contentType: fileType.mime
            })

            // Upload to catbox
            const response = await axios.post('https://catbox.moe/user/api.php', form, {
                headers: {
                    ...form.getHeaders()
                }
            })

            if (response.data.startsWith('https://')) {
                await m.reply(`✅ File berhasil diupload!\n\n🔗 URL: ${response.data}`)

                // Add success reaction
                await sock.sendMessage(m.chat, {
                    react: { text: '✅', key: m.key }
                })
            } else {
                throw new Error('Upload failed: ' + response.data)
            }

        } catch (error) {
            console.error('Error in upload:', error)
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            })
            await m.reply('❌ Gagal upload file: ' + error.message)
        }
    }
}

export default handler