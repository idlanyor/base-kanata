import moment from 'moment';
export const description = "Ping Bot";
export const handler = "ping"
const calculatePing = function (timestamp, now) {
    return moment.duration(now - moment(timestamp * 1000)).asSeconds();
};

export default async ({ sock, m, id, psn, sender, noTel, caption }) => {
    await sock.sendMessage(id, { text: `Bot merespon dalam *_${calculatePing(m.messageTimestamp, Date.now())} detik_*` }, {
        contextInfo: {
            isForwarded: true,
            forwardingScore: 9999999,
            isForwarded: true,
            externalAdReply: {
                title: `乂 Kanata 乂`,
                body: 'Kanata Bot',
                mediaType: 1,
                previewType: 0,
                renderLargerThumbnail: true,
                thumbnailUrl: 'https://telegra.ph/file/8360caca1efd0f697d122.jpg',
                sourceUrl: 'https://telegra.ph/file/8360caca1efd0f697d122.jpg',
            }
        },
    })
};
