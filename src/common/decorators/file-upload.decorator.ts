import {
  applyDecorators,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FILE_CONSTANTS } from '../constants/constants';

interface FileUploadOptions {
  fileSize?: number;
  allowedMimeTypes?: string[];
  multiple?: boolean;
}

export function FileUpload(options: FileUploadOptions = {}) {
  const {
    fileSize = FILE_CONSTANTS.FILE_SIZE,
    allowedMimeTypes = FILE_CONSTANTS.FILE_MIME_TYPES,
    multiple = false,
  } = options;

  const uploadInterceptor = multiple
    ? FilesInterceptor('files', 10, {
        storage: memoryStorage(),
        limits: {
          fileSize,
        },
        fileFilter: (_, file, callback) => {
          if (!allowedMimeTypes.includes(file.mimetype)) {
            return callback(
              new BadRequestException('Invalid file type'),
              false,
            );
          }

          callback(null, true);
        },
      })
    : FileInterceptor('file', {
        storage: memoryStorage(),
        limits: {
          fileSize,
        },
        fileFilter: (_, file, callback) => {
          if (!allowedMimeTypes.includes(file.mimetype)) {
            return callback(
              new BadRequestException('Invalid file type'),
              false,
            );
          }

          callback(null, true);
        },
      });

  return applyDecorators(UseInterceptors(uploadInterceptor));
}
