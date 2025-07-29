import axios from 'axios';

export const handler = {
    command: ['shalat', 'jadwalshalat', 'prayer', 'prayertime'],
    tags: ['misc'],
    help: 'Melihat jadwal shalat untuk kota tertentu. Gunakan !shalat <kota> atau !shalat untuk kota default',
    isAdmin: false,
    isBotAdmin: false,
    isOwner: false,
    isGroup: false,
    exec: async ({ m, args, sock }) => {
        try {
            let city = args || 'Jakarta';

            // Tambahkan reaksi proses
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            // Proses pencarian jadwal shalat menggunakan API
            const apiUrl = `https://api.fasturl.link/religious/prayerschedule?city=${encodeURIComponent(city)}`;
            const { data: result } = await axios.get(apiUrl, {
                headers: {
                    'accept': 'application/json',
                    'x-api-key': globalThis.apiKey.fasturl
                }
            });

            if (!result.status || result.status !== 200) {
                await m.reply(`❌ *Gagal mendapatkan jadwal shalat*\n\n*Kota:* ${city}\n*Error:* ${result.content || 'Unknown error'}`);
                await sock.sendMessage(m.chat, {
                    react: { text: '❌', key: m.key }
                });
                return;
            }

            const data = result.result;
            const schedule = data.todaySchedule;

            // Format waktu shalat dengan emoji
            const prayerEmojis = {
                'imsyak': '🌅',
                'shubuh': '🌄',
                'terbit': '☀️',
                'dhuha': '🌤️',
                'dzuhur': '🌞',
                'ashr': '🌅',
                'maghrib': '🌆',
                'isya': '🌙'
            };

            // Format pesan jadwal shalat
            let message = `🕌 *JADWAL SHALAT*\n\n`;
            message += `📍 *Kota:* ${data.city.charAt(0).toUpperCase() + data.city.slice(1)}\n`;
            message += `📅 *Tanggal:* ${data.date}\n`;
            message += `🕐 *Waktu Lokal:* ${data.citycurrentTime}\n`;
            message += `🌍 *Zona Waktu:* ${data.cityTimezone}\n`;
            message += `📍 *Koordinat:* ${data.location}\n`;
            message += `🧭 *Arah Kiblat:* ${data.direction}°\n`;
            message += `📏 *Jarak:* ${data.distance} km\n\n`;

            message += `⏰ *JADWAL HARI INI:*\n`;
            message += `├ ${prayerEmojis.imsyak} Imsyak: ${schedule.imsyak}\n`;
            message += `├ ${prayerEmojis.shubuh} Shubuh: ${schedule.shubuh}\n`;
            message += `├ ${prayerEmojis.terbit} Terbit: ${schedule.terbit}\n`;
            message += `├ ${prayerEmojis.dhuha} Dhuha: ${schedule.dhuha}\n`;
            message += `├ ${prayerEmojis.dzuhur} Dzuhur: ${schedule.dzuhur}\n`;
            message += `├ ${prayerEmojis.ashr} Ashar: ${schedule.ashr}\n`;
            message += `├ ${prayerEmojis.maghrib} Maghrib: ${schedule.maghrib}\n`;
            message += `└ ${prayerEmojis.isya} Isya: ${schedule.isya}\n\n`;

            // Tambahkan info shalat berikutnya
            if (data.citynextPrayer) {
                message += `⏳ *SHALAT BERIKUTNYA:*\n`;
                message += `└ ${data.citynextPrayer}\n\n`;
            }

            // Tambahkan jadwal untuk beberapa hari ke depan (3 hari)
            if (data.monthSchedule && data.monthSchedule.length > 0) {
                message += `📅 *JADWAL 3 HARI KE DEPAN:*\n`;
                const today = new Date();
                const currentDate = today.getDate();
                
                for (let i = 0; i < 3; i++) {
                    const targetDate = currentDate + i;
                    const daySchedule = data.monthSchedule.find(s => parseInt(s.date) === targetDate);
                    
                    if (daySchedule) {
                        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                        const targetDay = new Date(today.getFullYear(), today.getMonth(), targetDate);
                        const dayName = dayNames[targetDay.getDay()];
                        
                        message += `├ ${dayName}, ${daySchedule.date} ${today.toLocaleString('id-ID', { month: 'long' })}\n`;
                        message += `│ ├ Shubuh: ${daySchedule.shubuh}\n`;
                        message += `│ ├ Dzuhur: ${daySchedule.dzuhur}\n`;
                        message += `│ ├ Ashar: ${daySchedule.ashr}\n`;
                        message += `│ ├ Maghrib: ${daySchedule.maghrib}\n`;
                        message += `│ └ Isya: ${daySchedule.isya}\n`;
                    }
                }
                message += `└──────────────────\n\n`;
            }

            message += `💡 *TIPS:*\n`;
            message += `├ Gunakan !shalat <kota> untuk kota lain\n`;
            message += `├ Contoh: !shalat Surabaya, !shalat Bandung\n`;
            message += `└ Jadwal berdasarkan waktu setempat\n\n`;

            message += `⏰ *DICARI PADA:* ${new Date().toLocaleString('id-ID')}`;

            // Kirim hasil (split jika terlalu panjang)
            if (message.length > 4096) {
                // Split pesan jika terlalu panjang
                const headerMessage = `🕌 *JADWAL SHALAT*\n\n` +
                    `📍 *Kota:* ${data.city.charAt(0).toUpperCase() + data.city.slice(1)}\n` +
                    `📅 *Tanggal:* ${data.date}\n` +
                    `🕐 *Waktu Lokal:* ${data.citycurrentTime}\n` +
                    `🌍 *Zona Waktu:* ${data.cityTimezone}\n` +
                    `📍 *Koordinat:* ${data.location}\n` +
                    `🧭 *Arah Kiblat:* ${data.direction}°\n` +
                    `📏 *Jarak:* ${data.distance} km`;

                const scheduleMessage = `⏰ *JADWAL HARI INI:*\n` +
                    `├ ${prayerEmojis.imsyak} Imsyak: ${schedule.imsyak}\n` +
                    `├ ${prayerEmojis.shubuh} Shubuh: ${schedule.shubuh}\n` +
                    `├ ${prayerEmojis.terbit} Terbit: ${schedule.terbit}\n` +
                    `├ ${prayerEmojis.dhuha} Dhuha: ${schedule.dhuha}\n` +
                    `├ ${prayerEmojis.dzuhur} Dzuhur: ${schedule.dzuhur}\n` +
                    `├ ${prayerEmojis.ashr} Ashar: ${schedule.ashr}\n` +
                    `├ ${prayerEmojis.maghrib} Maghrib: ${schedule.maghrib}\n` +
                    `└ ${prayerEmojis.isya} Isya:`;

                await m.reply(headerMessage);
                await m.reply(scheduleMessage);
            } else {
                await m.reply(message);
            }

            // Tambahkan reaksi sukses
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });

        } catch (error) {
            console.error('Error in shalat command:', error);
            
            let errorMessage = '❌ Gagal mendapatkan jadwal shalat!';
            
            if (error.response?.status === 404) {
                errorMessage += '\n\n*Penyebab:* Kota tidak ditemukan dalam database.';
            } else if (error.response?.status === 429) {
                errorMessage += '\n\n*Penyebab:* Terlalu banyak permintaan. Coba lagi nanti.';
            } else if (error.code === 'ENOTFOUND') {
                errorMessage += '\n\n*Penyebab:* Tidak dapat terhubung ke server API.';
            } else {
                errorMessage += `\n\n*Error:* ${error.response?.data?.message || error.message}`;
            }

            await m.reply(errorMessage);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    }
};

export default handler; 