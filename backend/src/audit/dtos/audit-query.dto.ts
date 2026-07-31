import { IsOptional, IsString, IsDateString, IsInt, Min } from 'class-validator';

/** Filter/pagination for the audit-event list (auditor view). */
export class AuditQueryDto {
  @IsOptional() @IsString() ticketId?: string;
  @IsOptional() @IsString() ticketCode?: string;
  @IsOptional() @IsString() actorId?: string;
  @IsOptional() @IsString() eventType?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsInt() @Min(1) page?: number;
  @IsOptional() @IsInt() @Min(1) pageSize?: number;
}
