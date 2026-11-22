import mongoose from 'mongoose';
import {Schema} from 'mongoose';

const jobSchema = new Schema(
    {
        recruiter: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        requiredSkills: {
            type: [String],
            default: []
        },
        preferredSkills: {
            type: [String],
            default: [],
        },
        minimumExperienceYears: {
            type: Number,
            min: 0,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {timestamps: true}
);

const Job = mongoose.model('Job', jobSchema);

export default Job;
