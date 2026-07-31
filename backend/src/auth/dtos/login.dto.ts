import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@kwmoc.gov.ng', type: String })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', type: String })
  @IsString()
  @MinLength(8)
  password: string;
}
