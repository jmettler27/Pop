# Backend Structure

This directory contains the backend implementation of the application. The structure is organized as follows:

## Directory Structure

- `config/` - Configuration files and environment variables
- `errors/` - Custom error classes
- `firebase/` - Firebase configuration and related services
- `repositories/` - Data access layer for interacting with the database
- `services/` - Business logic layer containing service implementations
  - `game/` - Game-related services (GameService, ScoreService, etc.)
  - `timer/` - Timer-related services
  - `sound/` - Sound-related services
  - `question/` - Question-related services
  - `user/` - User-related services
  - `round/` - Round-related services
