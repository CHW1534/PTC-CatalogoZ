import { IsUUID, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AsignarProductoSucursalDto {
  @IsUUID()
  productoId: string;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  precio: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  cantidadInicial?: number;
}
