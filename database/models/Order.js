import { JSONFile } from 'lowdb/node'
import { dbFile, defaultData, initDatabase } from '../../helper/database.js'
import { randomBytes } from 'crypto'
import { Low } from 'lowdb'

class Order {

    static async create(orderData) {
        await initDatabase()
        const adapter = new JSONFile(dbFile)
        const db = new Low(adapter, defaultData)

        if (!db.data.orders) {
            db.data.orders = {}
        }

        const orderId = this.generateOrderId()
        const order = {
            id: orderId,
            userId: orderData.userId,
            username: orderData.username,
            productCode: orderData.productCode,
            productName: orderData.productName,
            price: orderData.price,
            status: 'pending', // pending, payment_sent, confirmed, completed, cancelled
            createdAt: new Date().toISOString(),
            paymentProof: null,
            serverId: null,
            serverDetails: null
        }

        db.data.orders[orderId] = order
        await db.write()

        return order
    }

    static async getById(orderId) {
        await initDatabase()
        const adapter = new JSONFile(dbFile)
        const db = new Low(adapter, defaultData)

        if (!db.data.orders) {
            db.data.orders = {}
        }
        return db.data.orders?.[orderId] || null
    }

    static async getByUserId(userId) {
        await initDatabase()
        const adapter = new JSONFile(dbFile)
        const db = new Low(adapter, defaultData)

        if (!db.data.orders) {
            db.data.orders = {}
        }
        if (!db.data.orders) return []

        return Object.values(db.data.orders).filter(order => order.userId === userId)
    }

    static async updateStatus(orderId, status, additionalData = {}) {
        await initDatabase()
        const adapter = new JSONFile(dbFile)
        const db = new Low(adapter, defaultData)

        if (!db.data.orders) {
            db.data.orders = {}
        }

        if (db.data.orders?.[orderId]) {
            db.data.orders[orderId].status = status
            db.data.orders[orderId].updatedAt = new Date().toISOString()

            // Merge additional data
            Object.assign(db.data.orders[orderId], additionalData)

            await db.write()
            return db.data.orders[orderId]
        }

        return null
    }

    static async addPaymentProof(orderId, proofData) {
        await initDatabase()
        const adapter = new JSONFile(dbFile)
        const db = new Low(adapter, defaultData)

        if (!db.data.orders) {
            db.data.orders = {}
        }

        if (db.data.orders?.[orderId]) {
            db.data.orders[orderId].paymentProof = proofData
            db.data.orders[orderId].status = 'payment_sent'
            db.data.orders[orderId].updatedAt = new Date().toISOString()

            await db.write()
            return db.data.orders[orderId]
        }

        return null
    }

    static async getAllPending() {
        await initDatabase()
        const adapter = new JSONFile(dbFile)
        const db = new Low(adapter, defaultData)

        if (!db.data.orders) {
            db.data.orders = {}
        }
        if (!db.data.orders) return []

        return Object.values(db.data.orders).filter(order =>
            order.status === 'pending' || order.status === 'payment_sent'
        )
    }

    static generateOrderId() {
        const timestamp = Date.now().toString(36)
        const random = randomBytes(3).toString('hex').toUpperCase()
        return `ORD-${timestamp}-${random}`
    }

    static formatPrice(price) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price)
    }
}

export default Order