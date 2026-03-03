import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateInventarioDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cantidad: number;
}
