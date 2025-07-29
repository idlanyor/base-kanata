/**
 * Pterodactyl Backup Management
 * Handles backup creation, listing, deletion, and restoration
 */

import { pterodactylClient } from './pterodactyl-client.js';
import { PTERODACTYL_CONFIG } from './pterodactyl-config.js';
import { logger } from '../helper/logger.js';
import moment from 'moment';

class PterodactylBackupManager {
    constructor() {
        this.client = pterodactylClient;
        this.config = PTERODACTYL_CONFIG;
    }

    /**
     * Create a backup for a server
     * @param {string} serverId - Server UUID
     * @param {Object} options - Backup options
     * @returns {Promise<Object>} Backup creation result
     */
    async createBackup(serverId, options = {}) {
        try {
            const {
                name = null,
                ignored = '',
                locked = false
            } = options;

            // Generate backup name if not provided
            const backupName = name || `${this.config.BACKUP.NAME_PREFIX}-${moment().format('YYYY-MM-DD-HH-mm-ss')}`;

            const backupData = {
                name: backupName,
                ignored: ignored,
                locked: locked
            };

            const response = await this.client.makeClientRequest('POST', `/servers/${serverId}/backups`, backupData);
            
            logger.info(`Backup creation initiated for server ${serverId}: ${backupName}`);
            
            return {
                success: true,
                backup: this.formatBackupInfo(response.attributes),
                serverId,
                message: `Backup "${backupName}" creation started`
            };
        } catch (error) {
            logger.error(`Failed to create backup for server ${serverId}:`, error.message);
            throw error;
        }
    }

