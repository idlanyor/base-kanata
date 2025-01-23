export const handler = 'kick'
export const description = 'Mengeluarkan anggota dari group'
export default async ({ sock, m, id, psn, sender, noTel, caption, attf }) => {

    if (psn === '') {
        await sock.sendMessage(id, { text: '📋 *Gunakan format:* \n\n`kick <@tag>`\n\nContoh:\n`kick @user`' });
        return;
    }

    try {
        let res = await sock.groupParticipantsUpdate(id, [psn.replace('@', '') + '@s.whatsapp.net'], 'remove')
        console.log(res)
        await sock.sendMessage(id, { text: `✅ *Menendang ${psn.trim()} dari group*` });
    } catch (error) {
        await sock.sendMessage(id, { text: '❌ *Terjadi kesalahan:* \n' + error.message });
    }
};
