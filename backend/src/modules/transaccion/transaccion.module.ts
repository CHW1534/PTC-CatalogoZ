import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransaccionService } from './transaccion.service';
import { TransaccionController } from './transaccion.controller';
import { Transaccion } from './entities/transaccion.entity';
import { ProductoSucursal } from '../producto/entities/producto-sucursal.entity';
import { InventarioModule } from '../inventario/inventario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaccion, ProductoSucursal]),
    InventarioModule,
  ],
  controllers: [TransaccionController],
  providers: [TransaccionService],
  exports: [TransaccionService],
})
export class TransaccionModule {}
