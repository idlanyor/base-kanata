import { makeInMemoryStore } from 'baileys'
import pino from 'pino'
import { logger } from './logger.js'

// Buat logger untuk store
const storeLogger = pino({
    level: 'silent'
}).child({})

// Buat store instance
let storeInstance = null

/**
 * Membuat store baru
 * @param {string} sessionName - Nama sesi untuk file store
 * @returns {object} Store instance
 */
export const makeStore = (sessionName) => {
    try {
        // Buat store baru jika belum ada
        if (!storeInstance) {
            storeInstance = makeInMemoryStore({ 
                logger: storeLogger 
            })

            // Baca data dari file jika ada
            storeInstance.readFromFile(`store-${sessionName}.json`)

            // Set interval untuk auto-save
            setInterval(() => {
                storeInstance.writeToFile(`store-${sessionName}.json`)
            }, 10000 * 6) // Simpan setiap 1 menit

            logger.info('Store initialized successfully')
        }

        return storeInstance

    } catch (error) {
        logger.error('Error initializing store:', error)
        throw error
    }
}

/**
 * Store class untuk menyimpan pesan dan data
 */
class Store {
    /**
     * Mengambil pesan dari store
     * @param {object} key - Key pesan yang akan diambil
     * @returns {Promise<object|undefined>} Pesan yang diambil
     */
    async getMessage(key) {
        try {
            if (!storeInstance) return undefined

            const msg = await storeInstance.loadMessage(
                key.remoteJid,
                key.id
            )
            return msg?.message || undefined

        } catch (error) {
            logger.error('Error getting message from store:', error)
            return undefined
        }
    }

    /**
     * Bind store ke event emitter
     * @param {object} ev - Event emitter dari socket
     */
    bind(ev) {
        if (storeInstance) {
            storeInstance.bind(ev)
            logger.info('Store bound to socket events')
        }
    }
}

// Export singleton instance
export const store = new Store()