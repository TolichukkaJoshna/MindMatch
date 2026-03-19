import Redis from 'ioredis';

let redisClient = null;

export const initializeRedis = () => {
    try {
        if (!process.env.REDIS_HOST) {
            console.log('⚠️  Redis not configured, skipping...');
            return null;
        }

        redisClient = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected');
        });

        redisClient.on('error', (err) => {
            console.error('❌ Redis error:', err);
        });

        return redisClient;
    } catch (error) {
        console.error('Redis initialization error:', error);
        return null;
    }
};

export const getRedis = () => {
    return redisClient;
};

// Cache helper functions
export const cacheGet = async (key) => {
    if (!redisClient) return null;
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Cache get error:', error);
        return null;
    }
};

export const cacheSet = async (key, value, expirySeconds = 3600) => {
    if (!redisClient) return;
    try {
        await redisClient.setex(key, expirySeconds, JSON.stringify(value));
    } catch (error) {
        console.error('Cache set error:', error);
    }
};

export const cacheDel = async (key) => {
    if (!redisClient) return;
    try {
        await redisClient.del(key);
    } catch (error) {
        console.error('Cache delete error:', error);
    }
};
