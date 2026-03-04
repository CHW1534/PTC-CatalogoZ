import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sucursal } from './entities/sucursal.entity';
import { CreateSucursalDto, UpdateSucursalDto } from './dto';

@Injectable()
export class SucursalService {
  constructor(
    @InjectRepository(Sucursal)
    private readonly sucursalRepository: Repository<Sucursal>,
  ) {}

  async create(createSucursalDto: CreateSucursalDto): Promise<Sucursal> {
    const sucursal = this.sucursalRepository.create(createSucursalDto);
    return this.sucursalRepository.save(sucursal);
  }

  async findAll(): Promise<Sucursal[]> {
    return this.sucursalRepository.find({
      where: { activa: true },
      order: { nombre: 'ASC' },
    });
  }

  async findAllIncludingInactive(): Promise<Sucursal[]> {
    return this.sucursalRepository.find({
      order: { activa: 'DESC', nombre: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Sucursal> {
    const sucursal = await this.sucursalRepository.findOne({ where: { id } });
    if (!sucursal) {
      throw new NotFoundException(`Sucursal con ID ${id} no encontrada`);
    }
    return sucursal;
  }

  async update(id: string, updateSucursalDto: UpdateSucursalDto): Promise<Sucursal> {
    const sucursal = await this.findOne(id);
    Object.assign(sucursal, updateSucursalDto);
    return this.sucursalRepository.save(sucursal);
  }

  async remove(id: string): Promise<void> {
    const sucursal = await this.findOne(id);
    sucursal.activa = false;
    await this.sucursalRepository.save(sucursal);
  }
}
