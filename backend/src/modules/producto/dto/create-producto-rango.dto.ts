import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { TipoProducto } from '../../../common/enums';

export class CreateProductoRangoDto {
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

  @IsString()
  @MaxLength(20)
  tallaInicio: string; // ej: "5" o "25"

  @IsString()
  @MaxLength(20)
  tallaFin: string; // ej: "9" o "28"

  @IsBoolean()
  @IsOptional()
  incluirMedias?: boolean; // true = 5, 5.5, 6, 6.5... | false = 5, 6, 7...

  @IsEnum(TipoProducto)
  tipo: TipoProducto;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
