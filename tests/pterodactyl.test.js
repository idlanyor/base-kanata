import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import PterodactylAPI from '../helper/pterodactyl.js'

describe('PterodactylAPI - Egg ID Resolution', () => {
    let pterodactylAPI
    let originalGlobalThis

    beforeEach(() => {
        // Save original globalThis state
        originalGlobalThis = {
            storeConfig: globalThis.storeConfig
        }

        // Reset console methods to avoid noise in tests
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        // Restore original globalThis state
        globalThis.storeConfig = originalGlobalThis.storeConfig
        
        // Restore console methods
        vi.restoreAllMocks()
    })

    describe('resolveEggId method with various product codes', () => {
        beforeEach(() => {
            // Setup valid configuration
            globalThis.storeConfig = {
                pterodactyl: {
                    url: 'https://panel.roidev.my.id',
                    apiKey: 'ptlc_t4zgkJH2ZmcmFZchnQxFn3N3J2Fn1nfFkh9BtbNggTk',
                    adminApiKey: 'ptla_suW1wqLztnQUv7IRUnr9B395MQ7YFTcTmeHI4ThqiXv',
                    emailSuffix: 'antidonasi.web.id',
                    eggIds: {
                        nodejs: '15',
                        vps: '16',
                        python: '17'
                    }
                }
            }
            pterodactylAPI = new PterodactylAPI()
        })

        it('should resolve egg ID for nodejs product codes (a1, a2, a3, etc.)', () => {
            const productSpec = { name: 'NodeJS Kroco', ram: '1GB', cpu: '100%', eggId: 18 }
            
            expect(pterodactylAPI.resolveEggId(productSpec, 'a1')).toBe('15')
            expect(pterodactylAPI.resolveEggId(productSpec, 'a2')).toBe('15')
            expect(pterodactylAPI.resolveEggId(productSpec, 'a3')).toBe('15')
            expect(pterodactylAPI.resolveEggId(productSpec, 'a4')).toBe('15')
            expect(pterodactylAPI.resolveEggId(productSpec, 'a5')).toBe('15')
            expect(pterodactylAPI.resolveEggId(productSpec, 'a6')).toBe('15')
        })

        it('should resolve egg ID for vps product codes (b1, b2, b3, etc.)', () => {
            const productSpec = { name: 'VPS Kroco', ram: '1GB', cpu: '100%', eggId: 15 }
            
            expect(pterodactylAPI.resolveEggId(productSpec, 'b1')).toBe('16')
            expect(pterodactylAPI.resolveEggId(productSpec, 'b2')).toBe('16')
            expect(pterodactylAPI.resolveEggId(productSpec, 'b3')).toBe('16')
            expect(pterodactylAPI.resolveEggId(productSpec, 'b4')).toBe('16')
            expect(pterodactylAPI.resolveEggId(productSpec, 'b5')).toBe('16')
            expect(pterodactylAPI.resolveEggId(productSpec, 'b6')).toBe('16')
        })

        it('should resolve egg ID for python product codes (c1, c2, c3, etc.)', () => {
            const productSpec = { name: 'Python Kroco', ram: '1GB', cpu: '100%', eggId: 22 }
            
            expect(pterodactylAPI.resolveEggId(productSpec, 'c1')).toBe('17')
            expect(pterodactylAPI.resolveEggId(productSpec, 'c2')).toBe('17')
            expect(pterodactylAPI.resolveEggId(productSpec, 'c3')).toBe('17')
            expect(pterodactylAPI.resolveEggId(productSpec, 'c4')).toBe('17')
            expect(pterodactylAPI.resolveEggId(productSpec, 'c5')).toBe('17')
            expect(pterodactylAPI.resolveEggId(productSpec, 'c6')).toBe('17')
        })

        it('should handle uppercase product codes', () => {
            const productSpec = { name: 'NodeJS Kroco', ram: '1GB', cpu: '100%', eggId: 18 }
            
            expect(pterodactylAPI.resolveEggId(productSpec, 'A1')).toBe('15')
            expect(pterodactylAPI.resolveEggId(productSpec, 'B2')).toBe('16')
            expect(pterodactylAPI.resolveEggId(productSpec, 'C3')).toBe('17')
        })
    })

    describe('configuration override behavior', () => {
        it('should use configuration override when valid config exists', () => {
            globalThis.storeConfig = {
                pterodactyl: {
                    url: 'https://panel.example.com',
                    apiKey: 'test-api-key',
                    adminApiKey: 'test-admin-key',
                    emailSuffix: 'example.com',
                    eggIds: {
                        nodejs: '25',
                        vps: '26',
                        python: '27'
                    }
                }
            }
            pterodactylAPI = new PterodactylAPI()
            
            const productSpec = { name: 'NodeJS Kroco', ram: '1GB', cpu: '100%', eggId: 18 }
            
            expect(pterodactylAPI.resolveEggId(productSpec, 'a1')).toBe('25')
            expect(pterodactylAPI.resolveEggId(productSpec, 'b1')).toBe('26')
            expect(pterodactylAPI.resolveEggId(productSpec, 'c1')).toBe('27')
        })

        it('should handle numeric egg IDs in configuration', () => {
            globalThis.storeConfig = {
                pterodactyl: {
                    url: 'https://panel.example.com',
                    apiKey: 'test-api-key',
                    adminApiKey: 'test-admin-key',
                    emailSuffix: 'example.com',
                    eggIds: {
                        nodejs: 30,
                        vps: 31,
                        python: 32
                    }
                }
            }
            pterodactylAPI = new PterodactylAPI()
            
            const productSpec = { name: 'NodeJS Kroco', ram: '1GB', cpu: '100%', eggId: 18 }
            
            expect(pterodactylAPI.resolveEggId(productSpec, 'a1')).toBe('30')
            expect(pterodactylAPI.resolveEggId(productSpec, 'b1')).toBe('31')
            expect(pterodactylAPI.resolveEggId(productSpec, 'c1')).toBe('32')
        })

        it('should handle partial configuration (missing some product types)', () => {
            globalThis.storeConfig = {
                pterodactyl: {
                    url: 'https://panel.example.com',
                    apiKey: 'test-api-key',
                    adminApiKey: 'test-admin-key',
                    emailSuffix: 'example.com',
                    eggIds: {
                        nodejs: '15',
                        // vps missing
                        python: '17'
                    }
                }
            }
            pterodactylAPI = new PterodactylAPI()
            
            const productSpec = { name: 'VPS Kroco', ram: '1GB', cpu: '100%', eggId: 20 }
            
            // Should fall back to productSpec.eggId when config is missing for that type
            expect(pterodactylAPI.resolveEggId(productSpec, 'b1')).toBe('20')
        })
    })

    describe('fallback to productSpec.eggId when no configuration override exists', () => {
        beforeEach(() => {
            // Setup configuration without eggIds
            globalThis.storeConfig = {
                pterodactyl: {
                    url: 'https://panel.example.com',
                    apiKey: 'test-api-key',
                    adminApiKey: 'test-admin-key',
                    emailSuffix: 'example.com'
                    // No eggIds configuration
                }
            }
            pterodactylAPI = new PterodactylAPI()
        })

        it('should fall back to productSpec.eggId when no configuration exists', () => {
            const productSpec = { name: 'NodeJS Kroco', ram: '1GB', cpu: '100%', eggId: 18 }
            
            expect(pterodactylAPI.resolveEggId(productSpec, 'a1')).toBe('18')
        })

        it('should fall back to productSpec.eggId with string values', () => {
            const productSpec = { name: 'VPS Kroco', ram: '1GB', cpu: '100%', eggId: '20' }
            
            expect(pterodactylAPI.resolveEggId(productSpec, 'b1')).toBe('20')
        })

        it('should use default mapping when productSpec.eggId is missing', () => {
            const productSpec = { name: 'NodeJS Kroco', ram: '1GB', cpu: '100%' }
            
            expect(pterodactylAPI.resolveEggId(productSpec, 'a1')).toBe('18') // default nodejs
            expect(pterodactylAPI.resolveEggId(productSpec, 'b1')).toBe('15') // default vps
            expect(pterodactylAPI.resolveEggId(productSpec, 'c1')).toBe('22') // default python
        })

        it('should handle null or undefined productSpec', () => {
            expect(pterodactylAPI.resolveEggId(null, 'a1')).toBe('18') // default nodejs
            expect(pterodactylAPI.resolveEggId(undefined, 'b1')).toBe('15') // default vps
            expect(pterodactylAPI.resolveEggId({}, 'c1')).toBe('22') // default python
        })
    })

    describe('error handling with invalid product codes', () => {
        beforeEach(() => {
            globalThis.storeConfig = {
                pterodactyl: {
                    url: 'https://panel.example.com',
                    apiKey: 'test-api-key',
                    adminApiKey: 'test-admin-key',
                    emailSuffix: 'example.com',
                    eggIds: {
                        nodejs: '15',
                        vps: '16',
                        python: '17'
                    }
                }
            }
            pterodactylAPI = new PterodactylAPI()
        })

        it('should handle invalid product code formats', () => {
            const productSpec = { name: 'Test Product', ram: '1GB', cpu: '100%', eggId: 18 }
            
            // When product code is truly invalid (doesn't start with a, b, or c), it triggers fallback behavior
            // The fallback should use productSpec.eggId if valid
            const result1 = pterodactylAPI.resolveEggId(productSpec, 'x1')  // starts with x - invalid
            const result2 = pterodactylAPI.resolveEggId(productSpec, '1a')  // starts with number - invalid
            const result3 = pterodactylAPI.resolveEggId(productSpec, 'z99') // starts with z - invalid
            const result4 = pterodactylAPI.resolveEggId(productSpec, '123') // starts with number - invalid
            
            // All should use productSpec.eggId as fallback
            expect(result1).toBe('18')
            expect(result2).toBe('18')
            expect(result3).toBe('18')
            expect(result4).toBe('18')
        })

        it('should handle empty or null product codes', () => {
            const productSpec = { name: 'Test Product', ram: '1GB', cpu: '100%', eggId: 18 }
            
            expect(pterodactylAPI.resolveEggId(productSpec, '')).toBe('18') // fallback to productSpec
            expect(pterodactylAPI.resolveEggId(productSpec, null)).toBe('18') // fallback to productSpec
            expect(pterodactylAPI.resolveEggId(productSpec, undefined)).toBe('18') // fallback to productSpec
        })

        it('should handle non-string product codes', () => {
            const productSpec = { name: 'Test Product', ram: '1GB', cpu: '100%', eggId: 18 }
            
            expect(pterodactylAPI.resolveEggId(productSpec, 123)).toBe('18') // fallback to productSpec
            expect(pterodactylAPI.resolveEggId(productSpec, {})).toBe('18') // fallback to productSpec
            expect(pterodactylAPI.resolveEggId(productSpec, [])).toBe('18') // fallback to productSpec
        })

        it('should use ultimate fallback when both productCode and productSpec are invalid', () => {
            expect(pterodactylAPI.resolveEggId(null, 'x1')).toBe('15') // ultimate fallback
            expect(pterodactylAPI.resolveEggId({}, '')).toBe('15') // ultimate fallback
            expect(pterodactylAPI.resolveEggId(undefined, null)).toBe('15') // ultimate fallback
        })
    })

    describe('error handling with malformed configuration', () => {
        it('should handle missing globalThis.storeConfig', () => {
            delete globalThis.storeConfig
            
            // Constructor will fail, so we need to test the error handling differently
            expect(() => new PterodactylAPI()).toThrow()
        })

        it('should handle missing pterodactyl configuration', () => {
            globalThis.storeConfig = {
                // Missing pterodactyl config
                someOtherConfig: 'value'
            }
            
            // Constructor will fail, so we need to test the error handling differently
            expect(() => new PterodactylAPI()).toThrow()
        })

        it('should handle invalid eggIds configuration type', () => {
            globalThis.storeConfig = {
                pterodactyl: {
                    url: 'https://panel.example.com',
                    apiKey: 'test-api-key',
                    adminApiKey: 'test-admin-key',
                    emailSuffix: 'example.com',
                    eggIds: 'invalid-string' // Should be object
                }
            }
            pterodactylAPI = new PterodactylAPI()
            
            const productSpec = { name: 'NodeJS Kroco', ram: '1GB', cpu: '100%', eggId: 18 }
            
            expect(pterodactylAPI.resolveEggId(productSpec, 'a1')).toBe('18') // fallback to productSpec
        })

        it('should handle array instead of object for eggIds', () => {
            globalThis.storeConfig = {
                pterodactyl: {
                    url: 'https://panel.example.com',
                    apiKey: 'test-api-key',
                    adminApiKey: 'test-admin-key',
                    emailSuffix: 'example.com',
                    eggIds: ['15', '16', '17'] // Should be object
                }
            }
            pterodactylAPI = new PterodactylAPI()
            
            const productSpec = { name: 'NodeJS Kroco', ram: '1GB', cpu: '100%', eggId: 18 }
            
            expect(pterodactylAPI.resolveEggId(productSpec, 'a1')).toBe('18') // fallback to productSpec
        })

        it('should handle invalid egg ID values in configuration', () => {
            globalThis.storeConfig = {
                pterodactyl: {
                    url: 'https://panel.example.com',
                    apiKey: 'test-api-key',
                    adminApiKey: 'test-admin-key',
                    emailSuffix: 'example.com',
                    eggIds: {
                        nodejs: 'invalid-id', // Non-numeric
                        vps: -5, // Negative number
                        python: 0 // Zero
                    }
                }
            }
            pterodactylAPI = new PterodactylAPI()
            
            const productSpec = { name: 'NodeJS Kroco', ram: '1GB', cpu: '100%', eggId: 18 }
            
            expect(pterodactylAPI.resolveEggId(productSpec, 'a1')).toBe('18') // fallback to productSpec
            expect(pterodactylAPI.resolveEggId(productSpec, 'b1')).toBe('18') // fallback to productSpec
            expect(pterodactylAPI.resolveEggId(productSpec, 'c1')).toBe('18') // fallback to productSpec
        })

        it('should handle null/undefined values in eggIds configuration', () => {
            globalThis.storeConfig = {
                pterodactyl: {
                    url: 'https://panel.example.com',
                    apiKey: 'test-api-key',
                    adminApiKey: 'test-admin-key',
                    emailSuffix: 'example.com',
                    eggIds: {
                        nodejs: null,
                        vps: undefined,
                        python: '17'
                    }
                }
            }
            pterodactylAPI = new PterodactylAPI()
            
            const productSpec = { name: 'NodeJS Kroco', ram: '1GB', cpu: '100%', eggId: 18 }
            
            expect(pterodactylAPI.resolveEggId(productSpec, 'a1')).toBe('18') // fallback to productSpec
            expect(pterodactylAPI.resolveEggId(productSpec, 'b1')).toBe('18') // fallback to productSpec
            expect(pterodactylAPI.resolveEggId(productSpec, 'c1')).toBe('17') // valid config
        })

        it('should handle invalid productSpec.eggId values', () => {
            globalThis.storeConfig = {
                pterodactyl: {
                    url: 'https://panel.example.com',
                    apiKey: 'test-api-key',
                    adminApiKey: 'test-admin-key',
                    emailSuffix: 'example.com'
                    // No eggIds configuration
                }
            }
            pterodactylAPI = new PterodactylAPI()
            
            // Test with invalid productSpec.eggId values
            expect(pterodactylAPI.resolveEggId({ eggId: 'invalid' }, 'a1')).toBe('18') // default nodejs
            expect(pterodactylAPI.resolveEggId({ eggId: -5 }, 'b1')).toBe('15') // default vps
            expect(pterodactylAPI.resolveEggId({ eggId: 0 }, 'c1')).toBe('22') // default python
            expect(pterodactylAPI.resolveEggId({ eggId: null }, 'a1')).toBe('18') // default nodejs
        })
    })

    describe('getProductType helper method', () => {
        beforeEach(() => {
            globalThis.storeConfig = {
                pterodactyl: {
                    url: 'https://panel.example.com',
                    apiKey: 'test-api-key',
                    adminApiKey: 'test-admin-key',
                    emailSuffix: 'example.com'
                }
            }
            pterodactylAPI = new PterodactylAPI()
        })

        it('should correctly identify product types from codes', () => {
            expect(pterodactylAPI.getProductType('a1')).toBe('nodejs')
            expect(pterodactylAPI.getProductType('a2')).toBe('nodejs')
            expect(pterodactylAPI.getProductType('A1')).toBe('nodejs')
            
            expect(pterodactylAPI.getProductType('b1')).toBe('vps')
            expect(pterodactylAPI.getProductType('b2')).toBe('vps')
            expect(pterodactylAPI.getProductType('B1')).toBe('vps')
            
            expect(pterodactylAPI.getProductType('c1')).toBe('python')
            expect(pterodactylAPI.getProductType('c2')).toBe('python')
            expect(pterodactylAPI.getProductType('C1')).toBe('python')
        })

        it('should return null for invalid product codes', () => {
            expect(pterodactylAPI.getProductType('x1')).toBe(null)
            expect(pterodactylAPI.getProductType('1a')).toBe(null)
            expect(pterodactylAPI.getProductType('')).toBe(null)
            expect(pterodactylAPI.getProductType(null)).toBe(null)
            expect(pterodactylAPI.getProductType(undefined)).toBe(null)
            expect(pterodactylAPI.getProductType(123)).toBe(null)
        })
    })

    describe('getDefaultEggId helper method', () => {
        beforeEach(() => {
            globalThis.storeConfig = {
                pterodactyl: {
                    url: 'https://panel.example.com',
                    apiKey: 'test-api-key',
                    adminApiKey: 'test-admin-key',
                    emailSuffix: 'example.com'
                }
            }
            pterodactylAPI = new PterodactylAPI()
        })

        it('should return correct default egg IDs for each product type', () => {
            expect(pterodactylAPI.getDefaultEggId('a1')).toBe('18') // nodejs
            expect(pterodactylAPI.getDefaultEggId('b1')).toBe('15') // vps
            expect(pterodactylAPI.getDefaultEggId('c1')).toBe('22') // python
        })

        it('should return ultimate fallback for unknown product codes', () => {
            expect(pterodactylAPI.getDefaultEggId('x1')).toBe('15') // ultimate fallback
            expect(pterodactylAPI.getDefaultEggId('')).toBe('15') // ultimate fallback
            expect(pterodactylAPI.getDefaultEggId(null)).toBe('15') // ultimate fallback
        })
    })

    describe('configuration validation', () => {
        it('should validate correct configuration structure', () => {
            globalThis.storeConfig = {
                pterodactyl: {
                    url: 'https://panel.example.com',
                    apiKey: 'test-api-key',
                    adminApiKey: 'test-admin-key',
                    emailSuffix: 'example.com',
                    eggIds: {
                        nodejs: '15',
                        vps: '16',
                        python: '17'
                    }
                }
            }
            pterodactylAPI = new PterodactylAPI()
            
            expect(pterodactylAPI.configValidation.isValid).toBe(true)
            expect(pterodactylAPI.configValidation.configExists).toBe(true)
            expect(pterodactylAPI.configValidation.validProductTypes).toEqual(['nodejs', 'vps', 'python'])
        })

        it('should handle missing configuration gracefully', () => {
            globalThis.storeConfig = {
                pterodactyl: {
                    url: 'https://panel.example.com',
                    apiKey: 'test-api-key',
                    adminApiKey: 'test-admin-key',
                    emailSuffix: 'example.com'
                    // No eggIds
                }
            }
            pterodactylAPI = new PterodactylAPI()
            
            expect(pterodactylAPI.configValidation.isValid).toBe(true)
            expect(pterodactylAPI.configValidation.configExists).toBe(false)
        })

        it('should detect invalid configuration', () => {
            globalThis.storeConfig = {
                pterodactyl: {
                    url: 'https://panel.example.com',
                    apiKey: 'test-api-key',
                    adminApiKey: 'test-admin-key',
                    emailSuffix: 'example.com',
                    eggIds: {
                        nodejs: 'invalid',
                        vps: -5,
                        python: '17'
                    }
                }
            }
            pterodactylAPI = new PterodactylAPI()
            
            expect(pterodactylAPI.configValidation.isValid).toBe(false)
            expect(pterodactylAPI.configValidation.errors.length).toBeGreaterThan(0)
        })
    })

    describe('edge cases and comprehensive error handling', () => {
        beforeEach(() => {
            globalThis.storeConfig = {
                pterodactyl: {
                    url: 'https://panel.example.com',
                    apiKey: 'test-api-key',
                    adminApiKey: 'test-admin-key',
                    emailSuffix: 'example.com',
                    eggIds: {
                        nodejs: '15',
                        vps: '16',
                        python: '17'
                    }
                }
            }
            pterodactylAPI = new PterodactylAPI()
        })

        it('should handle mixed case product codes correctly', () => {
            const productSpec = { name: 'NodeJS Kroco', ram: '1GB', cpu: '100%', eggId: 18 }
            
            expect(pterodactylAPI.resolveEggId(productSpec, 'A1')).toBe('15')
            expect(pterodactylAPI.resolveEggId(productSpec, 'B1')).toBe('16')
            expect(pterodactylAPI.resolveEggId(productSpec, 'C1')).toBe('17')
            expect(pterodactylAPI.resolveEggId(productSpec, 'a1')).toBe('15')
            expect(pterodactylAPI.resolveEggId(productSpec, 'b1')).toBe('16')
            expect(pterodactylAPI.resolveEggId(productSpec, 'c1')).toBe('17')
        })

        it('should handle product codes with various suffixes', () => {
            const productSpec = { name: 'Test Product', ram: '1GB', cpu: '100%', eggId: 18 }
            
            // All these should be treated as valid product codes since they start with a, b, or c
            expect(pterodactylAPI.resolveEggId(productSpec, 'a123')).toBe('15') // nodejs
            expect(pterodactylAPI.resolveEggId(productSpec, 'btest')).toBe('16') // vps
            expect(pterodactylAPI.resolveEggId(productSpec, 'cxyz')).toBe('17') // python
            expect(pterodactylAPI.resolveEggId(productSpec, 'a_special')).toBe('15') // nodejs
        })

        it('should handle zero and negative egg IDs in productSpec', () => {
            globalThis.storeConfig = {
                pterodactyl: {
                    url: 'https://panel.example.com',
                    apiKey: 'test-api-key',
                    adminApiKey: 'test-admin-key',
                    emailSuffix: 'example.com'
                    // No eggIds configuration
                }
            }
            pterodactylAPI = new PterodactylAPI()
            
            // These should fall back to default mapping since productSpec.eggId is invalid
            expect(pterodactylAPI.resolveEggId({ eggId: 0 }, 'a1')).toBe('18') // default nodejs
            expect(pterodactylAPI.resolveEggId({ eggId: -1 }, 'b1')).toBe('15') // default vps
            expect(pterodactylAPI.resolveEggId({ eggId: 'abc' }, 'c1')).toBe('22') // default python
        })

        it('should handle extremely long product codes', () => {
            const productSpec = { name: 'Test Product', ram: '1GB', cpu: '100%', eggId: 18 }
            const longProductCode = 'a' + 'x'.repeat(1000) // Very long product code starting with 'a'
            
            expect(pterodactylAPI.resolveEggId(productSpec, longProductCode)).toBe('15') // should still detect as nodejs
        })

        it('should handle special characters in product codes', () => {
            const productSpec = { name: 'Test Product', ram: '1GB', cpu: '100%', eggId: 18 }
            
            // These should still be detected based on first character
            expect(pterodactylAPI.resolveEggId(productSpec, 'a@#$')).toBe('15') // nodejs
            expect(pterodactylAPI.resolveEggId(productSpec, 'b!@#')).toBe('16') // vps
            expect(pterodactylAPI.resolveEggId(productSpec, 'c%^&')).toBe('17') // python
        })
    })

    describe('Helper Methods - getDockerImage, getStartupCommand, getEnvironmentVariables', () => {
        beforeEach(() => {
            globalThis.storeConfig = {
                pterodactyl: {
                    url: 'https://panel.example.com',
                    apiKey: 'test-api-key',
                    adminApiKey: 'test-admin-key',
                    emailSuffix: 'example.com',
                    eggIds: {
                        nodejs: '15',
                        vps: '16',
                        python: '17'
                    }
                }
            }
            pterodactylAPI = new PterodactylAPI()
        })

        describe('getDockerImage method', () => {
            it('should return correct Docker images for new egg IDs', () => {
                expect(pterodactylAPI.getDockerImage(15)).toBe('ghcr.io/parkervcp/yolks:nodejs_18') // NodeJS
                expect(pterodactylAPI.getDockerImage(16)).toBe('ghcr.io/parkervcp/yolks:ubuntu') // VPS
                expect(pterodactylAPI.getDockerImage(17)).toBe('ghcr.io/parkervcp/yolks:python_3.11') // Python
            })

            it('should maintain backward compatibility with existing egg IDs', () => {
                expect(pterodactylAPI.getDockerImage(18)).toBe('ghcr.io/parkervcp/yolks:nodejs_18') // NodeJS (legacy)
                expect(pterodactylAPI.getDockerImage(22)).toBe('ghcr.io/parkervcp/yolks:python_3.11') // Python (legacy)
            })

            it('should return default Ubuntu image for unknown egg IDs', () => {
                expect(pterodactylAPI.getDockerImage(999)).toBe('ghcr.io/parkervcp/yolks:ubuntu')
                expect(pterodactylAPI.getDockerImage(0)).toBe('ghcr.io/parkervcp/yolks:ubuntu')
                expect(pterodactylAPI.getDockerImage(-1)).toBe('ghcr.io/parkervcp/yolks:ubuntu')
            })

            it('should handle string egg IDs', () => {
                expect(pterodactylAPI.getDockerImage('15')).toBe('ghcr.io/parkervcp/yolks:nodejs_18')
                expect(pterodactylAPI.getDockerImage('16')).toBe('ghcr.io/parkervcp/yolks:ubuntu')
                expect(pterodactylAPI.getDockerImage('17')).toBe('ghcr.io/parkervcp/yolks:python_3.11')
            })

            it('should handle invalid egg ID types', () => {
                expect(pterodactylAPI.getDockerImage(null)).toBe('ghcr.io/parkervcp/yolks:ubuntu')
                expect(pterodactylAPI.getDockerImage(undefined)).toBe('ghcr.io/parkervcp/yolks:ubuntu')
                expect(pterodactylAPI.getDockerImage('invalid')).toBe('ghcr.io/parkervcp/yolks:ubuntu')
                expect(pterodactylAPI.getDockerImage({})).toBe('ghcr.io/parkervcp/yolks:ubuntu')
            })
        })

        describe('getStartupCommand method', () => {
            it('should return correct startup commands for new egg IDs', () => {
                expect(pterodactylAPI.getStartupCommand(15)).toBe('npm start') // NodeJS
                expect(pterodactylAPI.getStartupCommand(16)).toBe('/bin/bash') // VPS
                expect(pterodactylAPI.getStartupCommand(17)).toBe('python main.py') // Python
            })

            it('should maintain backward compatibility with existing egg IDs', () => {
                expect(pterodactylAPI.getStartupCommand(18)).toBe('npm start') // NodeJS (legacy)
                expect(pterodactylAPI.getStartupCommand(22)).toBe('python main.py') // Python (legacy)
            })

            it('should return default bash command for unknown egg IDs', () => {
                expect(pterodactylAPI.getStartupCommand(999)).toBe('/bin/bash')
                expect(pterodactylAPI.getStartupCommand(0)).toBe('/bin/bash')
                expect(pterodactylAPI.getStartupCommand(-1)).toBe('/bin/bash')
            })

            it('should handle string egg IDs', () => {
                expect(pterodactylAPI.getStartupCommand('15')).toBe('npm start')
                expect(pterodactylAPI.getStartupCommand('16')).toBe('/bin/bash')
                expect(pterodactylAPI.getStartupCommand('17')).toBe('python main.py')
            })

            it('should handle invalid egg ID types', () => {
                expect(pterodactylAPI.getStartupCommand(null)).toBe('/bin/bash')
                expect(pterodactylAPI.getStartupCommand(undefined)).toBe('/bin/bash')
                expect(pterodactylAPI.getStartupCommand('invalid')).toBe('/bin/bash')
                expect(pterodactylAPI.getStartupCommand({})).toBe('/bin/bash')
            })
        })

        describe('getEnvironmentVariables method', () => {
            it('should return correct environment variables for new egg IDs', () => {
                // NodeJS
                const nodejsEnv = pterodactylAPI.getEnvironmentVariables(15)
                expect(nodejsEnv).toEqual({
                    "NODE_VERSION": "18",
                    "MAIN_FILE": "index.js"
                })

                // VPS (empty environment)
                const vpsEnv = pterodactylAPI.getEnvironmentVariables(16)
                expect(vpsEnv).toEqual({})

                // Python
                const pythonEnv = pterodactylAPI.getEnvironmentVariables(17)
                expect(pythonEnv).toEqual({
                    "PYTHON_VERSION": "3.11",
                    "MAIN_FILE": "main.py"
                })
            })

            it('should maintain backward compatibility with existing egg IDs', () => {
                // NodeJS (legacy)
                const nodejsLegacyEnv = pterodactylAPI.getEnvironmentVariables(18)
                expect(nodejsLegacyEnv).toEqual({
                    "NODE_VERSION": "18",
                    "MAIN_FILE": "index.js"
                })

                // Python (legacy)
                const pythonLegacyEnv = pterodactylAPI.getEnvironmentVariables(22)
                expect(pythonLegacyEnv).toEqual({
                    "PYTHON_VERSION": "3.11",
                    "MAIN_FILE": "main.py"
                })
            })

            it('should return empty object for unknown egg IDs', () => {
                expect(pterodactylAPI.getEnvironmentVariables(999)).toEqual({})
                expect(pterodactylAPI.getEnvironmentVariables(0)).toEqual({})
                expect(pterodactylAPI.getEnvironmentVariables(-1)).toEqual({})
            })

            it('should handle string egg IDs', () => {
                const nodejsEnv = pterodactylAPI.getEnvironmentVariables('15')
                expect(nodejsEnv).toEqual({
                    "NODE_VERSION": "18",
                    "MAIN_FILE": "index.js"
                })

                const vpsEnv = pterodactylAPI.getEnvironmentVariables('16')
                expect(vpsEnv).toEqual({})

                const pythonEnv = pterodactylAPI.getEnvironmentVariables('17')
                expect(pythonEnv).toEqual({
                    "PYTHON_VERSION": "3.11",
                    "MAIN_FILE": "main.py"
                })
            })

            it('should handle invalid egg ID types', () => {
                expect(pterodactylAPI.getEnvironmentVariables(null)).toEqual({})
                expect(pterodactylAPI.getEnvironmentVariables(undefined)).toEqual({})
                expect(pterodactylAPI.getEnvironmentVariables('invalid')).toEqual({})
                expect(pterodactylAPI.getEnvironmentVariables({})).toEqual({})
            })

            it('should return objects that can be safely modified', () => {
                const env1 = pterodactylAPI.getEnvironmentVariables(15)
                const env2 = pterodactylAPI.getEnvironmentVariables(15)
                
                // Modify one environment object
                env1.CUSTOM_VAR = 'test'
                
                // Should not affect the other
                expect(env2.CUSTOM_VAR).toBeUndefined()
                expect(env2).toEqual({
                    "NODE_VERSION": "18",
                    "MAIN_FILE": "index.js"
                })
            })
        })

        describe('Product type mapping verification', () => {
            it('should correctly map NodeJS products to appropriate Docker images', () => {
                const productSpec = { name: 'NodeJS Kroco', ram: '1GB', cpu: '100%', eggId: 18 }
                const resolvedEggId = pterodactylAPI.resolveEggId(productSpec, 'a1')
                const dockerImage = pterodactylAPI.getDockerImage(resolvedEggId)
                
                expect(resolvedEggId).toBe('15') // Configured NodeJS egg ID
                expect(dockerImage).toBe('ghcr.io/parkervcp/yolks:nodejs_18')
            })

            it('should correctly map VPS products to appropriate Docker images', () => {
                const productSpec = { name: 'VPS Kroco', ram: '1GB', cpu: '100%', eggId: 15 }
                const resolvedEggId = pterodactylAPI.resolveEggId(productSpec, 'b1')
                const dockerImage = pterodactylAPI.getDockerImage(resolvedEggId)
                
                expect(resolvedEggId).toBe('16') // Configured VPS egg ID
                expect(dockerImage).toBe('ghcr.io/parkervcp/yolks:ubuntu')
            })

            it('should correctly map Python products to appropriate Docker images', () => {
                const productSpec = { name: 'Python Kroco', ram: '1GB', cpu: '100%', eggId: 22 }
                const resolvedEggId = pterodactylAPI.resolveEggId(productSpec, 'c1')
                const dockerImage = pterodactylAPI.getDockerImage(resolvedEggId)
                
                expect(resolvedEggId).toBe('17') // Configured Python egg ID
                expect(dockerImage).toBe('ghcr.io/parkervcp/yolks:python_3.11')
            })

            it('should correctly map NodeJS products to appropriate startup commands', () => {
                const productSpec = { name: 'NodeJS Kroco', ram: '1GB', cpu: '100%', eggId: 18 }
                const resolvedEggId = pterodactylAPI.resolveEggId(productSpec, 'a1')
                const startupCommand = pterodactylAPI.getStartupCommand(resolvedEggId)
                
                expect(resolvedEggId).toBe('15') // Configured NodeJS egg ID
                expect(startupCommand).toBe('npm start')
            })

            it('should correctly map VPS products to appropriate startup commands', () => {
                const productSpec = { name: 'VPS Kroco', ram: '1GB', cpu: '100%', eggId: 15 }
                const resolvedEggId = pterodactylAPI.resolveEggId(productSpec, 'b1')
                const startupCommand = pterodactylAPI.getStartupCommand(resolvedEggId)
                
                expect(resolvedEggId).toBe('16') // Configured VPS egg ID
                expect(startupCommand).toBe('/bin/bash')
            })

            it('should correctly map Python products to appropriate startup commands', () => {
                const productSpec = { name: 'Python Kroco', ram: '1GB', cpu: '100%', eggId: 22 }
                const resolvedEggId = pterodactylAPI.resolveEggId(productSpec, 'c1')
                const startupCommand = pterodactylAPI.getStartupCommand(resolvedEggId)
                
                expect(resolvedEggId).toBe('17') // Configured Python egg ID
                expect(startupCommand).toBe('python main.py')
            })

            it('should correctly map NodeJS products to appropriate environment variables', () => {
                const productSpec = { name: 'NodeJS Kroco', ram: '1GB', cpu: '100%', eggId: 18 }
                const resolvedEggId = pterodactylAPI.resolveEggId(productSpec, 'a1')
                const envVars = pterodactylAPI.getEnvironmentVariables(resolvedEggId)
                
                expect(resolvedEggId).toBe('15') // Configured NodeJS egg ID
                expect(envVars).toEqual({
                    "NODE_VERSION": "18",
                    "MAIN_FILE": "index.js"
                })
            })

            it('should correctly map VPS products to appropriate environment variables', () => {
                const productSpec = { name: 'VPS Kroco', ram: '1GB', cpu: '100%', eggId: 15 }
                const resolvedEggId = pterodactylAPI.resolveEggId(productSpec, 'b1')
                const envVars = pterodactylAPI.getEnvironmentVariables(resolvedEggId)
                
                expect(resolvedEggId).toBe('16') // Configured VPS egg ID
                expect(envVars).toEqual({}) // VPS has empty environment
            })

            it('should correctly map Python products to appropriate environment variables', () => {
                const productSpec = { name: 'Python Kroco', ram: '1GB', cpu: '100%', eggId: 22 }
                const resolvedEggId = pterodactylAPI.resolveEggId(productSpec, 'c1')
                const envVars = pterodactylAPI.getEnvironmentVariables(resolvedEggId)
                
                expect(resolvedEggId).toBe('17') // Configured Python egg ID
                expect(envVars).toEqual({
                    "PYTHON_VERSION": "3.11",
                    "MAIN_FILE": "main.py"
                })
            })
        })

        describe('Fallback behavior for helper methods', () => {
            beforeEach(() => {
                // Setup configuration without eggIds to test fallback behavior
                globalThis.storeConfig = {
                    pterodactyl: {
                        url: 'https://panel.example.com',
                        apiKey: 'test-api-key',
                        adminApiKey: 'test-admin-key',
                        emailSuffix: 'example.com'
                        // No eggIds configuration
                    }
                }
                pterodactylAPI = new PterodactylAPI()
            })

            it('should use fallback egg IDs with correct Docker images', () => {
                // Test NodeJS fallback (should use default egg ID 18)
                const productSpec = { name: 'NodeJS Kroco', ram: '1GB', cpu: '100%', eggId: 18 }
                const resolvedEggId = pterodactylAPI.resolveEggId(productSpec, 'a1')
                const dockerImage = pterodactylAPI.getDockerImage(resolvedEggId)
                
                expect(resolvedEggId).toBe('18') // Fallback to productSpec.eggId
                expect(dockerImage).toBe('ghcr.io/parkervcp/yolks:nodejs_18')
            })

            it('should use fallback egg IDs with correct startup commands', () => {
                // Test Python fallback (should use default egg ID 22)
                const productSpec = { name: 'Python Kroco', ram: '1GB', cpu: '100%', eggId: 22 }
                const resolvedEggId = pterodactylAPI.resolveEggId(productSpec, 'c1')
                const startupCommand = pterodactylAPI.getStartupCommand(resolvedEggId)
                
                expect(resolvedEggId).toBe('22') // Fallback to productSpec.eggId
                expect(startupCommand).toBe('python main.py')
            })

            it('should use fallback egg IDs with correct environment variables', () => {
                // Test VPS fallback (should use default egg ID 15)
                const productSpec = { name: 'VPS Kroco', ram: '1GB', cpu: '100%', eggId: 15 }
                const resolvedEggId = pterodactylAPI.resolveEggId(productSpec, 'b1')
                const envVars = pterodactylAPI.getEnvironmentVariables(resolvedEggId)
                
                expect(resolvedEggId).toBe('15') // Fallback to productSpec.eggId
                expect(envVars).toEqual({}) // VPS has empty environment (but this is legacy VPS egg ID)
            })

            it('should use default mapping when productSpec.eggId is missing', () => {
                // Test with missing productSpec.eggId - should use default mapping
                const productSpec = { name: 'NodeJS Kroco', ram: '1GB', cpu: '100%' }
                const resolvedEggId = pterodactylAPI.resolveEggId(productSpec, 'a1')
                const dockerImage = pterodactylAPI.getDockerImage(resolvedEggId)
                const startupCommand = pterodactylAPI.getStartupCommand(resolvedEggId)
                const envVars = pterodactylAPI.getEnvironmentVariables(resolvedEggId)
                
                expect(resolvedEggId).toBe('18') // Default NodeJS egg ID
                expect(dockerImage).toBe('ghcr.io/parkervcp/yolks:nodejs_18')
                expect(startupCommand).toBe('npm start')
                expect(envVars).toEqual({
                    "NODE_VERSION": "18",
                    "MAIN_FILE": "index.js"
                })
            })
        })

        describe('Edge cases for helper methods', () => {
            beforeEach(() => {
                globalThis.storeConfig = {
                    pterodactyl: {
                        url: 'https://panel.example.com',
                        apiKey: 'test-api-key',
                        adminApiKey: 'test-admin-key',
                        emailSuffix: 'example.com',
                        eggIds: {
                            nodejs: '15',
                            vps: '16',
                            python: '17'
                        }
                    }
                }
                pterodactylAPI = new PterodactylAPI()
            })

            it('should handle numeric egg IDs consistently', () => {
                // Test that both string and numeric egg IDs work the same
                expect(pterodactylAPI.getDockerImage(15)).toBe(pterodactylAPI.getDockerImage('15'))
                expect(pterodactylAPI.getStartupCommand(16)).toBe(pterodactylAPI.getStartupCommand('16'))
                expect(pterodactylAPI.getEnvironmentVariables(17)).toEqual(pterodactylAPI.getEnvironmentVariables('17'))
            })

            it('should handle floating point egg IDs', () => {
                // Should treat as unknown and use defaults
                expect(pterodactylAPI.getDockerImage(15.5)).toBe('ghcr.io/parkervcp/yolks:ubuntu')
                expect(pterodactylAPI.getStartupCommand(16.7)).toBe('/bin/bash')
                expect(pterodactylAPI.getEnvironmentVariables(17.9)).toEqual({})
            })

            it('should handle very large egg IDs', () => {
                const largeEggId = 999999999
                expect(pterodactylAPI.getDockerImage(largeEggId)).toBe('ghcr.io/parkervcp/yolks:ubuntu')
                expect(pterodactylAPI.getStartupCommand(largeEggId)).toBe('/bin/bash')
                expect(pterodactylAPI.getEnvironmentVariables(largeEggId)).toEqual({})
            })

            it('should handle boolean egg IDs', () => {
                expect(pterodactylAPI.getDockerImage(true)).toBe('ghcr.io/parkervcp/yolks:ubuntu')
                expect(pterodactylAPI.getStartupCommand(false)).toBe('/bin/bash')
                expect(pterodactylAPI.getEnvironmentVariables(true)).toEqual({})
            })
        })
    })
})