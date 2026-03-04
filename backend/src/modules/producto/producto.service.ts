import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Producto, ProductoSucursal } from './entities';
import {
  CreateProductoDto,
  UpdateProductoDto,
  AsignarProductoSucursalDto,
  UpdateProductoSucursalDto,
  FilterProductoDto,
  CreateProductoRangoDto,
  CreateProductoMultiTallaDto,
} from './dto';
import { Inventario } from '../inventario/entities/inventario.entity';
import { Transaccion } from '../transaccion/entities/transaccion.entity';
import { TipoTransaccion } from '../../common/enums';

@Injectable()
export class ProductoService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(ProductoSucursal)
    private readonly productoSucursalRepository: Repository<ProductoSucursal>,
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    @InjectRepository(Transaccion)
    private readonly transaccionRepository: Repository<Transaccion>,
  ) {}

  // === PRODUCTOS BASE ===

  async create(createProductoDto: CreateProductoDto): Promise<Producto> {
    const producto = this.productoRepository.create(createProductoDto);
    return this.productoRepository.save(producto);
  }

  async findAll(): Promise<Producto[]> {
    return this.productoRepository.find({
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Producto> {
    const producto = await this.productoRepository.findOne({
      where: { id },
      relations: ['productosSucursal', 'productosSucursal.sucursal'],
    });
    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return producto;
  }

  async update(id: string, updateProductoDto: UpdateProductoDto): Promise<Producto> {
    const producto = await this.findOne(id);
    Object.assign(producto, updateProductoDto);
    return this.productoRepository.save(producto);
  }

  async remove(id: string): Promise<void> {
    const producto = await this.findOne(id);
    await this.productoRepository.softRemove(producto);
  }

  // === PRODUCTOS POR SUCURSAL ===

  async asignarASucursal(
    sucursalId: string,
    dto: AsignarProductoSucursalDto,
  ): Promise<ProductoSucursal> {
    // Verificar que el producto existe
    await this.findOne(dto.productoId);

    // Crear asignación
    const productoSucursal = this.productoSucursalRepository.create({
      productoId: dto.productoId,
      sucursalId,
      precio: dto.precio,
      activo: dto.activo ?? true,
    });

    const saved = await this.productoSucursalRepository.save(productoSucursal);

    const cantidadInicial = dto.cantidadInicial ?? 0;

    // Crear inventario inicial
    const inventario = this.inventarioRepository.create({
      productoSucursalId: saved.id,
      cantidad: cantidadInicial,
    });
    await this.inventarioRepository.save(inventario);

    // Registrar transacción de ENTRADA si hay stock inicial
    if (cantidadInicial > 0) {
      const transaccion = this.transaccionRepository.create({
        productoSucursalId: saved.id,
        tipoTransaccion: TipoTransaccion.ENTRADA,
        cantidad: cantidadInicial,
        precioUnitario: dto.precio,
        total: cantidadInicial * dto.precio,
        observaciones: 'Stock inicial al asignar producto',
      });
      await this.transaccionRepository.save(transaccion);
    }

    return saved;
  }

  async findBySucursal(
    sucursalId: string,
    filters: FilterProductoDto,
  ): Promise<{ data: ProductoSucursal[]; total: number; page: number; limit: number }> {
    const { tipo, color, talla, search, page = 1, limit = 10 } = filters;

    const queryBuilder = this.productoSucursalRepository
      .createQueryBuilder('ps')
      .leftJoinAndSelect('ps.producto', 'producto')
      .leftJoinAndSelect('ps.inventario', 'inventario')
      .where('ps.sucursal_id = :sucursalId', { sucursalId })
      .andWhere('ps.activo = :activo', { activo: true })
      .andWhere('producto.deleted_at IS NULL');

    if (tipo) {
      queryBuilder.andWhere('producto.tipo = :tipo', { tipo });
    }

    if (color) {
      queryBuilder.andWhere('LOWER(producto.color) = LOWER(:color)', { color });
    }

    if (talla) {
      queryBuilder.andWhere('producto.talla = :talla', { talla });
    }

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(producto.nombre) LIKE LOWER(:search) OR LOWER(producto.marca) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    const total = await queryBuilder.getCount();

    const data = await queryBuilder
      .orderBy('producto.nombre', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total, page, limit };
  }

  async updateProductoSucursal(
    sucursalId: string,
    productoId: string,
    dto: UpdateProductoSucursalDto,
  ): Promise<ProductoSucursal> {
    const productoSucursal = await this.productoSucursalRepository.findOne({
      where: { sucursalId, productoId },
    });

    if (!productoSucursal) {
      throw new NotFoundException(
        `Producto ${productoId} no asignado a sucursal ${sucursalId}`,
      );
    }

    Object.assign(productoSucursal, dto);
    return this.productoSucursalRepository.save(productoSucursal);
  }

  async removeFromSucursal(sucursalId: string, productoId: string): Promise<void> {
    const productoSucursal = await this.productoSucursalRepository.findOne({
      where: { sucursalId, productoId },
    });

    if (!productoSucursal) {
      throw new NotFoundException(
        `Producto ${productoId} no asignado a sucursal ${sucursalId}`,
      );
    }

    productoSucursal.activo = false;
    await this.productoSucursalRepository.save(productoSucursal);
  }

  // === DISPONIBILIDAD CROSS-SUCURSAL ===

  async getDisponibilidad(productoId: string): Promise<
    {
      sucursal: { id: string; nombre: string };
      precio: number;
      stock: number;
    }[]
  > {
    const productosSucursal = await this.productoSucursalRepository.find({
      where: { productoId, activo: true },
      relations: ['sucursal', 'inventario'],
    });

    return productosSucursal.map((ps) => ({
      sucursal: {
        id: ps.sucursal.id,
        nombre: ps.sucursal.nombre,
      },
      precio: Number(ps.precio),
      stock: ps.inventario?.cantidad ?? 0,
    }));
  }

  // === UTILIDADES ===

  async getColoresUnicos(sucursalId?: string): Promise<string[]> {
    const query = this.productoRepository
      .createQueryBuilder('p')
      .select('DISTINCT p.color', 'color')
      .where('p.deleted_at IS NULL');

    if (sucursalId) {
      query
        .innerJoin('p.productosSucursal', 'ps')
        .andWhere('ps.sucursal_id = :sucursalId', { sucursalId });
    }

    const results = await query.getRawMany();
    return results.map((r) => r.color);
  }

  async getTallasUnicas(sucursalId?: string): Promise<string[]> {
    const query = this.productoRepository
      .createQueryBuilder('p')
      .select('DISTINCT p.talla', 'talla')
      .where('p.deleted_at IS NULL');

    if (sucursalId) {
      query
        .innerJoin('p.productosSucursal', 'ps')
        .andWhere('ps.sucursal_id = :sucursalId', { sucursalId });
    }

    const results = await query.getRawMany();
    return results.map((r) => r.talla);
  }

  // === CREAR PRODUCTOS CON RANGO DE TALLAS ===

  /**
   * Genera un array de tallas a partir de un rango
   * Ej: generarTallas("5", "9", true) => ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9"]
   * Ej: generarTallas("25", "28", false) => ["25", "26", "27", "28"]
   */
  private generarTallas(inicio: string, fin: string, incluirMedias: boolean): string[] {
    const tallaInicio = parseFloat(inicio);
    const tallaFin = parseFloat(fin);
    
    if (isNaN(tallaInicio) || isNaN(tallaFin) || tallaInicio > tallaFin) {
      return [inicio]; // Si no es un rango válido, devolver solo el inicio
    }

    const tallas: string[] = [];
    const incremento = incluirMedias ? 0.5 : 1;

    for (let t = tallaInicio; t <= tallaFin; t += incremento) {
      // Formatear la talla correctamente (ej: 5 -> "5", 5.5 -> "5.5")
      const tallaStr = Number.isInteger(t) ? t.toString() : t.toFixed(1);
      tallas.push(tallaStr);
    }

    return tallas;
  }

  async createConRango(dto: CreateProductoRangoDto): Promise<Producto[]> {
    const tallas = this.generarTallas(
      dto.tallaInicio,
      dto.tallaFin,
      dto.incluirMedias ?? true, // Por defecto incluir medias tallas
    );

    const productos: Producto[] = [];
    const grupoId = uuidv4(); // Mismo grupoId para todas las tallas

    for (const talla of tallas) {
      const producto = this.productoRepository.create({
        nombre: dto.nombre,
        marca: dto.marca,
        modelo: dto.modelo,
        color: dto.color,
        talla,
        tipo: dto.tipo,
        descripcion: dto.descripcion,
        grupoId, // Asignar el grupoId compartido
      });
      const saved = await this.productoRepository.save(producto);
      productos.push(saved);
    }

    return productos;
  }

  // === CREAR PRODUCTOS CON MÚLTIPLES TALLAS SELECCIONADAS ===

  async createConMultiTallas(dto: CreateProductoMultiTallaDto): Promise<Producto[]> {
    const productos: Producto[] = [];
    const grupoId = uuidv4(); // Mismo grupoId para todas las tallas

    for (const tallaData of dto.tallas) {
      const producto = this.productoRepository.create({
        nombre: dto.nombre,
        marca: dto.marca,
        modelo: dto.modelo,
        color: dto.color,
        talla: tallaData.talla,
        tipo: dto.tipo,
        descripcion: dto.descripcion,
        imagenUrl: dto.imagenUrl,
        grupoId,
      });
      const saved = await this.productoRepository.save(producto);
      productos.push(saved);
    }

    return productos;
  }
}
