/**
 * Pterodactyl Panel API Configuration
 * Configuration for connecting to Pterodactyl Panel API
 */

export const PTERODACTYL_CONFIG = {
    // Panel URL (without trailing slash)
    PANEL_URL: globalThis.storeConfig?.pterodactyl?.url || process.env.PTERODACTYL_PANEL_URL || 'https://panel.example.com',
    
    // API Key for Application API (starts with ptla_)
    APPLICATION_API_KEY: globalThis.storeConfig?.pterodactyl?.adminApiKey || process.env.PTERODACTYL_APP_KEY || '',
    
    // API Key for Client API (starts with ptlc_)
    CLIENT_API_KEY: globalThis.storeConfig?.pterodactyl?.apiKey || process.env.PTERODACTYL_CLIENT_KEY || '',
    
    // Email suffix for server management
    EMAIL_SUFFIX: globalThis.storeConfig?.pterodactyl?.emailSuffix || process.env.PTERODACTYL_EMAIL_SUFFIX || '',
    
    // Request timeout in milliseconds
    TIMEOUT: parseInt(process.env.PTERODACTYL_TIMEOUT) || 30000,
    
    // Backup settings
    BACKUP: {
        // Maximum number of backups to keep per server
        MAX_BACKUPS: parseInt(process.env.PTERODACTYL_MAX_BACKUPS) || 5,
        
        // Default backup name prefix
        NAME_PREFIX: process.env.PTERODACTYL_BACKUP_PREFIX || 'auto-backup',
        
        // Backup retention in days
        RETENTION_DAYS: parseInt(process.env.PTERODACTYL_BACKUP_RETENTION) || 7
    },
    
    // Rate limiting
    RATE_LIMIT: {
        // Maximum requests per minute
        MAX_REQUESTS: parseInt(process.env.PTERODACTYL_RATE_LIMIT) || 60,
        
        // Rate limit window in milliseconds
        WINDOW_MS: 60000
    }
};

/**
 * Validate Pterodactyl configuration
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export function validateConfig() {
    const errors = [];
    
    if (!PTERODACTYL_CONFIG.PANEL_URL || PTERODACTYL_CONFIG.PANEL_URL === 'https://panel.example.com') {
        errors.push('Pterodactyl panel URL is required (check globalThis.storeConfig.pterodactyl.url or PTERODACTYL_PANEL_URL)');
    }
    
    if (!PTERODACTYL_CONFIG.APPLICATION_API_KEY) {
        errors.push('Pterodactyl Application API key is required (check globalThis.storeConfig.pterodactyl.adminApiKey or PTERODACTYL_APP_KEY)');
    }
    
    if (!PTERODACTYL_CONFIG.CLIENT_API_KEY) {
        errors.push('Pterodactyl Client API key is required (check globalThis.storeConfig.pterodactyl.apiKey or PTERODACTYL_CLIENT_KEY)');
    }
    
    // Validate URL format
    try {
        new URL(PTERODACTYL_CONFIG.PANEL_URL);
    } catch (error) {
        errors.push('Pterodactyl panel URL must be a valid URL');
    }
    
    // Validate API key formats
    if (PTERODACTYL_CONFIG.APPLICATION_API_KEY && !PTERODACTYL_CONFIG.APPLICATION_API_KEY.startsWith('ptla_')) {
        errors.push('Application API key should start with "ptla_"');
    }
    
    if (PTERODACTYL_CONFIG.CLIENT_API_KEY && !PTERODACTYL_CONFIG.CLIENT_API_KEY.startsWith('ptlc_')) {
        errors.push('Client API key should start with "ptlc_"');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

export default PTERODACTYL_CONFIG; 