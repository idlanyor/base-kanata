import Database from '../helper/database.js';
import os from 'os';
import { networkInterfaces } from 'os';
import { performance } from 'perf_hooks';
import pidusage from 'pidusage';

// Helper functions
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const getNetworkInfo = () => {
    const nets = networkInterfaces();
    const results = [];
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                results.push({
                    name,
                    address: net.address,
                    netmask: net.netmask
                });
            }
        }
    }
    return results;
};

const getSystemInfo = async () => {
    // Process stats
    const stats = await pidusage(process.pid);
    
    // RAM info
    const totalRAM = os.totalmem();
    const freeRAM = os.freemem();
    const usedRAM = totalRAM - freeRAM;
    const ramUsage = ((usedRAM / totalRAM) * 100).toFixed(2);
    
    // CPU info
    const cpus = os.cpus();
    const cpuModel = cpus[0].model.replace(/\(R\)|@.*$/g, '').trim();
    const cpuSpeed = (cpus[0].speed / 1000).toFixed(1);
    const cpuCores = cpus.length;
    const cpuThreads = cpus.length * (cpuModel.includes('Intel') ? 2 : 1);

    // Network info
    const network = getNetworkInfo();
    
    return {
        process: {
            pid: process.pid,
            memory: formatBytes(stats.memory),
            cpu: stats.cpu.toFixed(2),
            uptime: formatDuration(process.uptime())
        },
        ram: {
            total: formatBytes(totalRAM),
            used: formatBytes(usedRAM),
            free: formatBytes(freeRAM),
            usage: ramUsage
        },
        cpu: {
            model: cpuModel,
            speed: cpuSpeed,
            cores: cpuCores,
            threads: cpuThreads,
            usage: ((os.loadavg()[0] * 100) / cpuThreads).toFixed(2)
        },
        os: {
            platform: `${os.platform()} ${os.release()}`,
            arch: os.arch(),
            version: os.version(),
            uptime: formatDuration(os.uptime())
        },
        network: network[0] || { address: 'Not available' }
    };
};

const createProgressBar = (percent, length = 15) => {
    const filled = Math.round((percent / 100) * length);
    const empty = length - filled;
    const filledChars = '■'.repeat(filled);
    const emptyChars = '□'.repeat(empty);
    const percentage = percent.toString().padStart(4, ' ');
    return `${filledChars}${emptyChars} ${percentage}%`;
};

const formatDuration = (seconds) => {
    const units = [
        { label: 'd', mod: 86400 },
        { label: 'h', mod: 3600 },
        { label: 'm', mod: 60 },
        { label: 's', mod: 1 }
    ];

    let remainingSeconds = Math.floor(seconds);
    const parts = [];

    for (const { label, mod } of units) {
        if (remainingSeconds >= mod) {
            const value = Math.floor(remainingSeconds / mod);
            parts.push(`${value}${label}`);
            remainingSeconds %= mod;
        }
    }

    return parts.join(' ') || '0s';
};

export const handler = {
    command: ['ping', 'status', 'info'],
    tags: ['tools', 'info'],
    help: 'Mengecek status dan performa bot\n\n' +
          'Format: !ping\n' +
          'Alias: !status, !info',
    exec: async ({ sock, m }) => {
        try {
            const start = performance.now();
            
            // Send initial reaction
            await sock.sendMessage(m.chat, {
                react: { text: '⌛', key: m.key }
            });

            // Get system info
            const sysInfo = await getSystemInfo();
            
            // Calculate response time
            const end = performance.now();
            const responseTime = ((end - start) / 1000).toFixed(3);

            // Create progress bars
            const ramBar = createProgressBar(parseFloat(sysInfo.ram.usage));
            const cpuBar = createProgressBar(parseFloat(sysInfo.cpu.usage));
            const processBar = createProgressBar(parseFloat(sysInfo.process.cpu));

            // Format status message
            const status = `*╭───「 KANATA BOT STATUS 」*
├ *Performance Metrics*
├ 📊 Response : ${responseTime}s
├ 🔄 Uptime  : ${sysInfo.process.uptime}
├ 🎯 PID     : ${sysInfo.process.pid}
│
├ *Resource Usage*
├ 💻 CPU     : ${cpuBar}
├ 💾 RAM     : ${ramBar}
├ 📈 Process : ${processBar}
│
├ *System Info*
├ 🖥️  Model   : ${sysInfo.cpu.model}
├ ⚡ Speed   : ${sysInfo.cpu.speed} GHz
├ 🧮 Cores   : ${sysInfo.cpu.cores}C/${sysInfo.cpu.threads}T
├ 💽 Memory  : ${sysInfo.ram.used} / ${sysInfo.ram.total}
│
├ *Platform Details*
├ 🛠️  OS      : ${sysInfo.os.platform}
├ 📐 Arch    : ${sysInfo.os.arch}
├ 🌐 IP      : ${sysInfo.network.address}
├ ⏰ Uptime  : ${sysInfo.os.uptime}
*╰───────────────*

_Powered by Kanata Bot v2.0_`;

            // Send status message with fancy header
            await sock.sendMessage(m.chat, {
                text: status,
                contextInfo: {
                    externalAdReply: {
                        title: '乂 System Monitor 乂',
                        body: `Response Time: ${responseTime}s | RAM: ${sysInfo.ram.usage}% | CPU: ${sysInfo.cpu.usage}%`,
                        mediaType: 1,
                        previewType: 0,
                        renderLargerThumbnail: true,
                        thumbnailUrl: 'https://i.ibb.co/hgJVrRv/server.jpg',
                        sourceUrl: 'https://github.com/rtwone/base-kanata'
                    }
                }
            });

            // Send reaction based on performance
            const getPerformanceEmoji = (time) => {
                if (time < 0.5) return '🚀'; // Excellent
                if (time < 1.0) return '⚡'; // Very Good
                if (time < 2.0) return '✨'; // Good
                if (time < 3.0) return '⚠️'; // Warning
                return '🐌'; // Slow
            };
            
            await sock.sendMessage(m.chat, {
                react: { text: getPerformanceEmoji(parseFloat(responseTime)), key: m.key }
            });

            // Update stats
            await Database.addCommand();

        } catch (error) {
            console.error('Error in ping:', error);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
            await m.reply('❌ Terjadi kesalahan: ' + error.message);
        }
    }
};

export default handler;
