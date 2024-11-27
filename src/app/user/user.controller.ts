import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { UserService } from './user.service';
import { JoiValidationPipe } from 'src/common/pipes/joi-validation.pipe';
import {
  generateNonceSchema,
  GenerateNonceDTO,
} from './DTO/generate-nonce.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('nonce')
  @UsePipes(new JoiValidationPipe(generateNonceSchema))
  async generateNonce(@Body() generateNonceDTO: GenerateNonceDTO) {
    const nonce = await this.userService.generateNonce(generateNonceDTO.wallet);

    return { nonce };
  }
}
