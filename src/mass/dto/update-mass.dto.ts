import { PartialType } from '@nestjs/mapped-types';
import { CreateMassDto } from './create-mass.dto';

export class UpdateMassDto extends PartialType(CreateMassDto) {}
