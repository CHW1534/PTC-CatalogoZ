import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ProductoSucursal } from '../../producto/entities/producto-sucursal.entity';

@Entity('inventario')
export class Inventario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'producto_sucursal_id' })
  productoSucursalId: string;

  @Column({ type: 'int', default: 0 })
  cantidad: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => ProductoSucursal, (ps) => ps.inventario, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'producto_sucursal_id' })
  productoSucursal: ProductoSucursal;
}
