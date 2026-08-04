import {
  ArrayUnique,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../common/types/role';
import { Permission } from '../../common/types/permission';

/** Super Admin creates a staff user. */
export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ enum: Role, enumName: 'Role' })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  designation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({
    enum: Permission,
    enumName: 'Permission',
    type: [String],
    description: 'Module permissions for ADMIN users (ignored for other roles).',
  })
  @IsOptional()
  @IsEnum(Permission, { each: true })
  @ArrayUnique()
  permissions?: Permission[];

  @ApiPropertyOptional({
    description: 'Grant Super Admin bypass (only meaningful for ADMIN role).',
  })
  @IsOptional()
  @IsBoolean()
  isSuperAdmin?: boolean;
}
