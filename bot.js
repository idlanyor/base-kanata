import { makeWASocket, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, makeInMemoryStore, useMultiFileAuthState, DisconnectReason, Browsers } from '@seaavey/baileys';
import pino from "pino";
import NodeCache from "node-cache";
import fs from 'fs-extra';
import { startBot } from "./main.js";
import { logger } from './helper/logger.js';

class Sonata {
    constructor(data) {
        this.phoneNumber = data.phoneNumber;
        this.sessionId = data.sessionId;
        this.useStore = data.useStore;
    }

    async start() {
        const msgRetryCounterCache = new NodeCache();
        const useStore = this.useStore;
        const MAIN_LOGGER = pino({
            timestamp: () => `,"time":"${new Date().toJSON()}"`,
        });

        const loggerPino = MAIN_LOGGER.child({});
        loggerPino.level = "silent";

        const store = useStore ? makeInMemoryStore({ logger: loggerPino }) : undefined;
        store?.readFromFile(`store-${this.sessionId}.json`);

        setInterval(() => {
            store?.writeToFile(`store-${this.sessionId}.json`);
        }, 10000 * 6);

        const P = pino({
            level: "silent",
        });
        let { state, saveCreds } = await useMultiFileAuthState(this.sessionId);
        let { version } = await fetchLatestBaileysVersion();
        const sock = makeWASocket({
            version,
            logger: P,
            printQRInTerminal: false,
            browser: Browsers.macOS("Safari"),
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, P),
            },
            msgRetryCounterCache,
            connectOptions: {
                maxRetries: 5,
                keepAlive: true,
            },
        });

        store?.bind(sock.ev);

        sock.ev.on("creds.update", saveCreds);

        // Tambah mekanisme retry jika koneksi gagal pas request pairing code
        if (!sock.authState.creds.registered) {
            logger.info("Menunggu Pairing Code");
            const number = this.phoneNumber;
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

            let retryCount = 0;
            const maxRetries = 1;

            while (retryCount < maxRetries) {
                try {
                    await delay(6000);
                    const code = await sock.requestPairingCode(number);
                    logger.connection.pairing(code);
                    break;
                } catch (err) {
                    retryCount++;
                    if (retryCount >= maxRetries) {
                        await fs.remove(`./${this.sessionId}`);
                        await startBot();
                    }
                }
            }
        }

        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;
            if (connection === "connecting") {
                logger.connection.connecting("Memulai koneksi soket");
            } else if (connection === "open") {
                logger.connection.connected("Soket terhubung");
            } else if (connection === "close") {
                logger.connection.disconnected("Koneksi terputus, mencoba kembali...");
                const reason = lastDisconnect?.error?.output?.statusCode;

                if (reason === DisconnectReason.loggedOut) {
                    logger.error("Sesi ora valid, bakal dihapus...");

                    // Hapus folder sesi kalo sesi logout
                    await fs.remove(`./${this.sessionId}`);
                    logger.warning(`Folder sesi ${this.sessionId} dihapus, login ulang...`);

                    // Login ulang tanpa nge-delay
                    logger.success("Login ulang berhasil. Eksekusi tugas selanjutnya...");
                    await startBot();
                } else {
                    logger.error("Koneksi terputus, mencoba kembali...");
                    await startBot();
                }
            }
        });

        return sock;
    }
}

async function clearMessages(m) {
    try {
        if (m === "undefined") return;
        let data;
        if (m.message?.conversation) {
            const text = m.message?.conversation.trim();
            if (m.key.remoteJid.endsWith("g.us")) {
                data = {
                    chatsFrom: "group",
                    remoteJid: m.key.remoteJid,
                    participant: {
                        fromMe: m.key.fromMe,
                        number: m.key.participant,
                        pushName: m.pushName,
                        message: text,
                    },
                };
            } else {
                data = {
                    chatsFrom: "private",
                    remoteJid: m.key.remoteJid,
                    fromMe: m.key.fromMe,
                    pushName: m.pushName,
                    message: text,
                };
            }
            if (typeof text !== "undefined") {
                return data;
            } else {
                return m;
            }
        } else if (m.message?.extendedTextMessage) {
            const text = m.message?.extendedTextMessage.text.trim();
            if (m.key.remoteJid.endsWith("g.us")) {
                data = {
                    chatsFrom: "group",
                    remoteJid: m.key.remoteJid,
                    participant: {
                        fromMe: m.key.fromMe,
                        number: m.key.participant,
                        pushName: m.pushName,
                        message: text,
                    },
                };
            } else {
                data = {
                    chatsFrom: "private",
                    remoteJid: m.key.remoteJid,
                    fromMe: m.key.fromMe,
                    pushName: m.pushName,
                    message: text,
                };
            }
            if (typeof text !== "undefined") {
                return data;
            } else {
                return m;
            }
        }
    } catch (err) {
        logger.error("Error: ", err);
        return m;
    }
}
const sanitizeBotId = botId => botId.split(":")[0] + "@s.whatsapp.net";

export { Sonata, clearMessages, sanitizeBotId };
