import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventario } from './entities/inventario.entity';
import { UpdateInventarioDto } from './dto';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
  ) {}

  async findAll(): Promise<Inventario[]> {
    return this.inventarioRepository.find({
      relations: ['productoSucursal', 'productoSucursal.producto', 'productoSucursal.sucursal'],
    });
  }

  async findByProductoSucursal(productoSucursalId: string): Promise<Inventario> {
    const inventario = await this.inventarioRepository.findOne({
      where: { productoSucursalId },
      relations: ['productoSucursal', 'productoSucursal.producto'],
    });

    if (!inventario) {
      throw new NotFoundException(`Inventario no encontrado`);
    }

    return inventario;
  }

  async update(productoSucursalId: string, dto: UpdateInventarioDto): Promise<Inventario> {
    const inventario = await this.findByProductoSucursal(productoSucursalId);
    inventario.cantidad = dto.cantidad;
    return this.inventarioRepository.save(inventario);
  }

  async ajustarStock(productoSucursalId: string, cantidad: number): Promise<Inventario> {
    const inventario = await this.findByProductoSucursal(productoSucursalId);
    inventario.cantidad += cantidad;

    if (inventario.cantidad < 0) {
      inventario.cantidad = 0;
    }

    return this.inventarioRepository.save(inventario);
  }

  async getStockBySucursal(sucursalId: string): Promise<Inventario[]> {
    return this.inventarioRepository
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.productoSucursal', 'ps')
      .leftJoinAndSelect('ps.producto', 'producto')
      .where('ps.sucursal_id = :sucursalId', { sucursalId })
      .andWhere('ps.activo = :activo', { activo: true })
      .getMany();
  }
}
