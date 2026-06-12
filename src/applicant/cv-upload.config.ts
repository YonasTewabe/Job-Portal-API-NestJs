import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

export const uploadsDir = join(process.cwd(), 'uploads');

if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

export const cvUploadOptions = {
  storage: diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => {
      const original = file.originalname?.trim() || 'cv.pdf';
      const safe = original.replace(/[/\\]/g, '_');
      cb(null, `${randomUUID()}-${safe}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
      return;
    }
    cb(
      new BadRequestException('Only PDF files are allowed') as unknown as Error,
      false,
    );
  },
};
