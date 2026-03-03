import { IsUUID, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransaccionDto {
  @IsUUID()
  productoSucursalId: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  cantidad: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
