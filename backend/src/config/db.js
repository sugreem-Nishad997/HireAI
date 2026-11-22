import mongoose from "mongoose";

const connectDB = async () => {
  await mongoose.connect(process.env.DB_URL, {dbName: 'HireAI'});
  console.log("MongoDB connected");
};

export default connectDB;