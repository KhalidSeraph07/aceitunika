const { toCamelCase } = require('../utils/helpers');

const prestamosController = {
    // GET /prestamos
    getAll: async (request, reply) => {
        const fastify = request.server;
        const client = await fastify.pg.connect();
        try {
            const { rows } = await client.query(`
        SELECT p.*, u.nombre as usuario_nombre
        FROM prestamos p
        LEFT JOIN usuarios u ON p.usuario_id = u.id
        ORDER BY p.fecha DESC, p.id DESC
      `);
            return toCamelCase(rows);
        } finally {
            client.release();
        }
    },

    // POST /prestamos
    create: async (request, reply) => {
        const fastify = request.server;
        const user = request.session.user;
        const data = request.body;
        const client = await fastify.pg.connect();
        try {
            const { rows } = await client.query(`
        INSERT INTO prestamos (fecha, tipo_prestamo, codigo_lote, calibre, kilos, destinatario, motivo, estado, usuario_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendiente', $8)
        RETURNING id
      `, [
                data.fecha || new Date().toISOString().split('T')[0],
                data.tipoPrestamo || 'salida',
                data.codigoLote || null,
                data.calibre || null,
                data.kilos || 0,
                data.destinatario || null,
                data.motivo || null,
                user.id
            ]);

            const id = rows[0].id;
            await fastify.logActivity(user.id, 'crear', 'prestamos', `Préstamo creado: ${data.codigoLote}`);
            return reply.code(201).send({ success: true, id });
        } finally {
            client.release();
        }
    },

    // PUT /prestamos/:id
    update: async (request, reply) => {
        const { id } = request.params;
        const fastify = request.server;
        const user = request.session.user;
        const data = request.body;

        if (user.rol !== 'admin') return reply.code(403).send({ error: 'No tiene permisos' });

        const client = await fastify.pg.connect();
        try {
            await client.query('UPDATE prestamos SET estado = $1, fecha_devolucion = $2 WHERE id = $3', [
                data.estado || 'pendiente',
                data.fechaDevolucion || null,
                id
            ]);
            await fastify.logActivity(user.id, 'editar', 'prestamos', `Préstamo actualizado ID: ${id}`);
            return { success: true };
        } finally {
            client.release();
        }
    },

    // DELETE /prestamos/:id
    delete: async (request, reply) => {
        const { id } = request.params;
        const fastify = request.server;
        const user = request.session.user;

        if (user.rol !== 'admin') return reply.code(403).send({ error: 'No tiene permisos' });

        const client = await fastify.pg.connect();
        try {
            await client.query('DELETE FROM prestamos WHERE id = $1', [id]);
            await fastify.logActivity(user.id, 'eliminar', 'prestamos', `Préstamo eliminado ID: ${id}`);
            return { success: true };
        } finally {
            client.release();
        }
    }
};

module.exports = prestamosController;
