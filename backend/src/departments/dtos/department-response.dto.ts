import { ApiProperty } from '@nestjs/swagger';

export class DepartmentResponseDto {
  @ApiProperty({ type: () => String })
  id: string;

  @ApiProperty({ type: () => String })
  name: string;

  @ApiProperty({ type: () => String })
  code: string;

  @ApiProperty({ type: () => String, nullable: true, required: false })
  description?: string | null;
}
