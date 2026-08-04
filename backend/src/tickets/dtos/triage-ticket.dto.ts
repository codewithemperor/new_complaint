import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { Priority, Sensitivity } from '../../common/types/ticket-status';

export class TriageTicketDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsEnum(Sensitivity)
  sensitivity?: Sensitivity;

  @IsOptional()
  @IsString()
  triageNote?: string;

  @IsOptional()
  @IsUUID()
  overrideOfficerId?: string;
}
