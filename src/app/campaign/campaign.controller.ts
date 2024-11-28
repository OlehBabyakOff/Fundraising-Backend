import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';

import { JoiValidationPipe } from 'src/common/pipes/joi-validation.pipe';

import { FileUpload } from 'src/common/decorators/file-upload.decorator';

import { CampaignService } from './campaign.service';

import {
  CreateCampaignDTO,
  createCampaignSchema,
} from './DTO/create-campaign.dto';

import { GetDetailsDTO, getDetailsSchema } from './DTO/get-details.dto';

import { DonateDTO, donateSchema } from './DTO/donate.dto';

@Controller('campaign')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post('create')
  @UseGuards(AccessTokenGuard)
  @UsePipes(new JoiValidationPipe(createCampaignSchema))
  @FileUpload()
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateCampaignDTO,
  ) {
    const result = await this.campaignService.create(file, dto);

    return result;
  }

  @Get('list')
  async getList(@Query() query) {
    const result = await this.campaignService.getList(query);

    return result;
  }

  @Get('details/:address')
  @UsePipes(new JoiValidationPipe(getDetailsSchema))
  async getDetails(@Param() dto: GetDetailsDTO) {
    const result = await this.campaignService.getDetails(dto.address);

    return result;
  }

  @Get('slider')
  async getSlider() {
    const result = await this.campaignService.getSlider();

    return result;
  }

  @Post('donate/:address')
  @UseGuards(AccessTokenGuard)
  @UsePipes(new JoiValidationPipe(donateSchema))
  async donate(@Body() dto: DonateDTO, @Param() param) {
    const result = await this.campaignService.donate(param.address, dto);

    if (!result) {
      throw new BadRequestException('Помилка під час донату');
    }

    return {
      message: `Ви успішно задонатили ${dto.amount} ETH на збір ${param.address}`,
    };
  }
}
