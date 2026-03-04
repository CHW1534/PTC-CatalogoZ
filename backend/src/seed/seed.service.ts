import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sucursal } from '../modules/sucursal/entities/sucursal.entity';
import { Producto } from '../modules/producto/entities/producto.entity';
import { ProductoSucursal } from '../modules/producto/entities/producto-sucursal.entity';
import { Inventario } from '../modules/inventario/entities/inventario.entity';
import { TipoProducto } from '../common/enums';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Sucursal)
    private sucursalRepository: Repository<Sucursal>,
    @InjectRepository(Producto)
    private productoRepository: Repository<Producto>,
    @InjectRepository(ProductoSucursal)
    private productoSucursalRepository: Repository<ProductoSucursal>,
    @InjectRepository(Inventario)
    private inventarioRepository: Repository<Inventario>,
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    if (process.env.RUN_SEED === 'true') {
      await this.seed();
    }
  }

  async seed() {
    const existingSucursales = await this.sucursalRepository.count();
    if (existingSucursales > 0) {
      this.logger.log('Base de datos ya tiene datos, omitiendo seed');
      return;
    }

    this.logger.log('Iniciando seed de datos de demostracion...');

    try {
      // Crear sucursales
      const sucursales = await this.crearSucursales();
      this.logger.log(`Creadas ${sucursales.length} sucursales`);

      // Crear productos
      const productos = await this.crearProductos();
      this.logger.log(`Creados ${productos.length} productos`);

      // Asignar productos a sucursales con precios e inventario
      await this.asignarProductosASucursales(sucursales, productos);
      this.logger.log('Productos asignados a sucursales con inventario');

      this.logger.log('Seed completado exitosamente');
    } catch (error) {
      this.logger.error('Error durante el seed:', error);
      throw error;
    }
  }

  private async crearSucursales(): Promise<Sucursal[]> {
    const sucursalesData = [
      {
        nombre: 'Centro Historico',
        direccion: 'Av. Juarez 123, Col. Centro',
        telefono: '555-100-2000',
        activa: true,
      },
      {
        nombre: 'Plaza Norte',
        direccion: 'Blvd. Norte 456, Plaza Comercial Norte',
        telefono: '555-200-3000',
        activa: true,
      },
      {
        nombre: 'Galerias Sur',
        direccion: 'Av. Insurgentes Sur 789, Galerias',
        telefono: '555-300-4000',
        activa: true,
      },
    ];

    const sucursales: Sucursal[] = [];
    for (const data of sucursalesData) {
      const sucursal = this.sucursalRepository.create(data);
      sucursales.push(await this.sucursalRepository.save(sucursal));
    }
    return sucursales;
  }

  private async crearProductos(): Promise<Producto[]> {
    const productosData = [
      // ZAPATOS - Dama
      { nombre: 'Stiletto Elegance', marca: 'Flexi', modelo: 'STL-001', color: 'Negro', talla: '24', tipo: TipoProducto.ZAPATO, descripcion: 'Zapatilla de tacon alto para ocasiones especiales' },
      { nombre: 'Stiletto Elegance', marca: 'Flexi', modelo: 'STL-001', color: 'Negro', talla: '25', tipo: TipoProducto.ZAPATO, descripcion: 'Zapatilla de tacon alto para ocasiones especiales' },
      { nombre: 'Stiletto Elegance', marca: 'Flexi', modelo: 'STL-001', color: 'Rojo', talla: '24', tipo: TipoProducto.ZAPATO, descripcion: 'Zapatilla de tacon alto para ocasiones especiales' },
      { nombre: 'Stiletto Elegance', marca: 'Flexi', modelo: 'STL-001', color: 'Rojo', talla: '25', tipo: TipoProducto.ZAPATO, descripcion: 'Zapatilla de tacon alto para ocasiones especiales' },
      { nombre: 'Flat Comfort', marca: 'Andrea', modelo: 'FLT-200', color: 'Beige', talla: '23', tipo: TipoProducto.ZAPATO, descripcion: 'Ballerina comoda para uso diario' },
      { nombre: 'Flat Comfort', marca: 'Andrea', modelo: 'FLT-200', color: 'Beige', talla: '24', tipo: TipoProducto.ZAPATO, descripcion: 'Ballerina comoda para uso diario' },
      { nombre: 'Flat Comfort', marca: 'Andrea', modelo: 'FLT-200', color: 'Rosa', talla: '23', tipo: TipoProducto.ZAPATO, descripcion: 'Ballerina comoda para uso diario' },
      { nombre: 'Sandalia Verano', marca: 'Price Shoes', modelo: 'SND-100', color: 'Dorado', talla: '24', tipo: TipoProducto.ZAPATO, descripcion: 'Sandalia con plataforma para verano' },
      { nombre: 'Sandalia Verano', marca: 'Price Shoes', modelo: 'SND-100', color: 'Plateado', talla: '25', tipo: TipoProducto.ZAPATO, descripcion: 'Sandalia con plataforma para verano' },
      
      // ZAPATOS - Caballero
      { nombre: 'Oxford Classic', marca: 'Flexi', modelo: 'OXF-500', color: 'Negro', talla: '27', tipo: TipoProducto.ZAPATO, descripcion: 'Zapato de vestir clasico para caballero' },
      { nombre: 'Oxford Classic', marca: 'Flexi', modelo: 'OXF-500', color: 'Negro', talla: '28', tipo: TipoProducto.ZAPATO, descripcion: 'Zapato de vestir clasico para caballero' },
      { nombre: 'Oxford Classic', marca: 'Flexi', modelo: 'OXF-500', color: 'Cafe', talla: '27', tipo: TipoProducto.ZAPATO, descripcion: 'Zapato de vestir clasico para caballero' },
      { nombre: 'Oxford Classic', marca: 'Flexi', modelo: 'OXF-500', color: 'Cafe', talla: '28', tipo: TipoProducto.ZAPATO, descripcion: 'Zapato de vestir clasico para caballero' },
      { nombre: 'Mocasin Casual', marca: 'Quirelli', modelo: 'MOC-300', color: 'Azul Marino', talla: '26', tipo: TipoProducto.ZAPATO, descripcion: 'Mocasin casual sin agujetas' },
      { nombre: 'Mocasin Casual', marca: 'Quirelli', modelo: 'MOC-300', color: 'Azul Marino', talla: '27', tipo: TipoProducto.ZAPATO, descripcion: 'Mocasin casual sin agujetas' },
      { nombre: 'Mocasin Casual', marca: 'Quirelli', modelo: 'MOC-300', color: 'Cafe', talla: '27', tipo: TipoProducto.ZAPATO, descripcion: 'Mocasin casual sin agujetas' },
      
      // ZAPATOS - Deportivos
      { nombre: 'Runner Sport', marca: 'Nike', modelo: 'RUN-800', color: 'Blanco', talla: '26', tipo: TipoProducto.ZAPATO, descripcion: 'Tenis deportivo para correr' },
      { nombre: 'Runner Sport', marca: 'Nike', modelo: 'RUN-800', color: 'Blanco', talla: '27', tipo: TipoProducto.ZAPATO, descripcion: 'Tenis deportivo para correr' },
      { nombre: 'Runner Sport', marca: 'Nike', modelo: 'RUN-800', color: 'Negro', talla: '26', tipo: TipoProducto.ZAPATO, descripcion: 'Tenis deportivo para correr' },
      { nombre: 'Runner Sport', marca: 'Nike', modelo: 'RUN-800', color: 'Negro', talla: '27', tipo: TipoProducto.ZAPATO, descripcion: 'Tenis deportivo para correr' },
      { nombre: 'Urban Skate', marca: 'Vans', modelo: 'USK-400', color: 'Negro', talla: '25', tipo: TipoProducto.ZAPATO, descripcion: 'Tenis estilo skate urbano' },
      { nombre: 'Urban Skate', marca: 'Vans', modelo: 'USK-400', color: 'Gris', talla: '26', tipo: TipoProducto.ZAPATO, descripcion: 'Tenis estilo skate urbano' },
      { nombre: 'Retro Classic', marca: 'Adidas', modelo: 'RTC-600', color: 'Blanco/Verde', talla: '27', tipo: TipoProducto.ZAPATO, descripcion: 'Tenis clasico estilo retro' },
      { nombre: 'Retro Classic', marca: 'Adidas', modelo: 'RTC-600', color: 'Blanco/Azul', talla: '26', tipo: TipoProducto.ZAPATO, descripcion: 'Tenis clasico estilo retro' },
      
      // BOLSAS - Dama
      { nombre: 'Tote Bag Executive', marca: 'Michael Kors', modelo: 'TBE-100', color: 'Negro', talla: 'Grande', tipo: TipoProducto.BOLSA, descripcion: 'Bolsa grande ideal para trabajo' },
      { nombre: 'Tote Bag Executive', marca: 'Michael Kors', modelo: 'TBE-100', color: 'Cafe', talla: 'Grande', tipo: TipoProducto.BOLSA, descripcion: 'Bolsa grande ideal para trabajo' },
      { nombre: 'Tote Bag Executive', marca: 'Michael Kors', modelo: 'TBE-100', color: 'Vino', talla: 'Grande', tipo: TipoProducto.BOLSA, descripcion: 'Bolsa grande ideal para trabajo' },
      { nombre: 'Crossbody Mini', marca: 'Guess', modelo: 'CBM-200', color: 'Rosa', talla: 'Chica', tipo: TipoProducto.BOLSA, descripcion: 'Bolsa cruzada pequena para salir' },
      { nombre: 'Crossbody Mini', marca: 'Guess', modelo: 'CBM-200', color: 'Negro', talla: 'Chica', tipo: TipoProducto.BOLSA, descripcion: 'Bolsa cruzada pequena para salir' },
      { nombre: 'Crossbody Mini', marca: 'Guess', modelo: 'CBM-200', color: 'Beige', talla: 'Chica', tipo: TipoProducto.BOLSA, descripcion: 'Bolsa cruzada pequena para salir' },
      { nombre: 'Clutch Elegante', marca: 'Coach', modelo: 'CLE-300', color: 'Dorado', talla: 'Clutch', tipo: TipoProducto.BOLSA, descripcion: 'Clutch de fiesta con cadena' },
      { nombre: 'Clutch Elegante', marca: 'Coach', modelo: 'CLE-300', color: 'Plateado', talla: 'Clutch', tipo: TipoProducto.BOLSA, descripcion: 'Clutch de fiesta con cadena' },
      { nombre: 'Clutch Elegante', marca: 'Coach', modelo: 'CLE-300', color: 'Negro', talla: 'Clutch', tipo: TipoProducto.BOLSA, descripcion: 'Clutch de fiesta con cadena' },
      { nombre: 'Mochila Casual', marca: 'Kipling', modelo: 'MCH-400', color: 'Azul', talla: 'Mediana', tipo: TipoProducto.BOLSA, descripcion: 'Mochila ligera para uso diario' },
      { nombre: 'Mochila Casual', marca: 'Kipling', modelo: 'MCH-400', color: 'Morado', talla: 'Mediana', tipo: TipoProducto.BOLSA, descripcion: 'Mochila ligera para uso diario' },
      { nombre: 'Mochila Casual', marca: 'Kipling', modelo: 'MCH-400', color: 'Negro', talla: 'Mediana', tipo: TipoProducto.BOLSA, descripcion: 'Mochila ligera para uso diario' },
      { nombre: 'Shopper Weekend', marca: 'Fossil', modelo: 'SHW-500', color: 'Cafe', talla: 'Extra Grande', tipo: TipoProducto.BOLSA, descripcion: 'Bolsa grande para viajes cortos' },
      { nombre: 'Shopper Weekend', marca: 'Fossil', modelo: 'SHW-500', color: 'Negro', talla: 'Extra Grande', tipo: TipoProducto.BOLSA, descripcion: 'Bolsa grande para viajes cortos' },
      
      // BOLSAS - Caballero
      { nombre: 'Portafolio Business', marca: 'Samsonite', modelo: 'PFB-100', color: 'Negro', talla: 'Ejecutivo', tipo: TipoProducto.BOLSA, descripcion: 'Portafolio ejecutivo con compartimento laptop' },
      { nombre: 'Portafolio Business', marca: 'Samsonite', modelo: 'PFB-100', color: 'Cafe', talla: 'Ejecutivo', tipo: TipoProducto.BOLSA, descripcion: 'Portafolio ejecutivo con compartimento laptop' },
      { nombre: 'Messenger Casual', marca: 'Fossil', modelo: 'MSG-200', color: 'Cafe', talla: 'Mediana', tipo: TipoProducto.BOLSA, descripcion: 'Bolsa messenger estilo casual' },
      { nombre: 'Messenger Casual', marca: 'Fossil', modelo: 'MSG-200', color: 'Negro', talla: 'Mediana', tipo: TipoProducto.BOLSA, descripcion: 'Bolsa messenger estilo casual' },
      { nombre: 'Backpack Tech', marca: 'Tumi', modelo: 'BPT-300', color: 'Negro', talla: 'Grande', tipo: TipoProducto.BOLSA, descripcion: 'Mochila con multiples compartimentos tecnologicos' },
      { nombre: 'Backpack Tech', marca: 'Tumi', modelo: 'BPT-300', color: 'Gris', talla: 'Grande', tipo: TipoProducto.BOLSA, descripcion: 'Mochila con multiples compartimentos tecnologicos' },
    ];

    const productos: Producto[] = [];
    for (const data of productosData) {
      const producto = this.productoRepository.create(data);
      productos.push(await this.productoRepository.save(producto));
    }
    return productos;
  }

  private async asignarProductosASucursales(sucursales: Sucursal[], productos: Producto[]) {
    // Precios base por tipo de producto
    const preciosBase: Record<string, number> = {
      'Stiletto Elegance': 1299,
      'Flat Comfort': 599,
      'Sandalia Verano': 799,
      'Oxford Classic': 1499,
      'Mocasin Casual': 1199,
      'Runner Sport': 1899,
      'Urban Skate': 1099,
      'Retro Classic': 1599,
      'Tote Bag Executive': 2499,
      'Crossbody Mini': 899,
      'Clutch Elegante': 1299,
      'Mochila Casual': 999,
      'Shopper Weekend': 1799,
      'Portafolio Business': 2999,
      'Messenger Casual': 1399,
      'Backpack Tech': 3499,
    };

    for (const sucursal of sucursales) {
      // Cada sucursal tiene precios ligeramente diferentes
      const factorPrecio = sucursal.nombre === 'Centro Historico' ? 1.0 
        : sucursal.nombre === 'Plaza Norte' ? 1.05 
        : 1.1;
      
      // Asignar la mayoria de productos a cada sucursal (algunos productos no estaran en todas)
      for (let i = 0; i < productos.length; i++) {
        // 80% de probabilidad de tener el producto en esta sucursal
        if (Math.random() > 0.2) {
          const producto = productos[i];
          const precioBase = preciosBase[producto.nombre] || 999;
          const precio = Math.round(precioBase * factorPrecio);
          
          const productoSucursal = this.productoSucursalRepository.create({
            productoId: producto.id,
            sucursalId: sucursal.id,
            precio,
            activo: true,
          });
          const savedPS = await this.productoSucursalRepository.save(productoSucursal);

          // Crear inventario con cantidad aleatoria
          const inventario = this.inventarioRepository.create({
            productoSucursalId: savedPS.id,
            cantidad: Math.floor(Math.random() * 15) + 3, // Entre 3 y 17 unidades
          });
          await this.inventarioRepository.save(inventario);
        }
      }
    }
  }
}
