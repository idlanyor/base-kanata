import { logger } from './logger.js';
import cron from 'node-cron';
import fetch from 'node-fetch';
import { proto, prepareWAMessageMedia, generateWAMessageFromContent } from 'baileys';

class AutoNotification {
    constructor() {
        this.sock = null;
        this.isRunning = false;
        this.scheduledJobs = new Map();
        this.apiBaseUrl = globalThis.ryzumi.backendAnime
        this.apiEndpoint = globalThis.ryzumi.endpointAnime;
    }

    // Inisialisasi scheduler dengan socket WhatsApp
    init(sock) {
        this.sock = sock;
        this.startDailyNotification();
        logger.info('📅 Anime notification scheduler initialized');
    }

    // Fungsi untuk memulai notifikasi harian jam 12.00
    startDailyNotification() {
        if (this.scheduledJobs.has('daily_12pm')) {
            this.scheduledJobs.get('daily_12pm').destroy();
        }

        // Cron job untuk jam 01.00 setiap hari (0 01 * * *)
        const job = cron.schedule('0 01 * * *', async () => {
            await this.sendDailyAnimeNotification();
        }, {
            scheduled: true,
            timezone: 'Asia/Jakarta'
        });

        this.scheduledJobs.set('daily_12pm', job);
        this.isRunning = true;
        logger.info('⏰ Daily anime notification scheduled for 12:00 PM (Asia/Jakarta)');
    }

