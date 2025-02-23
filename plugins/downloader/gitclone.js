import axios from 'axios'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import AdmZip from 'adm-zip'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const execAsync = promisify(exec)
const tmpDir = path.join(__dirname, '../../tmp')

export const handler = {
    command: ['gitclone', 'git'],
    tags: ['downloader'],
    help: 'Download repository GitHub\nContoh: !gitclone https://github.com/username/repo',
    exec: async ({ sock, m, args }) => {
        try {
            if (!args) {
                await m.reply(`❌ Masukkan URL repository GitHub!\n\nContoh:\n!gitclone https://github.com/username/repo`)
                return
            }

            // Validasi URL GitHub
            const githubRegex = /^https?:\/\/github\.com\/[^/]+\/[^/]+/i
            if (!githubRegex.test(args)) {
                await m.reply('❌ URL tidak valid! Masukkan URL GitHub yang benar')
                return
            }

            // Tambahkan reaksi proses
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            })

            // Ambil username dan repo dari URL
            const [, username, repo] = args.match(/github\.com\/([^/]+)\/([^/]+)/i)

            // Buat URL API
            const apiUrl = `https://api.github.com/repos/${username}/${repo}`
            const downloadUrl = `${args}/archive/refs/heads/main.zip`

            // Cek repository exists
            const { data } = await axios.get(apiUrl)
            if (!data) {
                throw new Error('Repository tidak ditemukan!')
            }

            // Buat folder tmp jika belum ada
            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true })
            }

            // Download repository
            const response = await axios({
                method: 'get',
                url: downloadUrl,
                responseType: 'arraybuffer'
            })

            // Simpan ke file zip
            const zipPath = path.join(tmpDir, `${repo}.zip`)
            fs.writeFileSync(zipPath, response.data)

            // Extract info repo
            const zip = new AdmZip(zipPath)
            const zipEntries = zip.getEntries()
            const totalFiles = zipEntries.length
            const size = (response.data.length / (1024 * 1024)).toFixed(2) // Convert to MB

            // Kirim file
            await sock.sendMessage(m.chat, {
                document: fs.readFileSync(zipPath),
                fileName: `${repo}.zip`,
                mimetype: 'application/zip',
                caption: `*GITHUB REPOSITORY*\n\n` +
                        `📂 Repository: ${repo}\n` +
                        `👤 Owner: ${username}\n` +
                        `⭐ Stars: ${data.stargazers_count}\n` +
                        `🍴 Forks: ${data.forks_count}\n` +
                        `📝 Description: ${data.description || '-'}\n` +
                        `📊 Size: ${size} MB\n` +
                        `📁 Total Files: ${totalFiles}\n` +
                        `🔗 URL: ${args}`,
                contextInfo: {
                    externalAdReply: {
                        title: '📥 GitHub Repository Downloader',
                        body: `${repo} by ${username}`,
                        thumbnailUrl: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
                        sourceUrl: args,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            })

            // Hapus file zip temporary
            fs.unlinkSync(zipPath)

            // Tambahkan reaksi sukses
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            })

        } catch (error) {
            console.error('Error in gitclone:', error)
            
            let errorMessage = '❌ Terjadi kesalahan saat mengunduh repository!'
            
            if (error.response?.status === 404) {
                errorMessage = '❌ Repository tidak ditemukan!'
            } else if (error.response?.status === 403) {
                errorMessage = '❌ Rate limit! Coba lagi nanti'
            }
            
            await m.reply(errorMessage)
            
            // Tambahkan reaksi error
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            })
        }
    }
} 