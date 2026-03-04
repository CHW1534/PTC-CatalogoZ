import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Sucursal } from '../modules/sucursal/entities/sucursal.entity';
import { Producto } from '../modules/producto/entities/producto.entity';
import { ProductoSucursal } from '../modules/producto/entities/producto-sucursal.entity';
import { Inventario } from '../modules/inventario/entities/inventario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sucursal,
      Producto,
      ProductoSucursal,
      Inventario,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
