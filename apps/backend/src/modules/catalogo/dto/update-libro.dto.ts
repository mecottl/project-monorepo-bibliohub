import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateLibroDto } from './create-libro.dto';

export class UpdateLibroDto extends PartialType(
  OmitType(CreateLibroDto, ['isbn'] as const),
) {}
