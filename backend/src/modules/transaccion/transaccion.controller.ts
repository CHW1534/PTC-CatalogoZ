import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TransaccionService } from './transaccion.service';
import { CreateTransaccionDto, FilterTransaccionDto } from './dto';

@Controller('api/transacciones')
export class TransaccionController {
  constructor(private readonly transaccionService: TransaccionService) {}

  @Get()
  findAll(@Query() filters: FilterTransaccionDto) {
    return this.transaccionService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.transaccionService.findOne(id);
  }

  @Post('entrada')
  registrarEntrada(@Body() dto: CreateTransaccionDto) {
    return this.transaccionService.registrarEntrada(dto);
  }

  @Post('salida')
  registrarSalida(@Body() dto: CreateTransaccionDto) {
    return this.transaccionService.registrarSalida(dto);
  }
}
