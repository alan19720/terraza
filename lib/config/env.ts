/**
 * Environment Configuration
 * Centralized access to environment variables with type safety and validation
 */

interface EnvConfig {
    DATABASE_URL: string;
    JWT_SIGNING_KEY: string;
    NODE_ENV: string;
}

/**
 * Validates and returns environment variables
 * Throws error if required variables are missing
 */
function getEnvConfig(): EnvConfig {
    const requiredVars = {
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SIGNING_KEY: process.env.JWT_SIGNING_KEY,
        NODE_ENV: process.env.NODE_ENV || 'development',
    };

    // Validate required variables
    const missingVars: string[] = [];

    if (!requiredVars.DATABASE_URL) missingVars.push('DATABASE_URL');
    if (!requiredVars.JWT_SIGNING_KEY) missingVars.push('JWT_SIGNING_KEY');

    if (missingVars.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missingVars.join(', ')}\n` +
            'Please check your .env file.'
        );
    }

    return requiredVars as EnvConfig;
}

// Export validated config
export const env = getEnvConfig();

// Export individual values for convenience
export const {
    DATABASE_URL,
    JWT_SIGNING_KEY,
    NODE_ENV,
} = env;

// Helper to check if in production
export const isProduction = NODE_ENV === 'production';
export const isDevelopment = NODE_ENV === 'development';

// Restaurant timezone (Morelia, Michoacán)
export const TIMEZONE = 'America/Mexico_City';
