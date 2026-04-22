async function insumosService(client) {
    return {
        async getAll() {
            const { rows } = await client.query(`
                SELECT i.*,
                    (SELECT SUM(CASE WHEN tipo = 'entrada' THEN cantidad ELSE -cantidad END)
                    FROM movimientos_insumos WHERE insumo_id = i.id) as stock_calculado
                FROM insumos i
                ORDER BY i.nombre
            `);
            for (const insumo of rows) {
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
        },

        async registrarMovimiento(client, data, userId) {
            let insumoId = data.insumoId;
            if (!insumoId && data.insumo) {
                const mapping = {
                    'Agua': 1, 'SorbatoPotasio': 2, 'AcidoLactico': 3, 'AcidoCitrico': 4,
                    'Calcio': 5, 'AcidoAcetico': 6, 'AcidoAscorbico': 7, 'BenzoatoPotasio': 8,
                    'SalIndustrial': 9, 'Otros': 10
                };
                insumoId = mapping[data.insumo];
            }

            if (!insumoId || !data.tipo || !data.cantidad) {
                throw Object.assign(new Error('Datos incompletos'), { statusCode: 400 });
            }

            await client.query(
                'INSERT INTO movimientos_insumos (insumo_id, tipo, cantidad, motivo, usuario_id) VALUES ($1, $2, $3, $4, $5)',
                [insumoId, data.tipo, data.cantidad, data.motivo, userId]
            );

            const operador = data.tipo === 'entrada' ? '+' : '-';
            await client.query(
                `UPDATE insumos SET stock_actual = stock_actual ${operador} $1 WHERE id = $2`,
                [data.cantidad, insumoId]
            );

            const { rows: [insumo] } = await client.query(
                `SELECT nombre, stock_actual, stock_minimo, unidad FROM insumos WHERE id = $1`,
                [insumoId]
            );
            const alerta = insumo.stock_minimo > 0 && insumo.stock_actual <= insumo.stock_minimo
                ? `⚠️ Alerta: ${insumo.nombre} está por debajo del stock mínimo (${insumo.stock_actual} ${insumo.unidad || 'und'} restante)`
                : null;

            return { success: true, alerta };
        },

        async getAlertas(client) {
            const { rows } = await client.query(`
                SELECT nombre, stock_actual, stock_minimo, unidad
                FROM insumos
                WHERE stock_minimo > 0 AND stock_actual <= stock_minimo
                ORDER BY (stock_actual / NULLIF(stock_minimo, 0)) ASC
            `);
            return rows.map(r => ({
                ...r,
                mensaje: `⚠️ ${r.nombre}: ${r.stock_actual} ${r.unidad || 'und'} (mínimo: ${r.stock_minimo})`
            }));
        }
    };
}

module.exports = insumosService;
