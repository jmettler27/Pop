import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  // Firebase Configuration
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  },

  // Game Configuration
  game: {
    maxPlayers: parseInt(process.env.MAX_PLAYERS || '8'),
    maxTeams: parseInt(process.env.MAX_TEAMS || '4'),
    defaultRoundDuration: parseInt(process.env.DEFAULT_ROUND_DURATION || '60000')
  },

  // API Configuration
  api: {
    port: parseInt(process.env.PORT || '3000'),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  }
}; 