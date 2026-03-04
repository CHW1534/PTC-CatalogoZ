import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoProducto } from '../../../common/enums';

export class TallaConCantidadDto {
  @IsString()
  @MaxLength(10)
  talla: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cantidad?: number; // Cantidad inicial para inventario (opcional)
}

export class CreateProductoMultiTallaDto {
  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  marca?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  modelo?: string;

  @IsString()
  @MaxLength(30)
  color: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TallaConCantidadDto)
  tallas: TallaConCantidadDto[]; // Array de tallas seleccionadas con cantidad opcional

  @IsEnum(TipoProducto)
  tipo: TipoProducto;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  imagenUrl?: string;
}
