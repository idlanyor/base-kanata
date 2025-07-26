# Design Document

## Overview

This design improves the Pterodactyl API helper to dynamically resolve egg IDs from configuration instead of using hardcoded values. The current implementation has static mappings for egg IDs (15, 18, 22) but should reference the actual configuration values for different package types and tiers.

## Architecture

The solution involves modifying the `PterodactylAPI` class to:
1. Add a configuration-based egg ID resolver
2. Update the Docker image, startup command, and environment variable mappings to use the new egg IDs
3. Maintain backward compatibility with existing product specifications

## Components and Interfaces

### 1. Configuration Structure

The system works with the existing product catalog structure:
```javascript
globalThis.products = {
    nodejs: {
        a1: { name: "NodeJS Kroco", ram: "1GB", cpu: "100%", price: 5000, nodeId: 1, eggId: 18 },
        a2: { name: "NodeJS Karbit", ram: "2GB", cpu: "150%", price: 7500, nodeId: 1, eggId: 18 },
        // ... more nodejs products
    },
    vps: {
        b1: { name: "VPS Kroco", ram: "1GB", cpu: "100%", price: 7500, nodeId: 1, eggId: 15 },
        b2: { name: "VPS Karbit", ram: "2GB", cpu: "150%", price: 10000, nodeId: 1, eggId: 15 },
        // ... more vps products
    },
    python: {
        c1: { name: "Python Kroco", ram: "1GB", cpu: "100%", price: 3000, nodeId: 1, eggId: 22 },
        c2: { name: "Python Karbit", ram: "1GB", cpu: "150%", price: 5000, nodeId: 1, eggId: 22 },
        // ... more python products
    }
}
```

And the new egg ID configuration to override defaults:
```javascript
globalThis.storeConfig = {
    pterodactyl: {
        // existing config...
        eggIds: {
            nodejs: "15", // NODEJS_A_EGG_ID (all nodejs products use this)
            vps: "16",    // VPS_A_EGG_ID (all vps products use this)  
            python: "17"  // PYTHON_A_EGG_ID (all python products use this)
        }
    }
}
```

### 2. Egg ID Resolution Method

New method `resolveEggId(productSpec, productCode)`:
- Input: Product specification object and product code (e.g., "a1", "b1", "c1")
- Output: Resolved egg ID from configuration or product specification
- Logic: 
  1. Check if `globalThis.storeConfig.pterodactyl.eggIds` has override for product type
  2. Fall back to `productSpec.eggId` if no override
  3. Use default mapping based on product code pattern as last resort

### 3. Updated Helper Methods

Modify existing methods to use resolved egg IDs:
- `getDockerImage(eggId)` - Updated mappings for new egg IDs
- `getStartupCommand(eggId)` - Updated mappings for new egg IDs  
- `getEnvironmentVariables(eggId)` - Updated mappings for new egg IDs

## Data Models

### Product Code Structure
```
Format: [letter][number]
Examples:
- a1, a2, a3, a4, a5, a6 = NodeJS packages (Kroco, Karbit, Standar, Sepuh, Suhu, Pro Max)
- b1, b2, b3, b4, b5, b6 = VPS packages (Kroco, Karbit, Standar, Sepuh, Suhu, Pro Max)
- c1, c2, c3, c4, c5, c6 = Python packages (Kroco, Karbit, Standar, Sepuh, Suhu, Pro Max)
```

### Product Type Detection
```javascript
function getProductType(productCode) {
  if (productCode.startsWith('a')) return 'nodejs';
  if (productCode.startsWith('b')) return 'vps';
  if (productCode.startsWith('c')) return 'python';
  return null;
}
```

### Egg Configuration Mapping
```javascript
{
  productType: "nodejs" | "vps" | "python",
  configuredEggId: string,
  defaultEggId: string,
  resolvedEggId: string
}
```

## Error Handling

### Configuration Missing
- Log warning when egg configuration is not found
- Fall back to product specification eggId if available
- Use default egg ID (15 for VPS/Ubuntu) as last resort

### Invalid Product Code
- Log error for unrecognized product code format
- Return fallback egg ID or default
- Continue processing to avoid breaking server creation

### Egg ID Resolution Failure
- Log detailed error information
- Use safe defaults based on product type detection
- Ensure server creation doesn't fail completely

## Testing Strategy

### Unit Tests
1. Test `resolveEggId()` with various product codes
2. Test configuration lookup with missing/invalid data
3. Test fallback behavior for each scenario
4. Test Docker image/command mapping with new egg IDs

### Integration Tests  
1. Test complete server creation flow with configured egg IDs
2. Test backward compatibility with existing product specifications
3. Test error handling with malformed configuration
4. Test with real Pterodactyl API (if available)

### Configuration Tests
1. Verify configuration structure matches expected format
2. Test with different egg ID values
3. Test with missing configuration sections
4. Test environment variable resolution

## Implementation Notes

### Backward Compatibility
- Existing `productSpec.eggId` should still work if present
- Configuration-based resolution is additive, not replacing
- Default mappings remain as fallback

### Performance Considerations
- Configuration lookup should be cached if accessed frequently
- Avoid repeated parsing of product codes
- Log configuration resolution for debugging

### Security Considerations
- Validate egg IDs are numeric strings
- Sanitize product codes to prevent injection
- Log configuration access for audit trail