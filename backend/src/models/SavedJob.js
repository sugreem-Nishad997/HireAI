import mongoose from 'mongoose';
import {Schema} from 'mongoose';

const savedJobSchema = new Schema(
  {
    candidate: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    job: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
  },
  {timestamps: true}
);

savedJobSchema.index({candidate: 1, job: 1}, {unique: true});

const SavedJob = mongoose.model('SavedJob', savedJobSchema);
export default SavedJob;
