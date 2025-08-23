import autoNotification from '../helper/scheduler.js';

export const handler =  {
    command: 'autonotif',
    category: 'owner',
    desc: 'Mengontrol fitur auto anime notification',
    isOwner: true,
    query: 'Pilih aksi: test, status, restart, stop, preview',
    example: '.autonotif test',
    
    async exec({ sock, m, args }) {
        const action = args.toLowerCase();
        
        if (!action) {
            return m.reply(`🎌 *ANIME AUTO NOTIFICATION CONTROL*\n\n` +
                          `📋 *Available Commands:*\n` +
                          `• \`.autonotif test\` - Test kirim notifikasi anime sekarang\n` +
                          `• \`.autonotif status\` - Cek status scheduler\n` +
                          `• \`.autonotif preview\` - Preview anime hari ini\n` +
                          `• \`.autonotif restart\` - Restart scheduler\n` +
                          `• \`.autonotif stop\` - Stop scheduler\n\n` +
                          `⏰ *Schedule:* Setiap hari jam 12.00 WIB\n` )
        }
        
        switch (action) {
            case 'test':
                try {
                    m.reply('🧪 Mengirim test anime notification...');
                    const success = await autoNotification.sendTestNotification();
                    if (success) {
                        m.reply('✅ Test anime notification berhasil dikirim!');
                    } else {
                        m.reply('❌ Gagal mengirim test anime notification!');
                    }
                } catch (error) {
                    m.reply(`❌ Error: ${error.message}`);
                }
                break;
                
            case 'status':
                try {
                    const status = autoNotification.getStatus();
                    const statusText = status.isRunning ? '🟢 Active' : '🔴 Inactive';
                    
                    m.reply(`📊 *ANIME NOTIFICATION STATUS*\n\n` +
                           `🔄 Status: ${statusText}\n` +
                           `📅 Next Run: ${status.nextRun}\n` +
                           `🗓️ Current Day: ${status.currentDay}\n` +
                           `⚙️ Active Jobs: ${status.activeJobs.length}\n` +
                           `📝 Jobs: ${status.activeJobs.join(', ') || 'None'}\n\n` +
                           `🎯 Target: 62895395590009\n` +
                           `🌐 API: ${status.apiEndpoint}\n` +
                           `🌏 Timezone: Asia/Jakarta`);
                } catch (error) {
                    m.reply(`❌ Error getting status: ${error.message}`);
                }
                break;
                
            case 'preview':
                try {
                    m.reply('🔍 Mengambil preview anime hari ini...');
                    const preview = await autoNotification.getAnimePreview();
                    
                    if (!preview) {
                        return m.reply('❌ Gagal mengambil data anime dari API');
                    }
                    
                    let previewText = `🎌 *PREVIEW ANIME HARI ${preview.day.toUpperCase()}*\n\n`;
                    previewText += `📊 Total: ${preview.count} anime\n\n`;
                    
                    if (preview.count === 0) {
                        previewText += `😔 Tidak ada anime yang tayang hari ${preview.day}`;
                    } else {
                        previewText += `🎯 *Top ${Math.min(5, preview.count)} Anime:*\n\n`;
                        preview.anime.forEach((anime, index) => {
                            const episodeInfo = anime.eps && anime.eps[1] ? anime.eps[1].trim() : 'TBA';
                            previewText += `${index + 1}. 📺 *${anime.judul}*\n`;
                            previewText += `   📊 Episode: ${episodeInfo}\n\n`;
                        });
                    }
                    
                    m.reply(previewText);
                } catch (error) {
                    m.reply(`❌ Error getting preview: ${error.message}`);
                }
                break;
                
            case 'restart':
                try {
                    autoNotification.stop();
                    autoNotification.init(sock);
                    m.reply('🔄 Anime notification scheduler berhasil direstart!');
                } catch (error) {
                    m.reply(`❌ Error restarting: ${error.message}`);
                }
                break;
                
            case 'stop':
                try {
                    autoNotification.stop();
                    m.reply('🛑 Anime notification scheduler berhasil dihentikan!');
                } catch (error) {
                    m.reply(`❌ Error stopping: ${error.message}`);
                }
                break;
                
            default:
                m.reply(`❌ Aksi tidak dikenal: ${action}\n\n` +
                        `📋 Available: test, status, preview, restart, stop`);
        }
    }
};