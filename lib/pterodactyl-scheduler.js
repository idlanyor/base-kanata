/**
 * Pterodactyl Scheduler
 * Handles scheduled tasks like automated backups and monitoring
 */

import { serverManager } from './pterodactyl-server.js';
import { backupManager } from './pterodactyl-backup.js';
import { PTERODACTYL_CONFIG } from './pterodactyl-config.js';
import { logger } from '../helper/logger.js';
import cron from 'node-cron';

class PterodactylScheduler {
    constructor() {
        this.jobs = new Map();
        this.config = PTERODACTYL_CONFIG;
        this.isInitialized = false;
    }

    /**
     * Initialize scheduler
     */
    init() {
        if (this.isInitialized) {
            logger.warn('Pterodactyl scheduler already initialized');
            return;
        }

        logger.info('Initializing Pterodactyl scheduler...');
        
        // Daily backup cleanup (runs at 2 AM)
        this.scheduleJob('daily-cleanup', '0 2 * * *', async () => {
            await this.runDailyCleanup();
        });

        // Hourly monitoring (runs every hour)
        this.scheduleJob('hourly-monitoring', '0 * * * *', async () => {
            await this.runHourlyMonitoring();
        });

        // Weekly backup creation (runs Sunday at 3 AM)
        this.scheduleJob('weekly-backup', '0 3 * * 0', async () => {
            await this.runWeeklyBackup();
        });

        this.isInitialized = true;
        logger.info('Pterodactyl scheduler initialized successfully');
    }

    /**
     * Schedule a cron job
     * @param {string} name - Job name
     * @param {string} schedule - Cron schedule
     * @param {Function} task - Task function
     */
    scheduleJob(name, schedule, task) {
        if (this.jobs.has(name)) {
            logger.warn(`Job '${name}' already exists, replacing...`);
            this.jobs.get(name).stop();
        }

        const job = cron.schedule(schedule, async () => {
            logger.info(`Starting scheduled job: ${name}`);
            try {
                await task();
                logger.info(`Completed scheduled job: ${name}`);
            } catch (error) {
                logger.error(`Error in scheduled job '${name}':`, error);
            }
        }, {
            scheduled: true,
            timezone: process.env.TZ || 'UTC'
        });

        this.jobs.set(name, job);
        logger.info(`Scheduled job '${name}' with schedule: ${schedule}`);
    }

    /**
     * Daily cleanup task
     */
    async runDailyCleanup() {
        try {
            logger.info('Running daily backup cleanup...');
            
            // Get all servers
            const { servers } = await serverManager.getAllServers({ perPage: 100 });
            
            let totalCleaned = 0;
            const cleanupResults = [];

            for (const server of servers) {
                try {
                    const result = await backupManager.cleanupOldBackups(server.uuid);
                    totalCleaned += result.deletedCount;
                    
                    if (result.deletedCount > 0) {
                        cleanupResults.push({
                            server: server.name,
                            uuid: server.uuid,
                            deleted: result.deletedCount,
                            remaining: result.remainingBackups
                        });
                    }
                } catch (error) {
                    logger.error(`Failed to cleanup backups for server ${server.uuid}:`, error);
                }
            }

            logger.info(`Daily cleanup completed: ${totalCleaned} backups cleaned from ${cleanupResults.length} servers`);
            
            // Optionally send notification
            await this.sendCleanupNotification(cleanupResults, totalCleaned);
            
        } catch (error) {
            logger.error('Daily cleanup task failed:', error);
        }
    }

