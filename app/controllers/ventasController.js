const { toCamelCase } = require('../utils/helpers');

const ventasController = {
    // GET /ventas
    getAll: async (request, reply) => {
        const fastify = request.server;
        const user = request.session.user;
        const client = await fastify.pg.connect();

        try {
            if (user.rol !== 'admin') {
                return reply.code(403).send({ error: 'No tiene permisos' });
            }

            const { rows: ventas } = await client.query(`
        SELECT v.*, u.nombre as usuario_nombre
        FROM ventas v
        LEFT JOIN usuarios u ON v.usuario_id = u.id
        ORDER BY v.fecha DESC, v.id DESC
      `);

            for (let venta of ventas) {
                const { rows: detalles } = await client.query(
                    'SELECT * FROM ventas_detalle WHERE venta_id = $1',
                    [venta.id]
                );
                venta.calibres = detalles;
            }

            return toCamelCase(ventas);
        } finally {
            client.release();
        }
    },

    // GET /ventas/:id
    getOne: async (request, reply) => {
        const { id } = request.params;
        const fastify = request.server;
        const user = request.session.user;
        const client = await fastify.pg.connect();

        try {
            if (user.rol !== 'admin') {
                return reply.code(403).send({ error: 'No tiene permisos' });
            }

            const { rows } = await client.query('SELECT * FROM ventas WHERE id = $1', [id]);
            if (rows.length === 0) return reply.code(404).send({ error: 'Venta no encontrada' });
            const venta = rows[0];

            const { rows: detalles } = await client.query(
                'SELECT * FROM ventas_detalle WHERE venta_id = $1',
                [id]
            );
            venta.calibres = detalles;

            return toCamelCase(venta);
        } finally {
            client.release();
        }
    },

    // POST /ventas
    create: async (request, reply) => {
        const fastify = request.server;
        const user = request.session.user;
        const data = request.body;
        const client = await fastify.pg.connect();

        try {
            if (user.rol !== 'admin') {
                return reply.code(403).send({ error: 'No tiene permisos para crear ventas' });
            }

            await client.query('BEGIN');

            // Calcular totales
            let totalBidones = 0;
            let totalKg = 0;
            let totalMonto = 0;

            const calibres = data.calibres || [];
            for (const c of calibres) {
                const bidones = parseInt(c.bidones || 0);
                const kgBidon = parseFloat(c.kgBidon || c.kg_bidon || 0);
                const kg = parseFloat(c.subtotal || (kgBidon * bidones) || 0);
                const precioKg = parseFloat(c.precioKg || c.precio_kg || 0);

                totalBidones += bidones;
                totalKg += kg;
                totalMonto += kg * precioKg;
            }

            // Extraer destino
            const destino = data.destino || {};
            let destinoPais = '';
            let destinoCiudad = '';
            let cliente = '';

            if (data.tipoVenta === 'exportacion') {
                destinoPais = destino.pais || '';
                destinoCiudad = destino.ciudad || '';
                cliente = destino.cliente || '';
            } else {
                destinoCiudad = destino.ciudad || '';
                cliente = destino.cliente || '';
            }

            // Insertar venta principal
            const { rows: ventaIdRows } = await client.query(`
        INSERT INTO ventas (
          fecha, tipo_venta, codigo_lote, entrada_id, cliente, 
          destino_pais, destino_ciudad, total_bidones, total_kg, 
          total_monto, observaciones, usuario_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `, [
                data.fecha || new Date().toISOString().split('T')[0],
                data.tipoVenta || 'exportacion',
                data.codigoLote || null,
                data.loteId || data.entradaId || null,
                cliente,
                destinoPais,
                destinoCiudad,
                totalBidones,
                totalKg,
                totalMonto,
                data.observaciones || null,
                user.id
            ]);

            const ventaId = ventaIdRows[0].id;

            // Insertar detalles
            for (const c of calibres) {
                const bidones = parseInt(c.bidones || 0);
                const kgBidon = parseFloat(c.kgBidon || c.kg_bidon || 0);
                const kg = parseFloat(c.subtotal || (kgBidon * bidones) || 0);
                const precioKg = parseFloat(c.precioKg || c.precio_kg || 0);
                const subtotal = kg * precioKg;

                await client.query(`
          INSERT INTO ventas_detalle (venta_id, calibre, bidones, kg, precio_kg, subtotal)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
                    ventaId,
                    c.calibre || 'Sin calibre',
                    bidones,
                    kg,
                    precioKg,
                    subtotal
                ]);
            }

            await client.query('COMMIT');
            await fastify.logActivity(user.id, 'crear', 'ventas', `Venta creada: ${data.codigoLote} - ${totalKg} Kg`);

            return reply.code(201).send({ success: true, id: ventaId });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    // DELETE /ventas/:id
    delete: async (request, reply) => {
        const { id } = request.params;
        const fastify = request.server;
        const user = request.session.user;
        const client = await fastify.pg.connect();

        try {
            if (user.rol !== 'admin') {
                return reply.code(403).send({ error: 'No tiene permisos' });
            }

            const { rows: ventaRows } = await client.query('SELECT codigo_lote FROM ventas WHERE id = $1', [id]);

            await client.query('DELETE FROM ventas WHERE id = $1', [id]);

            await fastify.logActivity(user.id, 'eliminar', 'ventas', `Venta eliminada ID: ${id} - ${ventaRows[0]?.codigo_lote || 'N/A'}`);

            return { success: true };
        } finally {
            client.release();
        }
    }
};

module.exports = ventasController;
