import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import candidateMatchingRoutes from './routes/candidateMatching.routes.js';
import jobRoutes from './routes/job.routes.js';
import applicationRoutes from './routes/application.routes.js';
import recruiterRoutes from './routes/recruiter.routes.js';
import profileRoutes from './routes/profile.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';

dotenv.config();

const allowedOrigins = process.env.CLIENT_URL.split().map((origin) => origin.trim());

const app = express();

app.use(cors({ origin: allowedOrigins, credentials: true, limit: '1mb' }));
app.use(express.json({ limit: '40kb' }));
app.use(express.urlencoded({ extended: true, limit: '40kb' }));
app.use('/api', authRoutes);
app.use('/api', profileRoutes);
app.use('/api', resumeRoutes);
app.use('/api/candidate-matching', candidateMatchingRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use("/api/candidate/recommendations", recommendationRoutes);

const start = async () => {
    app.listen(3000, () => {
        console.log('Server is running on port 3000');
        connectDB().catch(err => {
            console.error('Failed to connect to MongoDB', err);
            process.exit(1);
        });
    });
}

start();