import {
  Body,
  Controller,
  Post,
  UseGuards,
  UsePipes,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JoiValidationPipe } from 'src/common/pipes/joi-validation.pipe';
import {
  signInSchema,
  SignInDTO,
  refreshSchema,
  RefreshDTO,
} from './DTO/sign-in.dto';
import { RefreshTokenGuard } from 'src/common/guards/refreshToken.guard';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';

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

  @Post('sign-out')
  @UseGuards(AccessTokenGuard)
  async signOut(@Request() req) {
    await this.authService.signOut(req.user.walletAddress);

    return { message: 'Successfully logged out' };
  }
}
