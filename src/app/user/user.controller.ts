import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UsePipes,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JoiValidationPipe } from 'src/common/pipes/joi-validation.pipe';
import {
  generateNonceSchema,
  GenerateNonceDTO,
} from './DTO/generate-nonce.dto';

import { PinataProvider } from 'src/providers/pinata/pinata.provider';
import { FileUpload } from 'src/common/decorators/file-upload.decorator';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly pinataProvider: PinataProvider,
  ) {}

  @Post('nonce')
  @UsePipes(new JoiValidationPipe(generateNonceSchema))
  async generateNonce(@Body() generateNonceDTO: GenerateNonceDTO) {
    const nonce = await this.userService.generateNonce(generateNonceDTO.wallet);

    return { nonce };
  }

  @Post('upload-test')
  @UsePipes(new JoiValidationPipe(generateNonceSchema))
  @FileUpload()
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: GenerateNonceDTO,
  ) {
    if (!file) {
      throw new BadRequestException('no file uploaded');
    }

    const result = await this.pinataProvider.uploadFile(file);

    return result;
  }
}
