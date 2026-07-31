import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReminderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Ticket ID this reminder is for' })
  ticketId: string;

  @ApiProperty({ description: 'User ID who owns this reminder' })
  userId: string;

  @ApiPropertyOptional({ description: 'Note attached to the reminder' })
  note?: string | null;

  @ApiProperty({ description: 'When the reminder triggers', format: 'date-time' })
  remindAt: string;

  @ApiProperty({ description: 'Whether the reminder is still active' })
  isActive: boolean;

  @ApiProperty({ description: 'When the reminder was created', format: 'date-time' })
  createdAt: string;
}
