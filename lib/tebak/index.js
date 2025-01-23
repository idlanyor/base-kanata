import { updatePoints } from '../../helper/database.js';
import { tebak } from '../../helper/skizotech.js';
import moment from 'moment';
import { maskSentence } from '../../helper/word.js';
export let tebakSession = new Map();


export const asahotak = async (id, sock) => {
    try {
        const response = await tebak('asahotak');
        const question = response.data.soal;
        const answer = response.data.jawaban;

        await sock.sendMessage(id, { text: question });

        tebakSession.set(id, {
            answer: answer,
            timeout: setTimeout(async () => {
                await sock.sendMessage(id, { text: `Waktu habis! Jawaban yang benar adalah: ${tebakSession.get(id).answer}` });
                tebakSession.delete(id);
            }, 60000)
        });
    } catch (error) {
        console.log(error)
        await sock.sendMessage(id, { text: 'Terjadi kesalahan, silakan coba lagi.' });
    }
};
export const caklontong = async (id, sock) => {
    try {
        const response = await tebak('caklontong');
        const question = `Soal : ${response.data.soal} \n Clue : ${response.data.deskripsi}`;
        const answer = response.data.jawaban;

        await sock.sendMessage(id, { text: question + ` ${maskSentence(answer)} (${answer.length}) kata` });

        tebakSession.set(id, {
            answer: answer,
            timeout: setTimeout(async () => {
                await sock.sendMessage(id, { text: `Waktu habis! Jawaban yang benar adalah: ${tebakSession.get(id).answer}` });
                tebakSession.delete(id);
            }, 60000) // 60 detik
        });
    } catch (error) {
        console.log(error)
        await sock.sendMessage(id, { text: 'Terjadi kesalahan, silakan coba lagi.' });
    }
};
export const susun = async (id, sock) => {
    try {
        const response = await tebak('susunkata');
        const question = response.data.result.pertanyaan;
        const answer = response.data.result.jawaban;

        await sock.sendMessage(id, { text: question });

        tebakSession.set(id, {
            answer: answer,
            timeout: setTimeout(async () => {
                await sock.sendMessage(id, { text: `Waktu habis! Jawaban yang benar adalah: ${tebakSession.get(id).answer}` });
                tebakSession.delete(id);
            }, 60000) // 60 detik
        });
    } catch (error) {
        console.log(error)
        await sock.sendMessage(id, { text: 'Terjadi kesalahan, silakan coba lagi.' });
    }
};

export const bendera = async (id, sock) => {
    try {
        const response = await tebak('bendera');
        const question = response.data.result.flag;
        const answer = response.data.result.name;

        await sock.sendMessage(id, { text: question });

        tebakSession.set(id, {
            answer: answer,
            timeout: setTimeout(async () => {
                await sock.sendMessage(id, { text: `Waktu habis! Jawaban yang benar adalah: ${tebakSession.get(id).answer}` });
                tebakSession.delete(id);
            }, 60000) // 60 detik
        });
    } catch (error) {
        console.log(error)
        await sock.sendMessage(id, { text: 'Terjadi kesalahan, silakan coba lagi.' });
    }
};
export const gambar = async (id, sock) => {
    try {
        const response = await tebak('gambar');
        const img = response.data.result.image;
        const answer = response.data.result.answer;
        await sock.sendMessage(id, { image: { url: img.replace(/\.png$/, '.jpg') } })

        tebakSession.set(id, {
            answer: answer,
            timeout: setTimeout(async () => {
                await sock.sendMessage(id, { text: `Waktu habis! Jawaban yang benar adalah: ${tebakSession.get(id).answer}` });
                tebakSession.delete(id);
            }, 60000) // 60 detik
        });
    } catch (error) {
        console.log(error)
        await sock.sendMessage(id, { text: 'Terjadi kesalahan, silakan coba lagi.' });
    }
};


export const checkAnswer = async (id, userAnswer, sock, quotedMessageId, noTel) => {
    const session = tebakSession.get(id);
    const correctAnswer = session.answer.toLowerCase();
    const questionTime = session.timestamp; // Waktu pertanyaan diajukan
    const currentTime = moment(); // Waktu saat ini

    const timeElapsed = currentTime.diff(questionTime, 'seconds'); // Menghitung selisih waktu dalam detik

    let maxPoin;
    let minPoin;

    if (timeElapsed <= 10) {
        minPoin = 900;
        maxPoin = 1000;
    } else if (timeElapsed <= 30) {
        minPoin = 800;
        maxPoin = 900;
    } else if (timeElapsed <= 60) {
        minPoin = 700;
        maxPoin = 800;
    } else if (timeElapsed <= 120) {
        minPoin = 600;
        maxPoin = 700;
    } else if (timeElapsed <= 180) {
        minPoin = 500;
        maxPoin = 600;
    } else if (timeElapsed <= 240) {
        minPoin = 400;
        maxPoin = 500;
    } else if (timeElapsed <= 300) {
        minPoin = 300;
        maxPoin = 400;
    } else if (timeElapsed <= 360) {
        minPoin = 200;
        maxPoin = 300;
    } else if (timeElapsed <= 420) {
        minPoin = 100;
        maxPoin = 200;
    } else {
        minPoin = 50;
        maxPoin = 100;
    }

    const kalkulasiPoin = Math.floor(Math.random() * (maxPoin - minPoin + 1)) + minPoin;

    if (userAnswer.toLowerCase() === correctAnswer) {
        clearTimeout(session.timeout);
        await updatePoints({ id: noTel, points: kalkulasiPoin })
        await sock.sendMessage(id, {
            text: 'Jawaban kamu benar! ' + correctAnswer + `\nSelamat poin kamu bertambah ${kalkulasiPoin} pts`,
        }, { quoted: quotedMessageId });
        tebakSession.delete(id);
    }

    // else {
    //     await sock.sendMessage(id, {
    //         text: 'Jawaban kamu salah. Coba lagi!',
    //     }, { quoted: quotedMessageId });
    // }
};


