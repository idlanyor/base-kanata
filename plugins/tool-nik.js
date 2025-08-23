import { nikParser } from 'nik-parser';
import { getSign, getZodiac } from 'horoscope';

function calcAge(birthDate) {
    const diff = Date.now() - birthDate.getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
}

function daysUntilBirthday(bd) {
    const now = new Date(), year = now.getFullYear();
    let next = new Date(year, bd.getMonth(), bd.getDate());
    if (next < now) next.setFullYear(year + 1);
    const ms = next - now;
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function parseNikFull(nik) {
    const obj = nikParser(nik);
    if (!obj || !obj.isValid()) return { status: false, error: 'NIK gak valid' };
    const bd = obj.lahir(); // JS Date
    const age = calcAge(bd);
    const countdown = daysUntilBirthday(bd);
    const zodiac = getSign({ month: bd.getMonth() + 1, day: bd.getDate() });
    const chinese = getZodiac(bd.getFullYear());

    return {
        status: true,
        data: {
            nik,
            valid: true,
            province: obj.province(),
            kabupatenKota: obj.kabupatenKota(),
            kecamatan: obj.kecamatan(),
            kodepos: obj.kodepos?.() || null,
            kelamin: obj.kelamin(),
            birthDate: bd.toISOString().slice(0, 10),
            birthDay: bd.getUTCDate(),
            birthMonth: bd.getUTCMonth() + 1,
            birthYear: bd.getUTCFullYear(),
            age,
            daysUntilBirthday: countdown,
            zodiacWestern: zodiac || null,
            chineseZodiac: chinese || null,
            uniqueCode: obj.uniqcode()
        }
    };
}

export const handler = {
    command: ['nik', 'ceknik', 'nikparser'],
    tags: ['tools'],
    help: 'Cek info NIK KTP',
    isGroup: false,
    isAdmin: false,
    isOwner: false,
    exec: async ({ m, args }) => {
        const nik = (args || '').replace(/\D/g, '');
        if (!nik || nik.length !== 16) {
            await m.reply(`❌ Masukkan NIK 16 digit!
Contoh: .nik 3204110609970001`);
            return;
        }
        const result = parseNikFull(nik);
        if (!result.status) {
            await m.reply(`❌ NIK tidak valid atau format salah!`);
            return;
        }
        const d = result.data;
        const msg = `*NIK Parser*

` +
            `*NIK:* ${d.nik}
` +
            `*Provinsi:* ${d.province}
` +
            `*Kab/Kota:* ${d.kabupatenKota}
` +
            `*Kecamatan:* ${d.kecamatan}
` +
            (d.kodepos ? `*Kodepos:* ${d.kodepos}
` : '') +
            `*Jenis Kelamin:* ${d.kelamin}
` +
            `*Tanggal Lahir:* ${d.birthDate}
` +
            `*Umur:* ${d.age} tahun
` +
            `*Zodiak:* ${d.zodiacWestern}
` +
            `*Shio:* ${d.chineseZodiac}
` +
            `*Kode Unik:* ${d.uniqueCode}
` +
            `*Hari ke ulang tahun berikutnya:* ${d.daysUntilBirthday} hari lagi`;
        await m.reply(msg);
    }
};

export default handler; 