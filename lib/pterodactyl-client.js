/**
 * Pterodactyl Panel API Client
 * Handles all API communications with Pterodactyl Panel
 */

import axios from 'axios';
import { PTERODACTYL_CONFIG, validateConfig } from './pterodactyl-config.js';
import { logger } from '../helper/logger.js';

class PterodactylClient {
    constructor() {
        this.config = PTERODACTYL_CONFIG;
        this.validateConfiguration();
        this.setupAxiosInstances();
        this.requestCounts = new Map();
    }

    /**
     * Validate configuration on initialization
     */
    validateConfiguration() {
        const validation = validateConfig();
        if (!validation.isValid) {
            throw new Error(`Pterodactyl configuration invalid: ${validation.errors.join(', ')}`);
        }
        logger.info('Pterodactyl configuration validated successfully');
    }

    /**
     * Setup axios instances for Application and Client APIs
     */
    setupAxiosInstances() {
        // Application API instance (for administrative tasks)
        this.appAPI = axios.create({
            baseURL: `${this.config.PANEL_URL}/api/application`,
            timeout: this.config.TIMEOUT,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.APPLICATION_API_KEY}`
            }
        });

        // Client API instance (for user-level operations)
        this.clientAPI = axios.create({
            baseURL: `${this.config.PANEL_URL}/api/client`,
            timeout: this.config.TIMEOUT,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.CLIENT_API_KEY}`
            }
        });

        // Add response interceptors for error handling
        this.setupInterceptors();
    }

    /**
     * Setup request/response interceptors
     */
    setupInterceptors() {
        const errorHandler = (error) => {
            if (error.response) {
                const { status, data } = error.response;
                logger.error(`Pterodactyl API Error ${status}:`, data);
                
                switch (status) {
                    case 401:
                        throw new Error('Invalid API key or unauthorized access');
                    case 403:
                        throw new Error('Insufficient permissions for this operation');
                    case 404:
                        throw new Error('Resource not found');
                    case 429:
                        throw new Error('Rate limit exceeded. Please wait before making more requests');
                    case 500:
                        throw new Error('Pterodactyl Panel server error');
                    default:
                        throw new Error(data.message || `API request failed with status ${status}`);
                }
            } else if (error.request) {
                logger.error('Network error:', error.message);
                throw new Error('Failed to connect to Pterodactyl Panel');
            } else {
                logger.error('Request configuration error:', error.message);
                throw new Error('Invalid request configuration');
            }
        };

        this.appAPI.interceptors.response.use(response => response, errorHandler);
        this.clientAPI.interceptors.response.use(response => response, errorHandler);
    }

    /**
     * Rate limiting check
     */
    checkRateLimit() {
        const now = Date.now();
        const windowStart = now - this.config.RATE_LIMIT.WINDOW_MS;
        
        // Clean old entries
        for (const [timestamp] of this.requestCounts) {
            if (timestamp < windowStart) {
                this.requestCounts.delete(timestamp);
            }
        }
        
        if (this.requestCounts.size >= this.config.RATE_LIMIT.MAX_REQUESTS) {
            throw new Error('Rate limit exceeded. Please wait before making more requests');
        }
        
        this.requestCounts.set(now, true);
    }

    /**
     * Make a request to Application API
     */
    async makeAppRequest(method, endpoint, data = null) {
        this.checkRateLimit();
        
        try {
            logger.info(`Making Application API request: ${method.toUpperCase()} ${endpoint}`);
            const config = { method, url: endpoint };
            if (data) config.data = data;
            
            const response = await this.appAPI.request(config);
            return response.data;
        } catch (error) {
            logger.error(`Application API request failed: ${method.toUpperCase()} ${endpoint}`, error.message);
            throw error;
        }
    }

    /**
     * Make a request to Client API
     */
    async makeClientRequest(method, endpoint, data = null) {
        this.checkRateLimit();
        
        try {
            logger.info(`Making Client API request: ${method.toUpperCase()} ${endpoint}`);
            const config = { method, url: endpoint };
            if (data) config.data = data;
            
            const response = await this.clientAPI.request(config);
            return response.data;
        } catch (error) {
            logger.error(`Client API request failed: ${method.toUpperCase()} ${endpoint}`, error.message);
            throw error;
        }
    }

    /**
     * Test API connectivity
     */
    async testConnection() {
        try {
            await this.makeAppRequest('GET', '/servers');
            await this.makeClientRequest('GET', '/');
            logger.info('Pterodactyl API connection test successful');
            return true;
        } catch (error) {
            logger.error('Pterodactyl API connection test failed:', error.message);
            return false;
        }
    }

    /**
     * Get API status and information
     */
    async getAPIStatus() {
        try {
            const [appResponse, clientResponse] = await Promise.all([
                this.makeAppRequest('GET', '/servers?per_page=1').catch(() => null),
                this.makeClientRequest('GET', '/').catch(() => null)
            ]);

            return {
                panelUrl: this.config.PANEL_URL,
                applicationAPI: {
                    connected: appResponse !== null,
                    endpoint: `${this.config.PANEL_URL}/api/application`
                },
                clientAPI: {
                    connected: clientResponse !== null,
                    endpoint: `${this.config.PANEL_URL}/api/client`
                },
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Failed to get API status:', error.message);
            throw error;
        }
    }
}

// Export singleton instance
export const pterodactylClient = new PterodactylClient();
export default PterodactylClient; 