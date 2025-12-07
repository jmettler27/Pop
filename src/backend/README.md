# Backend Structure

This directory contains the backend implementation of the application. The structure is organized as follows:

## Directory Structure

- `firebase/` - Firebase configuration and related services
- `repositories/` - Data access layer for interacting with the database
- `services/` - Business logic layer containing service implementations
  - `game/` - Game-related services (GameService, ScoreService, etc.)
  - `timer/` - Timer-related services
  - `sound/` - Sound-related services
  - `question/` - Question-related services
  - `user/` - User-related services
  - `round/` - Round-related services
- `game/` - Game-specific logic and components
- `models/` - Data models and schemas
- `utils/` - Utility functions and helpers
  - `string.js` - String manipulation utilities
  - `object.js` - Object manipulation utilities
- `config/` - Configuration files and environment variables
- `errors/` - Custom error classes
- `constants/` - Application-wide constants
- `tests/` - Test files organized by domain
  - `game/` - Game-related tests
  - `timer/` - Timer-related tests
  - `sound/` - Sound-related tests
  - `question/` - Question-related tests
  - `user/` - User-related tests
  - `round/` - Round-related tests
  - `utils/` - Utility function tests

## Architecture

The backend follows a layered architecture:

1. **Models Layer** (`models/`)
   - Defines the data structures and schemas
   - Contains domain models and their relationships

2. **Services Layer** (`services/`)
   - Implements business logic
   - Organized by domain (game, timer, sound, etc.)
   - Handles complex operations and workflows

3. **Repositories Layer** (`repositories/`)
   - Handles data persistence
   - Abstracts database operations
   - Provides a clean interface for data access

4. **Utilities** (`utils/`)
   - Common helper functions
   - Shared utilities across the application
   - Reusable code components

5. **Configuration** (`config/`)
   - Environment variables
   - Application settings
   - Service configurations

6. **Error Handling** (`errors/`)
   - Custom error classes
   - Domain-specific error types
   - Error codes and messages

7. **Testing** (`tests/`)
   - Unit tests organized by domain
   - Test utilities and helpers
   - Mock implementations

## Best Practices

1. Keep services focused on single responsibilities
2. Use repositories for all database operations
3. Keep models clean and focused on data structure
4. Use utils for shared functionality
5. Document complex operations and business logic
6. Write tests for all new functionality
7. Use environment variables for configuration
8. Handle errors appropriately with custom error classes 