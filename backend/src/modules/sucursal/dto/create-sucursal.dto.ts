import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateSucursalDto {
  @IsString()
  @MaxLength(100)
  nombre: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
