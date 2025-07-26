import { JSONFile } from 'lowdb/node'
import { dbFile, defaultData, initDatabase } from '../../helper/database.js'
import { randomBytes } from 'crypto'
import { Low } from 'lowdb'

class Order {

    static async create(orderData) {
        try {
            // Validate required fields
            if (!orderData.userId || !orderData.username || !orderData.productCode || 
                !orderData.productName || !orderData.price) {
                throw new Error('Missing required order data fields')
            }

            await initDatabase()
            const adapter = new JSONFile(dbFile)
            const db = new Low(adapter, defaultData)
            await db.read()

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
        } catch (error) {
            console.error('Error creating order:', error)
            throw error
        }
    }

    static async getById(orderId) {
        try {
            if (!orderId) {
                throw new Error('Order ID is required')
            }

            await initDatabase()
            const adapter = new JSONFile(dbFile)
            const db = new Low(adapter, defaultData)
            await db.read()

            if (!db.data.orders) {
                db.data.orders = {}
            }

            return db.data.orders[orderId] || null
        } catch (error) {
            console.error('Error getting order by ID:', error)
            throw error
        }
    }

    static async getByUserId(userId) {
        try {
            if (!userId) {
                throw new Error('User ID is required')
            }

            await initDatabase()
            const adapter = new JSONFile(dbFile)
            const db = new Low(adapter, defaultData)
            await db.read()

            if (!db.data.orders) {
                db.data.orders = {}
            }

            return Object.values(db.data.orders).filter(order => order.userId === userId)
        } catch (error) {
            console.error('Error getting orders by user ID:', error)
            throw error
        }
    }

    static async updateStatus(orderId, status, additionalData = {}) {
        try {
            if (!orderId || !status) {
                throw new Error('Order ID and status are required')
            }

            const validStatuses = ['pending', 'payment_sent', 'confirmed', 'completed', 'cancelled']
            if (!validStatuses.includes(status)) {
                throw new Error(`Invalid status: ${status}. Valid statuses: ${validStatuses.join(', ')}`)
            }

            await initDatabase()
            const adapter = new JSONFile(dbFile)
            const db = new Low(adapter, defaultData)
            await db.read()

            if (!db.data.orders) {
                db.data.orders = {}
            }

            if (db.data.orders[orderId]) {
                db.data.orders[orderId].status = status
                db.data.orders[orderId].updatedAt = new Date().toISOString()

                // Merge additional data
                Object.assign(db.data.orders[orderId], additionalData)

                await db.write()
                return db.data.orders[orderId]
            }

            return null
        } catch (error) {
            console.error('Error updating order status:', error)
            throw error
        }
    }

    static async addPaymentProof(orderId, proofData) {
        try {
            if (!orderId || !proofData) {
                throw new Error('Order ID and payment proof data are required')
            }

            await initDatabase()
            const adapter = new JSONFile(dbFile)
            const db = new Low(adapter, defaultData)
            await db.read()

            if (!db.data.orders) {
                db.data.orders = {}
            }

            if (db.data.orders[orderId]) {
                db.data.orders[orderId].paymentProof = proofData
                db.data.orders[orderId].status = 'payment_sent'
                db.data.orders[orderId].updatedAt = new Date().toISOString()

                await db.write()
                return db.data.orders[orderId]
            }

            return null
        } catch (error) {
            console.error('Error adding payment proof:', error)
            throw error
        }
    }

    static async getAllPending() {
        try {
            await initDatabase()
            const adapter = new JSONFile(dbFile)
            const db = new Low(adapter, defaultData)
            await db.read()

            if (!db.data.orders) {
                db.data.orders = {}
            }

            return Object.values(db.data.orders).filter(order =>
                order.status === 'pending' || order.status === 'payment_sent'
            )
        } catch (error) {
            console.error('Error getting pending orders:', error)
            throw error
        }
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