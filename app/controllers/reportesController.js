const { toCamelCase } = require('../utils/helpers');

const reportesController = {
    // GET /reportes
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
                const first = now.getDate() - now.getDay() + 1; // Lunes
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

            return {
                data: toCamelCase(entradas),
                lotes
            };
        } finally {
            client.release();
        }
    },

    // GET /reportes/inventario
    getInventario: async (request, reply) => {
        const client = await request.server.pg.connect();
        try {
            // 1. Lotes físicos
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

            // 2. Puchos
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

    // GET /reportes/export/excel
    exportExcel: async (request, reply) => {
        const fastify = request.server;
        const user = request.session.user;
        const client = await fastify.pg.connect();

        try {
            if (user.rol !== 'admin') {
                return reply.code(403).send({ error: 'No tiene permisos' });
            }

            const { rows: entradas } = await client.query('SELECT * FROM entradas ORDER BY codigo_lote, fecha DESC');
            for (let entrada of entradas) {
                const { rows: calibres } = await client.query('SELECT * FROM calibres WHERE entrada_id = $1', [entrada.id]);
                entrada.calibres = calibres;
                const { rows: otrosGastos } = await client.query('SELECT * FROM otros_gastos WHERE entrada_id = $1', [entrada.id]);
                entrada.otrosGastos = otrosGastos;
            }

            const xml = reportesController._generarExcelXML(entradas, 'Reporte General');
            await fastify.logActivity(user.id, 'exportar', 'reportes', 'Exportación de reporte general');

            reply.header('Content-Type', 'application/vnd.ms-excel');
            reply.header('Content-Disposition', `attachment; filename="reporte_aceitunas_${new Date().toISOString().split('T')[0]}.xls"`);

            return xml;
        } finally {
            client.release();
        }
    },

    _generarExcelXML: (entradas, titulo) => {
        // Replicando la lógica de generación XML del PHP original
        // Por brevedad, implemento la estructura básica. En una versión final se puede portar todo el estilo.
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="${titulo}">
    <Table>
      <Row ss:StyleID="header">
        <Cell><Data ss:Type="String">Fecha</Data></Cell>
        <Cell><Data ss:Type="String">Lote</Data></Cell>
        <Cell><Data ss:Type="String">Vendedor</Data></Cell>
        <Cell><Data ss:Type="String">Kg Total</Data></Cell>
      </Row>`;

        for (const e of entradas) {
            xml += `
      <Row>
        <Cell><Data ss:Type="String">${e.fecha}</Data></Cell>
        <Cell><Data ss:Type="String">${e.codigo_lote}</Data></Cell>
        <Cell><Data ss:Type="String">${e.vendedor || '-'}</Data></Cell>
        <Cell><Data ss:Type="Number">${e.cantidad || 0}</Data></Cell>
      </Row>`;
        }

        xml += `
    </Table>
  </Worksheet>
</Workbook>`;
        return xml;
    }
};

module.exports = reportesController;
