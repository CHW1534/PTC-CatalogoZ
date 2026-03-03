import { IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { TipoTransaccion } from '../../../common/enums';

export class FilterTransaccionDto {
  @IsOptional()
  @IsUUID()
  sucursalId?: string;

  @IsOptional()
  @IsUUID()
  productoId?: string;

  @IsOptional()
  @IsEnum(TipoTransaccion)
  tipo?: TipoTransaccion;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;
}
