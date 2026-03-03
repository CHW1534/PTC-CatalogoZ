import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TipoTransaccion } from '../../../common/enums';
import { ProductoSucursal } from '../../producto/entities/producto-sucursal.entity';

@Entity('transacciones')
export class Transaccion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'producto_sucursal_id' })
  productoSucursalId: string;

  @Column({
    type: 'enum',
    enum: TipoTransaccion,
    name: 'tipo_transaccion',
  })
  tipoTransaccion: TipoTransaccion;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'precio_unitario' })
  precioUnitario: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ProductoSucursal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'producto_sucursal_id' })
  productoSucursal: ProductoSucursal;
}
