import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Producto } from './producto.entity';
import { Sucursal } from '../../sucursal/entities/sucursal.entity';
import { Inventario } from '../../inventario/entities/inventario.entity';

@Entity('productos_sucursal')
@Unique(['producto', 'sucursal'])
export class ProductoSucursal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'producto_id' })
  productoId: string;

  @Column({ name: 'sucursal_id' })
  sucursalId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Producto, (producto) => producto.productosSucursal, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @ManyToOne(() => Sucursal, (sucursal) => sucursal.productosSucursal, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sucursal_id' })
  sucursal: Sucursal;

  @OneToOne(() => Inventario, (inventario) => inventario.productoSucursal)
  inventario: Inventario;
}
