import { makeWASocket, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, useMultiFileAuthState, DisconnectReason, Browsers, getAggregateVotesInPollMessage } from '@fizzxydev/baileys-pro';
import pino from "pino";
import NodeCache from "node-cache";
import fs from 'fs-extra';
import { startBot } from "./main.js";
import { logger } from './helper/logger.js';

// Global state to prevent multiple simultaneous restarts
let isRestarting = false;
let restartTimeout = null;

class Kanata {
    constructor(data) {
        this.phoneNumber = data.phoneNumber;
        this.sessionId = data.sessionId;
        this.useStore = data.useStore;
        this.sock = null;
        this.isConnecting = false;
    }

    async start() {
        // Prevent multiple simultaneous start attempts
        if (this.isConnecting) {
            logger.warning("Connection attempt already in progress, skipping...");
            return null;
        }

        this.isConnecting = true;

        try {
            const msgRetryCounterCache = new NodeCache();
            const useStore = this.useStore;
            const MAIN_LOGGER = pino({
                timestamp: () => `,"time":"${new Date().toJSON()}"`,
            });

            const loggerPino = MAIN_LOGGER.child({});
            loggerPino.level = "silent";

            const store = useStore ? false : undefined;
            store?.readFromFile(`store-${this.sessionId}.json`);

            setInterval(() => {
                store?.writeToFile(`store-${this.sessionId}.json`);
            }, 10000 * 6);

            const getMessageFromStore = async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return undefined;
            };

            const P = pino({
                level: "silent",
            });
            let { state, saveCreds } = await useMultiFileAuthState(this.sessionId);
            let { version } = await fetchLatestBaileysVersion();
            
            this.sock = makeWASocket({
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
                    connectTimeoutMs: 60000,
                    retryDelayMs: 2000,
                    patchBeforeConnect: true,
                    qrTimeout: 40000,
                    defaultQueryTimeoutMs: 60000
                },
                getMessage: async (key) => await getMessageFromStore(key)
            });

            store?.bind(this.sock.ev);

            this.sock.ev.on("creds.update", saveCreds);

            // Improved pairing code logic with proper error handling
            if (!this.sock.authState.creds.registered) {
                logger.info("Menunggu Pairing Code");
                const number = this.phoneNumber;
                const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

                let retryCount = 0;
                const maxRetries = 3; // Increase max retries
                let pairingSuccess = false;

                while (retryCount < maxRetries && !pairingSuccess) {
                    try {
                        await delay(3000); // Reduce delay
                        const code = await this.sock.requestPairingCode(number, 'ROYNALDI');
                        logger.connection.pairing(code);
                        pairingSuccess = true;
                        break;
                    } catch (err) {
                        retryCount++;
                        logger.error(`Pairing attempt ${retryCount}/${maxRetries} failed:`, err.message);
                        
                        if (retryCount >= maxRetries) {
                            logger.error("Max pairing retries reached, cleaning up session...");
                            await this.cleanup();
                            // await fs.remove(`./${this.sessionId}`);
                            
                            // Use debounced restart instead of immediate recursion
                            this.scheduleRestart(5000); // 5 second delay
                            return null;
                        }
                        
                        // Wait before retry
                        await delay(2000);
                    }
                }
            }

            this.sock.ev.on("connection.update", async (update) => {
                const { connection, lastDisconnect } = update;
                
                if (connection === "connecting") {
                    logger.connection.connecting("Memulai koneksi soket");
                } else if (connection === "open") {
                    logger.connection.connected("Soket terhubung");
                    this.isConnecting = false;
                    // Clear any pending restart
                    if (restartTimeout) {
                        clearTimeout(restartTimeout);
                        restartTimeout = null;
                    }
                    isRestarting = false;
                } else if (connection === "close") {
                    this.isConnecting = false;
                    logger.connection.disconnected("Koneksi terputus, mencoba kembali...");
                    const reason = lastDisconnect?.error?.output?.statusCode;

                    // Prevent multiple simultaneous restart attempts
                    if (isRestarting) {
                        logger.warning("Restart already in progress, ignoring...");
                        return;
                    }

                    if (reason === DisconnectReason.loggedOut) {
                        logger.error("Sesi tidak valid, akan dihapus...");
                        logger.warning(`Folder sesi ${this.sessionId} dihapus, login ulang...`);
                        
                        await this.cleanup();
                        // await fs.remove(`./${this.sessionId}`);
                        
                        this.scheduleRestart(3000); // 3 second delay for logout
                    } else if (reason === DisconnectReason.connectionClosed || 
                             reason === DisconnectReason.connectionLost ||
                             reason === DisconnectReason.restartRequired) {
                        logger.error("Koneksi terputus, mencoba kembali...");
                        await this.cleanup();
                        this.scheduleRestart(5000); // 5 second delay for connection issues
                    } else {
                        logger.error(`Unknown disconnect reason: ${reason}, restarting...`);
                        await this.cleanup();
                        this.scheduleRestart(10000); // 10 second delay for unknown issues
                    }
                }
            });

            return this.sock;

        } catch (error) {
            this.isConnecting = false;
            logger.error("Error during bot start:", error);
            await this.cleanup();
            this.scheduleRestart(10000); // 10 second delay on startup error
            return null;
        }
    }

    // Clean up resources before restart
    async cleanup() {
        try {
            if (this.sock) {
                // Remove all event listeners to prevent memory leaks
                this.sock.ev.removeAllListeners();
                
                // Close connection if still open
                if (this.sock.ws && this.sock.ws.readyState === 1) {
                    this.sock.ws.close();
                }
                
                this.sock = null;
            }
        } catch (error) {
            logger.error("Error during cleanup:", error);
        }
    }

    // Debounced restart with exponential backoff
    scheduleRestart(delay = 5000) {
        if (isRestarting) {
            logger.warning("Restart already scheduled, ignoring...");
            return;
        }

        isRestarting = true;
        
        // Clear any existing timeout
        if (restartTimeout) {
            clearTimeout(restartTimeout);
        }

        logger.info(`Scheduling restart in ${delay}ms...`);
        
        restartTimeout = setTimeout(async () => {
            try {
                logger.info("Executing scheduled restart...");
                await startBot();
            } catch (error) {
                logger.error("Error during scheduled restart:", error);
                // Exponential backoff - double the delay for next attempt
                this.scheduleRestart(Math.min(delay * 2, 60000)); // Max 1 minute
            } finally {
                isRestarting = false;
                restartTimeout = null;
            }
        }, delay);
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

export { Kanata, clearMessages, sanitizeBotId };
