import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Channel, Priority } from '../../common/types/ticket-status';

export class CreateTicketDto {
  @ApiPropertyOptional({ type: () => String })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'citizen@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ type: () => String })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Local Government Area' })
  @IsOptional()
  @IsString()
  lga?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiProperty({ example: 'INFRASTRUCTURE' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ enum: Priority, enumName: 'Priority' })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiProperty({ example: 'Pothole on Unity Road' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  subject: string;

  @ApiProperty({ example: 'There is a large pothole near the market...' })
  @IsString()
  @MinLength(10)
  @MaxLength(10000)
  description: string;

  @ApiPropertyOptional({
    enum: Channel,
    enumName: 'Channel',
    default: Channel.WEB,
  })
  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel;
}
