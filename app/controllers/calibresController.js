const calibresController = {
    // GET /calibres/:id/precio-venta
    getPrecioVenta: async (request, reply) => {
        const { id } = request.params;
        const client = await request.server.pg.connect();
        try {
            const { rows } = await client.query('SELECT id, calibre, precio, precio_venta FROM calibres WHERE id = $1', [id]);
            if (rows.length === 0) return reply.code(404).send({ error: 'Calibre no encontrado' });
            return { success: true, data: rows[0] };
        } finally {
            client.release();
        }
    },

    // PUT /calibres/:id/precio-venta
    updatePrecioVenta: async (request, reply) => {
        const { id } = request.params;
        const { precio_venta } = request.body;
        const client = await request.server.pg.connect();

        if (precio_venta === undefined) {
            return reply.code(400).send({ error: 'precio_venta es requerido' });
        }

        try {
            const { rowCount } = await client.query('UPDATE calibres SET precio_venta = $1 WHERE id = $2', [precio_venta, id]);
            if (rowCount === 0) return reply.code(404).send({ error: 'Calibre no encontrado' });

            return {
                success: true,
                message: 'Precio de venta actualizado',
                data: { calibre_id: id, precio_venta }
            };
        } finally {
            client.release();
        }
    },

    // PUT /calibres/precios-venta
    updateMultiplePrecios: async (request, reply) => {
        const { precios } = request.body;
        if (!Array.isArray(precios)) {
            return reply.code(400).send({ error: 'Se requiere un array de precios' });
        }

        const client = await request.server.pg.connect();
        try {
            await client.query('BEGIN');
            let actualizados = 0;
            for (const item of precios) {
                if (item.calibre_id !== undefined && item.precio_venta !== undefined) {
                    await client.query('UPDATE calibres SET precio_venta = $1 WHERE id = $2', [item.precio_venta, item.calibre_id]);
                    actualizados++;
                }
            }
            await client.query('COMMIT');
            return { success: true, actualizados };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
};

module.exports = calibresController;
