import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventarioService } from './inventario.service';
import { InventarioController } from './inventario.controller';
import { Inventario } from './entities/inventario.entity';
import { ProductoModule } from '../producto/producto.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Inventario]),
    forwardRef(() => ProductoModule),
  ],
  controllers: [InventarioController],
  providers: [InventarioService],
  exports: [InventarioService, TypeOrmModule],
})
export class InventarioModule {}
