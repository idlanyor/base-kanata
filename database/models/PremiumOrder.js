import { JSONFile } from 'lowdb/node'
import { dbFile, defaultData, initDatabase } from '../../helper/database.js'
import { randomBytes } from 'crypto'
import { Low } from 'lowdb'

class PremiumOrder {

    static async create(orderData) {
        await initDatabase()
        const adapter = new JSONFile(dbFile)
        const db = new Low(adapter, defaultData)

        if (!db.data.premiumOrders) {
            db.data.premiumOrders = {}
        }

        const orderId = this.generateOrderId()
        const order = {
            id: orderId,
            userId: orderData.userId,
            username: orderData.username,
            productCode: orderData.productCode,
            productName: orderData.productName,
            price: orderData.price,
            features: orderData.features || [],
            status: 'pending', // pending, payment_sent, completed, cancelled
            createdAt: new Date().toISOString(),
            paymentProof: null,
            premiumDetails: null
        }

        db.data.premiumOrders[orderId] = order
        await db.write()

        return order
    }

    static async getById(orderId) {
        await initDatabase()
        const adapter = new JSONFile(dbFile)
        const db = new Low(adapter, defaultData)

        if (!db.data.premiumOrders) {
            db.data.premiumOrders = {}
        }
        return db.data.premiumOrders?.[orderId] || null
    }

    static async getByUserId(userId) {
        await initDatabase()
        const adapter = new JSONFile(dbFile)
        const db = new Low(adapter, defaultData)

        if (!db.data.premiumOrders) {
            db.data.premiumOrders = {}
        }
        if (!db.data.premiumOrders) return []

        return Object.values(db.data.premiumOrders).filter(order => order.userId === userId)
    }

    static async updateStatus(orderId, status, additionalData = {}) {
        await initDatabase()
        const adapter = new JSONFile(dbFile)
        const db = new Low(adapter, defaultData)

        if (!db.data.premiumOrders) {
            db.data.premiumOrders = {}
        }

        if (db.data.premiumOrders?.[orderId]) {
            db.data.premiumOrders[orderId].status = status
            db.data.premiumOrders[orderId].updatedAt = new Date().toISOString()

            // Merge additional data
            Object.assign(db.data.premiumOrders[orderId], additionalData)

            await db.write()
            return db.data.premiumOrders[orderId]
        }

        return null
    }

    static async addPaymentProof(orderId, proofData) {
        await initDatabase()
        const adapter = new JSONFile(dbFile)
        const db = new Low(adapter, defaultData)

        if (!db.data.premiumOrders) {
            db.data.premiumOrders = {}
        }

        if (db.data.premiumOrders?.[orderId]) {
            db.data.premiumOrders[orderId].paymentProof = proofData
            db.data.premiumOrders[orderId].status = 'payment_sent'
            db.data.premiumOrders[orderId].updatedAt = new Date().toISOString()

            await db.write()
            return db.data.premiumOrders[orderId]
        }

        return null
    }

    static async getAllPending() {
        await initDatabase()
        const adapter = new JSONFile(dbFile)
        const db = new Low(adapter, defaultData)

        if (!db.data.premiumOrders) {
            db.data.premiumOrders = {}
        }
        if (!db.data.premiumOrders) return []

        return Object.values(db.data.premiumOrders).filter(order =>
            order.status === 'pending' || order.status === 'payment_sent'
        )
    }

    static async getActivePremium(userId) {
        await initDatabase()
        const adapter = new JSONFile(dbFile)
        const db = new Low(adapter, defaultData)

        if (!db.data.premiumOrders) {
            db.data.premiumOrders = {}
        }
        if (!db.data.premiumOrders) return null

        const userOrders = Object.values(db.data.premiumOrders).filter(order => 
            order.userId === userId && order.status === 'completed'
        )

        // Find the most recent active premium
        const activeOrder = userOrders
            .filter(order => order.premiumDetails?.expiresAt && new Date(order.premiumDetails.expiresAt) > new Date())
            .sort((a, b) => new Date(b.premiumDetails.expiresAt) - new Date(a.premiumDetails.expiresAt))[0]

        return activeOrder || null
    }

    static async isUserPremium(userId) {
        const activePremium = await this.getActivePremium(userId)
        return activePremium !== null
    }

    static generateOrderId() {
        const timestamp = Date.now().toString(36)
        const random = randomBytes(3).toString('hex').toUpperCase()
        return `PREM-${timestamp}-${random}`
    }

    static formatPrice(price) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price)
    }
}

export default PremiumOrder