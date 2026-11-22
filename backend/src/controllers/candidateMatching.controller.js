import mongoose from 'mongoose';
import httpStatus from 'http-status';
import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import MatchResult from '../models/MatchResult.js';
import {matchCandidateToJob} from '../ai/services/candidateMatching.service.js';

export const matchCandidatesForJob = async(req, res, next) => {

    try{

        const { jobId} = req.params;
        const recruiterId = req.user._id;

        if(!mongoose.isValidObjectId(jobId)){
            return res.status(httpStatus.BAD_REQUEST).json({success: false, message: 'Invalid job ID'});
        }  
        
        const job = await Job.findOne({
            _id: jobId,
            recruiter: recruiterId,
            isActive: true,
        });

        if(!job){
            return res.status(httpStatus.NOT_FOUND).json({success: false, message: 'Active Job not found or you do not have permission to access it'});
        }

        const resumes = await Resume.find({
            "parsing.status": "completed",
            parsedData: { $exists: true},
        })
        .select("candidate parsedData createdAt ")
        .lean();

        if(resumes.length === 0){
            return res.httpStatus(200).json({
                success: true,
                message: "No parsed candidate resumes found",
                job: {
                    id: job._id,
                    title: job.title
                },
                totalEvaluated: 0,
                failedEvaluations: 0,
                data: [],
            });
        }

        const results = [];
        const failedMatches = [];

        for(const resume of resumes){
            if(!resume.parsedData) continue;

            try{
                const match = await matchCandidateToJob(
                    resume.parsedData, job);


                const savedResult = await MatchResult.  findOneAndUpdate(
                    {
                        job: job._id,
                        candidate: resume.candidate,
                        resume: resume._id,
                    },
                    {
                    $set: {
                        matchScore: match.matchScore,
                        matchedSkills: match.matchedSkills,
                        missingRequiredSkills: match.       missingRequiredSkills,
                        relevantEvidence: match.relevantEvidence,
                        experienceAssessment: match.experienceAssessment,
                        summary: match.summary,
                        limitations: match.limitations,
                    },
                    },
                    {
                        upsert: true,
                        new: true,
                        runValidators: true,
                        setDefaultsOnInsert: true,
                    }
                ).lean();

                results.push({
                    matchResultId: savedResult._id,
                    resumeId: resume._id,
                    candidateId: resume.candidate,
                    match
                });
            }catch(error){
                console.error(`Matching failed for resume ${resume._id}:`, error.message);

                failedMatches.push({
                    resumeId: resume._id,
                    message: "Could not evaluate this resume.",
                });
            }  
        }

        results.sort(
            (a,b) => b.match.matchScore - a.match.matchScore
        )

        return res.status(httpStatus.OK).json({
            success: true,
            job:{
                id: job._id,
                title: job.title,
            },
            totalEvaluated: results.length,
            failedEvaluations: failedMatches.length,
            data: results,
        }); 

    } catch (error) {
        return next(error);
    }
}