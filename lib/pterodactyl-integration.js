/**
 * Pterodactyl Integration
 * Main integration file that initializes and coordinates all Pterodactyl components
 */

import { pterodactylClient } from './pterodactyl-client.js';
import { serverManager } from './pterodactyl-server.js';
import { backupManager } from './pterodactyl-backup.js';
import { scheduler } from './pterodactyl-scheduler.js';
import { validateConfig } from './pterodactyl-config.js';
import { logger } from '../helper/logger.js';

class PterodactylIntegration {
    constructor() {
        this.isInitialized = false;
        this.client = pterodactylClient;
        this.serverManager = serverManager;
        this.backupManager = backupManager;
        this.scheduler = scheduler;
    }

    /**
     * Initialize Pterodactyl integration
     */
    async init() {
        if (this.isInitialized) {
            logger.warn('Pterodactyl integration already initialized');
            return;
        }

        try {
            logger.info('🦕 Initializing Pterodactyl integration...');

            // 1. Validate configuration
            const validation = validateConfig();
            if (!validation.isValid) {
                logger.error('Pterodactyl configuration validation failed:', validation.errors);
                throw new Error(`Configuration invalid: ${validation.errors.join(', ')}`);
            }

            // 2. Test API connectivity
            logger.info('Testing Pterodactyl API connectivity...');
            const isConnected = await this.client.testConnection();
            if (!isConnected) {
                throw new Error('Failed to connect to Pterodactyl API');
            }

            // 3. Initialize scheduler (optional, based on environment)
            if (process.env.PTERODACTYL_ENABLE_SCHEDULER !== 'false') {
                logger.info('Initializing Pterodactyl scheduler...');
                this.scheduler.init();
            } else {
                logger.info('Pterodactyl scheduler disabled by configuration');
            }

            this.isInitialized = true;
            logger.info('✅ Pterodactyl integration initialized successfully');

            // 4. Optional: Send startup notification
            await this.sendStartupNotification();

        } catch (error) {
            logger.error('❌ Failed to initialize Pterodactyl integration:', error);
            throw error;
        }
    }

    /**
     * Shutdown Pterodactyl integration
     */
    async shutdown() {
        try {
            logger.info('🔄 Shutting down Pterodactyl integration...');

            // Stop scheduler
            if (this.scheduler.isInitialized) {
                this.scheduler.stopAll();
            }

            this.isInitialized = false;
            logger.info('✅ Pterodactyl integration shutdown complete');

        } catch (error) {
            logger.error('❌ Error during Pterodactyl integration shutdown:', error);
        }
    }

