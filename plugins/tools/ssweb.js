import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const handler = {
    command: ['ssweb', 'ss', 'screenshot'],
    help: 'Screenshot website dengan pilihan tampilan desktop/tablet/mobile. Gunakan !ssweb <url> [device]',
    tags: ['tools'],

    async exec({ m, args, sock }) {
        try {
            const input = args.split(' ');
            let url = input[0];
            let device = input[1] || 'desktop';

            // Jika tidak ada URL tapi ada reply
            if (!url && m.quoted) {
                const quotedText = m.quoted.text || m.quoted.message?.conversation || '';
                const quotedInput = quotedText.split(' ');
                url = quotedInput[0];
                device = quotedInput[1] || 'desktop';
            }

            // Validasi input
            if (!url) {
                await m.reply(`📸 *WEBSITE SCREENSHOT*\n\nCara penggunaan:\n!ssweb <url> [device]\n\nDevice options:\n• desktop (default)\n• tablet\n• mobile\n\nContoh:\n!ssweb google.com\n!ssweb google.com mobile\n!ssweb https://github.com tablet`);
                return;
            }

            // Validasi device
            const validDevices = ['desktop', 'tablet', 'mobile'];
            if (!validDevices.includes(device.toLowerCase())) {
                await m.reply(`❌ Device tidak valid!\n\nPilihan device:\n• desktop\n• tablet\n• mobile`);
                return;
            }

            device = device.toLowerCase();

            // Tambahkan protokol jika belum ada
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }

            // Tambahkan reaksi proses
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            // Konfigurasi viewport berdasarkan device
            const viewportConfig = {
                desktop: {
                    width: 1366,
                    height: 768,
                    deviceScaleFactor: 1,
                    isMobile: false,
                    hasTouch: false,
                    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                tablet: {
                    width: 768,
                    height: 1024,
                    deviceScaleFactor: 2,
                    isMobile: true,
                    hasTouch: true,
                    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
                },
                mobile: {
                    width: 375,
                    height: 667,
                    deviceScaleFactor: 2,
                    isMobile: true,
                    hasTouch: true,
                    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
                }
            };

            const config = viewportConfig[device];

            // Launch browser
            const browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });

            const page = await browser.newPage();

            // Set viewport dan user agent
            await page.setViewport({
                width: config.width,
                height: config.height,
                deviceScaleFactor: config.deviceScaleFactor,
                isMobile: config.isMobile,
                hasTouch: config.hasTouch
            });

            await page.setUserAgent(config.userAgent);

            // Set timeout dan navigasi
            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Tunggu sebentar untuk memastikan halaman fully loaded
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Ambil screenshot
            const screenshot = await page.screenshot({
                type: 'png',
                fullPage: true,
            });

            await browser.close();

            // Get domain untuk filename
            const domain = new URL(url).hostname;
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `screenshot_${domain}_${device}_${timestamp}.png`;

            // Format pesan hasil
            const deviceEmoji = {
                desktop: '🖥️',
                tablet: '📱',
                mobile: '📱'
            };

            const caption = `📸 *WEBSITE SCREENSHOT*\n\n` +
                `${deviceEmoji[device]} *Device:* ${device.charAt(0).toUpperCase() + device.slice(1)}\n` +
                `🌐 *URL:* ${url}\n` +
                `📐 *Resolution:* ${config.width}x${config.height}\n` +
                `⏰ *Captured:* ${new Date().toLocaleString('id-ID')}`;

            // Kirim screenshot
            await sock.sendMessage(m.chat, {
                image: screenshot,
                caption: caption,
                fileName: filename
            }, { quoted: m });

            // Tambahkan reaksi sukses
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Error in ssweb command:', error);

            let errorMessage = '❌ Gagal mengambil screenshot!';

            if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
                errorMessage += '\n\n*Penyebab:* Domain tidak ditemukan atau tidak valid.';
            } else if (error.message.includes('TimeoutError')) {
                errorMessage += '\n\n*Penyebab:* Website terlalu lama merespons (timeout).';
            } else if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
                errorMessage += '\n\n*Penyebab:* Koneksi ditolak oleh server.';
            } else {
                errorMessage += `\n\n*Error:* ${error.message}`;
            }

            await m.reply(errorMessage);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    }
};