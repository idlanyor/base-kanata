import Database from "../../helper/database.js";

export const handler = {
    command: 'setwelcome',
    tags: ['group'],
    help: 'Set pesan sambutan custom grup',
    isGroup: true,
    isAdmin: true,
    exec: async ({ m, args }) => {
        if (!args) return m.reply(`❌ Masukkan pesan welcome!
Contoh: .setwelcome Selamat datang @user di grup @group!`);
        await Database.updateGroup(m.chat, { welcomeMessage: args });
        await m.reply('✅ Pesan welcome berhasil diubah!');
    }
}
