/**
 * Pterodactyl Server Management
 * Handles server operations like listing, starting, stopping, and monitoring
 */

import { pterodactylClient } from './pterodactyl-client.js';
import { logger } from '../helper/logger.js';
import moment from 'moment';

class PterodactylServerManager {
    constructor() {
        this.client = pterodactylClient;
    }

    /**
     * Get all servers (Admin view)
     * @param {Object} options - Query options
     * @returns {Promise<Array>} List of servers
     */
    async getAllServers(options = {}) {
        try {
            const {
                page = 1,
                perPage = 50,
                search = '',
                filterByUser = null
            } = options;

            let endpoint = `/servers?page=${page}&per_page=${perPage}`;
            
            if (search) {
                endpoint += `&filter[name]=${encodeURIComponent(search)}`;
            }
            
            if (filterByUser) {
                endpoint += `&filter[user]=${filterByUser}`;
            }

            const response = await this.client.makeAppRequest('GET', endpoint);
            
                    return {
            servers: response.data.map(server => this.formatServerInfo(server.attributes)),
            meta: response.meta,
            pagination: {
                current: response.meta.pagination.current_page,
                total: response.meta.pagination.total_pages,
                count: response.meta.pagination.count,
                total_count: response.meta.pagination.total
            }
        };
        } catch (error) {
            logger.error('Failed to get all servers:', error.message);
            throw error;
        }
    }

    /**
     * Get user's servers (Client view)
     * @returns {Promise<Array>} List of user's servers
     */
    async getUserServers() {
        try {
            const response = await this.client.makeClientRequest('GET', '/');
            
                    return {
            servers: response.data.map(server => this.formatClientServerInfo(server.attributes)),
            meta: response.meta
        };
        } catch (error) {
            logger.error('Failed to get user servers:', error.message);
            throw error;
        }
    }

    /**
     * Get specific server details
     * @param {string} serverId - Server UUID or ID
     * @param {boolean} isAdmin - Whether to use admin API
     * @returns {Promise<Object>} Server details
     */
    async getServerDetails(serverId, isAdmin = false) {
        try {
            let response;
            
            if (isAdmin) {
                response = await this.client.makeAppRequest('GET', `/servers/${serverId}`);
                return this.formatServerInfo(response.attributes);
            } else {
                response = await this.client.makeClientRequest('GET', `/servers/${serverId}`);
                return this.formatClientServerInfo(response.attributes);
            }
        } catch (error) {
            logger.error(`Failed to get server details for ${serverId}:`, error.message);
            throw error;
        }
    }

    /**
     * Get server resource usage
     * @param {string} serverId - Server UUID
     * @returns {Promise<Object>} Resource usage stats
     */
    async getServerResources(serverId) {
        try {
            const response = await this.client.makeClientRequest('GET', `/servers/${serverId}/resources`);
            
            return {
                serverId,
                timestamp: new Date().toISOString(),
                current_state: response.attributes.current_state,
                is_suspended: response.attributes.is_suspended,
                resources: {
                    memory: {
                        current: response.attributes.resources.memory_bytes,
                        limit: response.attributes.resources.memory_limit_bytes,
                        percentage: Math.round((response.attributes.resources.memory_bytes / response.attributes.resources.memory_limit_bytes) * 100)
                    },
                    cpu: {
                        current: response.attributes.resources.cpu_absolute,
                        percentage: Math.round(response.attributes.resources.cpu_absolute)
                    },
                    disk: {
                        current: response.attributes.resources.disk_bytes,
                        limit: response.attributes.resources.disk_limit_bytes,
                        percentage: Math.round((response.attributes.resources.disk_bytes / response.attributes.resources.disk_limit_bytes) * 100)
                    },
                    network: {
                        rx_bytes: response.attributes.resources.network_rx_bytes,
                        tx_bytes: response.attributes.resources.network_tx_bytes
                    }
                }
            };
        } catch (error) {
            logger.error(`Failed to get server resources for ${serverId}:`, error.message);
            throw error;
        }
    }

    /**
     * Start a server
     * @param {string} serverId - Server UUID
     * @returns {Promise<boolean>} Success status
     */
    async startServer(serverId) {
        try {
            await this.client.makeClientRequest('POST', `/servers/${serverId}/power`, {
                signal: 'start'
            });
            
            logger.info(`Server ${serverId} start command sent`);
            return true;
        } catch (error) {
            logger.error(`Failed to start server ${serverId}:`, error.message);
            throw error;
        }
    }

    /**
     * Stop a server
     * @param {string} serverId - Server UUID
     * @returns {Promise<boolean>} Success status
     */
    async stopServer(serverId) {
        try {
            await this.client.makeClientRequest('POST', `/servers/${serverId}/power`, {
                signal: 'stop'
            });
            
            logger.info(`Server ${serverId} stop command sent`);
            return true;
        } catch (error) {
            logger.error(`Failed to stop server ${serverId}:`, error.message);
            throw error;
        }
    }

