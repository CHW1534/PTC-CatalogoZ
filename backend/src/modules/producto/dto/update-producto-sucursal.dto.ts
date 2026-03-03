import { IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductoSucursalDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  precio?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
