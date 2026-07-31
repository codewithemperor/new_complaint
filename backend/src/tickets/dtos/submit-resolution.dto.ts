import { IsString, MaxLength } from 'class-validator';

/**
 * Officer submits the resolution narrative. Transitions IN_PROGRESS → RESOLVED
 * and starts the citizen feedback grace clock.
 */
export class SubmitResolutionDto {
  @IsString()
  @MaxLength(20_000)
  resolutionText: string;
}
