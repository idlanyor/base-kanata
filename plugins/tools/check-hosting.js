import axios from 'axios';

export const handler = {
    command: ['checkhosting', 'hosting', 'checkhost'],
    help: 'Mengecek informasi hosting dari domain. Gunakan !checkhosting <domain> atau reply pesan dengan !checkhosting',
    tags: ['tools'],

    async exec({ m, args, sock }) {
        try {
            let domain = args;

            // Jika tidak ada domain tapi ada reply
            if (!domain && m.quoted) {
                domain = m.quoted.text || m.quoted.message?.conversation || '';
            }

            // Validasi input
            if (!domain) {
                await m.reply(`🔍 *CHECK HOSTING INFO*\n\nCara penggunaan:\n1. !checkhosting <domain>\n2. Reply pesan dengan !checkhosting\n\nContoh:\n!checkhosting google.com\n!checkhosting antidonasi.web.id`);
                return;
            }

            // Bersihkan domain dari protokol jika ada
            domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0];

            // Tambahkan reaksi proses
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            // Proses check hosting menggunakan API
            const apiUrl = `https://api.ryzumi.vip/api/tool/check-hosting?domain=${encodeURIComponent(domain)}`;
            const { data: result } = await axios.get(apiUrl);

            if (!result.success) {
                await m.reply(`❌ *Gagal mengecek hosting*\n\n*Domain:* ${domain}\n*Error:* ${result.message || 'Unknown error'}`);
                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                });
                return;
            }

            const data = result.result;
            
            // Format informasi domain
            let message = `🔍 *HOSTING INFO CHECK*\n\n`;
            message += `*Domain:* ${data.domain.name}\n`;
            message += `*IPv6 Support:* ${data.domain.ipv6_support ? '✅ Ya' : '❌ Tidak'}\n\n`;

            // Informasi Web/Server
            if (data.web && data.web.ips && data.web.ips.length > 0) {
                message += `🌐 *INFORMASI SERVER*\n`;
                const mainIP = data.web.ips[0];
                message += `*IP Address:* ${mainIP.address}\n`;
                message += `*IPv6:* ${mainIP.is_ipv6 ? '✅ Ya' : '❌ Tidak'}\n`;
                message += `*Lokasi:* ${mainIP.location.city}, ${mainIP.location.country}\n`;
                message += `*Koordinat:* ${mainIP.location.latitude}, ${mainIP.location.longitude}\n`;
                message += `*Provider:* ${mainIP.provider.organization}\n`;
                message += `*AS Number:* ${mainIP.provider.asNumber}\n`;
                message += `*Domain Provider:* ${mainIP.provider.domain}\n\n`;
            }

            // Informasi Nameserver
            if (data.nameserver && data.nameserver.servers && data.nameserver.servers.length > 0) {
                message += `🔧 *NAMESERVER INFO*\n`;
                message += `*IPv6 Support:* ${data.nameserver.ipv6_support ? '✅ Ya' : '❌ Tidak'}\n`;
                
                data.nameserver.servers.forEach((server, index) => {
                    if (index < 2) { // Batasi hanya 2 nameserver pertama
                        message += `*NS ${index + 1}:* ${server.domain}\n`;
                        if (server.ips && server.ips.length > 0) {
                            const nsIP = server.ips[0];
                            message += `  └ IP: ${nsIP.address}\n`;
                            message += `  └ Lokasi: ${nsIP.location.city}, ${nsIP.location.country}\n`;
                        }
                    }
                });
                message += `\n`;
            }

            // Informasi Provider utama
            if (data.web && data.web.providers && data.web.providers.length > 0) {
                const provider = data.web.providers[0];
                message += `🏢 *HOSTING PROVIDER*\n`;
                message += `*Organisasi:* ${provider.organization}\n`;
                message += `*Domain:* ${provider.domain}\n`;
                message += `*Negara:* ${provider.country}\n`;
                message += `*EU Region:* ${provider.isEU ? '✅ Ya' : '❌ Tidak'}\n\n`;
            }

            // Timestamp
            if (data.timestamp) {
                const date = new Date(data.timestamp);
                message += `⏰ *Dicek pada:* ${date.toLocaleString('id-ID')}\n`;
            }

            // Kirim hasil
            await m.reply(message);

            // Tambahkan reaksi sukses
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Error in check-hosting command:', error);
            await m.reply(`❌ Error: ${error.response?.data?.message || error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    }
};