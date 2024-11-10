import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JoiValidationPipe } from 'src/common/pipes/joi-validation.pipe';
import { signInSchema, SignInDTO } from './DTO/sign-in.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-in')
  @UsePipes(new JoiValidationPipe(signInSchema))
  async signIn(@Body() signInDTO: SignInDTO) {
    const session = await this.authService.signIn(signInDTO);

    return {
      user: session.user,
      tokens: session.tokens,
    };
  }
}
