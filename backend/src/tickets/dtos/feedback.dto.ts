import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * Citizen feedback on a resolution (public, token-authenticated). Satisfied →
 * CLOSED; not satisfied → REOPENED. Rating is optional, 1–5 if provided.
 */
export class FeedbackDto {
  @IsBoolean()
  satisfied: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(5_000)
  comment?: string;
}
