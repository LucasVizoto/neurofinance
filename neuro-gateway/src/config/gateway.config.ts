export const serviceConfig = {
    users: {
        url: process.env.USERS_SERVICE_URL || 'http://localhost:3001',
        timeout: 160000, // 10 seconds
    },
    ai: {
        url: process.env.AI_SERVICE_URL || 'http://localhost:5000',
        timeout: 30000, // 30 seconds for AI and ML predictions
    },
} as const;
