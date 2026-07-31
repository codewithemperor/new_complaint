import { IsString, MaxLength } from 'class-validator';

/**
 * Citizen explicit reopen (alternative to feedback reject). Subject to the
 * 14-day reopen window from resolvedAt.
 */
export class ReopenDto {
  @IsString()
  @MaxLength(5_000)
  reason: string;
}
