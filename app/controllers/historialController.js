const { toCamelCase } = require('../utils/helpers');

const historialController = {
    // GET /historial
    getAll: async (request, reply) => {
        const fastify = request.server;
        const user = request.session.user;
        const client = await fastify.pg.connect();

        try {
            if (user.rol !== 'admin') {
                return reply.code(403).send({ error: 'No tiene permisos para ver el historial' });
            }

            const { modulo, usuario, fechaInicio, fechaFin } = request.query;
            const limit = Math.min(parseInt(request.query.limit || 100), 500);
            const offset = parseInt(request.query.offset || 0);

            let where = [];
            let params = [];
            let paramIndex = 1;

            if (modulo) {
                where.push(`h.modulo = $${paramIndex++}`);
                params.push(modulo);
            }
            if (usuario) {
                where.push(`h.usuario_id = $${paramIndex++}`);
                params.push(usuario);
            }
            if (fechaInicio) {
                where.push(`DATE(h.created_at) >= $${paramIndex++}`);
                params.push(fechaInicio);
            }
            if (fechaFin) {
                where.push(`DATE(h.created_at) <= $${paramIndex++}`);
                params.push(fechaFin);
            }

            const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

            const sql = `
        SELECT h.*, u.nombre as usuario_nombre, u.username
        FROM historial_actividad h
        LEFT JOIN usuarios u ON h.usuario_id = u.id
        ${whereClause}
        ORDER BY h.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

            const finalParams = [...params, limit, offset];
            const { rows: historial } = await client.query(sql, finalParams);

            const { rows: countRows } = await client.query(`SELECT COUNT(*) FROM historial_actividad h ${whereClause}`, params);
            const total = parseInt(countRows[0].count);

            return {
                data: toCamelCase(historial),
                total,
                limit,
                offset
            };
        } finally {
            client.release();
        }
    }
};

module.exports = historialController;
