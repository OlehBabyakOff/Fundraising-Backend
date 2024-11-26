import {
  BadRequestException,
  Injectable,
  PipeTransform,
  Type,
} from '@nestjs/common';
import * as Joi from 'joi';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private schema: Joi.ObjectSchema) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'body') {
      const isMultipart = value && (value.file || value.files);

      if (isMultipart) {
        const { file, files, ...requestData } = value;

        const { error } = this.schema.validate(requestData);

        if (error) {
          throw new BadRequestException(`Validation failed: ${error.message}`);
        }
        return value;
      } else {
        const { error, value: DTO } = this.schema.validate(value, {
          errors: {
            wrap: {
              label: '',
            },
          },
          convert: true,
          stripUnknown: true,
        });

        if (error) {
          throw new BadRequestException(`Validation failed: ${error.message}`);
        }

        return DTO;
      }
    }

    return value;
  }
}

export interface ArgumentMetadata {
  type: 'body' | 'query' | 'param';
  metatype?: Type<unknown>;
  data?: string;
}
