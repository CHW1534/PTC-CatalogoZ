import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { TipoProducto } from '../../../common/enums';

export class CreateProductoDto {
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
  @MaxLength(10)
  talla: string;

  @IsEnum(TipoProducto)
  tipo: TipoProducto;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  imagenUrl?: string;
}
