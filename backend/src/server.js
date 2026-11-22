import "dotenv/config";

import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import candidateMatchingRoutes from "./routes/candidateMatching.routes.js";
import jobRoutes from "./routes/job.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import recruiterRoutes from "./routes/recruiter.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import recommendationRoutes from "./routes/recommendation.routes.js";

const app = express();

const PORT = process.env.PORT || 3000;

const allowedOrigins = (
    process.env.CLIENT_URL ||
    "http://localhost:5173"
)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ extended: true, limit: "40kb" }));

// Health check for deployment monitoring
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "HireAI API is running",
    });
});

app.use("/api", authRoutes);
app.use("/api", profileRoutes);
app.use("/api", resumeRoutes);
app.use("/api/candidate-matching", candidateMatchingRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/candidate/recommendations", recommendationRoutes);

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`HireAI API running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start HireAI API:", error);
        process.exit(1);
    }
};

startServer();
