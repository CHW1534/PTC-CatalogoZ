import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { TipoProducto } from '../../../common/enums';
import { ProductoSucursal } from './producto-sucursal.entity';

@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'grupo_id', type: 'uuid', nullable: true })
  grupoId: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 50, nullable: true })
  marca: string;

  @Column({ length: 50, nullable: true })
  modelo: string;

  @Column({ length: 30 })
  color: string;

  @Column({ length: 10 })
  talla: string;

  @Column({
    type: 'enum',
    enum: TipoProducto,
  })
  tipo: TipoProducto;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'imagen_url', length: 500, nullable: true })
  imagenUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @OneToMany(() => ProductoSucursal, (ps) => ps.producto)
  productosSucursal: ProductoSucursal[];
}
