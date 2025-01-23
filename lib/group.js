// import { Welcome } from "./canvafy.js";

export async function groupUpdate(ev, sock) {
    // console.log('Groups update event:', ev);
    for (const group of ev) {
        console.log(`Group updated: ${group.id}`);
        switch (true) {
            case group.subject !== undefined:
                console.log(`New subject: ${group.subject}`);
                break;
            case group.announce !== undefined:
                await sock.sendMessage(group.id, { text: `Pengumuman: Grup ini sekarang ${group.announce ? 'tertutup' : 'terbuka'} untuk peserta mengirim pesan.` });
                console.log(`Group is now ${group.announce ? 'closed' : 'open'} for participants to send messages`);
                break;
            case group.restrict !== undefined:
                await sock.sendMessage(group.id, { text: `Pengaturan grup sekarang ${group.restrict ? 'dibatasi' : 'terbuka'}` });
                console.log(`Group settings are now ${group.restrict ? 'restricted' : 'open'}`);
                break;
            case group.joinApprovalMode !== undefined:
                await sock.sendMessage(group.id, { text: `Group join approval mode is now ${group.joinApprovalMode ? 'enabled' : 'disabled'}` });
                console.log(`Group join approval mode is now ${group.joinApprovalMode ? 'enabled' : 'disabled'}`);
                break;
            case group.desc !== undefined:
                console.log(`New description: ${group.desc}`);
                await sock.sendMessage(group.id, { text: `Deskripsi grup telah diperbarui: ${group.desc}` });
                break;
            case group.participants !== undefined:
                console.log(`Participants updated: ${group.participants}`);
                await sock.sendMessage(group.id, { text: `Daftar peserta grup telah diperbarui.` });
                break;
            case group.memberAddMode !== undefined:
                await sock.sendMessage(group.id, { text: `Mode penambahan anggota grup sekarang ${group.memberAddMode ? 'diaktifkan' : 'dinonaktifkan'}` });
                console.log(`Group member add mode is now ${group.memberAddMode ? 'enabled' : 'disabled'}`);
                break;
            case group.owner !== undefined:
                console.log(`New owner: ${group.owner}`);
                await sock.sendMessage(group.id, { text: `Pemilik grup telah diperbarui: @${group.owner.split('@')[0]}`, mentions: [group.owner] });
                break;
            case group.icon !== undefined:
                console.log(`New group icon: ${group.icon}`);
                await sock.sendMessage(group.id, { text: `Ikon grup telah diperbarui.` });
                break;
            case group.suspended !== undefined:
                console.log(`Group suspended status: ${group.suspended}`);
                await sock.sendMessage(group.id, { text: `Status grup sekarang ${group.suspended ? 'ditangguhkan' : 'aktif'}` });
                break;
            case group.inviteCode !== undefined:
                console.log(`New invite code: ${group.inviteCode}`);
                await sock.sendMessage(group.id, { text: `Kode undangan grup telah diperbarui: ${group.inviteCode}` });
                break;
            case group.ephemeral !== undefined:
                console.log(`Ephemeral settings updated: ${group.ephemeral}`);
                await sock.sendMessage(group.id, { text: `Pengaturan pesan sementara grup telah diperbarui.` });
                break;
        }

    }
}
export async function groupParticipants(ev, sock) {
    console.log('Group participants update event:', ev);
    const { id, participants, action } = ev;
    const groupMetadata = await sock.groupMetadata(id);
    const groupName = groupMetadata.subject;
    console.log(groupMetadata)

    const sendMessage = async (participant, message) => {
        await sock.sendMessage(id, message);
        console.log(`Sent ${action} message to: ${participant}`);
    };

    for (const participant of participants) {
        const userId = participant.split('@')[0];
        switch (action) {
            // case 'add':
            //     const welcomeImage = await Welcome(sock, userId, groupName, participant) || { url: "https://telegra.ph/file/cad7038fe82e47f79c609.jpg" };
            //     await sendMessage(participant, { image: welcomeImage, caption: `Selamat Datang @${userId}!`, mentions: [participant] });
            //     break;
            // case 'remove':
            //     await sendMessage(participant, { text: `@${userId} Meninggalkan pertempuran`, mentions: [participant] });
            //     break;
            case 'promote':
                await sendMessage(participant, { text: `Selamat @${userId}! Kamu sekarang menjadi Admin.`, mentions: [participant] });
                break;
            case 'demote':
                await sendMessage(participant, { text: `Maaf @${userId}! Kamu telah diturunkan dari admin.`, mentions: [participant] });
                break;
        }
    }
}

async function promote(jid, participants, sock) {
    return await sock.groupParticipantsUpdate(jid, [participants], 'promote')
}
async function demote(jid, participants, sock) {
    return await sock.groupParticipantsUpdate(jid, [participants], 'demote')
}

export const grupAction = {
    promote, demote
}


