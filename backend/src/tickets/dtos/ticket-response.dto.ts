import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Channel,
  Priority,
  Sensitivity,
  TicketStatus,
} from '../../common/types/ticket-status';

/**
 * Public-safe ticket shape returned to staff (not citizens).
 * Never includes trackingToken.
 */
export class TicketResponseDto {
  @ApiProperty({ type: () => String })
  id: string;

  @ApiProperty({ example: 'KWMOC-2026-000001' })
  ticketCode: string;

  @ApiProperty({ enum: TicketStatus, enumName: 'TicketStatus' })
  status: TicketStatus;

  @ApiPropertyOptional({ type: () => String })
  category?: string | null;

  @ApiPropertyOptional({ enum: Priority, enumName: 'Priority' })
  priority?: Priority | null;

  @ApiProperty({ enum: Sensitivity, enumName: 'Sensitivity' })
  sensitivity: Sensitivity;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: Channel, enumName: 'Channel' })
  channel: Channel;

  @ApiPropertyOptional({ type: () => String })
  lga?: string | null;

  @ApiPropertyOptional({ type: () => String })
  departmentId?: string | null;

  @ApiProperty({ type: () => String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: () => String, format: 'date-time' })
  updatedAt: Date;
}

/**
 * Track ticket DTO — public-safe view for citizens (no internal fields).
 */
export class TrackTicketDto {
  @ApiProperty()
  ticketCode: string;

  @ApiProperty({ enum: TicketStatus, enumName: 'TicketStatus' })
  status: TicketStatus;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional({ type: () => String })
  category?: string | null;

  @ApiProperty({ type: () => String, format: 'date-time' })
  createdAt: Date;

  @ApiPropertyOptional({ type: () => String, format: 'date-time' })
  resolvedAt?: Date | null;

  @ApiPropertyOptional({ type: () => String })
  resolutionText?: string | null;
}
