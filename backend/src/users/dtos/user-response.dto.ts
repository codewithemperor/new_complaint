import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../common/types/role';

/**
 * Public-safe user shape. NEVER includes passwordHash — this is the only user
 * DTO that leaves the API (strict DTO boundary per nestjs-architecture-principles).
 *
 * Note: all @ApiProperty use explicit `type: () => X` because the dev runtime
 * (tsx/esbuild) strips design:type metadata; explicit types keep Swagger working.
 */
export class UserResponseDto {
  @ApiProperty({ type: () => String })
  id: string;

  @ApiProperty({ type: () => String })
  email: string;

  @ApiProperty({ type: () => String })
  fullName: string;

  @ApiProperty({ enum: Role, enumName: 'Role' })
  role: Role;

  @ApiPropertyOptional({ type: () => String, nullable: true })
  designation?: string | null;

  @ApiPropertyOptional({ type: () => String, nullable: true })
  phone?: string | null;

  @ApiPropertyOptional({ type: () => String, nullable: true })
  departmentId?: string | null;

  @ApiProperty({ type: () => Boolean })
  isActive: boolean;

  @ApiPropertyOptional({ type: () => String, format: 'date-time', nullable: true })
  lastLoginAt?: Date | null;
}
