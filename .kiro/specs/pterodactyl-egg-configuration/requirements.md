# Requirements Document

## Introduction

This feature improves the Pterodactyl API helper to dynamically use the correct egg IDs based on product configuration instead of hardcoded values. The current implementation uses static egg IDs (15, 18, 22) but should reference the actual egg IDs from the global configuration for NodeJS, VPS, and Python packages.

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want the Pterodactyl server creation to use the correct egg IDs from configuration, so that servers are created with the proper environment setup.

#### Acceptance Criteria

1. WHEN creating a NodeJS server THEN the system SHALL use the egg ID from NODEJS_A_EGG_ID, NODEJS_B_EGG_ID, or NODEJS_C_EGG_ID configuration
2. WHEN creating a VPS server THEN the system SHALL use the egg ID from VPS_A_EGG_ID, VPS_B_EGG_ID, or VPS_C_EGG_ID configuration  
3. WHEN creating a Python server THEN the system SHALL use the egg ID from PYTHON_A_EGG_ID, PYTHON_B_EGG_ID, or PYTHON_C_EGG_ID configuration
4. WHEN a product specification contains an eggId THEN the system SHALL use that eggId for server creation
5. IF no matching egg configuration is found THEN the system SHALL fall back to a default egg ID

### Requirement 2

**User Story:** As a developer, I want the egg ID mapping to be maintainable through configuration, so that I can easily update egg IDs without modifying code.

#### Acceptance Criteria

1. WHEN the system needs an egg ID THEN it SHALL retrieve the value from globalThis.storeConfig or environment variables
2. WHEN multiple package tiers exist for the same type THEN the system SHALL correctly map to the appropriate egg ID based on product code
3. IF the configuration is missing or invalid THEN the system SHALL log an error and use a safe default

### Requirement 3

**User Story:** As a system administrator, I want Docker images and startup commands to match the configured egg IDs, so that servers start with the correct environment.

#### Acceptance Criteria

1. WHEN using egg ID 15 THEN the system SHALL use the NodeJS Docker image and startup command
2. WHEN using egg ID 16 THEN the system SHALL use the VPS Docker image and startup command
3. WHEN using egg ID 17 THEN the system SHALL use the Python Docker image and startup command
4. WHEN an unknown egg ID is encountered THEN the system SHALL use default Ubuntu image and bash startup