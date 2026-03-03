import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Transaccion } from './entities/transaccion.entity';
import { CreateTransaccionDto, FilterTransaccionDto } from './dto';
import { TipoTransaccion } from '../../common/enums';
import { InventarioService } from '../inventario/inventario.service';
import { ProductoSucursal } from '../producto/entities/producto-sucursal.entity';

@Injectable()
export class TransaccionService {
  constructor(
    @InjectRepository(Transaccion)
    private readonly transaccionRepository: Repository<Transaccion>,
    @InjectRepository(ProductoSucursal)
    private readonly productoSucursalRepository: Repository<ProductoSucursal>,
    private readonly inventarioService: InventarioService,
  ) {}

  async registrarEntrada(dto: CreateTransaccionDto): Promise<Transaccion> {
    const productoSucursal = await this.getProductoSucursal(dto.productoSucursalId);

    const transaccion = this.transaccionRepository.create({
      productoSucursalId: dto.productoSucursalId,
      tipoTransaccion: TipoTransaccion.ENTRADA,
      cantidad: dto.cantidad,
      precioUnitario: productoSucursal.precio,
      total: dto.cantidad * Number(productoSucursal.precio),
      observaciones: dto.observaciones,
    });

    const saved = await this.transaccionRepository.save(transaccion);

    // Actualizar inventario
    await this.inventarioService.ajustarStock(dto.productoSucursalId, dto.cantidad);

    return saved;
  }

  async registrarSalida(dto: CreateTransaccionDto): Promise<Transaccion> {
    const productoSucursal = await this.getProductoSucursal(dto.productoSucursalId);
    const inventario = await this.inventarioService.findByProductoSucursal(dto.productoSucursalId);

    if (inventario.cantidad < dto.cantidad) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${inventario.cantidad}, Solicitado: ${dto.cantidad}`,
      );
    }

    const transaccion = this.transaccionRepository.create({
      productoSucursalId: dto.productoSucursalId,
      tipoTransaccion: TipoTransaccion.SALIDA,
      cantidad: dto.cantidad,
      precioUnitario: productoSucursal.precio,
      total: dto.cantidad * Number(productoSucursal.precio),
      observaciones: dto.observaciones,
    });

    const saved = await this.transaccionRepository.save(transaccion);

    // Actualizar inventario
    await this.inventarioService.ajustarStock(dto.productoSucursalId, -dto.cantidad);

    return saved;
  }

  async findAll(filters: FilterTransaccionDto): Promise<Transaccion[]> {
    const query = this.transaccionRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.productoSucursal', 'ps')
      .leftJoinAndSelect('ps.producto', 'producto')
      .leftJoinAndSelect('ps.sucursal', 'sucursal');

    if (filters.sucursalId) {
      query.andWhere('ps.sucursal_id = :sucursalId', { sucursalId: filters.sucursalId });
    }

    if (filters.productoId) {
      query.andWhere('ps.producto_id = :productoId', { productoId: filters.productoId });
    }

    if (filters.tipo) {
      query.andWhere('t.tipo_transaccion = :tipo', { tipo: filters.tipo });
    }

    if (filters.desde) {
      query.andWhere('t.created_at >= :desde', { desde: filters.desde });
    }

    if (filters.hasta) {
      query.andWhere('t.created_at <= :hasta', { hasta: filters.hasta });
    }

    return query.orderBy('t.created_at', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Transaccion> {
    const transaccion = await this.transaccionRepository.findOne({
      where: { id },
      relations: ['productoSucursal', 'productoSucursal.producto', 'productoSucursal.sucursal'],
    });

    if (!transaccion) {
      throw new NotFoundException(`Transacción con ID ${id} no encontrada`);
    }

    return transaccion;
  }

  private async getProductoSucursal(id: string): Promise<ProductoSucursal> {
    const productoSucursal = await this.productoSucursalRepository.findOne({
      where: { id },
    });

    if (!productoSucursal) {
      throw new NotFoundException(`ProductoSucursal con ID ${id} no encontrado`);
    }

    return productoSucursal;
  }
}
