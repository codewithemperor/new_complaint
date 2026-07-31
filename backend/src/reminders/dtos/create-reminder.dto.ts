import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateReminderDto {
  @ApiProperty({ description: 'Ticket ID to set a reminder for' })
  @IsString()
  ticketId: string;

  @ApiPropertyOptional({ description: 'Note or message for the reminder' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  note?: string;

  @ApiProperty({
    description: 'When to remind (ISO 8601 date string)',
    example: '2026-03-15T09:00:00.000Z',
  })
  @IsDateString()
  remindAt: string;
}
