import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadedFile {
    url: string;
    publicId: string;
}

export const isCloudinaryConfigured = (): boolean =>
    Boolean(
        process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
    );

/** Uploads an in-memory file to the `taskflow` folder and returns its public URL and id. */
export const uploadBuffer = (buffer: Buffer): Promise<UploadedFile> =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'taskflow', resource_type: 'auto' },
            (error, result) => {
                if (error || !result) {
                    return reject(error ?? new Error('Cloudinary returned no result'));
                }
                resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );
        stream.end(buffer);
    });

export const deleteRemoteFile = async (publicId: string): Promise<void> => {
    // Files are uploaded with resource_type "auto", so the same id may be an image or a raw file.
    for (const resourceType of ['image', 'raw', 'video'] as const) {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        if (result.result === 'ok') {
            return;
        }
    }
};

export default cloudinary;
