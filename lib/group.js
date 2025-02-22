// import { Welcome } from "./canvafy.js";
import Database from '../helper/database.js'

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
    const { id, participants, action } = ev
    const group = await Database.getGroup(id)
    
    for (const participant of participants) {
        const userId = participant.split('@')[0]
        
        // Update database sesuai action
        switch (action) {
            case 'add':
                if (!group.members.includes(participant)) {
                    group.members.push(participant)
                }
                if (group.welcome) {
                    await sock.sendMessage(id, { 
                        text: `Selamat datang @${userId} di grup ${group.name}!`,
                        mentions: [participant] 
                    })
                }
                break
                
            case 'remove':
                group.members = group.members.filter(m => m !== participant)
                break
                
            case 'promote':
                if (!group.admins) group.admins = []
                if (!group.admins.includes(participant)) {
                    group.admins.push(participant)
                }
                break
                
            case 'demote':
                if (group.admins) {
                    group.admins = group.admins.filter(a => a !== participant)
                }
                break
        }
    }
    
    // Update database
    await Database.updateGroup(id, {
        members: group.members,
        admins: group.admins
    })
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


