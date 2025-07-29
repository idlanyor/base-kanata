/**
 * Pterodactyl Integration Test
 * Test file untuk memverifikasi konfigurasi dan koneksi Pterodactyl
 */

// Disable auto-init for testing
process.env.PTERODACTYL_AUTO_INIT = 'false';

import '../global.js'; // Load global configuration
import { pterodactylIntegration } from './pterodactyl-integration.js';
import { pterodactylClient } from './pterodactyl-client.js';
import { PTERODACTYL_CONFIG } from './pterodactyl-config.js';
import { logger } from '../helper/logger.js';

async function testPterodactylIntegration() {
    console.log('🦕 Testing Pterodactyl Integration...\n');

    try {
        // 1. Test Configuration
        console.log('📋 Configuration Test:');
        console.log(`Panel URL: ${PTERODACTYL_CONFIG.PANEL_URL}`);
        console.log(`Client API Key: ${PTERODACTYL_CONFIG.CLIENT_API_KEY ? '✅ Set' : '❌ Missing'}`);
        console.log(`Application API Key: ${PTERODACTYL_CONFIG.APPLICATION_API_KEY ? '✅ Set' : '❌ Missing'}`);
        console.log(`Email Suffix: ${PTERODACTYL_CONFIG.EMAIL_SUFFIX || 'Not set'}\n`);

        // 2. Test API Connection
        console.log('🔌 Testing API Connection...');
        
        // Test individual API endpoints
        console.log('Testing Application API...');
        try {
            const appResult = await pterodactylClient.makeAppRequest('GET', '/servers?per_page=1');
            console.log('✅ Application API: Connected');
        } catch (error) {
            console.log(`❌ Application API: Failed - ${error.message}`);
        }

        console.log('Testing Client API...');
        try {
            const clientResult = await pterodactylClient.makeClientRequest('GET', '/');
            console.log('✅ Client API: Connected');
        } catch (error) {
            console.log(`❌ Client API: Failed - ${error.message}`);
        }

        const isConnected = await pterodactylClient.testConnection();
        console.log(`Overall Connection Status: ${isConnected ? '✅ Connected' : '❌ Failed'}\n`);

        if (!isConnected) {
            console.log('❌ API connection failed. Please check your configuration.');
            console.log('Possible issues:');
            console.log('- Invalid API keys');
            console.log('- Network connectivity issues');
            console.log('- Pterodactyl panel is down');
            console.log('- Wrong panel URL');
            return;
        }

        // 3. Test API Status
        console.log('📊 Getting API Status...');
        const status = await pterodactylClient.getAPIStatus();
        console.log(`Application API: ${status.applicationAPI.connected ? '✅ Connected' : '❌ Disconnected'}`);
        console.log(`Client API: ${status.clientAPI.connected ? '✅ Connected' : '❌ Disconnected'}\n`);

        // 4. Test Server List (first 5 servers)
        console.log('🖥️ Testing Server List...');
        try {
            const { serverManager } = await import('./pterodactyl-server.js');
            const { servers, pagination } = await serverManager.getAllServers({ perPage: 5 });
            
            console.log(`Found ${pagination.total_count} total servers (showing first ${servers.length}):`);
            servers.forEach((server, index) => {
                console.log(`${index + 1}. ${server.name} (${server.uuid}) - ${server.status}`);
            });
            console.log();
        } catch (error) {
            console.log(`❌ Server list test failed: ${error.message}\n`);
        }

        // 5. Test Integration Health
        console.log('🏥 Testing Integration Health...');
        try {
            await pterodactylIntegration.init();
            const health = await pterodactylIntegration.getStatus();
            console.log(`Integration Status: ${health.initialized ? '✅ Initialized' : '❌ Not Initialized'}`);
            console.log(`API Status: ${health.api?.applicationAPI?.connected && health.api?.clientAPI?.connected ? '✅ Healthy' : '⚠️ Degraded'}`);
            console.log(`Scheduler Status: ${health.scheduler?.initialized ? '✅ Running' : '❌ Disabled'}\n`);
        } catch (error) {
            console.log(`❌ Integration test failed: ${error.message}\n`);
        }

        console.log('✅ Pterodactyl integration test completed successfully!');
        console.log('\n🚀 You can now use the following commands in WhatsApp:');
        console.log('• .ptero status - Check API status');
        console.log('• .servers - List all servers');
        console.log('• .server status <uuid> - Get server status');
        console.log('• .backup create <uuid> - Create backup');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        logger.error('Pterodactyl test error:', error);
    }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testPterodactylIntegration();
}

export default testPterodactylIntegration; 