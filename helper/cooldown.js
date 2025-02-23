import NodeCache from 'node-cache'

class Cooldown {
    constructor() {
        this.cache = new NodeCache({ 
            stdTTL: 10 // Default cooldown 10 detik
        })
    }

    /**
     * Cek apakah user dalam cooldown
     * @param {string} userId ID user
     * @param {string} command Command yang digunakan
     * @returns {boolean} Status cooldown
     */
    isOnCooldown(userId, command) {
        const key = `${userId}-${command}`
        return this.cache.has(key)
    }

    /**
     * Set cooldown untuk user
     * @param {string} userId ID user
     * @param {string} command Command yang digunakan
     * @param {number} duration Durasi cooldown dalam detik
     */
    setCooldown(userId, command, duration = 10) {
        const key = `${userId}-${command}`
        this.cache.set(key, true, duration)
    }

    /**
     * Hapus cooldown user
     * @param {string} userId ID user
     * @param {string} command Command yang digunakan
     */
    clearCooldown(userId, command) {
        const key = `${userId}-${command}`
        this.cache.del(key)
    }
}

export const cooldown = new Cooldown()

// Filter untuk pesan
export const messageFilter = {
    isSpam(message, userId) {
        if (cooldown.isOnCooldown(userId, 'spam')) {
            return true
        }
        cooldown.setCooldown(userId, 'spam', 3) // 3 detik cooldown
        return false
    },

    isPromotion(message) {
        const promoRegex = /(jual|beli|shop|store|olshop|preloved|promo|diskon|discount|sale|murah)/gi
        return promoRegex.test(message)
    },

    isLink(message) {
        const linkRegex = /(https?:\/\/|www\.)\S+/gi
        return linkRegex.test(message)
    },

    isToxic(message) {
        const toxicWords = ['anjing', 'bangsat', 'kontol', 'memek', 'jancok', 'babi']
        return toxicWords.some(word => message.toLowerCase().includes(word))
    }
} 