import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class TrackFeedbackDto {
  @IsString()
  code: string;

  @IsString()
  passcode: string;

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
