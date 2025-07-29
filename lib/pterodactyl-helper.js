/**
 * Pterodactyl Helper Functions
 * Helper functions untuk konversi server ID/UUID dan utilities lainnya
 */

import { serverManager } from './pterodactyl-server.js';
import { logger } from '../helper/logger.js';

class PterodactylHelper {
    constructor() {
        this.serverCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Get server by ID or UUID
     * @param {string|number} identifier - Server ID (number) or UUID (string)
     * @returns {Promise<Object>} Server object with both ID and UUID
     */
    async getServerByIdentifier(identifier) {
        try {
            // Check if it's a number (server ID)
            const isNumeric = /^\d+$/.test(identifier.toString());
            
            if (isNumeric) {
                // It's a server ID, find by ID
                return await this.getServerById(parseInt(identifier));
            } else {
                // It's a UUID, find by UUID
                return await this.getServerByUuid(identifier);
            }
        } catch (error) {
            logger.error(`Failed to get server by identifier ${identifier}:`, error.message);
            throw error;
        }
    }

    /**
     * Get server by ID (admin API)
     * @param {number} serverId - Server ID
     * @returns {Promise<Object>} Server details
     */
    async getServerById(serverId) {
        try {
            const response = await serverManager.client.makeAppRequest('GET', `/servers/${serverId}`);
            return {
                id: response.attributes.id,
                uuid: response.attributes.uuid,
                identifier: response.attributes.identifier,
                name: response.attributes.name,
                ...response.attributes
            };
        } catch (error) {
            throw new Error(`Server with ID ${serverId} not found`);
        }
    }

    /**
     * Get server by UUID
     * @param {string} uuid - Server UUID
     * @returns {Promise<Object>} Server details  
     */
    async getServerByUuid(uuid) {
        try {
            const response = await serverManager.client.makeAppRequest('GET', `/servers/${uuid}`);
            return {
                id: response.attributes.id,
                uuid: response.attributes.uuid,
                identifier: response.attributes.identifier,
                name: response.attributes.name,
                ...response.attributes
            };
        } catch (error) {
            throw new Error(`Server with UUID ${uuid} not found`);
        }
    }

    /**
     * Get all servers with ID mapping
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Server list with ID->UUID mapping
     */
    async getAllServersWithMapping(options = {}) {
        try {
            const { servers, pagination } = await serverManager.getAllServers(options);
            
            // Create ID to UUID mapping
            const idToUuid = {};
            const uuidToId = {};
            
            servers.forEach(server => {
                idToUuid[server.id] = server.uuid;
                uuidToId[server.uuid] = server.id;
            });

            return {
                servers: servers.map(server => ({
                    ...server,
                    displayId: server.id, // Add display ID for user convenience
                })),
                pagination,
                mapping: {
                    idToUuid,
                    uuidToId
                }
            };
        } catch (error) {
            logger.error('Failed to get servers with mapping:', error.message);
            throw error;
        }
    }

    /**
     * Convert server identifier to UUID
     * @param {string|number} identifier - Server ID or UUID
     * @returns {Promise<string>} Server UUID
     */
    async getUuidFromIdentifier(identifier) {
        try {
            const server = await this.getServerByIdentifier(identifier);
            return server.uuid;
        } catch (error) {
            throw new Error(`Cannot find server with identifier: ${identifier}`);
        }
    }

    /**
     * Convert server identifier to ID
     * @param {string|number} identifier - Server ID or UUID
     * @returns {Promise<number>} Server ID
     */
    async getIdFromIdentifier(identifier) {
        try {
            const server = await this.getServerByIdentifier(identifier);
            return server.id;
        } catch (error) {
            throw new Error(`Cannot find server with identifier: ${identifier}`);
        }
    }

    /**
     * Validate server identifier
     * @param {string|number} identifier - Server ID or UUID
     * @returns {Object} Validation result
     */
    validateIdentifier(identifier) {
        if (!identifier) {
            return { valid: false, type: null, message: 'Server identifier is required' };
        }

        const isNumeric = /^\d+$/.test(identifier.toString());
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
        const isShortId = /^[0-9a-f]{8}$/i.test(identifier); // Short identifier

        if (isNumeric) {
            return { valid: true, type: 'id', message: 'Server ID' };
        } else if (isUuid) {
            return { valid: true, type: 'uuid', message: 'Server UUID' };
        } else if (isShortId) {
            return { valid: true, type: 'identifier', message: 'Server short identifier' };
        } else {
            return { valid: false, type: null, message: 'Invalid server identifier format' };
        }
    }

    /**
     * Format server info for display
     * @param {Object} server - Server object
     * @returns {string} Formatted server info
     */
    formatServerDisplay(server) {
        const statusIcon = this.getStatusIcon(server.status);
        const suspendedText = server.is_suspended ? ' 🔒' : '';
        
        return `${statusIcon} *${server.name}*${suspendedText}\n` +
               `   📋 ID: \`${server.id}\` | UUID: \`${server.uuid}\`\n` +
               `   💾 RAM: ${server.limits?.memory || 0}MB | 💽 Disk: ${server.limits?.disk || 0}MB`;
    }

    /**
     * Get status icon
     * @param {string} status - Server status
     * @returns {string} Status icon
     */
    getStatusIcon(status) {
        const icons = {
            'running': '🟢',
            'starting': '🟡',
            'stopping': '🟠',
            'stopped': '🔴',
            'offline': '⚫',
            'installing': '📦',
            'suspended': '🔒',
            'unknown': '❓'
        };
        return icons[status?.toLowerCase()] || '❓';
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.serverCache.clear();
    }
}

// Export singleton instance
export const pterodactylHelper = new PterodactylHelper();
export default PterodactylHelper; 