    // Fungsi untuk mengambil data anime dari API
    async fetchAnimeData() {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            logger.error('❌ Error fetching anime data:', error);
            return null;
        }
    }

    // Fungsi untuk mendapatkan nama hari dalam bahasa Indonesia
    getCurrentDayName() {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const today = new Date();
        return days[today.getDay()];
    }

    // Fungsi untuk memfilter anime berdasarkan hari
    filterAnimeByDay(animeList, targetDay) {
        if (!animeList || !Array.isArray(animeList)) {
            return [];
        }

        return animeList.filter(anime => {
            if (anime.rate && anime.rate[1]) {
                return anime.rate[1].trim().toLowerCase() === targetDay.toLowerCase();
            }
            return false;
        });
    }

    // Fungsi untuk mengirim notifikasi anime harian
    async sendDailyAnimeNotification() {
        try {
            if (!this.sock) {
                logger.error('❌ Socket not available for anime notification');
                return;
            }
    
            const targetNumber = '120363401901734192@g.us';
            const currentDate = new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Asia/Jakarta'
            });
            
            const currentTime = new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Jakarta'
            });
    
            const currentDay = this.getCurrentDayName();
            logger.info(`🗓️ Fetching anime for ${currentDay}`);
    
            // Ambil data anime dari API
            const animeData = await this.fetchAnimeData();
            if (!animeData) {
                logger.error('❌ Failed to fetch anime data');
                return;
            }
    
            // Filter anime berdasarkan hari ini
            const todayAnime = this.filterAnimeByDay(animeData, currentDay);
    
            if (todayAnime.length === 0) {
                // Kirim pesan biasa jika tidak ada anime
                let message = `🎌 *JADWAL ANIME HARI INI*\n\n`;
                message += `📅 ${currentDate}\n`;
                message += `⏰ ${currentTime}\n\n`;
                message += `😔 Tidak ada anime yang tayang hari ${currentDay}\n\n`;
                message += `🔄 Coba cek lagi besok untuk jadwal anime terbaru!`;
                message += `\n\n🤖 Auto Update by: ${globalThis.botName || 'Kanata Bot'}`;

                await this.sock.sendMessage(targetNumber, {
                    text: message,
                    contextInfo: {
                        externalAdReply: {
                            title: `🎌 Jadwal Anime ${currentDay}`,
                            body: `Tidak ada anime tayang hari ini`,
                            mediaUrl: "https://antidonasi.web.id",
                            description: 'Daily Anime Schedule',
                            previewType: "PHOTO",
                            sourceUrl: "https://whatsapp.com/channel/0029VagADOLLSmbaxFNswH1m",
                        }
                    }
                });
                return;
            }

            // Buat cards untuk carousel
            const cards = await Promise.all(todayAnime.slice(0, 10).map(async (anime, index) => {
                const episodeInfo = anime.eps && anime.eps[1] ? anime.eps[1].trim() : 'TBA';
                const animeTitle = anime.judul || 'Unknown Title';
                const animeSlug = anime.slug || 'no-slug';
                const animeImage = anime.gambar ? anime.gambar.replace(/`/g, '').trim() : 'https://via.placeholder.com/300x400?text=No+Image';
                
                return {
                    body: proto.Message.InteractiveMessage.Body.fromObject({
                        text: `*${animeTitle}*\n\n📊 Episode: ${episodeInfo}\n🗓️ Hari: ${anime.rate[1]}`
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                        text: `© Anime Schedule ${currentDay}`
                    }),
                    header: proto.Message.InteractiveMessage.Header.fromObject({
                        title: `*Anime ${index + 1}*`,
                        hasMediaAttachment: true,
                        ...(await prepareWAMessageMedia({ image: { url: animeImage } }, { upload: this.sock.waUploadToServer }))
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                        buttons: [
                            {
                                name: "cta_url",
                                buttonParamsJson: `{"display_text":"📺 Tonton Anime","url":"https://anime.antidonasi.web.id/anime/${animeSlug}"}`
                            }
                        ]
                    })
                };
            }));
    
            const message = generateWAMessageFromContent(targetNumber, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                            contextInfo: {
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: '120363305152329358@newsletter',
                                    newsletterName: 'Powered By : Kanata Bot',
                                    serverMessageId: -1
                                },
                                forwardingScore: 256,
                                externalAdReply: {
                                    title: 'Jadwal Anime Harian',
                                    thumbnailUrl: todayAnime[0]?.gambar?.replace(/`/g, '').trim() || 'https://antidonasi.web.id',
                                    sourceUrl: 'https://whatsapp.com/channel/0029VagADOLLSmbaxFNswH1m',
                                    mediaType: 2,
                                    renderLargerThumbnail: false
                                }
                            },
                            body: proto.Message.InteractiveMessage.Body.fromObject({
                                text: `🎌 *JADWAL ANIME HARI INI*\n\n📅 ${currentDate}\n⏰ ${currentTime}\n\n🎯 *${todayAnime.length} Anime Tayang Hari ${currentDay}*\n\n✨ Selamat menonton anime favorit kalian!`
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                text: `🤖 Auto Update by: ${globalThis.botName || 'Kanata Bot'}`
                            }),
                            header: proto.Message.InteractiveMessage.Header.fromObject({
                                hasMediaAttachment: false
                            }),
                            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                                cards
                            })
                        })
                    }
                }
            }, {});
    
            await this.sock.relayMessage(targetNumber, message.message, { messageId: message.key.id });
            logger.success(`📤 Anime carousel notification sent to ${targetNumber.split('@')[0]} - ${todayAnime.length} anime for ${currentDay}`);
    
        } catch (error) {
            logger.error('❌ Error sending anime notification:', error);
        }
    }

    // Fungsi untuk mengirim notifikasi manual (untuk testing)
    async sendTestNotification() {
        try {
            if (!this.sock) {
                logger.error('❌ Socket not available for test notification');
                return false;
            }

            // const targetNumber = '120363401901734192@g.us';
            const targetNumber = '62895395590009@s.whatsapp.net';
            const currentDay = this.getCurrentDayName();
            
            // Ambil data anime dari API
            const animeData = await this.fetchAnimeData();
            if (!animeData) {
                logger.error('❌ Failed to fetch anime data for test');
                return false;
            }

            // Filter anime berdasarkan hari ini
            const todayAnime = this.filterAnimeByDay(animeData, currentDay);
    
            if (todayAnime.length === 0) {
                // Kirim pesan biasa jika tidak ada anime
                let message = `🧪 *TEST ANIME NOTIFICATION*\n\n`;
                message += `📅 Test pada: ${new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}\n`;
                message += `⏰ ${new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })}\n\n`;
                message += `😔 Tidak ada anime yang tayang hari ${currentDay}\n\n`;
                message += `🔄 Coba cek lagi besok untuk jadwal anime terbaru!`;
                message += `\n\n🧪 *Ini adalah pesan test*\n🤖 Auto Update by: ${globalThis.botName || 'Kanata Bot'}`;

                await this.sock.sendMessage(targetNumber, {
                    text: message,
                    contextInfo: {
                        externalAdReply: {
                            title: `🧪 Test Jadwal Anime ${currentDay}`,
                            body: `Tidak ada anime tayang hari ini`,
                            mediaUrl: "https://anime.antidonasi.web.id",
                            description: 'Test Daily Anime Schedule',
                            previewType: "PHOTO",
                            sourceUrl: "https://whatsapp.com/channel/0029VagADOLLSmbaxFNswH1m",
                        }
                    }
                });
                return true;
            }

            // Buat cards untuk carousel test
            const cards = await Promise.all(todayAnime.slice(0, 10).map(async (anime, index) => {
                const episodeInfo = anime.eps && anime.eps[1] ? anime.eps[1].trim() : 'TBA';
                const animeTitle = anime.judul || 'Unknown Title';
                const animeSlug = anime.slug || 'no-slug';
                const animeImage = anime.gambar ? anime.gambar.replace(/`/g, '').trim() : 'https://via.placeholder.com/300x400?text=No+Image';
                
                return {
                    body: proto.Message.InteractiveMessage.Body.fromObject({
                        text: `*${animeTitle}*\n\n📊 Episode: ${episodeInfo}\n🗓️ Hari: ${anime.rate[1]}`
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.fromObject({
                        text: `© Test Anime Schedule ${currentDay}`
                    }),
                    header: proto.Message.InteractiveMessage.Header.fromObject({
                        title: `*Test Anime ${index + 1}*`,
                        hasMediaAttachment: true,
                        ...(await prepareWAMessageMedia({ image: { url: animeImage } }, { upload: this.sock.waUploadToServer }))
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                        buttons: [
                            {
                                name: "cta_url",
                                buttonParamsJson: `{"display_text":"📺 Tonton Anime","url":"https://anime.antidonasi.web.id/anime/${animeSlug}"}`
                            }
                        ]
                    })
                };
            }));
    
            const message = generateWAMessageFromContent(targetNumber, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                            contextInfo: {
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: '120363305152329358@newsletter',
                                    newsletterName: 'Powered By : Kanata Bot',
                                    serverMessageId: -1
                                },
                                forwardingScore: 256,
                                externalAdReply: {
                                    title: 'Test Jadwal Anime Harian',
                                    thumbnailUrl: todayAnime[0]?.gambar?.replace(/`/g, '').trim() || 'https://antidonasi.web.id',
                                    sourceUrl: 'https://whatsapp.com/channel/0029VagADOLLSmbaxFNswH1m',
                                    mediaType: 2,
                                    renderLargerThumbnail: false
                                }
                            },
                            body: proto.Message.InteractiveMessage.Body.fromObject({
                                text: `🧪 *TEST ANIME NOTIFICATION*\n\n📅 Test pada: ${new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}\n⏰ ${new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })}\n\n🎯 *${todayAnime.length} Anime Tayang Hari ${currentDay}*\n\n✨ Selamat menonton anime favorit kalian!`
                            }),
                            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                text: `🧪 *Ini adalah pesan test*\n🤖 Auto Update by: ${globalThis.botName || 'Kanata Bot'}`
                            }),
                            header: proto.Message.InteractiveMessage.Header.fromObject({
                                hasMediaAttachment: false
                            }),
                            carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                                cards
                            })
                        })
                    }
                }
            }, {});
    
            await this.sock.relayMessage(targetNumber, message.message, { messageId: message.key.id });
            logger.success(`📤 Test anime carousel notification sent to ${targetNumber.split('@')[0]} - ${todayAnime.length} anime for ${currentDay}`);
            return true;
    
        } catch (error) {
            logger.error('❌ Error sending test anime notification:', error);
            return false;
        }
    }

    // Fungsi untuk menghentikan scheduler
    stop() {
        this.scheduledJobs.forEach((job, name) => {
            job.destroy();
            logger.info(`🛑 Stopped scheduled job: ${name}`);
        });
        this.scheduledJobs.clear();
        this.isRunning = false;
        logger.info('📅 Anime notification scheduler stopped');
    }

    // Fungsi untuk mendapatkan status scheduler
    getStatus() {
        return {
            isRunning: this.isRunning,
            activeJobs: Array.from(this.scheduledJobs.keys()),
            nextRun: this.isRunning ? 'Daily at 12:00 PM (Asia/Jakarta)' : 'Not scheduled',
            apiEndpoint: this.apiEndpoint,
            currentDay: this.getCurrentDayName()
        };
    }

    // Fungsi untuk mendapatkan preview anime hari ini
    async getAnimePreview() {
        try {
            const animeData = await this.fetchAnimeData();
            if (!animeData) return null;
            
            const currentDay = this.getCurrentDayName();
            const todayAnime = this.filterAnimeByDay(animeData, currentDay);
            
            return {
                day: currentDay,
                count: todayAnime.length,
                anime: todayAnime.slice(0, 5) // Return first 5 anime
            };
        } catch (error) {
            logger.error('❌ Error getting anime preview:', error);
            return null;
        }
    }
}

// Export instance tunggal
const autoNotification = new AutoNotification();
export default autoNotification;