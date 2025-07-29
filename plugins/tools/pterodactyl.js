/**
 * Pterodactyl Management Plugin for WhatsApp Bot
 * Provides server management and backup functionality through chat commands
 */

import { serverManager } from '../../lib/pterodactyl-server.js';
import { backupManager } from '../../lib/pterodactyl-backup.js';
import { pterodactylClient } from '../../lib/pterodactyl-client.js';
import { pterodactylHelper } from '../../lib/pterodactyl-helper.js';
import { logger } from '../../helper/logger.js';

const PTERODACTYL_COMMANDS = {
    server: {
        list: ['servers', 'server list', 'srv list'],
        status: ['server status', 'srv status'],
        start: ['server start', 'srv start'],
        stop: ['server stop', 'srv stop'],
        restart: ['server restart', 'srv restart'],
        kill: ['server kill', 'srv kill'],
        info: ['server info', 'srv info'],
        resources: ['server resources', 'srv resources'],
        console: ['server console', 'srv console'],
        command: ['server cmd', 'srv cmd']
    },
    backup: {
        list: ['backups', 'backup list', 'bak list'],
        create: ['backup create', 'bak create'],
        delete: ['backup delete', 'bak delete'],
        restore: ['backup restore', 'bak restore'],
        download: ['backup download', 'bak download'],
        stats: ['backup stats', 'bak stats'],
        cleanup: ['backup cleanup', 'bak cleanup']
    },
    system: {
        status: ['ptero status', 'panel status'],
        test: ['ptero test', 'panel test']
    }
};

