import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
  ): Promise<string> {
    const result = await this.campaignService.create(file, dto);

    return result;
  }

  @Get('list')
  async getList() {
    const result = await this.campaignService.getList();

    return result;
  }

  @Get('details/:wallet')
  @UsePipes(new JoiValidationPipe(getDetailsSchema))
  async getDetails(@Param() dto: GetDetailsDTO) {
    const result = await this.campaignService.getDetails(dto.wallet);

    return result;
  }
}
