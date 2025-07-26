import axios from 'axios'

class PterodactylAPI {
    constructor() {
        this.baseURL = globalThis.storeConfig.pterodactyl.url
        this.clientApiKey = globalThis.storeConfig.pterodactyl.apiKey
        this.adminApiKey = globalThis.storeConfig.pterodactyl.adminApiKey
        this.emailSuffix = globalThis.storeConfig.pterodactyl.emailSuffix
    }

    // Admin API calls
    async createUser(username, email, firstName = '', lastName = '') {
        try {
            const response = await axios.post(
                `${this.baseURL}/api/application/users`,
                {
                    username: username,
                    email: email,
                    first_name: firstName || username,
                    last_name: lastName || 'User',
                    password: this.generatePassword()
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.adminApiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            )
            return { success: true, data: response.data }
        } catch (error) {
            console.error('Error creating user:', error.response?.data || error.message)
            return { success: false, error: error.response?.data || error.message }
        }
    }

    async createServer(userId, serverName, productSpec) {
        try {
            // Convert RAM string to MB (e.g., "1GB" -> 1024)
            const ramMB = this.convertRamToMB(productSpec.ram)
            // Convert CPU percentage to number (e.g., "100%" -> 100)
            const cpuLimit = parseInt(productSpec.cpu.replace('%', ''))

            const response = await axios.post(
                `${this.baseURL}/api/application/servers`,
                {
                    name: serverName,
                    user: userId,
                    egg: productSpec.eggId,
                    docker_image: this.getDockerImage(productSpec.eggId),
                    startup: this.getStartupCommand(productSpec.eggId),
                    environment: this.getEnvironmentVariables(productSpec.eggId),
                    limits: {
                        memory: ramMB,
                        swap: 0,
                        disk: 5120, // 5GB default
                        io: 500,
                        cpu: cpuLimit
                    },
                    feature_limits: {
                        databases: 2,
                        allocations: 1,
                        backups: 1
                    },
                    allocation: {
                        default: await this.getAvailableAllocation(productSpec.nodeId)
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.adminApiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            )
            return { success: true, data: response.data }
        } catch (error) {
            console.error('Error creating server:', error.response?.data || error.message)
            return { success: false, error: error.response?.data || error.message }
        }
    }

    async getUser(userId) {
        try {
            const response = await axios.get(
                `${this.baseURL}/api/application/users/${userId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.adminApiKey}`,
                        'Accept': 'application/json'
                    }
                }
            )
            return { success: true, data: response.data }
        } catch (error) {
            return { success: false, error: error.response?.data || error.message }
        }
    }

    async getUserByEmail(email) {
        try {
            const response = await axios.get(
                `${this.baseURL}/api/application/users?filter[email]=${email}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.adminApiKey}`,
                        'Accept': 'application/json'
                    }
                }
            )
            return { success: true, data: response.data }
        } catch (error) {
            return { success: false, error: error.response?.data || error.message }
        }
    }

    async getAvailableAllocation(nodeId) {
        try {
            const response = await axios.get(
                `${this.baseURL}/api/application/nodes/${nodeId}/allocations`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.adminApiKey}`,
                        'Accept': 'application/json'
                    }
                }
            )
            
            const allocations = response.data.data
            const available = allocations.find(alloc => !alloc.attributes.assigned)
            
            return available ? available.attributes.id : null
        } catch (error) {
            console.error('Error getting allocations:', error.response?.data || error.message)
            return null
        }
    }

    // Helper methods
    convertRamToMB(ramString) {
        const amount = parseInt(ramString.replace(/[^0-9]/g, ''))
        if (ramString.toLowerCase().includes('gb')) {
            return amount * 1024
        }
        return amount // assume MB if no unit
    }

    getDockerImage(eggId) {
        const images = {
            15: "ghcr.io/parkervcp/yolks:ubuntu", // VPS
            18: "ghcr.io/parkervcp/yolks:nodejs_18", // NodeJS
            22: "ghcr.io/parkervcp/yolks:python_3.11" // Python
        }
        return images[eggId] || "ghcr.io/parkervcp/yolks:ubuntu"
    }

    getStartupCommand(eggId) {
        const commands = {
            15: "/bin/bash", // VPS
            18: "npm start", // NodeJS
            22: "python main.py" // Python
        }
        return commands[eggId] || "/bin/bash"
    }

    getEnvironmentVariables(eggId) {
        const envs = {
            15: {}, // VPS
            18: { // NodeJS
                "NODE_VERSION": "18",
                "MAIN_FILE": "index.js"
            },
            22: { // Python
                "PYTHON_VERSION": "3.11",
                "MAIN_FILE": "main.py"
            }
        }
        return envs[eggId] || {}
    }

    generatePassword(length = 12) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
        let password = ''
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return password
    }

    generateEmail(username) {
        return `${username}@${this.emailSuffix}`
    }

    async createCompleteOrder(username, productCode) {
        const product = globalThis.getProduct(productCode)
        if (!product) {
            return { success: false, error: 'Product not found' }
        }

        const email = this.generateEmail(username)
        
        // Create user first
        const userResult = await this.createUser(username, email)
        if (!userResult.success) {
            return { success: false, error: 'Failed to create user', details: userResult.error }
        }

        const userId = userResult.data.attributes.id
        const serverName = `${product.name} - ${username}`

        // Create server
        const serverResult = await this.createServer(userId, serverName, product)
        if (!serverResult.success) {
            return { success: false, error: 'Failed to create server', details: serverResult.error }
        }

        return {
            success: true,
            user: userResult.data,
            server: serverResult.data,
            loginUrl: `${this.baseURL}/auth/login`,
            credentials: {
                email: email,
                // Note: In real implementation, you should send password via secure method
                message: "Password has been sent to your email"
            }
        }
    }
}

export default PterodactylAPI