import { IsString, IsOptional, MaxLength } from 'class-validator';

/** Approve the current approval tier. Comment optional but encouraged. */
export class ApproveDto {
  @IsOptional()
  @IsString()
  @MaxLength(5_000)
  comment?: string;
}

/** Return the ticket to the officer with mandatory feedback. */
export class ReturnDto {
  @IsString()
  @MaxLength(5_000)
  comment: string;
}

/** Escalate to the next tier (HOD → PS, or PS → Commissioner). */
export class EscalateDto {
  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  reason?: string;
}

/** Refer the matter to an external body (e.g. Public Complaints Commission). */
export class ReferDto {
  @IsString()
  @MaxLength(200)
  referredBody: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  reason?: string;
}
