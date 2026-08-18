import { IsString } from 'class-validator';

export class TrackTicketDto {
  @IsString()
  code: string;

  @IsString()
  passcode: string;
}
