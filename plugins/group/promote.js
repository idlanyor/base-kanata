export const handler = 'promote'
export const description = 'Menaikkan pangkat anggota grup menjadi Admin'
export default async ({ sock, m, id, psn, sender, noTel, caption, attf }) => {

    if (psn === '') {
        await sock.sendMessage(id, { text: '📋 *Gunakan format:* \n\n`promote <@tag>`\n\nContoh:\n`promote @user`' });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(id, [psn.replace('@', '') + '@s.whatsapp.net'], 'promote')
        // console.log(res)
        await sock.sendMessage(id, { text: `✅ *Berhasil Menaikkan pangkat \`\`\`${psn.trim()}\`\`\` sebagai Admin*` });
    } catch (error) {
        await sock.sendMessage(id, { text: '❌ *Terjadi kesalahan:* \n' + error.message });
    }
};
