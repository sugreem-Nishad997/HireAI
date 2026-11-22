import {Readable} from "node:stream";
import {randomUUID} from "node:crypto";
import cloudinary from "../config/cloudinary.js";

export const uploadResumeToCloudinary = (file, candidateId) => {
    const extension = file.originalname.slice(file.originalname.lastIndexOf(".")).toLowerCase();

    const publicId = `${candidateId}/${randomUUID()}${extension}`;

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "raw",
                type: "authenticated",
                public_id: publicId,
                overwrite: false,
                tags: ["resume"],
            },
            (error, result) => {
                if(error){
                    return reject(error);
                }

                resolve(result);
            }
        );

        Readable.from([file.buffer]).pipe(uploadStream);
    });

};

export const deleteResumeFromCloudinary = (publicId) => {
    return cloudinary.uploader.destroy(publicId,{
        resource_type: "raw",
        type: "authenticated"
    });
};