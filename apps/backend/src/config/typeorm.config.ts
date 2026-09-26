import { Bitacora } from '../modules/bitacora/entities/bitacora.entity';
import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Cliente } from '@modules/clientes/entities/cliente.entity';
import { Empleado } from '@modules/empleados/entities/empleado.entity';
import { Sesion } from '@modules/auth/entities/sesion.entity';
import { LogAcceso } from '@modules/auth/entities/log-acceso.entity';
import { Editorial } from '@modules/catalogo/entities/editorial.entity';
import { Categoria } from '@modules/catalogo/entities/categoria.entity';
import { Autor } from '@modules/catalogo/entities/autor.entity';
import { Libro } from '@modules/catalogo/entities/libro.entity';
import { LibroAutor } from '@modules/catalogo/entities/libro-autor.entity';
import { MovimientoInventario } from '@modules/inventario/entities/movimiento-inventario.entity';
import { TransaccionPuntos } from '@modules/clientes/entities/transaccion-puntos.entity';
import { Venta } from '@modules/ventas/entities/venta.entity';
import { DetalleVenta } from '@modules/ventas/entities/detalle-venta.entity';
import { Proveedor } from '@modules/proveedores/entities/proveedor.entity';
import { PedidoCompra } from '@modules/proveedores/entities/pedido-compra.entity';
import { DetallePedidoCompra } from '@modules/proveedores/entities/detalle-pedido-compra.entity';
import { Configuracion } from '@modules/configuracion/entities/configuracion.entity';
import { Carrito } from '@modules/carrito/entities/carrito.entity';
import { RecuperacionPassword } from '@modules/auth/entities/recuperacion-password.entity';
import { ListaDeseos } from '@modules/lista-deseos/entities/lista-deseos.entity';
import { ItemCarrito } from '@modules/carrito/entities/item-carrito.entity';
import { DireccionEntrega } from '@modules/pedidos/entities/direccion-entrega.entity';
import { PedidoLinea } from '@modules/pedidos/entities/pedido-linea.entity';
import { DetallePedidoLinea } from '@modules/pedidos/entities/detalle-pedido-linea.entity';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'bibliohubv1',
    entities: [
      Bitacora,
      Cliente,
      Empleado,
      Sesion,
      LogAcceso,
      Editorial,
      Categoria,
      Autor,
      Libro,
      LibroAutor,
      MovimientoInventario,
      TransaccionPuntos,
      Venta,
      DetalleVenta,
      Proveedor,
      PedidoCompra,
      DetallePedidoCompra,
      Configuracion,
      Carrito,
      ListaDeseos,
      RecuperacionPassword,
      ItemCarrito,
      DireccionEntrega,
      PedidoLinea,
      DetallePedidoLinea,
    ],
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
  }),
);
