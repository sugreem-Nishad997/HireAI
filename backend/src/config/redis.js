import IORedis from "ioredis";

const createRedisConnection = () => {
    if (!process.env.REDIS_URL) {
        throw new Error("REDIS_URL is missing from environment variables");
    }

    const redis = new IORedis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
    });

    redis.on("connect", () => {
        console.log("Cloud Redis connected successfully");
    });

    redis.on("error", (error) => {
        console.error("Redis connection error:", error.message);
    });

    return redis;
};

export const redisConnection = createRedisConnection();
export { createRedisConnection };

export default redisConnection;