export const handler = {
    isAdmin: false,
    isBotAdmin: false,
    isOwner: true,
    isGroup: false,
    command: ['ptero', 'pterodactyl', 'server','servers', 'srv', 'backup', 'bak', 'pt', 's', 'b'],
    help: `🦕 *Pterodactyl Panel Management*

*📊 System Commands:*
• \`!ptero status\` - Check API connection status
• \`!ptero test\` - Test API connectivity

*🖥️ Server Management:*
• \`!servers\` - List all servers
• \`!server status <id>\` - Get server status
• \`!server start <id>\` - Start server
• \`!server stop <id>\` - Stop server
• \`!server restart <id>\` - Restart server
• \`!server kill <id>\` - Force kill server
• \`!server info <id>\` - Get server details
• \`!server resources <id>\` - Get resource usage
• \`!server cmd <id> <command>\` - Send console command

*💾 Backup Management:*
• \`!backups <id>\` - List server backups
• \`!backup create <id> [name]\` - Create new backup
• \`!backup delete <id> <backup_id>\` - Delete backup
• \`!backup restore <id> <backup_id>\` - Restore from backup
• \`!backup download <id> <backup_id>\` - Get download link
• \`!backup stats <id>\` - Backup statistics
• \`!backup cleanup <id>\` - Clean old backups

*📝 Examples:*
• \`!servers\` - Show all servers
• \`!server start 3\` - Start server with ID 3
• \`!backup create 3 daily-backup\` - Create named backup

*Note:* Server ID (number) can be found using \`!servers\` command`,
    tags: ['tools'],
    
    async exec({ m,cmd, args, sock }) {
        try {


            // Parse args string menjadi array untuk memudahkan akses
            const argsArray = args ? args.trim().split(/\s+/) : [];
            // args = "status abcd" -> argsArray = ["status", "abcd"]

            const subCommand = argsArray[0]?.toLowerCase() || ''; // "status"
            const action = argsArray[1]?.toLowerCase() || '';     // "abcd"
            const serverId = argsArray[1] || argsArray[2];        // "abcd"
            const additional = argsArray[2] || argsArray[3];

            // Add loading reaction
            await sock.sendMessage(m.chat, {
                react: { text: '⏳', key: m.key }
            });

            // System commands - check full command (cmd + subCommand)
            const fullCommand = `${cmd} ${subCommand}`.trim();
            if (this.isCommand(fullCommand, PTERODACTYL_COMMANDS.system.status)) {
                return await this.handleSystemStatus(m, sock);
            }
            
            if (this.isCommand(fullCommand, PTERODACTYL_COMMANDS.system.test)) {
                return await this.handleSystemTest(m, sock);
            }

            // Server commands
            if (this.isCommand(cmd, PTERODACTYL_COMMANDS.server.list) || 
                this.isCommand(fullCommand, PTERODACTYL_COMMANDS.server.list)) {
                return await this.handleServerList(m, sock, subCommand);
            }

            const serverFullCommand = `${cmd} ${subCommand} ${action}`.trim();
            if (this.isCommand(serverFullCommand, PTERODACTYL_COMMANDS.server.status)) {
                return await this.handleServerStatus(m, sock, additional);
            }

            if (this.isCommand(serverFullCommand, PTERODACTYL_COMMANDS.server.start)) {
                return await this.handleServerStart(m, sock, additional);
            }

            if (this.isCommand(serverFullCommand, PTERODACTYL_COMMANDS.server.stop)) {
                return await this.handleServerStop(m, sock, additional);
            }

            if (this.isCommand(serverFullCommand, PTERODACTYL_COMMANDS.server.restart)) {
                return await this.handleServerRestart(m, sock, additional);
            }

            if (this.isCommand(serverFullCommand, PTERODACTYL_COMMANDS.server.kill)) {
                return await this.handleServerKill(m, sock, additional);
            }

            if (this.isCommand(serverFullCommand, PTERODACTYL_COMMANDS.server.info)) {
                return await this.handleServerInfo(m, sock, additional);
            }

            if (this.isCommand(serverFullCommand, PTERODACTYL_COMMANDS.server.resources)) {
                return await this.handleServerResources(m, sock, additional);
            }

            if (this.isCommand(serverFullCommand, PTERODACTYL_COMMANDS.server.command)) {
                const commandText = argsArray.slice(3).join(' ');
                return await this.handleServerCommand(m, sock, additional, commandText);
            }

            // Backup commands
            if (this.isCommand(cmd, PTERODACTYL_COMMANDS.backup.list) || 
                this.isCommand(fullCommand, PTERODACTYL_COMMANDS.backup.list)) {
                return await this.handleBackupList(m, sock, subCommand);
            }

            const backupFullCommand = `${cmd} ${subCommand} ${action}`.trim();
            if (this.isCommand(backupFullCommand, PTERODACTYL_COMMANDS.backup.create)) {
                const backupName = argsArray.slice(3).join(' ');
                return await this.handleBackupCreate(m, sock, additional, backupName);
            }

            if (this.isCommand(backupFullCommand, PTERODACTYL_COMMANDS.backup.delete)) {
                return await this.handleBackupDelete(m, sock, additional, argsArray[3]);
            }

            if (this.isCommand(backupFullCommand, PTERODACTYL_COMMANDS.backup.restore)) {
                return await this.handleBackupRestore(m, sock, additional, argsArray[3]);
            }

            if (this.isCommand(backupFullCommand, PTERODACTYL_COMMANDS.backup.download)) {
                return await this.handleBackupDownload(m, sock, additional, argsArray[3]);
            }

            if (this.isCommand(backupFullCommand, PTERODACTYL_COMMANDS.backup.stats)) {
                return await this.handleBackupStats(m, sock, additional);
            }

            if (this.isCommand(backupFullCommand, PTERODACTYL_COMMANDS.backup.cleanup)) {
                return await this.handleBackupCleanup(m, sock, additional);
            }

            // Show usage if no valid command
            await m.reply(this.getUsageText());
            await sock.sendMessage(m.chat, {
                react: { text: 'ℹ️', key: m.key }
            });

        } catch (error) {
            logger.error('Pterodactyl plugin error:', error);
            await m.reply(`❌ Error: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    },

    getUsageText() {
        return `🦕 *Pterodactyl Management Commands*

*📊 System Commands:*
• \`!ptero status\` - Check API connection status
• \`!ptero test\` - Test API connectivity

*🖥️ Server Management:*
• \`!servers\` - List all servers
• \`!server status <uuid>\` - Get server status
• \`!server start <uuid>\` - Start server
• \`!server stop <uuid>\` - Stop server
• \`!server restart <uuid>\` - Restart server
• \`!server kill <uuid>\` - Force kill server
• \`!server info <uuid>\` - Get server details
• \`!server resources <uuid>\` - Get resource usage
• \`!server cmd <uuid> <command>\` - Send console command

*💾 Backup Management:*
• \`!backups <uuid>\` - List server backups
• \`!backup create <uuid> [name]\` - Create new backup
• \`!backup delete <uuid> <backup_id>\` - Delete backup
• \`!backup restore <uuid> <backup_id>\` - Restore from backup
• \`!backup download <uuid> <backup_id>\` - Get download link
• \`!backup stats <uuid>\` - Backup statistics
• \`!backup cleanup <uuid>\` - Clean old backups

*📝 Examples:*
• \`!servers\` - Show all servers
• \`!server start abc123\` - Start server with UUID abc123
• \`!backup create abc123 daily-backup\` - Create named backup
• \`!backup cleanup abc123\` - Remove old backups

*Note:* Server UUID can be found using \`!servers\` command`;
    },

    // Utility function to check command matches
    isCommand(input, commands) {
        return commands.some(cmd => input === cmd || input.startsWith(cmd + ' '));
    },

    // System command handlers
    async handleSystemStatus(m, sock) {
        try {
            const loading = await m.reply('🔄 Checking Pterodactyl API status...');
            const status = await pterodactylClient.getAPIStatus();
            
            const statusText = `
🦕 *Pterodactyl Panel Status*

📡 *Panel URL:* ${status.panelUrl}

🔧 *Application API:*
• Status: ${status.applicationAPI.connected ? '✅ Connected' : '❌ Disconnected'}
• Endpoint: ${status.applicationAPI.endpoint}

👤 *Client API:*
• Status: ${status.clientAPI.connected ? '✅ Connected' : '❌ Disconnected'}
• Endpoint: ${status.clientAPI.endpoint}

⏰ *Last Checked:* ${status.timestamp}
            `.trim();

            await sock.sendMessage(m.chat, { text: statusText, edit: loading.key });
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            await m.reply(`❌ Failed to get API status: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    },

    async handleSystemTest(m, sock) {
        try {
            const loading = await m.reply('🔄 Testing Pterodactyl API connection...');
            const isConnected = await pterodactylClient.testConnection();
            
            const result = isConnected
                ? '✅ Pterodactyl API connection test successful!'
                : '❌ Pterodactyl API connection test failed!';
            
            await sock.sendMessage(m.chat, { text: result, edit: loading.key });
            await sock.sendMessage(m.chat, {
                react: { text: isConnected ? '✅' : '❌', key: m.key }
            });
        } catch (error) {
            await m.reply(`❌ Connection test failed: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    },

    // Server command handlers
    async handleServerList(m, sock, search = '') {
        try {
            const loading = await m.reply('🔄 Loading server list...');
            
            const options = search ? { search, perPage: 20 } : { perPage: 20 };
            const { servers, pagination } = await pterodactylHelper.getAllServersWithMapping(options);
            
            if (servers.length === 0) {
                return await sock.sendMessage(m.chat, { 
                    text: search ? `🔍 No servers found matching "${search}"` : '📭 No servers found', 
                    edit: loading.key 
                });
            }

            let serverList = `🖥️ *Server List* ${search ? `(Search: "${search}")` : ''}\n`;
            serverList += `📊 *Page ${pagination.current}/${pagination.total}* (${pagination.count}/${pagination.total_count} servers)\n\n`;

            servers.forEach((server, index) => {
                const statusIcon = this.getStatusIcon(server.status);
                const suspendedText = server.is_suspended ? ' 🔒' : '';
                
                serverList += `${index + 1}. ${statusIcon} *${server.name}*${suspendedText}\n`;
                serverList += `   📋 ID: \`${server.id}\` | Short: \`${server.identifier}\`\n`;
                serverList += `   💾 RAM: ${server.limits.memory}MB | 💽 Disk: ${server.limits.disk}MB\n`;
                serverList += `   📅 Created: ${server.created_at}\n\n`;
            });

            serverList += `\n💡 *Tip:* Use server ID (number) for easier commands\n`;
            serverList += `Example: \`!server status ${servers[0]?.id}\``;

            await sock.sendMessage(m.chat, { text: serverList.trim(), edit: loading.key });
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            await m.reply(`❌ Failed to get server list: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    },

    async handleServerStatus(m, sock, serverId) {
        if (!serverId) {
            await m.reply('❌ Please provide server ID or UUID. Use `!servers` to get server list.');
            return;
        }

        try {
            const loading = await m.reply('🔄 Getting server status...');
            
            // Convert server ID/UUID to UUID for API calls
            const serverUuid = await pterodactylHelper.getUuidFromIdentifier(serverId);
            const serverInfo = await pterodactylHelper.getServerByIdentifier(serverId);
            
            const resources = await serverManager.getServerResources(serverUuid);
            const server = await serverManager.getServerDetails(serverUuid);
            
            const statusIcon = this.getStatusIcon(resources.current_state);
            const suspendedText = resources.is_suspended ? ' 🔒 SUSPENDED' : '';
            
            const statusText = `
🖥️ *Server Status*

📛 *Name:* ${server.name}${suspendedText}
📋 *ID:* \`${serverInfo.id}\` | *Short:* \`${serverInfo.identifier}\`
${statusIcon} *Status:* ${resources.current_state.toUpperCase()}

💻 *Resource Usage:*
• 🧠 RAM: ${resources.resources.memory.percentage}% (${this.formatBytes(resources.resources.memory.current)}/${this.formatBytes(resources.resources.memory.limit)})
• ⚡ CPU: ${resources.resources.cpu.percentage}%
• 💽 Disk: ${resources.resources.disk.percentage}% (${this.formatBytes(resources.resources.disk.current)}/${this.formatBytes(resources.resources.disk.limit)})
• 📡 Network: ↓${this.formatBytes(resources.resources.network.rx_bytes)} ↑${this.formatBytes(resources.resources.network.tx_bytes)}

⏰ *Last Updated:* ${resources.timestamp}
            `.trim();

            await sock.sendMessage(m.chat, { text: statusText, edit: loading.key });
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            await m.reply(`❌ Failed to get server status: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    },

    async handleServerStart(m, sock, serverId) {
        if (!serverId) {
            await m.reply('❌ Please provide server ID or UUID.');
            return;
        }

        try {
            const loading = await m.reply('🔄 Starting server...');
            const serverUuid = await pterodactylHelper.getUuidFromIdentifier(serverId);
            const serverInfo = await pterodactylHelper.getServerByIdentifier(serverId);
            
            await serverManager.startServer(serverUuid);
            await sock.sendMessage(m.chat, { 
                text: `✅ Start command sent to server *${serverInfo.name}* (ID: \`${serverInfo.id}\`)\nNote: It may take a few moments to start.`, 
                edit: loading.key 
            });
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            await m.reply(`❌ Failed to start server: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    },

    async handleServerStop(m, sock, serverId) {
        if (!serverId) {
            await m.reply('❌ Please provide server ID or UUID.');
            return;
        }

        try {
            const loading = await m.reply('🔄 Stopping server...');
            const serverUuid = await pterodactylHelper.getUuidFromIdentifier(serverId);
            const serverInfo = await pterodactylHelper.getServerByIdentifier(serverId);
            
            await serverManager.stopServer(serverUuid);
            await sock.sendMessage(m.chat, { 
                text: `✅ Stop command sent to server *${serverInfo.name}* (ID: \`${serverInfo.id}\`)`, 
                edit: loading.key 
            });
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            await m.reply(`❌ Failed to stop server: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    },

    async handleServerRestart(m, sock, serverId) {
        if (!serverId) {
            await m.reply('❌ Please provide server ID or UUID.');
            return;
        }

        try {
            const loading = await m.reply('🔄 Restarting server...');
            const serverUuid = await pterodactylHelper.getUuidFromIdentifier(serverId);
            const serverInfo = await pterodactylHelper.getServerByIdentifier(serverId);
            
            await serverManager.restartServer(serverUuid);
            await sock.sendMessage(m.chat, { 
                text: `✅ Restart command sent to server *${serverInfo.name}* (ID: \`${serverInfo.id}\`)`, 
                edit: loading.key 
            });
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            await m.reply(`❌ Failed to restart server: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    },

    async handleServerKill(m, sock, serverId) {
        if (!serverId) {
            await m.reply('❌ Please provide server UUID.');
            return;
        }

        try {
            const loading = await m.reply('🔄 Force killing server...');
            await serverManager.killServer(serverId);
            await sock.sendMessage(m.chat, { 
                text: `✅ Kill command sent to server \`${serverId}\`\n⚠️ This was a force kill operation.`, 
                edit: loading.key 
            });
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            await m.reply(`❌ Failed to kill server: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    },

    async handleServerInfo(m, sock, serverId) {
        if (!serverId) {
            await m.reply('❌ Please provide server UUID.');
            return;
        }

        try {
            const loading = await m.reply('🔄 Getting server information...');
            const server = await serverManager.getServerDetails(serverId, true);
            
            const suspendedText = server.is_suspended ? ' 🔒' : '';
            const installingText = server.is_installing ? ' 📦 Installing' : '';
            const transferringText = server.is_transferring ? ' 🔄 Transferring' : '';
            
            const infoText = `
🖥️ *Server Information*

📛 *Name:* ${server.name}${suspendedText}${installingText}${transferringText}
📋 *UUID:* \`${server.uuid}\`
🏷️ *Identifier:* ${server.identifier}
📝 *Description:* ${server.description || 'No description'}

💻 *Limits:*
• 🧠 RAM: ${server.limits.memory}MB (Swap: ${server.limits.swap}MB)
• 💽 Disk: ${server.limits.disk}MB
• ⚡ CPU: ${server.limits.cpu}%
• 🔧 IO: ${server.limits.io}
• 🧵 Threads: ${server.limits.threads || 'Unlimited'}

🆔 *IDs:*
• User: ${server.user_id}
• Node: ${server.node_id}
• Allocation: ${server.allocation_id}
• Nest: ${server.nest_id}
• Egg: ${server.egg_id}

📅 *Dates:*
• Created: ${server.created_at}
• Updated: ${server.updated_at}
            `.trim();

            await sock.sendMessage(m.chat, { text: infoText, edit: loading.key });
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            await m.reply(`❌ Failed to get server info: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    },

    async handleServerResources(m, sock, serverId) {
        if (!serverId) {
            await m.reply('❌ Please provide server UUID.');
            return;
        }

        try {
            const loading = await m.reply('🔄 Getting resource usage...');
            const resources = await serverManager.getServerResources(serverId);
            
            const resourceText = `
📊 *Server Resources*

📋 *Server:* \`${serverId}\`
🔄 *Status:* ${resources.current_state.toUpperCase()}
${resources.is_suspended ? '🔒 *Suspended*' : ''}

💻 *Current Usage:*

🧠 *Memory:*
• Used: ${this.formatBytes(resources.resources.memory.current)}
• Limit: ${this.formatBytes(resources.resources.memory.limit)}
• Usage: ${resources.resources.memory.percentage}%
${this.getUsageBar(resources.resources.memory.percentage)}

⚡ *CPU:*
• Usage: ${resources.resources.cpu.percentage}%
${this.getUsageBar(resources.resources.cpu.percentage)}

💽 *Disk:*
• Used: ${this.formatBytes(resources.resources.disk.current)}
• Limit: ${this.formatBytes(resources.resources.disk.limit)}
• Usage: ${resources.resources.disk.percentage}%
${this.getUsageBar(resources.resources.disk.percentage)}

📡 *Network:*
• Downloaded: ${this.formatBytes(resources.resources.network.rx_bytes)}
• Uploaded: ${this.formatBytes(resources.resources.network.tx_bytes)}

⏰ *Last Updated:* ${resources.timestamp}
            `.trim();

            await sock.sendMessage(m.chat, { text: resourceText, edit: loading.key });
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            await m.reply(`❌ Failed to get server resources: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    },

    async handleServerCommand(m, sock, serverId, command) {
        if (!serverId || !command) {
            await m.reply('❌ Please provide server UUID and command.\nExample: `!server cmd abc123 say Hello World`');
            return;
        }

        try {
            const loading = await m.reply('🔄 Sending command to server...');
            await serverManager.sendCommand(serverId, command);
            await sock.sendMessage(m.chat, { 
                text: `✅ Command sent to server \`${serverId}\`:\n\`${command}\``, 
                edit: loading.key 
            });
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            await m.reply(`❌ Failed to send command: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    },

    // Backup command handlers
    async handleBackupList(m, sock, serverId) {
        if (!serverId) {
            await m.reply('❌ Please provide server ID or UUID.');
            return;
        }

        try {
            const loading = await m.reply('🔄 Loading backup list...');
            const serverUuid = await pterodactylHelper.getUuidFromIdentifier(serverId);
            const serverInfo = await pterodactylHelper.getServerByIdentifier(serverId);
            
            const { backups, count } = await backupManager.getServerBackups(serverUuid);
            
            if (count === 0) {
                return await sock.sendMessage(m.chat, { 
                    text: `📭 No backups found for server *${serverInfo.name}* (ID: \`${serverInfo.id}\`)`, 
                    edit: loading.key 
                });
            }

            let backupList = `💾 *Server Backups*\n`;
            backupList += `📋 *Server:* ${serverInfo.name} (ID: \`${serverInfo.id}\`)\n`;
            backupList += `📊 *Total:* ${count} backups\n\n`;

            backups.forEach((backup, index) => {
                const statusIcon = backup.status === 'completed' ? '✅' : 
                                 backup.status === 'processing' ? '🔄' : 
                                 backup.locked ? '🔒' : '❌';
                
                backupList += `${index + 1}. ${statusIcon} *${backup.name}*\n`;
                backupList += `   📋 ID: \`${backup.uuid}\`\n`;
                backupList += `   📊 Size: ${backup.size_formatted}\n`;
                backupList += `   📅 Created: ${backup.created_at}\n`;
                if (backup.completed_at) {
                    backupList += `   ✅ Completed: ${backup.completed_at}\n`;
                }
                backupList += `\n`;
            });

            await sock.sendMessage(m.chat, { text: backupList.trim(), edit: loading.key });
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            await m.reply(`❌ Failed to get backup list: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    },

    async handleBackupCreate(m, sock, serverId, name) {
        if (!serverId) {
            await m.reply('❌ Please provide server UUID.');
            return;
        }

        try {
            const loading = await m.reply('🔄 Creating backup...');
            const options = name ? { name } : {};
            const result = await backupManager.createBackup(serverId, options);
            
            const resultText = `
✅ *Backup Creation Started*

📋 *Server:* \`${serverId}\`
💾 *Backup Name:* ${result.backup.name}
📋 *Backup ID:* \`${result.backup.uuid}\`
📅 *Started:* ${result.backup.created_at}

⏳ The backup is being created in the background.
Use \`.backups ${serverId}\` to check status.
            `.trim();

            await sock.sendMessage(m.chat, { text: resultText, edit: loading.key });
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            await m.reply(`❌ Failed to create backup: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    },

    async handleBackupDelete(m, sock, serverId, backupId) {
        if (!serverId || !backupId) {
            await m.reply('❌ Please provide server UUID and backup ID.');
            return;
        }

        try {
            const loading = await m.reply('🔄 Deleting backup...');
            await backupManager.deleteBackup(serverId, backupId);
            await sock.sendMessage(m.chat, { 
                text: `✅ Backup \`${backupId}\` deleted from server \`${serverId}\``, 
                edit: loading.key 
            });
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            await m.reply(`❌ Failed to delete backup: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    },

    async handleBackupRestore(m, sock, serverId, backupId) {
        if (!serverId || !backupId) {
            await m.reply('❌ Please provide server UUID and backup ID.');
            return;
        }

        try {
            const loading = await m.reply('🔄 Restoring from backup...');
            await backupManager.restoreBackup(serverId, backupId);
            await sock.sendMessage(m.chat, { 
                text: `✅ Restore started for server \`${serverId}\` from backup \`${backupId}\`\n⚠️ Server will be stopped during restore process.`, 
                edit: loading.key 
            });
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            await m.reply(`❌ Failed to restore backup: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    },

    async handleBackupDownload(m, sock, serverId, backupId) {
        if (!serverId || !backupId) {
            await m.reply('❌ Please provide server UUID and backup ID.');
            return;
        }

        try {
            const loading = await m.reply('🔄 Generating download link...');
            const download = await backupManager.getBackupDownloadUrl(serverId, backupId);
            
            const downloadText = `
📥 *Backup Download*

📋 *Server:* \`${serverId}\`
💾 *Backup:* \`${backupId}\`
🔗 *Download URL:* ${download.downloadUrl}
⏰ *Expires:* ${download.expiresAt}

⚠️ *Note:* Download link expires after some time.
            `.trim();

            await sock.sendMessage(m.chat, { text: downloadText, edit: loading.key });
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            await m.reply(`❌ Failed to get download link: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    },

    async handleBackupStats(m, sock, serverId) {
        if (!serverId) {
            await m.reply('❌ Please provide server UUID.');
            return;
        }

        try {
            const loading = await m.reply('🔄 Getting backup statistics...');
            const stats = await backupManager.getBackupStats(serverId);
            
            const statsText = `
📊 *Backup Statistics*

📋 *Server:* \`${serverId}\`

📈 *Counts:*
• Total: ${stats.statistics.total}
• Completed: ${stats.statistics.completed}
• Failed: ${stats.statistics.failed}
• Processing: ${stats.statistics.processing}
• Locked: ${stats.statistics.locked}

💽 *Storage:*
• Total Size: ${stats.statistics.totalSize}

📅 *Dates:*
${stats.statistics.oldestBackup ? `• Oldest: ${stats.statistics.oldestBackup.name} (${stats.statistics.oldestBackup.created_at})` : '• No completed backups'}
${stats.statistics.newestBackup ? `• Newest: ${stats.statistics.newestBackup.name} (${stats.statistics.newestBackup.created_at})` : ''}

⏰ *Generated:* ${stats.timestamp}
            `.trim();

            await sock.sendMessage(m.chat, { text: statsText, edit: loading.key });
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            await m.reply(`❌ Failed to get backup stats: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    },

    async handleBackupCleanup(m, sock, serverId) {
        if (!serverId) {
            await m.reply('❌ Please provide server UUID.');
            return;
        }

        try {
            const loading = await m.reply('🔄 Cleaning up old backups...');
            const result = await backupManager.cleanupOldBackups(serverId);
            
            if (result.deletedCount === 0) {
                return await sock.sendMessage(m.chat, { 
                    text: `✅ No cleanup needed for server \`${serverId}\`\n📊 Remaining: ${result.remainingBackups} backups`, 
                    edit: loading.key 
                });
            }

            const cleanupText = `
🧹 *Backup Cleanup Complete*

📋 *Server:* \`${serverId}\`
🗑️ *Deleted:* ${result.deletedCount} backups
📊 *Remaining:* ${result.remainingBackups} backups

📋 *Deleted Backups:*
${result.deletedBackups.map(backup => 
    `• ${backup.name} (${backup.reason})`
).join('\n')}

⏰ *Completed:* ${result.timestamp}
            `.trim();

            await sock.sendMessage(m.chat, { text: cleanupText, edit: loading.key });
            await sock.sendMessage(m.chat, {
                react: { text: '✅', key: m.key }
            });
        } catch (error) {
            await m.reply(`❌ Failed to cleanup backups: ${error.message}`);
            await sock.sendMessage(m.chat, {
                react: { text: '❌', key: m.key }
            });
        }
    },

    // Utility functions
    getStatusIcon(status) {
        const icons = {
            'running': '🟢',
            'starting': '🟡',
            'stopping': '🟠',
            'stopped': '🔴',
            'offline': '⚫',
            'installing': '📦',
            'suspended': '🔒'
        };
        return icons[status?.toLowerCase()] || '❓';
    },

    getUsageBar(percentage) {
        const blocks = Math.round(percentage / 10);
        const bar = '█'.repeat(blocks) + '░'.repeat(10 - blocks);
        return `${bar} ${percentage}%`;
    },

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}; 