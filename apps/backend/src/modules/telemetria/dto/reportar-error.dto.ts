import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReportarErrorDto {
  @IsString()
  @MaxLength(500)
  mensaje!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  stack?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  url?: string;
}
