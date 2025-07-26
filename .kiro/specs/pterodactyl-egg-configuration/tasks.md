# Implementation Plan

- [x] 1. Add egg ID resolution method to PterodactylAPI class





  - Create `resolveEggId(productSpec, productCode)` method that checks configuration overrides
  - Implement product type detection from product code (a=nodejs, b=vps, c=python)
  - Add fallback logic: config override → productSpec.eggId → default mapping
  - Include error handling and logging for missing configuration
  - _Requirements: 1.1, 1.4, 1.5, 2.1, 2.3_

- [x] 2. Update createServer method to use resolved egg IDs





  - Modify `createServer` method to call `resolveEggId` before using egg ID
  - Pass resolved egg ID to Docker image, startup command, and environment methods
  - Ensure backward compatibility with existing productSpec.eggId usage
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Update Docker image mapping for new egg IDs





  - Modify `getDockerImage` method to handle new egg IDs (15=nodejs, 16=vps, 17=python)
  - Keep existing mappings as fallback for backward compatibility
  - Add logging for unknown egg IDs using default Ubuntu image
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Update startup command mapping for new egg IDs  





  - Modify `getStartupCommand` method to handle new egg IDs (15=npm start, 16=/bin/bash, 17=python main.py)
  - Keep existing mappings as fallback for backward compatibility
  - Add logging for unknown egg IDs using default bash command
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Update environment variables mapping for new egg IDs





  - Modify `getEnvironmentVariables` method to handle new egg IDs
  - Set appropriate NODE_VERSION for nodejs (15), empty for vps (16), PYTHON_VERSION for python (17)
  - Keep existing mappings as fallback for backward compatibility
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 6. Add configuration validation and error handling





  - Create method to validate egg ID configuration structure
  - Add comprehensive error handling for missing or invalid configuration
  - Implement logging for configuration resolution steps
  - Add fallback behavior when configuration is completely missing
  - _Requirements: 2.2, 2.3_


- [x] 7. Write unit tests for egg ID resolution



  - Test `resolveEggId` method with various product codes (a1, b2, c3, etc.)
  - Test configuration override behavior with valid and missing config
  - Test fallback to productSpec.eggId when no configuration override exists
  - Test error handling with invalid product codes and malformed configuration
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3_


- [ ] 8. Write unit tests for updated helper methods



  - Test `getDockerImage`, `getStartupCommand`, and `getEnvironmentVariables` with new egg IDs
  - Test backward compatibility with existing egg IDs (15, 18, 22)
  - Test fallback behavior for unknown egg IDs
  - Verify correct mappings for each product type
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 9. Integration test with complete server creation flow

  - Test complete `createServer` flow with configured egg IDs
  - Test with different product types (nodejs, vps, python) and tiers
  - Verify that resolved egg IDs are correctly passed to Pterodactyl API
  - Test error scenarios and ensure graceful degradation
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 3.1, 3.2, 3.3_