export const handler = 'demote'
export const description = 'Menurunkan pangkat anggota grup dari Admin'
export default async ({ sock, m, id, psn, sender, noTel, caption, attf }) => {

    if (psn === '') {
        await sock.sendMessage(id, { text: '📋 *Gunakan format:* \n\n`demote <@tag>`\n\nContoh:\n`demote @user`' });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(id, [psn.replace('@', '') + '@s.whatsapp.net'], 'demote')
        // console.log(res)
        await sock.sendMessage(id, { text: `✅ *Berhasil Menaikkan pangkat \`\`\`${psn.trim()}\`\`\` sebagai Admin*` });
    } catch (error) {
        await sock.sendMessage(id, { text: '❌ *Terjadi kesalahan:* \n' + error.message });
    }
};
