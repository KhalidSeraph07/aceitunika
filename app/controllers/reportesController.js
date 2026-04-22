const ExcelJS = require('exceljs');
const { toCamelCase } = require('../utils/helpers');

const reportesController = {
    getReporte: async (request, reply) => {
        const fastify = request.server;
        const user = request.session.user;
        const client = await fastify.pg.connect();

        try {
            const { periodo, tipoEnvase, lote, fechaInicio, fechaFin } = request.query;
            let where = [];
            let params = [];
            let paramIndex = 1;

            if (periodo === 'today') {
                where.push(`e.fecha = $${paramIndex++}`);
                params.push(new Date().toISOString().split('T')[0]);
            } else if (periodo === 'week') {
                const now = new Date();
                const first = now.getDate() - now.getDay() + 1;
                const firstDay = new Date(now.setDate(first)).toISOString().split('T')[0];
                where.push(`e.fecha >= $${paramIndex++}`);
                params.push(firstDay);
            } else if (periodo === 'month') {
                const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
                where.push(`e.fecha >= $${paramIndex++}`);
                params.push(firstDay);
            } else if (periodo === 'custom' && fechaInicio && fechaFin) {
                where.push(`e.fecha BETWEEN $${paramIndex++} AND $${paramIndex++}`);
                params.push(fechaInicio, fechaFin);
            }

            if (tipoEnvase) {
                where.push(`e.tipo_envase = $${paramIndex++}`);
                params.push(tipoEnvase);
            }

            if (lote) {
                where.push(`e.codigo_lote = $${paramIndex++}`);
                params.push(lote);
            }

            const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
            const sql = `
                SELECT e.*
                FROM entradas e
                ${whereClause}
                ORDER BY e.codigo_lote, e.fecha DESC
            `;

            const { rows: entradas } = await client.query(sql, params);

            for (let entrada of entradas) {
                const { rows: calibres } = await client.query('SELECT * FROM calibres WHERE entrada_id = $1', [entrada.id]);
                entrada.calibres = calibres;

                const { rows: otrosGastos } = await client.query('SELECT * FROM otros_gastos WHERE entrada_id = $1', [entrada.id]);
                entrada.otrosGastos = otrosGastos;
            }

            const { rows: lotesRows } = await client.query('SELECT DISTINCT codigo_lote FROM entradas WHERE codigo_lote IS NOT NULL ORDER BY codigo_lote');
            const lotes = lotesRows.map(r => r.codigo_lote);

            return { data: toCamelCase(entradas), lotes };
        } finally {
            client.release();
        }
    },

    getInventario: async (request, reply) => {
        const client = await request.server.pg.connect();
        try {
            const { rows: fisico } = await client.query(`
                SELECT
                  f.nombre as fila,
                  c.nombre as cuadrante,
                  c.id as cuadrante_id,
                  la.codigo_lote,
                  la.entrada_id,
                  ca.calibre,
                  ca.kg,
                  ca.cantidad_envases,
                  ca.pucho
                FROM filas f
                JOIN cuadrantes c ON c.fila_id = f.id
                JOIN lotes_almacen la ON la.cuadrante_id = c.id
                JOIN calibres_almacen ca ON ca.lote_almacen_id = la.id
                ORDER BY f.nombre, c.nombre, la.codigo_lote
            `);

            const { rows: puchos } = await client.query(`
                SELECT
                  f.nombre as fila,
                  c.nombre as cuadrante,
                  c.id as cuadrante_id,
                  pd.calibre,
                  pd.color,
                  pd.kg,
                  pd.fecha_aporte,
                  COALESCE(la.codigo_lote, e.codigo_lote) as codigo_lote
                FROM filas f
                JOIN cuadrantes c ON c.fila_id = f.id
                JOIN puchos_detalle pd ON pd.cuadrante_id = c.id
                LEFT JOIN lotes_almacen la ON pd.lote_origen_id = la.id
                LEFT JOIN entradas e ON pd.entrada_id = e.id
                ORDER BY f.nombre, c.nombre, pd.fecha_aporte DESC
            `);

            return {
                fisico: toCamelCase(fisico),
                puchos: toCamelCase(puchos),
                fechaReporte: new Date().toISOString()
            };
        } finally {
            client.release();
        }
    },

    exportExcel: async (request, reply) => {
        const fastify = request.server;
        const user = request.session.user;
        const client = await fastify.pg.connect();

        try {
            if (user.rol !== 'admin') {
                return reply.code(403).send({ error: 'No tiene permisos' });
            }

            const { rows: entradas } = await client.query(`
                SELECT e.*,
                    COALESCE((SELECT SUM(kg) FROM calibres_almacen ca JOIN lotes_almacen la ON ca.lote_almacen_id = la.id WHERE la.entrada_id = e.id), 0) as kg_almacen,
                    COALESCE((SELECT SUM(kg) FROM puchos_detalle pd WHERE pd.entrada_id = e.id), 0) as kg_puchos
                FROM entradas e
                ORDER BY e.codigo_lote, e.fecha DESC
            `);

            for (let entrada of entradas) {
                const { rows: calibres } = await client.query(
                    'SELECT calibre, kg, cantidad_envases, subtotal, precio FROM calibres WHERE entrada_id = $1 ORDER BY calibre',
                    [entrada.id]
                );
                entrada.calibres = calibres;
            }

            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'Aceitunas SAS';
            workbook.created = new Date();

            const ws = workbook.addWorksheet('Reporte General');
            ws.properties.defaultRowHeight = 15;

            const titleRow = ws.addRow(['REPORTE GENERAL DE ENTRADAS - ACEITUNAS SAS']);
            titleRow.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
            titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4332' } };
            titleRow.height = 22;
            ws.mergeCells('A1:N1');
            titleRow.alignment = { horizontal: 'center', vertical: 'middle' };

            const dateRow = ws.addRow([`Generado: ${new Date().toLocaleDateString('es-PE')}`]);
            dateRow.font = { size: 10, italic: true, color: { argb: 'FF6B7280' } };
            ws.mergeCells('A2:N2');

            ws.addRow([]);

            const headers = [
                'Fecha', 'Lote', 'Vendedor', 'Supervisor', 'Lugar',
                'Tipo Envase', 'Cantidad (kg)', 'Precio', 'Total',
                'Kg Almacén', 'Kg Puchos', 'Variedad', 'Color', 'Observaciones'
            ];
            const headerRow = ws.addRow(headers);
            headerRow.eachCell(cell => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D6A4F' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' }, bottom: { style: 'thin' },
                    left: { style: 'thin' }, right: { style: 'thin' }
                };
            });
            headerRow.height = 18;

            let alternate = false;
            for (const entrada of entradas) {
                const rowData = [
                    entrada.fecha ? new Date(entrada.fecha) : '',
                    entrada.codigo_lote || '',
                    entrada.vendedor || '',
                    entrada.supervisor || '',
                    entrada.lugar || '',
                    entrada.tipo_envase || '',
                    entrada.cantidad || 0,
                    entrada.precio || 0,
                    entrada.total || 0,
                    entrada.kg_almacen || 0,
                    entrada.kg_puchos || 0,
                    entrada.variedad || '',
                    entrada.color || '',
                    entrada.observaciones || ''
                ];
                const row = ws.addRow(rowData);
                row.eachCell(cell => {
                    const altFill = alternate
                        ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD8F3DC' } }
                        : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
                    cell.fill = altFill;
                    cell.border = {
                        top: { style: 'thin' }, bottom: { style: 'thin' },
                        left: { style: 'thin' }, right: { style: 'thin' }
                    };
                    if (cell.column > 6 && cell.column <= 10) {
                        cell.numFmt = '#,##0.00';
                    } else if (cell.column >= 7 && cell.column <= 9) {
                        cell.numFmt = 'S/ #,##0.00';
                    }
                });
                alternate = !alternate;
            }

            ws.columns = [
                { width: 12 }, { width: 14 }, { width: 18 }, { width: 14 },
                { width: 16 }, { width: 10 }, { width: 12 }, { width: 10 },
                { width: 12 }, { width: 12 }, { width: 10 }, { width: 12 },
                { width: 8 }, { width: 20 }
            ];

            ws.addRow([]);
            const calibresSheet = workbook.addWorksheet('Detalle Calibres');
            const calTitleRow = calibresSheet.addRow(['DETALLE POR CALIBRES']);
            calTitleRow.font = { size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
            calTitleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4332' } };
            calTitleRow.height = 20;
            calibresSheet.mergeCells('A1:G1');
            calTitleRow.alignment = { horizontal: 'center', vertical: 'middle' };

            const calHeaders = ['Lote', 'Fecha', 'Calibre', 'Bidones', 'Kg/Bidón', 'Subtotal (kg)', 'Precio Venta'];
            const calHeaderRow = calibresSheet.addRow(calHeaders);
            calHeaderRow.eachCell(cell => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D6A4F' } };
                cell.alignment = { horizontal: 'center' };
                cell.border = {
                    top: { style: 'thin' }, bottom: { style: 'thin' },
                    left: { style: 'thin' }, right: { style: 'thin' }
                };
            });

            for (const entrada of entradas) {
                if (entrada.calibres && entrada.calibres.length > 0) {
                    for (const cal of entrada.calibres) {
                        const calRow = calibresSheet.addRow([
                            entrada.codigo_lote,
                            entrada.fecha ? new Date(entrada.fecha) : '',
                            cal.calibre,
                            cal.bidones || 0,
                            cal.kilos_por_bidon || 0,
                            cal.subtotal || 0,
                            cal.precio || 0
                        ]);
                        calRow.eachCell(cell => {
                            cell.border = {
                                top: { style: 'thin' }, bottom: { style: 'thin' },
                                left: { style: 'thin' }, right: { style: 'thin' }
                            };
                            if (cell.column === 4) cell.numFmt = '#,##0';
                            if (cell.column >= 5) cell.numFmt = '#,##0.00';
                        });
                    }
                }
            }

            calibresSheet.columns = [
                { width: 14 }, { width: 12 }, { width: 10 },
                { width: 8 }, { width: 10 }, { width: 12 }, { width: 12 }
            ];

            await fastify.logActivity(user.id, 'exportar', 'reportes', 'Exportación de reporte general con ExcelJS');

            const buffer = await workbook.xlsx.writeBuffer();

            reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            reply.header('Content-Disposition', `attachment; filename="reporte_aceitunas_${new Date().toISOString().split('T')[0]}.xlsx"`);

            return Buffer.from(buffer);
        } finally {
            client.release();
        }
    },

    getDashboard: async (request, reply) => {
        const client = await request.server.pg.connect();
        try {
            const today = new Date().toISOString().split('T')[0];
            const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

            const [{ rows: totalEntradas }] = await Promise.all([
                client.query('SELECT COUNT(*) as count FROM entradas')
            ]);
            const [{ rows: entradasHoy }] = await Promise.all([
                client.query('SELECT COUNT(*) as count FROM entradas WHERE fecha = $1', [today])
            ]);
            const [{ rows: entradasMes }] = await Promise.all([
                client.query('SELECT COUNT(*) as count FROM entradas WHERE fecha >= $1', [monthStart])
            ]);
            const [{ rows: kgMes }] = await Promise.all([
                client.query(`
                    SELECT COALESCE(SUM(cantidad), 0) as total
                    FROM entradas WHERE fecha >= $1`, [monthStart])
            ]);
            const [{ rows: stockAlmacen }] = await Promise.all([
                client.query(`
                    SELECT COALESCE(SUM(ca.kg), 0) as total
                    FROM calibres_almacen ca
                    JOIN lotes_almacen la ON ca.lote_almacen_id = la.id`)
            ]);
            const [{ rows: totalVentas }] = await Promise.all([
                client.query('SELECT COUNT(*) as count FROM ventas')
            ]);
            const [{ rows: ventasMes }] = await Promise.all([
                client.query('SELECT COUNT(*) as count FROM ventas WHERE fecha >= $1', [monthStart])
            ]);
            const [{ rows: montoVentasMes }] = await Promise.all([
                client.query(`
                    SELECT COALESCE(SUM(total_monto), 0) as total
                    FROM ventas WHERE fecha >= $1`, [monthStart])
            ]);
            const [{ rows: prestamosActivos }] = await Promise.all([
                client.query(`
                    SELECT COUNT(*) as count FROM prestamos
                    WHERE estado = 'pendiente'`)
            ]);
            const [{ rows: alertasStock }] = await Promise.all([
                client.query(`
                    SELECT COUNT(*) as count FROM insumos
                    WHERE stock_minimo > 0 AND stock_actual <= stock_minimo`)
            ]);

            const [{ rows: entradasPorMes }] = await Promise.all([
                client.query(`
                    SELECT DATE_TRUNC('month', fecha) as mes,
                           COUNT(*) as cantidad,
                           COALESCE(SUM(cantidad), 0) as kg
                    FROM entradas
                    WHERE fecha >= $1
                    GROUP BY DATE_TRUNC('month', fecha)
                    ORDER BY mes`, [new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]])
            ]);

            const [{ rows: ventasPorMes }] = await Promise.all([
                client.query(`
                    SELECT DATE_TRUNC('month', fecha) as mes,
                           COUNT(*) as cantidad,
                           COALESCE(SUM(total_monto), 0) as monto
                    FROM ventas
                    WHERE fecha >= $1
                    GROUP BY DATE_TRUNC('month', fecha)
                    ORDER BY mes`, [new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]])
            ]);

            const [{ rows: topLotes }] = await Promise.all([
                client.query(`
                    SELECT codigo_lote, cantidad, fecha
                    FROM entradas
                    ORDER BY cantidad DESC
                    LIMIT 5`)
            ]);

            return {
                resumen: {
                    totalEntradas: parseInt(totalEntradas[0].count),
                    entradasHoy: parseInt(entradasHoy[0].count),
                    entradasMes: parseInt(entradasMes[0].count),
                    kgMes: parseFloat(kgMes[0].total),
                    stockAlmacen: parseFloat(stockAlmacen[0].total),
                    totalVentas: parseInt(totalVentas[0].count),
                    ventasMes: parseInt(ventasMes[0].count),
                    montoVentasMes: parseFloat(montoVentasMes[0].total),
                    prestamosActivos: parseInt(prestamosActivos[0].count),
                    alertasStock: parseInt(alertasStock[0].count)
                },
                entradasPorMes: entradasPorMes.map(r => ({
                    mes: r.mes,
                    cantidad: parseInt(r.cantidad),
                    kg: parseFloat(r.kg)
                })),
                ventasPorMes: ventasPorMes.map(r => ({
                    mes: r.mes,
                    cantidad: parseInt(r.cantidad),
                    monto: parseFloat(r.monto)
                })),
                topLotes: toCamelCase(topLotes)
            };
        } finally {
            client.release();
        }
    },

    getKPIs: async (request, reply) => {
        const client = await request.server.pg.connect();
        try {
            const today = new Date().toISOString().split('T')[0];
            const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
            const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

            const [{ rows: kgThisWeek }] = await Promise.all([
                client.query(`
                    SELECT COALESCE(SUM(cantidad), 0) as total
                    FROM entradas WHERE fecha >= $1`, [weekAgo])
            ]);
            const [{ rows: kgLastWeek }] = await Promise.all([
                client.query(`
                    SELECT COALESCE(SUM(cantidad), 0) as total
                    FROM entradas
                    WHERE fecha >= $1 AND fecha < $2`, [monthAgo, weekAgo])
            ]);
            const [{ rows: montoVentasWeek }] = await Promise.all([
                client.query(`
                    SELECT COALESCE(SUM(total_monto), 0) as total
                    FROM ventas WHERE fecha >= $1`, [weekAgo])
            ]);
            const [{ rows: montoVentasLastWeek }] = await Promise.all([
                client.query(`
                    SELECT COALESCE(SUM(total_monto), 0) as total
                    FROM ventas
                    WHERE fecha >= $1 AND fecha < $2`, [monthAgo, weekAgo])
            ]);
            const [{ rows: lotesActivos }] = await Promise.all([
                client.query(`
                    SELECT COUNT(DISTINCT entrada_id) as count
                    FROM lotes_almacen WHERE entrada_id IS NOT NULL`)
            ]);
            const [{ rows: puchosPendientes }] = await Promise.all([
                client.query('SELECT COALESCE(SUM(kg), 0) as total FROM puchos_detalle')
            ]);
            const [{ rows: insumosBajoMinimo }] = await Promise.all([
                client.query(`
                    SELECT COUNT(*) as count FROM insumos
                    WHERE stock_minimo > 0 AND stock_actual <= stock_minimo`)
            ]);

            const calcChange = (curr, prev) => {
                if (!prev || prev === 0) return curr > 0 ? 100 : 0;
                return Math.round(((curr - prev) / prev) * 100);
            };

            return {
                kgEntradasThisWeek: parseFloat(kgThisWeek[0].total),
                kgEntradasLastWeek: parseFloat(kgLastWeek[0].total),
                kgEntradasChange: calcChange(parseFloat(kgThisWeek[0].total), parseFloat(kgLastWeek[0].total)),
                montoVentasThisWeek: parseFloat(montoVentasWeek[0].total),
                montoVentasLastWeek: parseFloat(montoVentasLastWeek[0].total),
                montoVentasChange: calcChange(parseFloat(montoVentasWeek[0].total), parseFloat(montoVentasLastWeek[0].total)),
                lotesActivos: parseInt(lotesActivos[0].count),
                puchosPendientes: parseFloat(puchosPendientes[0].total),
                insumosBajoMinimo: parseInt(insumosBajoMinimo[0].count),
                updatedAt: new Date().toISOString()
            };
        } finally {
            client.release();
        }
    }
};

module.exports = reportesController;
