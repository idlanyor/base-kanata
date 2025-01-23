export const handler = 'add'
export const description = 'Menambahkan anggota ke dalam group'
export default async ({ sock, m, id, psn, sender, noTel, caption, attf }) => {

    if (psn === '') {
        await sock.sendMessage(id, { text: '📋 *Gunakan format:* \n\n`add <@tag>`\n\nContoh:\n`add @user`' });
        return;
    }

    try {
        let res = await sock.groupParticipantsUpdate(id, [psn.replace('@', '') + '@s.whatsapp.net'], 'add')
        console.log(res)
        await sock.sendMessage(id, { text: `✅ *Berhasil Menambahkan \`\`\`${psn.trim()}\`\`\` ke group*` });
    } catch (error) {
        await sock.sendMessage(id, { text: '❌ *Terjadi kesalahan:* \n' + error.message });
    }
};
