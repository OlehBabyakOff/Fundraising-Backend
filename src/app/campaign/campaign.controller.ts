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

import { DonateDTO, donateSchema } from './DTO/donate.dto';

@Controller('campaign')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post('upload-image')
  @UseGuards(AccessTokenGuard)
  @FileUpload()
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const result = await this.campaignService.uploadImage(file);

    return result;
  }

  @Post('create')
  @UseGuards(AccessTokenGuard)
  @UsePipes(new JoiValidationPipe(createCampaignSchema))
  async create(@Body() dto: CreateCampaignDTO) {
    const result = await this.campaignService.create(dto);

    return result;
  }

  @Get('list')
  async getList(@Query() query) {
    const result = await this.campaignService.getList(query);

    return result;
  }

  @Get('details/:address')
  async getDetails(@Param() params: { address: string }) {
    const result = await this.campaignService.getDetails(params.address);

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

    return result;
  }
}
