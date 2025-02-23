import os from 'os';

export const handler = {
    command: 'stats',
    tags: ['tools'],
    help: 'Menampilkan informasi sistem server',
    isAdmin: false,
    isBotAdmin: false, 
    isOwner: false,
    isGroup: false,
    exec: async ({ sock, m }) => {
        try {
            const platform = os.platform();
            const release = os.release();
            const osType = os.type();
            let OS = `🌐「 *Server System Information* 」* 🌐\n\n`;

            // Informasi OS
            OS += `💻 *OS*: ${osType} (${platform} ${release})\n`;

            // Informasi RAM
            const totalMem = os.totalmem() / (1024 ** 3); // Dalam GB
            const freeMem = os.freemem() / (1024 ** 3); // Dalam GB
            const usedMem = totalMem - freeMem;
            const uptime = os.uptime() / 3600; // Dalam jam

            const hours = Math.floor(uptime);
            const minutes = Math.floor((uptime - hours) * 60);
            const seconds = Math.floor(((uptime - hours) * 60 - minutes) * 60);

            OS += `🧠 *Total RAM*: ${totalMem.toFixed(2)} GB\n`;
            OS += `📊 *RAM Terpakai*: ${usedMem.toFixed(2)} GB\n`;
            OS += `💾 *RAM Tersedia*: ${freeMem.toFixed(2)} GB\n\n`;

            // Informasi Waktu Aktif (Uptime)
            OS += `⏱️ *Uptime*: ${hours} jam ${minutes} menit ${seconds} detik\n\n`;

            // Informasi CPU
            OS += `🖥️ *CPU Info*:\n`;
            const cpus = os.cpus();
            cpus.forEach((cpu, index) => {
                OS += `   🔹 *CPU ${index + 1}*: ${cpu.model} (${cpu.times.user / 1000} MHz)\n`;
            });

            await sock.sendMessage(m.chat, { text: OS });

        } catch (error) {
            console.error('Error in stats:', error);
            await m.reply('❌ Gagal mendapatkan informasi sistem');
        }
    }
}

export default handler
