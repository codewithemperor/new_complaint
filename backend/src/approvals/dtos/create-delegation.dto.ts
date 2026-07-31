import { IsUUID, IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * PS creates a time-boxed delegation of approval authority to a Director.
 * While active (now ∈ [validFrom, validTo]), the delegate resolves PS-tier
 * approvals in the PS's place.
 */
export class CreateDelegationDto {
  @IsUUID()
  delegateId: string;

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validTo: string;

  @IsOptional()
  @IsString()
  @MaxLength(1_000)
  reason?: string;
}
