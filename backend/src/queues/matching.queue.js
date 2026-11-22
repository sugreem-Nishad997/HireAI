
import { Queue } from "bullmq";
import redisConnection from "../config/redis.js";

export const matchingQueue = new Queue("application-matching", {
    connection: redisConnection,

    defaultJobOptions: {
        // Retry failed matching tasks
        attempts: 3,

        // Wait progressively longer between retries
        backoff: {
            type: "exponential",
            delay: 2000,
        },

        // Keep some completed jobs for debugging
        removeOnComplete: {
            count: 500,
        },

        // Keep failed jobs for investigation
        removeOnFail: {
            count: 1000,
        },
    },
});

// Queue event listeners
matchingQueue.on("error", (error) => {
    console.error("Matching queue error:", error.message);
});

console.log("Application matching queue initialized");
