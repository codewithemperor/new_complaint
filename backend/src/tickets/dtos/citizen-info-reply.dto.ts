import { IsString, MaxLength } from 'class-validator';

/**
 * Citizen's reply to an info request. Posted to the public token-authenticated
 * endpoint; on success the SLA clock resumes (awaiting = NONE).
 */
export class CitizenInfoReplyDto {
  @IsString()
  @MaxLength(10_000)
  body: string;
}
