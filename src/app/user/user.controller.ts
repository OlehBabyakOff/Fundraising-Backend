import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JoiValidationPipe } from 'src/common/pipes/joi-validation.pipe';
import {
  generateNonceSchema,
  GenerateNonceDTO,
} from './DTO/generate-nonce.dto';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('nonce')
  @UsePipes(new JoiValidationPipe(generateNonceSchema))
  async generateNonce(@Body() generateNonceDTO: GenerateNonceDTO) {
    const nonce = await this.userService.generateNonce(generateNonceDTO.wallet);

    return { nonce };
  }

  @Get('balance')
  @UseGuards(AccessTokenGuard)
  async getBalance(@Req() req) {
    const wallet = req.user.walletAddress;

    const result = await this.userService.getBalance(wallet);

    return result;
  }

  @Get('transactions')
  @UseGuards(AccessTokenGuard)
  async getTransactions(@Req() req, @Query() query) {
    const wallet = req.user.walletAddress;

    const result = await this.userService.getTransactions(wallet, query);

    return result;
  }

  @Get('my-campaigns')
  @UseGuards(AccessTokenGuard)
  async getMyCampaigns(@Req() req, @Query() query) {
    const wallet = req.user.walletAddress;

    const result = await this.userService.getMyCampaigns(wallet, query);

    return result;
  }
}
