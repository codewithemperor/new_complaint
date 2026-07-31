import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

/**
 * Append a minute to a ticket's investigation sheet.
 *
 * Minutes are strictly append-only (no update path). `isInternal` hides the
 * minute from the citizen-facing track view; `isResolutionDraft` flags a
 * proposed resolution for HOD review (the actual resolution submission is M6).
 */
export class PostMinuteDto {
  @IsString()
  @MaxLength(10_000)
  body: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;

  @IsOptional()
  @IsBoolean()
  isResolutionDraft?: boolean;
}
