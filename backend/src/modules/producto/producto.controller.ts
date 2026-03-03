import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProductoService } from './producto.service';
import {
  CreateProductoDto,
  CreateProductoRangoDto,
  UpdateProductoDto,
  AsignarProductoSucursalDto,
  UpdateProductoSucursalDto,
  FilterProductoDto,
} from './dto';

@Controller('api')
export class ProductoController {
  constructor(private readonly productoService: ProductoService) {}

  // === PRODUCTOS BASE ===

  @Post('productos')
  create(@Body() createProductoDto: CreateProductoDto) {
    return this.productoService.create(createProductoDto);
  }

  @Post('productos/rango')
  createConRango(@Body() dto: CreateProductoRangoDto) {
    return this.productoService.createConRango(dto);
  }

  @Get('productos')
  findAll() {
    return this.productoService.findAll();
  }

  @Get('productos/colores')
  getColores(@Query('sucursalId') sucursalId?: string) {
    return this.productoService.getColoresUnicos(sucursalId);
  }

  @Get('productos/tallas')
  getTallas(@Query('sucursalId') sucursalId?: string) {
    return this.productoService.getTallasUnicas(sucursalId);
  }

  @Get('productos/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productoService.findOne(id);
  }

  @Get('productos/:id/disponibilidad')
  getDisponibilidad(@Param('id', ParseUUIDPipe) id: string) {
    return this.productoService.getDisponibilidad(id);
  }

  @Patch('productos/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductoDto: UpdateProductoDto,
  ) {
    return this.productoService.update(id, updateProductoDto);
  }

  @Delete('productos/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productoService.remove(id);
  }

  // === PRODUCTOS POR SUCURSAL ===

  @Get('sucursales/:sucursalId/productos')
  findBySucursal(
    @Param('sucursalId', ParseUUIDPipe) sucursalId: string,
    @Query() filters: FilterProductoDto,
  ) {
    return this.productoService.findBySucursal(sucursalId, filters);
  }

  @Post('sucursales/:sucursalId/productos')
  asignarASucursal(
    @Param('sucursalId', ParseUUIDPipe) sucursalId: string,
    @Body() dto: AsignarProductoSucursalDto,
  ) {
    return this.productoService.asignarASucursal(sucursalId, dto);
  }

  @Patch('sucursales/:sucursalId/productos/:productoId')
  updateProductoSucursal(
    @Param('sucursalId', ParseUUIDPipe) sucursalId: string,
    @Param('productoId', ParseUUIDPipe) productoId: string,
    @Body() dto: UpdateProductoSucursalDto,
  ) {
    return this.productoService.updateProductoSucursal(sucursalId, productoId, dto);
  }

  @Delete('sucursales/:sucursalId/productos/:productoId')
  removeFromSucursal(
    @Param('sucursalId', ParseUUIDPipe) sucursalId: string,
    @Param('productoId', ParseUUIDPipe) productoId: string,
  ) {
    return this.productoService.removeFromSucursal(sucursalId, productoId);
  }
}
