import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CloneTemplateDto {
  @ApiProperty({ description: 'Business ID belonging to the authenticated tenant' })
  @IsString()
  @IsNotEmpty()
  businessId: string;

  @ApiProperty({ example: 'My New Website' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;
}
