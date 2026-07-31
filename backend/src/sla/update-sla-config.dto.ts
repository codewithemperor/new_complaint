import { IsInt, IsNumber, IsArray, IsString, Min, Max } from 'class-validator';

/** Update one priority's SLA config row (Super Admin). */
export class UpdateSlaConfigDto {
  @IsInt()
  @Min(1)
  firstResponseHours: number;

  @IsInt()
  @Min(1)
  resolutionHours: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  warningThreshold: number;

  @IsArray()
  @IsString({ each: true })
  escalationChain: string[];
}
