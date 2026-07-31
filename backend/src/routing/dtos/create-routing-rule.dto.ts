import { IsString, IsOptional, IsEnum, IsUUID, IsInt, IsBoolean, Min } from 'class-validator';
import { Priority } from '../../common/types/ticket-status';

export class CreateRoutingRuleDto {
  @IsString()
  category: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  lga?: string;

  @IsUUID()
  departmentId: string;

  @IsOptional()
  @IsUUID()
  defaultOfficerId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priorityRank?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