    /**
     * Hourly monitoring task
     */
    async runHourlyMonitoring() {
        try {
            logger.info('Running hourly server monitoring...');
            
            // Get all servers
            const { servers } = await serverManager.getAllServers({ perPage: 100 });
            
            const alerts = [];
            
            for (const server of servers) {
                try {
                    const resources = await serverManager.getServerResources(server.uuid);
                    
                    // Check for high resource usage
                    const memoryUsage = resources.resources.memory.percentage;
                    const diskUsage = resources.resources.disk.percentage;
                    const cpuUsage = resources.resources.cpu.percentage;
                    
                    // Memory alert (>90%)
                    if (memoryUsage > 90) {
                        alerts.push({
                            type: 'high_memory',
                            server: server.name,
                            uuid: server.uuid,
                            usage: memoryUsage,
                            message: `High memory usage: ${memoryUsage}%`
                        });
                    }
                    
                    // Disk alert (>85%)
                    if (diskUsage > 85) {
                        alerts.push({
                            type: 'high_disk',
                            server: server.name,
                            uuid: server.uuid,
                            usage: diskUsage,
                            message: `High disk usage: ${diskUsage}%`
                        });
                    }
                    
                    // CPU alert (>95% for extended period)
                    if (cpuUsage > 95) {
                        alerts.push({
                            type: 'high_cpu',
                            server: server.name,
                            uuid: server.uuid,
                            usage: cpuUsage,
                            message: `High CPU usage: ${cpuUsage}%`
                        });
                    }
                    
                    // Server offline alert
                    if (resources.current_state === 'offline' || resources.current_state === 'stopped') {
                        alerts.push({
                            type: 'server_offline',
                            server: server.name,
                            uuid: server.uuid,
                            status: resources.current_state,
                            message: `Server is ${resources.current_state}`
                        });
                    }
                    
                } catch (error) {
                    logger.error(`Failed to monitor server ${server.uuid}:`, error);
                    alerts.push({
                        type: 'monitoring_error',
                        server: server.name,
                        uuid: server.uuid,
                        error: error.message,
                        message: `Failed to get server status: ${error.message}`
                    });
                }
            }

            if (alerts.length > 0) {
                logger.warn(`Found ${alerts.length} server alerts`);
                await this.sendMonitoringAlerts(alerts);
            } else {
                logger.info('All servers are running normally');
            }
            
        } catch (error) {
            logger.error('Hourly monitoring task failed:', error);
        }
    }

    /**
     * Weekly backup task
     */
    async runWeeklyBackup() {
        try {
            logger.info('Running weekly automated backup...');
            
            // Get all servers
            const { servers } = await serverManager.getAllServers({ perPage: 100 });
            
            const backupResults = [];
            
            for (const server of servers) {
                try {
                    // Skip suspended servers
                    if (server.is_suspended) {
                        logger.info(`Skipping suspended server: ${server.name}`);
                        continue;
                    }
                    
                    const backupName = `weekly-auto-${new Date().toISOString().split('T')[0]}`;
                    const result = await backupManager.createBackup(server.uuid, { 
                        name: backupName,
                        locked: false 
                    });
                    
                    backupResults.push({
                        server: server.name,
                        uuid: server.uuid,
                        backup: result.backup.name,
                        backupId: result.backup.uuid,
                        success: true
                    });
                    
                } catch (error) {
                    logger.error(`Failed to create backup for server ${server.uuid}:`, error);
                    backupResults.push({
                        server: server.name,
                        uuid: server.uuid,
                        success: false,
                        error: error.message
                    });
                }
            }

            const successCount = backupResults.filter(r => r.success).length;
            const failCount = backupResults.filter(r => !r.success).length;
            
            logger.info(`Weekly backup completed: ${successCount} successful, ${failCount} failed`);
            
            // Send notification
            await this.sendBackupNotification(backupResults, successCount, failCount);
            
        } catch (error) {
            logger.error('Weekly backup task failed:', error);
        }
    }

    /**
     * Send cleanup notification
     */
    async sendCleanupNotification(results, totalCleaned) {
        if (totalCleaned === 0) return;
        
        try {
            const message = `
🧹 *Daily Backup Cleanup Report*

🗑️ *Total Cleaned:* ${totalCleaned} backups
🖥️ *Servers Affected:* ${results.length}

📋 *Details:*
${results.map(r => `• ${r.server}: ${r.deleted} deleted, ${r.remaining} remaining`).join('\n')}

⏰ *Time:* ${new Date().toISOString()}
            `.trim();

            // Send to admin chat if configured
            const adminChat = process.env.PTERODACTYL_ADMIN_CHAT;
            if (adminChat && global.sock) {
                await global.sock.sendMessage(adminChat, { text: message });
            }
            
            logger.info('Cleanup notification sent');
        } catch (error) {
            logger.error('Failed to send cleanup notification:', error);
        }
    }

