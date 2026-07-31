import { IsString, IsOptional, IsEnum, IsUUID, IsInt, IsBoolean, Min } from 'class-validator';
import { Priority } from '../../common/types/ticket-status';

export class UpdateRoutingRuleDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority | null;

  @IsOptional()
  @IsString()
  lga?: string | null;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  defaultOfficerId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  priorityRank?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
