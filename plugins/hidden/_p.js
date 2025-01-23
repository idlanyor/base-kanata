import loadAssets from "../../helper/loadAssets.js";

export const handler = ['p', 'oy']
export const description = 'p'
export default async ({ sock, m, id, psn, sender, noTel, caption, attf }) => {
    console.log(await loadAssets('anjay.mp3', 'voice'))
    
    await sock.sendMessage(id, { audio: { url: await loadAssets('anjay.mp3', 'voice') }, mimetype: 'audio/mp4', fileName: "anjay" }, { quoted: m });
};
