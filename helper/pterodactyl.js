import axios from 'axios'

class PterodactylAPI {
    constructor() {
        this.baseURL = globalThis.storeConfig.pterodactyl.url
        this.clientApiKey = globalThis.storeConfig.pterodactyl.apiKey
        this.adminApiKey = globalThis.storeConfig.pterodactyl.adminApiKey
        this.emailSuffix = globalThis.storeConfig.pterodactyl.emailSuffix
        
        // Validate egg configuration on initialization
        this.configValidation = this.validateEggConfiguration()
        
        // Set up fallback behavior based on validation results
        this.initializeFallbackBehavior()
    }

    initializeFallbackBehavior() {
        console.log('[PterodactylAPI] Initializing fallback behavior based on configuration validation...')
        
        if (!this.configValidation.isValid) {
            console.warn('[PterodactylAPI] Configuration validation failed - all egg ID resolution will use fallback behavior')
            this.fallbackMode = 'full'
        } else if (!this.configValidation.configExists) {
            console.log('[PterodactylAPI] No egg ID configuration found - will use productSpec and default fallbacks')
            this.fallbackMode = 'partial'
        } else {
            console.log('[PterodactylAPI] Configuration validation passed - normal operation mode')
            this.fallbackMode = 'none'
        }

        // Log available fallback strategies
        console.log(`[PterodactylAPI] Fallback mode: ${this.fallbackMode}`)
        if (this.fallbackMode !== 'none') {
            console.log('[PterodactylAPI] Available fallback strategies:')
            console.log('  1. productSpec.eggId (if available)')
            console.log('  2. Default egg ID mapping (nodejs=18, vps=15, python=22)')
            console.log('  3. Ultimate fallback (egg ID 15 - Ubuntu VPS)')
        }
    }

    // Comprehensive fallback behavior when configuration is completely missing
    handleConfigurationMissing(productSpec, productCode, reason = 'unknown') {
        console.warn(`[PterodactylAPI] Handling missing configuration scenario. Reason: ${reason}`)
        console.log(`[PterodactylAPI] Attempting fallback resolution for product code: ${productCode}`)
        
        const fallbackResult = {
            eggId: null,
            source: null,
            warnings: [],
            errors: []
        }

        try {
            // Strategy 1: Try productSpec.eggId if available
            if (productSpec && productSpec.eggId) {
                const productSpecEggId = String(productSpec.eggId)
                
                // Validate productSpec.eggId format
                if (!/^\d+$/.test(productSpecEggId)) {
                    fallbackResult.warnings.push(`Invalid productSpec.eggId format: ${productSpecEggId}`)
                } else {
                    const eggIdNum = parseInt(productSpecEggId)
                    if (eggIdNum <= 0) {
                        fallbackResult.warnings.push(`Invalid productSpec.eggId value: ${eggIdNum}`)
                    } else {
                        fallbackResult.eggId = productSpecEggId
                        fallbackResult.source = 'productSpec'
                        console.log(`[PterodactylAPI] Fallback successful using productSpec.eggId: ${productSpecEggId}`)
                        return fallbackResult
                    }
                }
            } else {
                fallbackResult.warnings.push('No productSpec.eggId available')
            }

            // Strategy 2: Use default mapping based on product code
            const productType = this.getProductType(productCode)
            if (productType) {
                const defaultEggId = this.getDefaultEggId(productCode)
                fallbackResult.eggId = defaultEggId
                fallbackResult.source = 'default_mapping'
                console.log(`[PterodactylAPI] Fallback successful using default mapping for ${productType}: ${defaultEggId}`)
                return fallbackResult
            } else {
                fallbackResult.warnings.push(`Unable to determine product type from code: ${productCode}`)
            }

            // Strategy 3: Ultimate fallback
            const ultimateFallback = '15' // Ubuntu VPS
            fallbackResult.eggId = ultimateFallback
            fallbackResult.source = 'ultimate_fallback'
            fallbackResult.warnings.push('Using ultimate fallback egg ID (Ubuntu VPS)')
            console.warn(`[PterodactylAPI] All fallback strategies exhausted, using ultimate fallback: ${ultimateFallback}`)
            
            return fallbackResult

        } catch (error) {
            fallbackResult.errors.push(`Fallback handling failed: ${error.message}`)
            fallbackResult.eggId = '15' // Emergency fallback
            fallbackResult.source = 'emergency'
            console.error(`[PterodactylAPI] Critical error in fallback handling:`, error)
            return fallbackResult
        }
    }

