/**
 * CONTROLADOR DE INSUMOS (MIGRADOS DE PHP)
 */
const insumosController = {
    // GET /insumos
    getAll: async (request, reply) => {
        const fastify = request.server;
        const client = await fastify.pg.connect();
        try {
            const { rows } = await client.query(`
        SELECT i.*, 
               (SELECT SUM(CASE WHEN tipo = 'entrada' THEN cantidad ELSE -cantidad END) 
                FROM movimientos_insumos WHERE insumo_id = i.id) as stock_calculado
        FROM insumos i
        ORDER BY i.nombre
      `);

            // Obtener últimos movimientos para cada insumo (replicando lógica PHP)
            for (let insumo of rows) {
                const movResult = await client.query(`
          SELECT m.*, u.nombre as usuario_nombre
          FROM movimientos_insumos m
          LEFT JOIN usuarios u ON m.usuario_id = u.id
          WHERE m.insumo_id = $1
          ORDER BY m.created_at DESC
          LIMIT 10
        `, [insumo.id]);
                insumo.movimientos = movResult.rows;
            }

            return rows;
        } finally {
            client.release();
        }
    },

    // POST /insumos/movimiento
    registrarMovimiento: async (request, reply) => {
        const fastify = request.server;
        const data = request.body;
        const user = request.session.user;
        const client = await fastify.pg.connect();

        try {
            let insumoId = data.insumoId;

            // Mapeo de llaves de frontend (igual que en PHP)
            if (!insumoId && data.insumo) {
                const mapping = {
                    'Agua': 1, 'SorbatoPotasio': 2, 'AcidoLactico': 3, 'AcidoCitrico': 4,
                    'Calcio': 5, 'AcidoAcetico': 6, 'AcidoAscorbico': 7, 'BenzoatoPotasio': 8,
                    'SalIndustrial': 9, 'Otros': 10
                };
                insumoId = mapping[data.insumo];
            }

            if (!insumoId || !data.tipo || !data.cantidad) {
                return reply.code(400).send({ error: 'Datos incompletos' });
            }

            // 1. Insertar movimiento
            await client.query(
                'INSERT INTO movimientos_insumos (insumo_id, tipo, cantidad, motivo, usuario_id) VALUES ($1, $2, $3, $4, $5)',
                [insumoId, data.tipo, data.cantidad, data.motivo, user.id]
            );

            // 2. Actualizar stock actual (replicando lógica PHP)
            const operador = data.tipo === 'entrada' ? '+' : '-';
            await client.query(
                `UPDATE insumos SET stock_actual = stock_actual ${operador} $1 WHERE id = $2`,
                [data.cantidad, insumoId]
            );

            // 3. Log Activity (usando el decorador de Fastify)
            await fastify.logActivity(user.id, 'crear', 'insumos', `Movimiento: ${data.tipo} ${data.cantidad}`);

            return reply.code(201).send({ success: true });
        } finally {
            client.release();
        }
    }
};

module.exports = insumosController;
