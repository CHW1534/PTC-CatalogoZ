import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InventarioService } from './inventario.service';
import { UpdateInventarioDto } from './dto';

@Controller('api/inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Get()
  findAll() {
    return this.inventarioService.findAll();
  }

  @Get('sucursal/:sucursalId')
  getBySucursal(@Param('sucursalId', ParseUUIDPipe) sucursalId: string) {
    return this.inventarioService.getStockBySucursal(sucursalId);
  }

  @Get(':productoSucursalId')
  findOne(@Param('productoSucursalId', ParseUUIDPipe) productoSucursalId: string) {
    return this.inventarioService.findByProductoSucursal(productoSucursalId);
  }

  @Patch(':productoSucursalId')
  update(
    @Param('productoSucursalId', ParseUUIDPipe) productoSucursalId: string,
    @Body() dto: UpdateInventarioDto,
  ) {
    return this.inventarioService.update(productoSucursalId, dto);
  }
}
