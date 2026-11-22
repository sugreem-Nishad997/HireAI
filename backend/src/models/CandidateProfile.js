import mongoose from "mongoose";
import {Schema} from "mongoose";

const candidateProfileSchema = new Schema(
  {
    candidate: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fullName: {type: String, trim: true, default: ""},
    email: {type: String, trim: true, lowercase: true, default: ""},
    phone: {type: String, trim: true, default: ""},
    location: {type: String, trim: true, default: ""},
    summary: {type: String, trim: true, default: ""},
    skills: {type: [String], default: []},
    education: {
      type: [{
        degree: {type: String, default: ""},
        institution: {type: String, default: ""},
        fieldOfStudy: {type: String, default: ""},
        graduationYear: {type: String, default: ""},
      }],
      default: [],
    },
    experience: {
      type: [{
        company: {type: String, default: ""},
        jobTitle: {type: String, default: ""},
        startDate: {type: String, default: ""},
        endDate: {type: String, default: ""},
        description: {type: String, default: ""},
      }],
      default: [],
    },
    projects: {
      type: [{
        name: {type: String, default: ""},
        description: {type: String, default: ""},
        technologies: {type: [String], default: []},
      }],
      default: [],
    },
  },
  {timestamps: true}
);

const CandidateProfile = mongoose.model("CandidateProfile", candidateProfileSchema);

export default CandidateProfile;