    /**
     * Restart a server
     * @param {string} serverId - Server UUID
     * @returns {Promise<boolean>} Success status
     */
    async restartServer(serverId) {
        try {
            await this.client.makeClientRequest('POST', `/servers/${serverId}/power`, {
                signal: 'restart'
            });
            
            logger.info(`Server ${serverId} restart command sent`);
            return true;
        } catch (error) {
            logger.error(`Failed to restart server ${serverId}:`, error.message);
            throw error;
        }
    }

    /**
     * Kill a server (force stop)
     * @param {string} serverId - Server UUID
     * @returns {Promise<boolean>} Success status
     */
    async killServer(serverId) {
        try {
            await this.client.makeClientRequest('POST', `/servers/${serverId}/power`, {
                signal: 'kill'
            });
            
            logger.info(`Server ${serverId} kill command sent`);
            return true;
        } catch (error) {
            logger.error(`Failed to kill server ${serverId}:`, error.message);
            throw error;
        }
    }

    /**
     * Send command to server console
     * @param {string} serverId - Server UUID
     * @param {string} command - Command to send
     * @returns {Promise<boolean>} Success status
     */
    async sendCommand(serverId, command) {
        try {
            await this.client.makeClientRequest('POST', `/servers/${serverId}/command`, {
                command: command
            });
            
            logger.info(`Command sent to server ${serverId}: ${command}`);
            return true;
        } catch (error) {
            logger.error(`Failed to send command to server ${serverId}:`, error.message);
            throw error;
        }
    }

    /**
     * Get server console logs
     * @param {string} serverId - Server UUID
     * @returns {Promise<Array>} Console logs
     */
    async getConsoleLog(serverId) {
        try {
            const response = await this.client.makeClientRequest('GET', `/servers/${serverId}/logs`);
            
            return {
                serverId,
                logs: response.data,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error(`Failed to get console logs for server ${serverId}:`, error.message);
            throw error;
        }
    }

    /**
     * Format server info for admin API response
     * @param {Object} server - Raw server data
     * @returns {Object} Formatted server info
     */
    formatServerInfo(server) {
        return {
            id: server.id,
            uuid: server.uuid,
            identifier: server.identifier,
            name: server.name,
            description: server.description || '',
            status: server.status || 'unknown',
            is_suspended: server.suspended || false,
            is_installing: server.is_installing || false,
            is_transferring: server.is_transferring || false,
            limits: {
                memory: server.limits?.memory || 0,
                swap: server.limits?.swap || 0,
                disk: server.limits?.disk || 0,
                io: server.limits?.io || 0,
                cpu: server.limits?.cpu || 0,
                threads: server.limits?.threads,
                oom_disabled: server.limits?.oom_disabled || false
            },
            feature_limits: server.feature_limits || {},
            user_id: server.user,
            node_id: server.node,
            allocation_id: server.allocation,
            nest_id: server.nest,
            egg_id: server.egg,
            created_at: moment(server.created_at).format('YYYY-MM-DD HH:mm:ss'),
            updated_at: moment(server.updated_at).format('YYYY-MM-DD HH:mm:ss')
        };
    }

    /**
     * Format server info for client API response
     * @param {Object} server - Raw server data
     * @returns {Object} Formatted server info
     */
    formatClientServerInfo(server) {
        return {
            uuid: server.uuid,
            identifier: server.identifier,
            name: server.name,
            description: server.description || '',
            status: server.status || 'unknown',
            is_suspended: server.is_suspended || false,
            is_installing: server.is_installing || false,
            is_transferring: server.is_transferring || false,
            limits: {
                memory: server.limits?.memory || 0,
                swap: server.limits?.swap || 0,
                disk: server.limits?.disk || 0,
                io: server.limits?.io || 0,
                cpu: server.limits?.cpu || 0,
                threads: server.limits?.threads,
                oom_disabled: server.limits?.oom_disabled || false
            },
            feature_limits: server.feature_limits || {},
            server_owner: server.server_owner || false,
            created_at: server.created_at ? moment(server.created_at).format('YYYY-MM-DD HH:mm:ss') : 'Unknown'
        };
    }

    /**
     * Get multiple servers' status at once
     * @param {Array<string>} serverIds - Array of server UUIDs
     * @returns {Promise<Array>} Array of server statuses
     */
    async getMultipleServerStatuses(serverIds) {
        try {
            const promises = serverIds.map(async (serverId) => {
                try {
                    const resources = await this.getServerResources(serverId);
                    return {
                        serverId,
                        status: resources.current_state,
                        is_suspended: resources.is_suspended,
                        resources: resources.resources
                    };
                } catch (error) {
                    return {
                        serverId,
                        status: 'error',
                        error: error.message
                    };
                }
            });

            return await Promise.all(promises);
        } catch (error) {
            logger.error('Failed to get multiple server statuses:', error.message);
            throw error;
        }
    }
}

// Export singleton instance
export const serverManager = new PterodactylServerManager();
export default PterodactylServerManager; 