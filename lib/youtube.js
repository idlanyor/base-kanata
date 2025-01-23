import { yutub, yutubAudio, yutubVideo } from "../lib/downloader.js";
import yts from "yt-search";

export const ytsearch = async (query) => {
    const res = await yts(query);
    return res.videos.map((video, index) => ({
        image: video.image || video.thumbnail,
        author: video.author.name,
        title: video.title,
        url: video.url
    }));
}
// await ytsearch('jejak awan pesawat')


export const ytPlay = async (query) => {
    try {
        const { url, title, } = (await ytsearch(query))[0];
        return yutubAudio(url);
    } catch (error) {
        console.error('Error in ytPlay2:', error);
        return error;
    }
}
export const ytPlayVideo = async (query) => {
    try {
        const { url, title, } = (await ytsearch(query))[0];
        return yutubVideo(url);
    } catch (error) {
        console.error('Error in ytPlay2:', error);
        return error;
    }
}


// const testPerformance = async () => {
//     const query = 'jejak awan pesawat official';

//     // Mengukur waktu eksekusi untuk ytPlay
//     console.time('ytPlay');
//     await ytPlay(query);
//     console.timeEnd('ytPlay');

//     // Mengukur waktu eksekusi untuk ytPlay2
//     console.time('ytPlay2');
//     await ytPlay2(query);
//     console.timeEnd('ytPlay2');

//     // Menentukan mana yang lebih cepat
//     const timeTaken1 = console.timeLog('ytPlay');
//     const timeTaken2 = console.timeLog('ytPlay2');

//     if (timeTaken1 < timeTaken2) {
//         console.log('ytPlay lebih cepat.');
//     } else if (timeTaken1 > timeTaken2) {
//         console.log('ytPlay2 lebih cepat.');
//     } else {
//         console.log('Kedua fungsi memiliki waktu eksekusi yang sama.');
//     }
// };

// // Jalankan pengujian
// testPerformance();