    /**
     * Get integration status
     */
    async getStatus() {
        try {
            const [apiStatus, schedulerStatus] = await Promise.all([
                this.client.getAPIStatus(),
                Promise.resolve(this.scheduler.getJobStatus())
            ]);

            return {
                initialized: this.isInitialized,
                api: apiStatus,
                scheduler: schedulerStatus,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Failed to get Pterodactyl integration status:', error);
            return {
                initialized: this.isInitialized,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Health check for all components
     */
    async healthCheck() {
        const health = {
            overall: 'healthy',
            components: {},
            timestamp: new Date().toISOString()
        };

        try {
            // Test API connectivity
            health.components.api = {
                status: await this.client.testConnection() ? 'healthy' : 'unhealthy',
                component: 'Pterodactyl API'
            };

            // Check scheduler
            health.components.scheduler = {
                status: this.scheduler.isInitialized ? 'healthy' : 'disabled',
                component: 'Task Scheduler',
                jobCount: this.scheduler.getJobStatus().jobCount
            };

            // Check if any component is unhealthy
            const hasUnhealthyComponent = Object.values(health.components)
                .some(component => component.status === 'unhealthy');

            if (hasUnhealthyComponent) {
                health.overall = 'degraded';
            }

        } catch (error) {
            logger.error('Health check failed:', error);
            health.overall = 'unhealthy';
            health.error = error.message;
        }

        return health;
    }

    /**
     * Send startup notification to admin chat
     */
    async sendStartupNotification() {
        try {
            const adminChat = process.env.PTERODACTYL_ADMIN_CHAT;
            if (!adminChat || !global.sock) return;

            const status = await this.getStatus();
            const appConnected = status.api?.applicationAPI?.connected;
            const clientConnected = status.api?.clientAPI?.connected;

            const message = `
🦕 *Pterodactyl Integration Started*

📡 *API Status:*
• Application API: ${appConnected ? '✅ Connected' : '❌ Disconnected'}
• Client API: ${clientConnected ? '✅ Connected' : '❌ Disconnected'}

⏰ *Scheduler:*
• Status: ${status.scheduler?.initialized ? '✅ Active' : '❌ Disabled'}
• Jobs: ${status.scheduler?.jobCount || 0}

🚀 *Ready for server management commands!*

⏰ *Started:* ${status.timestamp}
            `.trim();

            await global.sock.sendMessage(adminChat, { text: message });
            logger.info('Startup notification sent');

        } catch (error) {
            logger.error('Failed to send startup notification:', error);
        }
    }

    /**
     * Send health status to admin chat
     */
    async sendHealthStatus() {
        try {
            const adminChat = process.env.PTERODACTYL_ADMIN_CHAT;
            if (!adminChat || !global.sock) return;

            const health = await this.healthCheck();
            const statusIcon = {
                'healthy': '✅',
                'degraded': '⚠️',
                'unhealthy': '❌'
            };

            const message = `
🏥 *Pterodactyl Health Check*

${statusIcon[health.overall]} *Overall Status:* ${health.overall.toUpperCase()}

📊 *Components:*
${Object.entries(health.components).map(([key, component]) => 
    `• ${component.component}: ${statusIcon[component.status] || '❓'} ${component.status}`
).join('\n')}

${health.error ? `\n❌ *Error:* ${health.error}` : ''}

⏰ *Checked:* ${health.timestamp}
            `.trim();

            await global.sock.sendMessage(adminChat, { text: message });
            logger.info('Health status sent');

        } catch (error) {
            logger.error('Failed to send health status:', error);
        }
    }

    /**
     * Manual backup for all servers
     */
    async createBackupForAllServers(options = {}) {
        try {
            logger.info('Creating backup for all servers...');

            const { servers } = await this.serverManager.getAllServers({ perPage: 100 });
            const activeServers = servers.filter(server => !server.is_suspended);

            if (activeServers.length === 0) {
                logger.warn('No active servers found for backup');
                return {
                    success: true,
                    message: 'No active servers to backup',
                    results: []
                };
            }

            const serverIds = activeServers.map(server => server.uuid);
            const results = await this.scheduler.createManualBackup(serverIds, options);

            logger.info(`Manual backup completed for ${activeServers.length} servers`);
            return results;

        } catch (error) {
            logger.error('Failed to create backup for all servers:', error);
            throw error;
        }
    }

    /**
     * Get overview of all servers and their status
     */
    async getServerOverview() {
        try {
            const { servers } = await this.serverManager.getAllServers({ perPage: 100 });
            
            const overview = {
                total: servers.length,
                running: 0,
                stopped: 0,
                suspended: 0,
                installing: 0,
                transferring: 0,
                servers: []
            };

            for (const server of servers) {
                try {
                    const resources = await this.serverManager.getServerResources(server.uuid);
                    
                    // Count by status
                    switch (resources.current_state) {
                        case 'running':
                            overview.running++;
                            break;
                        case 'stopped':
                        case 'offline':
                            overview.stopped++;
                            break;
                    }

                    if (server.is_suspended) overview.suspended++;
                    if (server.is_installing) overview.installing++;
                    if (server.is_transferring) overview.transferring++;

                    overview.servers.push({
                        uuid: server.uuid,
                        name: server.name,
                        status: resources.current_state,
                        suspended: server.is_suspended,
                        installing: server.is_installing,
                        transferring: server.is_transferring,
                        resources: {
                            memory: resources.resources.memory.percentage,
                            cpu: resources.resources.cpu.percentage,
                            disk: resources.resources.disk.percentage
                        }
                    });

                } catch (error) {
                    logger.warn(`Failed to get resources for server ${server.uuid}:`, error.message);
                    overview.servers.push({
                        uuid: server.uuid,
                        name: server.name,
                        status: 'error',
                        error: error.message
                    });
                }
            }

            overview.timestamp = new Date().toISOString();
            return overview;

        } catch (error) {
            logger.error('Failed to get server overview:', error);
            throw error;
        }
    }

    /**
     * Cleanup resources and reset
     */
    async reset() {
        try {
            logger.info('Resetting Pterodactyl integration...');
            
            await this.shutdown();
            
            // Clear any cached data if needed
            // this.client.clearCache();
            
            await this.init();
            
            logger.info('Pterodactyl integration reset complete');
        } catch (error) {
            logger.error('Failed to reset Pterodactyl integration:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const pterodactylIntegration = new PterodactylIntegration();
export default PterodactylIntegration;

// Auto-initialize if enabled (disabled by default for manual control)
if (process.env.PTERODACTYL_AUTO_INIT === 'true') {
    // Initialize after a short delay to ensure other systems are ready
    setTimeout(async () => {
        try {
            await pterodactylIntegration.init();
        } catch (error) {
            logger.error('Auto-initialization failed:', error);
        }
    }, 5000);
} 