    /**
     * Send monitoring alerts
     */
    async sendMonitoringAlerts(alerts) {
        try {
            const criticalAlerts = alerts.filter(a => 
                a.type === 'high_memory' || a.type === 'high_disk' || a.type === 'server_offline'
            );
            
            if (criticalAlerts.length === 0) return;
            
            const message = `
🚨 *Server Monitoring Alert*

⚠️ *Critical Issues:* ${criticalAlerts.length}
📊 *Total Alerts:* ${alerts.length}

🔍 *Critical Issues:*
${criticalAlerts.map(a => `• ${a.server}: ${a.message}`).join('\n')}

⏰ *Time:* ${new Date().toISOString()}

💡 Use \`.server status <uuid>\` for details
            `.trim();

            // Send to admin chat if configured
            const adminChat = process.env.PTERODACTYL_ADMIN_CHAT;
            if (adminChat && global.sock) {
                await global.sock.sendMessage(adminChat, { text: message });
            }
            
            logger.info(`Monitoring alerts sent for ${criticalAlerts.length} critical issues`);
        } catch (error) {
            logger.error('Failed to send monitoring alerts:', error);
        }
    }

    /**
     * Send backup notification
     */
    async sendBackupNotification(results, successCount, failCount) {
        try {
            const message = `
💾 *Weekly Backup Report*

✅ *Successful:* ${successCount}
❌ *Failed:* ${failCount}
📊 *Total Servers:* ${results.length}

${failCount > 0 ? `\n🚨 *Failed Backups:*\n${results.filter(r => !r.success).map(r => `• ${r.server}: ${r.error}`).join('\n')}` : ''}

⏰ *Time:* ${new Date().toISOString()}
            `.trim();

            // Send to admin chat if configured
            const adminChat = process.env.PTERODACTYL_ADMIN_CHAT;
            if (adminChat && global.sock) {
                await global.sock.sendMessage(adminChat, { text: message });
            }
            
            logger.info('Backup notification sent');
        } catch (error) {
            logger.error('Failed to send backup notification:', error);
        }
    }

    /**
     * Stop a scheduled job
     */
    stopJob(name) {
        if (this.jobs.has(name)) {
            this.jobs.get(name).stop();
            this.jobs.delete(name);
            logger.info(`Stopped scheduled job: ${name}`);
        }
    }

    /**
     * Stop all scheduled jobs
     */
    stopAll() {
        for (const [name, job] of this.jobs) {
            job.stop();
            logger.info(`Stopped scheduled job: ${name}`);
        }
        this.jobs.clear();
        this.isInitialized = false;
        logger.info('All scheduled jobs stopped');
    }

    /**
     * Get job status
     */
    getJobStatus() {
        const jobs = [];
        for (const [name, job] of this.jobs) {
            jobs.push({
                name,
                running: job.running || false,
                scheduled: true
            });
        }
        return {
            initialized: this.isInitialized,
            jobCount: this.jobs.size,
            jobs
        };
    }

    /**
     * Manual backup for specific servers
     */
    async createManualBackup(serverIds, options = {}) {
        try {
            logger.info(`Creating manual backup for ${serverIds.length} servers`);
            
            const results = await backupManager.createMultipleBackups(serverIds, {
                name: options.name || `manual-${new Date().toISOString().split('T')[0]}`,
                locked: options.locked || false
            });

            const successCount = results.filter(r => r.success).length;
            const failCount = results.filter(r => !r.success).length;
            
            logger.info(`Manual backup completed: ${successCount} successful, ${failCount} failed`);
            
            return {
                success: true,
                results,
                successCount,
                failCount,
                total: serverIds.length
            };
        } catch (error) {
            logger.error('Manual backup failed:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const scheduler = new PterodactylScheduler();
export default PterodactylScheduler; 