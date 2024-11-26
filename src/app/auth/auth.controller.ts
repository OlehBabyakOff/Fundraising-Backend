import { Body, Controller, Post, UseGuards, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JoiValidationPipe } from 'src/common/pipes/joi-validation.pipe';
import {
  signInSchema,
  SignInDTO,
  refreshSchema,
  RefreshDTO,
} from './DTO/sign-in.dto';
import { RefreshTokenGuard } from 'src/common/guards/refreshToken.guard';

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

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @UsePipes(new JoiValidationPipe(refreshSchema))
  async refresh(@Body() refreshDTO: RefreshDTO) {
    const tokens = await this.authService.refreshTokens(refreshDTO);

    return tokens;
  }
}
