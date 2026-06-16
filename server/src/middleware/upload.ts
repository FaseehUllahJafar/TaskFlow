import path from 'path';
import multer from 'multer';
import AppError from '../utils/AppError';

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.xls', '.xlsx']);

// Files stay in memory (10MB cap) so the service can authorize the request before anything leaves the server.
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
    },
    fileFilter: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(extension)) {
            return callback(new AppError('File type not allowed', 400));
        }
        callback(null, true);
    },
});
