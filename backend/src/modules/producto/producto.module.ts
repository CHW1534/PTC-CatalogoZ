import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductoService } from './producto.service';
import { ProductoController } from './producto.controller';
import { Producto, ProductoSucursal } from './entities';
import { InventarioModule } from '../inventario/inventario.module';
import { Transaccion } from '../transaccion/entities/transaccion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Producto, ProductoSucursal, Transaccion]),
    forwardRef(() => InventarioModule),
  ],
  controllers: [ProductoController],
  providers: [ProductoService],
  exports: [ProductoService, TypeOrmModule],
})
export class ProductoModule {}
