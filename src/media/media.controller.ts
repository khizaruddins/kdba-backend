import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import { MediaService } from './media.service';
import { CurrentUser, JwtPayload, Public } from '../common/decorators';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a media file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        altText: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body('altText') altText?: string,
  ) {
    return this.mediaService.upload(user.tenantId, file, altText);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all media for tenant' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.mediaService.findAll(user.tenantId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get media details' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.mediaService.findOne(id, user.tenantId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a media item' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.mediaService.delete(id, user.tenantId);
  }

  @Get('file/:key')
  @Public()
  @ApiOperation({ summary: 'Serve public media file' })
  async serveFile(@Param('key') key: string, @Res() res: Response) {
    const filePath = this.mediaService.getFilePath(key);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.sendFile(filePath);
  }
}
