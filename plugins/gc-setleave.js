import Database from "../helper/database.js";

export const handler = {
    command: 'setleave',
    tags: ['group'],
    help: 'Set pesan leave custom grup',
    isGroup: true,
    isAdmin: true,
    exec: async ({ m, args }) => {
        if (!args) return m.reply(`❌ Masukkan pesan leave!
Contoh: .setleave Selamat tinggal @user dari grup @group!`);
        await Database.updateGroup(m.chat, { leaveMessage: args });
        await m.reply('✅ Pesan leave berhasil diubah!');
    }
}