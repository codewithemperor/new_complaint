import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateReminderDto {
  @ApiPropertyOptional({ description: 'Updated note or message' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  note?: string;

  @ApiPropertyOptional({
    description: 'Updated reminder datetime (ISO 8601)',
    example: '2026-03-20T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  remindAt?: string;

  @ApiPropertyOptional({ description: 'Whether the reminder is active' })
  @IsOptional()
  isActive?: boolean;
}