    /**
     * Get all backups for a server
     * @param {string} serverId - Server UUID
     * @returns {Promise<Array>} List of backups
     */
    async getServerBackups(serverId) {
        try {
            const response = await this.client.makeClientRequest('GET', `/servers/${serverId}/backups`);
            
            return {
                serverId,
                backups: response.data.map(backup => this.formatBackupInfo(backup.attributes)),
                count: response.data.length,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error(`Failed to get backups for server ${serverId}:`, error.message);
            throw error;
        }
    }

    /**
     * Get specific backup details
     * @param {string} serverId - Server UUID
     * @param {string} backupId - Backup UUID
     * @returns {Promise<Object>} Backup details
     */
    async getBackupDetails(serverId, backupId) {
        try {
            const response = await this.client.makeClientRequest('GET', `/servers/${serverId}/backups/${backupId}`);
            
            return this.formatBackupInfo(response.attributes);
        } catch (error) {
            logger.error(`Failed to get backup details for ${backupId}:`, error.message);
            throw error;
        }
    }

    /**
     * Download backup
     * @param {string} serverId - Server UUID
     * @param {string} backupId - Backup UUID
     * @returns {Promise<Object>} Download URL and info
     */
    async getBackupDownloadUrl(serverId, backupId) {
        try {
            const response = await this.client.makeClientRequest('GET', `/servers/${serverId}/backups/${backupId}/download`);
            
            return {
                serverId,
                backupId,
                downloadUrl: response.attributes.url,
                expiresAt: moment(response.attributes.expires_at).format('YYYY-MM-DD HH:mm:ss'),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error(`Failed to get download URL for backup ${backupId}:`, error.message);
            throw error;
        }
    }

    /**
     * Delete a backup
     * @param {string} serverId - Server UUID
     * @param {string} backupId - Backup UUID
     * @returns {Promise<boolean>} Success status
     */
    async deleteBackup(serverId, backupId) {
        try {
            await this.client.makeClientRequest('DELETE', `/servers/${serverId}/backups/${backupId}`);
            
            logger.info(`Backup ${backupId} deleted from server ${serverId}`);
            return true;
        } catch (error) {
            logger.error(`Failed to delete backup ${backupId}:`, error.message);
            throw error;
        }
    }

    /**
     * Restore server from backup
     * @param {string} serverId - Server UUID
     * @param {string} backupId - Backup UUID
     * @param {boolean} truncate - Whether to truncate server files before restore
     * @returns {Promise<boolean>} Success status
     */
    async restoreBackup(serverId, backupId, truncate = false) {
        try {
            await this.client.makeClientRequest('POST', `/servers/${serverId}/backups/${backupId}/restore`, {
                truncate: truncate
            });
            
            logger.info(`Backup restore initiated for server ${serverId} from backup ${backupId}`);
            return true;
        } catch (error) {
            logger.error(`Failed to restore backup ${backupId}:`, error.message);
            throw error;
        }
    }

    /**
     * Auto cleanup old backups based on retention policy
     * @param {string} serverId - Server UUID
     * @returns {Promise<Object>} Cleanup result
     */
    async cleanupOldBackups(serverId) {
        try {
            const { backups } = await this.getServerBackups(serverId);
            
            // Sort backups by creation date (newest first)
            const sortedBackups = backups
                .filter(backup => backup.status === 'completed' && !backup.locked)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            const maxBackups = this.config.BACKUP.MAX_BACKUPS;
            const retentionDays = this.config.BACKUP.RETENTION_DAYS;
            const cutoffDate = moment().subtract(retentionDays, 'days');

            let deletedCount = 0;
            const deletedBackups = [];

            // Delete backups exceeding max count
            if (sortedBackups.length > maxBackups) {
                const excessBackups = sortedBackups.slice(maxBackups);
                for (const backup of excessBackups) {
                    await this.deleteBackup(serverId, backup.uuid);
                    deletedBackups.push({ ...backup, reason: 'exceeded_max_count' });
                    deletedCount++;
                }
            }

            // Delete backups older than retention period
            const oldBackups = sortedBackups.filter(backup => 
                moment(backup.created_at).isBefore(cutoffDate)
            );
            
            for (const backup of oldBackups) {
                if (!deletedBackups.find(d => d.uuid === backup.uuid)) {
                    await this.deleteBackup(serverId, backup.uuid);
                    deletedBackups.push({ ...backup, reason: 'exceeded_retention' });
                    deletedCount++;
                }
            }

            logger.info(`Cleaned up ${deletedCount} old backups for server ${serverId}`);
            
            return {
                serverId,
                deletedCount,
                deletedBackups,
                remainingBackups: sortedBackups.length - deletedCount,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error(`Failed to cleanup old backups for server ${serverId}:`, error.message);
            throw error;
        }
    }

    /**
     * Create scheduled backup for multiple servers
     * @param {Array<string>} serverIds - Array of server UUIDs
     * @param {Object} options - Backup options
     * @returns {Promise<Array>} Results for each server
     */
    async createMultipleBackups(serverIds, options = {}) {
        try {
            const results = await Promise.allSettled(
                serverIds.map(serverId => this.createBackup(serverId, options))
            );

            return results.map((result, index) => ({
                serverId: serverIds[index],
                success: result.status === 'fulfilled',
                data: result.status === 'fulfilled' ? result.value : null,
                error: result.status === 'rejected' ? result.reason.message : null
            }));
        } catch (error) {
            logger.error('Failed to create multiple backups:', error.message);
            throw error;
        }
    }

    /**
     * Get backup statistics for a server
     * @param {string} serverId - Server UUID
     * @returns {Promise<Object>} Backup statistics
     */
    async getBackupStats(serverId) {
        try {
            const { backups } = await this.getServerBackups(serverId);
            
            const totalBackups = backups.length;
            const completedBackups = backups.filter(b => b.status === 'completed').length;
            const failedBackups = backups.filter(b => b.status === 'failed').length;
            const processingBackups = backups.filter(b => b.status === 'processing').length;
            const lockedBackups = backups.filter(b => b.locked).length;
            
            const totalSize = backups
                .filter(b => b.status === 'completed')
                .reduce((sum, backup) => sum + backup.size, 0);
            
            const oldestBackup = backups
                .filter(b => b.status === 'completed')
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];
            
            const newestBackup = backups
                .filter(b => b.status === 'completed')
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

            return {
                serverId,
                statistics: {
                    total: totalBackups,
                    completed: completedBackups,
                    failed: failedBackups,
                    processing: processingBackups,
                    locked: lockedBackups,
                    totalSize: this.formatFileSize(totalSize),
                    totalSizeBytes: totalSize,
                    oldestBackup: oldestBackup ? {
                        name: oldestBackup.name,
                        created_at: oldestBackup.created_at
                    } : null,
                    newestBackup: newestBackup ? {
                        name: newestBackup.name,
                        created_at: newestBackup.created_at
                    } : null
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error(`Failed to get backup stats for server ${serverId}:`, error.message);
            throw error;
        }
    }

    /**
     * Format backup information
     * @param {Object} backup - Raw backup data
     * @returns {Object} Formatted backup info
     */
    formatBackupInfo(backup) {
        return {
            uuid: backup.uuid,
            name: backup.name,
            ignored_files: backup.ignored_files,
            sha256_hash: backup.sha256_hash,
            size: backup.bytes,
            size_formatted: this.formatFileSize(backup.bytes),
            status: backup.is_successful ? 'completed' : (backup.is_locked ? 'locked' : 'processing'),
            locked: backup.is_locked,
            created_at: moment(backup.created_at).format('YYYY-MM-DD HH:mm:ss'),
            completed_at: backup.completed_at ? moment(backup.completed_at).format('YYYY-MM-DD HH:mm:ss') : null
        };
    }

    /**
     * Format file size in human readable format
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Export singleton instance
export const backupManager = new PterodactylBackupManager();
export default PterodactylBackupManager; 