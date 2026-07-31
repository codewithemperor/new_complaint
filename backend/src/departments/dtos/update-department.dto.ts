import { PartialType } from '@nestjs/swagger';
import { CreateDepartmentDto } from './create-department.dto';

/** Super Admin edits a department. All fields optional. */
export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
