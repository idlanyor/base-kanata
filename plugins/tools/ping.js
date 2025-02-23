import moment from 'moment';
import Database from '../../helper/database.js';
import os from 'os';
import { networkInterfaces } from 'os';

// Helper functions
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const getSystemInfo = () => {
    // RAM info
    const totalRAM = os.totalmem();
    const freeRAM = os.freemem();
    const usedRAM = totalRAM - freeRAM;
    const ramUsage = ((usedRAM / totalRAM) * 100).toFixed(2);
    
    // CPU info
    const cpus = os.cpus();
    const cpuModel = cpus[0].model;
    const cpuSpeed = cpus[0].speed;
    const cpuCores = cpus.length;

    // Network info
    const nets = networkInterfaces();
    const networkInfo = Object.keys(nets).map(name => ({
        name,
        addresses: nets[name].map(net => net.address).join(', ')
    }));

    // Host info
    const hostname = os.hostname();
    const platform = os.platform();
    const release = os.release();
    const arch = os.arch();

    // Uptime
    const uptime = os.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    return {
        ram: {
            total: formatBytes(totalRAM),
            used: formatBytes(usedRAM),
            free: formatBytes(freeRAM),
            usage: ramUsage
        },
        cpu: {
            model: cpuModel,
            speed: cpuSpeed,
            cores: cpuCores
        },
        network: networkInfo,
        host: {
            name: hostname,
            platform,
            release,
            arch
        },
        uptime: {
            hours,
            minutes,
            seconds
        }
    };
};

export const handler = {
    command: 'ping',
    tags: ['tools', 'info'],
    help: 'Mengecek status dan kecepatan respon bot',
    isAdmin: false,
    isBotAdmin: false, 
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m, id }) => {
        try {
            // Hitung ping
            const timestamp = m.messageTimestamp;
            const now = Date.now();
            const ping = moment.duration(now - moment(timestamp * 1000)).asSeconds();
            
            // Dapatkan info sistem
            const sysInfo = getSystemInfo();
            
            // Buat progress bar RAM
            const progressBarLength = 10;
            const filledBars = Math.round((sysInfo.ram.usage / 100) * progressBarLength);
            const progressBar = '█'.repeat(filledBars) + '░'.repeat(progressBarLength - filledBars);

            // Format network info
            const networkText = sysInfo.network
                .map(net => `➸ *${net.name}:* ${net.addresses}`)
                .join('\n');

            // Kirim pesan respon
            await sock.sendMessage(id, { 
                text: `*🤖 SONATA BOT STATUS*\n\n` +
                      `*⚡ Response Time:* ${ping} detik\n\n` +
                      `*💻 Host Information*\n` +
                      `➸ *Hostname:* ${sysInfo.host.name}\n` +
                      `➸ *Platform:* ${sysInfo.host.platform}\n` +
                      `➸ *Release:* ${sysInfo.host.release}\n` +
                      `➸ *Architecture:* ${sysInfo.host.arch}\n\n` +
                      `*🔧 CPU Information*\n` +
                      `➸ *Model:* ${sysInfo.cpu.model}\n` +
                      `➸ *Speed:* ${sysInfo.cpu.speed} MHz\n` +
                      `➸ *Cores:* ${sysInfo.cpu.cores}\n\n` +
                      `*🌐 Network Interfaces*\n${networkText}\n\n` +
                      `*📊 Memory Usage*\n` +
                      `➸ *RAM Usage:* ${progressBar} ${sysInfo.ram.usage}%\n` +
                      `➸ *Total RAM:* ${sysInfo.ram.total}\n` +
                      `➸ *Used RAM:* ${sysInfo.ram.used}\n` +
                      `➸ *Free RAM:* ${sysInfo.ram.free}\n\n` +
                      `*⏰ Uptime:* ${sysInfo.uptime.hours}h ${sysInfo.uptime.minutes}m ${sysInfo.uptime.seconds}s\n\n` +
                      `_Powered by Sonata Bot_`,
                contextInfo: {
                    isForwarded: true,
                    forwardingScore: 9999999,
                    externalAdReply: {
                        title: `乂 Sonata Bot Status 乂`,
                        body: `Response Time: ${ping}s`,
                        mediaType: 1,
                        previewType: 0,
                        renderLargerThumbnail: true,
                        thumbnailUrl: `${globalThis.ppUrl}`,
                        sourceUrl: `${globalThis.newsletterUrl}`
                    }
                }
            });

            // Kirim reaksi berdasarkan kecepatan
            let reactionEmoji = '🚀'; // Cepat
            if (ping > 3) reactionEmoji = '⚡'; // Sedang  
            if (ping > 5) reactionEmoji = '🐌'; // Lambat

            await sock.sendMessage(id, {
                react: {
                    text: reactionEmoji,
                    key: m.key
                }
            });

            // Tambah statistik command
            await Database.addCommand();

        } catch (error) {
            console.error('Error in ping:', error);
            await m.reply('❌ Terjadi kesalahan saat mengecek status bot');
        }
    }
}

export default handler;
