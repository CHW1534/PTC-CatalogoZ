import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSucursal } from '../context';
import { transaccionesService } from '../services';

export function MonitorVentas() {
    const { selectedSucursal } = useSucursal();

    const { data: transacciones = [], isLoading, error } = useQuery({
        queryKey: ['transacciones', selectedSucursal?.id],
        queryFn: () => selectedSucursal ? transaccionesService.getAll({ sucursalId: selectedSucursal.id }) : Promise.resolve([]),
        enabled: !!selectedSucursal
    });

    console.log("Transacciones from Monitor:", transacciones);

    const { totalEntradas, totalSalidas, ingresosGenerados, topProductos } = useMemo(() => {
        let entradas = 0;
        let salidas = 0;
        let ingresos = 0;
        const productosMap = new Map<string, { nombre: string, cantidad: number, ingresos: number }>();

        transacciones.forEach(t => {
            const cantidadNum = Number(t.cantidad) || 0;
            const totalNum = Number(t.total) || 0;

            if (t.tipoTransaccion === 'ENTRADA') {
                entradas += cantidadNum;
            } else if (t.tipoTransaccion === 'SALIDA') {
                salidas += cantidadNum;
                // Total money (precio * cantidad)
                ingresos += totalNum;

                // Add to top productos
                if (t.productoSucursal?.producto?.nombre) {
                    const key = t.productoSucursal.producto.nombre;
                    const current = productosMap.get(key) || { nombre: key, cantidad: 0, ingresos: 0 };
                    current.cantidad += cantidadNum;
                    current.ingresos += totalNum;
                    productosMap.set(key, current);
                }
            }
        });

        const top = Array.from(productosMap.values()).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);

        return {
            totalEntradas: entradas,
            totalSalidas: salidas,
            ingresosGenerados: ingresos,
            topProductos: top
        };
    }, [transacciones]);

    if (!selectedSucursal) {
        return <div className="p-8 text-center text-gray-500 font-medium bg-white rounded-2xl border border-gray-100 shadow-sm">Selecciona una sucursal para ver el monitor</div>;
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <svg className="animate-spin mb-4 h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span className="text-gray-500 font-medium">Cargando monitor...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center font-medium">
                Error al cargar las transacciones. Por favor intenta de nuevo.
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                    <div className="space-y-1">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Entradas (Stock)</div>
                        <div className="text-3xl font-black text-emerald-600">+{totalEntradas}</div>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                    <div className="space-y-1">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Salidas / Ventas</div>
                        <div className="text-3xl font-black text-red-600">-{totalSalidas}</div>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                    <div className="space-y-1">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ingresos Generados</div>
                        <div className="text-3xl font-black text-blue-600">${ingresosGenerados.toFixed(2)}</div>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Productos con Mayor Movimiento</h3>
                    <p className="text-sm text-gray-500 mt-1">Los 10 productos más vendidos en esta sucursal</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50/80 uppercase text-xs font-bold text-gray-500 tracking-wider">
                            <tr>
                                <th className="px-6 py-4 border-b border-gray-100">#</th>
                                <th className="px-6 py-4 border-b border-gray-100">Nombre del Producto</th>
                                <th className="px-6 py-4 border-b border-gray-100">Cantidad Vendida</th>
                                <th className="px-6 py-4 border-b border-gray-100">Ingresos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {topProductos.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                        No hay suficientes datos de ventas para mostrar los productos más populares.
                                    </td>
                                </tr>
                            ) : (
                                topProductos.map((prod, index) => (
                                    <tr key={prod.nombre} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-400">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            {prod.nombre}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                                                {prod.cantidad} unid.
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            ${prod.ingresos.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