    // Enhanced error logging method
    logConfigurationError(context, error, additionalInfo = {}) {
        const timestamp = new Date().toISOString()
        const errorInfo = {
            timestamp,
            context,
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            fallbackMode: this.fallbackMode,
            configValidation: {
                isValid: this.configValidation.isValid,
                configExists: this.configValidation.configExists,
                errorCount: this.configValidation.errors.length,
                warningCount: this.configValidation.warnings.length
            },
            ...additionalInfo
        }

        console.error(`[PterodactylAPI] Configuration Error in ${context}:`, errorInfo)
        
        // Log suggestions for fixing the issue
        if (!this.configValidation.configExists) {
            console.log('[PterodactylAPI] Suggestion: Add egg ID configuration to globalThis.storeConfig.pterodactyl.eggIds')
            console.log('[PterodactylAPI] Example configuration:')
            console.log('  globalThis.storeConfig.pterodactyl.eggIds = {')
            console.log('    nodejs: "15",')
            console.log('    vps: "16",')
            console.log('    python: "17"')
            console.log('  }')
        } else if (!this.configValidation.isValid) {
            console.log('[PterodactylAPI] Suggestion: Fix configuration validation errors:')
            this.configValidation.errors.forEach((err, index) => {
                console.log(`  ${index + 1}. ${err}`)
            })
        }
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

    async createServer(userId, serverName, productSpec, productCode = null) {
        try {
            // Convert RAM string to MB (e.g., "1GB" -> 1024)
            const ramMB = this.convertRamToMB(productSpec.ram)
            // Convert CPU percentage to number (e.g., "100%" -> 100)
            const cpuLimit = parseInt(productSpec.cpu.replace('%', ''))

            // Resolve egg ID using configuration-based resolution
            // If no productCode provided, fall back to productSpec.eggId for backward compatibility
            const resolvedEggId = productCode ?
                this.resolveEggId(productSpec, productCode) :
                (productSpec.eggId || this.getDefaultEggId('b1')) // Default to VPS if no info available

            console.log(`[PterodactylAPI] Using resolved egg ID ${resolvedEggId} for server ${serverName}${productCode ? ` (product: ${productCode})` : ' (legacy mode)'}`)

            const response = await axios.post(
                `${this.baseURL}/api/application/servers`,
                {
                    name: serverName,
                    user: userId,
                    egg: resolvedEggId,
                    docker_image: this.getDockerImage(resolvedEggId),
                    startup: this.getStartupCommand(resolvedEggId),
                    environment: this.getEnvironmentVariables(resolvedEggId),
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

    // Configuration Validation
    validateEggConfiguration() {
        console.log('[PterodactylAPI] Validating egg ID configuration structure...')
        
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            configExists: false,
            validProductTypes: []
        }

        try {
            // Check if globalThis.storeConfig exists
            if (!globalThis.storeConfig) {
                validation.errors.push('globalThis.storeConfig is not defined')
                validation.isValid = false
                return validation
            }

            // Check if pterodactyl config exists
            if (!globalThis.storeConfig.pterodactyl) {
                validation.errors.push('globalThis.storeConfig.pterodactyl is not defined')
                validation.isValid = false
                return validation
            }

            // Check if eggIds config exists
            const eggIds = globalThis.storeConfig.pterodactyl.eggIds
            if (!eggIds) {
                validation.warnings.push('globalThis.storeConfig.pterodactyl.eggIds is not defined - will use fallback behavior')
                return validation
            }

            validation.configExists = true

            // Validate eggIds is an object
            if (typeof eggIds !== 'object' || Array.isArray(eggIds)) {
                validation.errors.push('eggIds configuration must be an object')
                validation.isValid = false
                return validation
            }

            // Validate each product type configuration
            const expectedProductTypes = ['nodejs', 'vps', 'python']
            
            for (const productType of expectedProductTypes) {
                const eggId = eggIds[productType]
                
                if (eggId === undefined || eggId === null) {
                    validation.warnings.push(`Missing egg ID configuration for product type: ${productType}`)
                    continue
                }

                // Validate egg ID format
                if (typeof eggId !== 'string' && typeof eggId !== 'number') {
                    validation.errors.push(`Invalid egg ID type for ${productType}: expected string or number, got ${typeof eggId}`)
                    validation.isValid = false
                    continue
                }

                // Convert to string and validate it's numeric
                const eggIdStr = String(eggId)
                if (!/^\d+$/.test(eggIdStr)) {
                    validation.errors.push(`Invalid egg ID format for ${productType}: ${eggIdStr} (must be numeric)`)
                    validation.isValid = false
                    continue
                }

                // Validate egg ID is positive
                const eggIdNum = parseInt(eggIdStr)
                if (eggIdNum <= 0) {
                    validation.errors.push(`Invalid egg ID value for ${productType}: ${eggIdNum} (must be positive)`)
                    validation.isValid = false
                    continue
                }

                validation.validProductTypes.push(productType)
            }

            // Check for unexpected product types
            const configuredTypes = Object.keys(eggIds)
            const unexpectedTypes = configuredTypes.filter(type => !expectedProductTypes.includes(type))
            if (unexpectedTypes.length > 0) {
                validation.warnings.push(`Unexpected product types in configuration: ${unexpectedTypes.join(', ')}`)
            }

        } catch (error) {
            validation.errors.push(`Configuration validation failed: ${error.message}`)
            validation.isValid = false
        }

        // Log validation results
        if (validation.isValid && validation.configExists) {
            console.log(`[PterodactylAPI] Configuration validation passed. Valid product types: ${validation.validProductTypes.join(', ')}`)
        } else if (validation.isValid && !validation.configExists) {
            console.log('[PterodactylAPI] No egg ID configuration found, fallback behavior will be used')
        } else {
            console.error('[PterodactylAPI] Configuration validation failed:', validation.errors)
        }

        if (validation.warnings.length > 0) {
            console.warn('[PterodactylAPI] Configuration warnings:', validation.warnings)
        }

        return validation
    }

    // Egg ID Resolution with enhanced error handling
    resolveEggId(productSpec, productCode) {
        console.log(`[PterodactylAPI] Starting egg ID resolution for product code: ${productCode}`)
        
        try {
            // Use cached validation from constructor
            const configValidation = this.configValidation
            
            // Detect product type from product code
            const productType = this.getProductType(productCode)
            console.log(`[PterodactylAPI] Detected product type: ${productType || 'unknown'} from code: ${productCode}`)

            if (!productType) {
                const error = new Error(`Invalid product code format: ${productCode}`)
                this.logConfigurationError('resolveEggId', error, { productCode, productType })
                
                const fallbackResult = this.handleConfigurationMissing(productSpec, productCode, 'invalid_product_code')
                return fallbackResult.eggId
            }

            // Check for configuration override first (only if config is valid)
            if (configValidation.isValid && configValidation.configExists) {
                const configEggId = this.getConfiguredEggId(productType)
                if (configEggId) {
                    console.log(`[PterodactylAPI] Successfully resolved egg ID ${configEggId} from configuration for ${productType} (${productCode})`)
                    return configEggId
                } else {
                    console.warn(`[PterodactylAPI] Configuration exists but no egg ID found for ${productType}`)
                }
            } else if (!configValidation.isValid) {
                console.error(`[PterodactylAPI] Configuration validation failed, using fallback behavior for ${productType}`)
                const fallbackResult = this.handleConfigurationMissing(productSpec, productCode, 'invalid_configuration')
                return fallbackResult.eggId
            } else if (!configValidation.configExists) {
                console.log(`[PterodactylAPI] No egg ID configuration found, using fallback behavior for ${productType}`)
                const fallbackResult = this.handleConfigurationMissing(productSpec, productCode, 'missing_configuration')
                return fallbackResult.eggId
            }

            // This should not be reached if configuration is valid and exists, but handle as fallback
            console.warn(`[PterodactylAPI] Unexpected state in egg ID resolution for ${productType}`)
            const fallbackResult = this.handleConfigurationMissing(productSpec, productCode, 'unexpected_state')
            return fallbackResult.eggId

        } catch (error) {
            this.logConfigurationError('resolveEggId', error, { productCode, productSpec })
            
            // Use comprehensive fallback handling
            const fallbackResult = this.handleConfigurationMissing(productSpec, productCode, 'critical_error')
            console.log(`[PterodactylAPI] Using emergency fallback egg ID: ${fallbackResult.eggId}`)
            return fallbackResult.eggId
        }
    }

    getProductType(productCode) {
        if (!productCode || typeof productCode !== 'string') {
            return null
        }

        const firstChar = productCode.toLowerCase().charAt(0)
        switch (firstChar) {
            case 'a': return 'nodejs'
            case 'b': return 'vps'
            case 'c': return 'python'
            default: return null
        }
    }

    getConfiguredEggId(productType) {
        console.log(`[PterodactylAPI] Looking up configured egg ID for product type: ${productType}`)
        
        try {
            // Check if globalThis.storeConfig exists
            if (!globalThis.storeConfig) {
                console.error('[PterodactylAPI] globalThis.storeConfig is not available')
                return null
            }

            // Check if pterodactyl config exists
            if (!globalThis.storeConfig.pterodactyl) {
                console.error('[PterodactylAPI] globalThis.storeConfig.pterodactyl is not available')
                return null
            }

            // Check if eggIds config exists
            const eggIds = globalThis.storeConfig.pterodactyl.eggIds
            if (!eggIds) {
                console.warn('[PterodactylAPI] No egg ID configuration found in globalThis.storeConfig.pterodactyl.eggIds - using fallback behavior')
                return null
            }

            console.log(`[PterodactylAPI] Found egg ID configuration object with keys: ${Object.keys(eggIds).join(', ')}`)

            const configuredId = eggIds[productType]
            if (configuredId === undefined || configuredId === null) {
                console.warn(`[PterodactylAPI] No configured egg ID found for product type: ${productType}`)
                return null
            }

            // Validate that the egg ID is a valid string/number
            if (typeof configuredId !== 'string' && typeof configuredId !== 'number') {
                console.error(`[PterodactylAPI] Invalid egg ID type for ${productType}: expected string or number, got ${typeof configuredId}`)
                return null
            }

            // Convert to string and validate format
            const configuredIdStr = String(configuredId)
            if (!/^\d+$/.test(configuredIdStr)) {
                console.error(`[PterodactylAPI] Invalid egg ID format for ${productType}: ${configuredIdStr} (must be numeric)`)
                return null
            }

            // Validate egg ID is positive
            const configuredIdNum = parseInt(configuredIdStr)
            if (configuredIdNum <= 0) {
                console.error(`[PterodactylAPI] Invalid egg ID value for ${productType}: ${configuredIdNum} (must be positive)`)
                return null
            }

            console.log(`[PterodactylAPI] Successfully retrieved configured egg ID ${configuredIdStr} for ${productType}`)
            return configuredIdStr

        } catch (error) {
            console.error(`[PterodactylAPI] Critical error accessing egg ID configuration for ${productType}:`, error.message)
            console.error(`[PterodactylAPI] Error stack:`, error.stack)
            return null
        }
    }

    getDefaultEggId(productCode) {
        console.log(`[PterodactylAPI] Getting default egg ID for product code: ${productCode}`)
        
        const productType = this.getProductType(productCode)
        console.log(`[PterodactylAPI] Product type for default lookup: ${productType || 'unknown'}`)

        // Default mappings based on current implementation
        const defaults = {
            'nodejs': '18',
            'vps': '15',
            'python': '22'
        }

        if (productType && defaults[productType]) {
            const defaultEggId = defaults[productType]
            console.log(`[PterodactylAPI] Using default egg ID ${defaultEggId} for product type: ${productType}`)
            return defaultEggId
        } else {
            const ultimateFallback = '15' // Ubuntu VPS as ultimate fallback
            console.warn(`[PterodactylAPI] Unknown product type '${productType}' for code '${productCode}', using ultimate fallback egg ID: ${ultimateFallback}`)
            return ultimateFallback
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
            // New egg ID mappings
            15: "ghcr.io/parkervcp/yolks:nodejs_18", // NodeJS
            16: "ghcr.io/parkervcp/yolks:ubuntu", // VPS
            17: "ghcr.io/parkervcp/yolks:python_3.11", // Python

            // Existing mappings for backward compatibility
            18: "ghcr.io/parkervcp/yolks:nodejs_18", // NodeJS (legacy)
            22: "ghcr.io/parkervcp/yolks:python_3.11" // Python (legacy)
        }

        const dockerImage = images[eggId]
        if (!dockerImage) {
            console.warn(`[PterodactylAPI] Unknown egg ID ${eggId}, using default Ubuntu image`)
            return "ghcr.io/parkervcp/yolks:ubuntu"
        }

        return dockerImage
    }

    getStartupCommand(eggId) {
        const commands = {
            // New egg ID mappings
            15: "npm start", // NodeJS
            16: "/bin/bash", // VPS
            17: "python main.py", // Python

            // Existing mappings for backward compatibility
            18: "npm start", // NodeJS (legacy)
            22: "python main.py" // Python (legacy)
        }

        const startupCommand = commands[eggId]
        if (!startupCommand) {
            console.warn(`[PterodactylAPI] Unknown egg ID ${eggId}, using default bash command`)
            return "/bin/bash"
        }

        return startupCommand
    }

    getEnvironmentVariables(eggId) {
        const envs = {
            // New egg ID mappings
            15: { // NodeJS
                "NODE_VERSION": "18",
                "MAIN_FILE": "index.js"
            },
            16: {}, // VPS (empty environment variables)
            17: { // Python
                "PYTHON_VERSION": "3.11",
                "MAIN_FILE": "main.py"
            },

            // Existing mappings for backward compatibility
            18: { // NodeJS (legacy)
                "NODE_VERSION": "18",
                "MAIN_FILE": "index.js"
            },
            22: { // Python (legacy)
                "PYTHON_VERSION": "3.11",
                "MAIN_FILE": "main.py"
            }
        }

        const environmentVars = envs[eggId]
        if (!environmentVars) {
            console.warn(`[PterodactylAPI] Unknown egg ID ${eggId}, using empty environment variables`)
            return {}
        }

        return environmentVars
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
        const serverResult = await this.createServer(userId, serverName, product, productCode)
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