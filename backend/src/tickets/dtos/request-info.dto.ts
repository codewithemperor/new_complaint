import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';

/**
 * Request more information from the citizen. Pauses the SLA clock
 * (awaiting = CITIZEN) and sends an INFO_REQUESTED email with the track URL.
 * The citizen replies via the public info endpoint to resume the clock.
 */
export class RequestInfoDto {
  @IsString()
  @MaxLength(5_000)
  requestText: string;

  /** Optional deadline shown to the citizen (not enforced automatically in M4). */
  @IsOptional()
  @IsDateString()
  deadlineAt?: string;
}
