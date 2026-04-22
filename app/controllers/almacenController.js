const lotesService = require('../services/lotesService');

const almacenController = {
    getAll: async (request, reply) => {
        const fastify = request.server;
        const client = await fastify.pg.connect();
        try {
            const sql = `
                SELECT f.*,
                    COALESCE(
                        (SELECT json_agg(c_data ORDER BY c_data.orden, c_data.id)
                         FROM (
                             SELECT c.*,
                                 COALESCE(
                                     (SELECT json_agg(l_data)
                                      FROM (
                                          SELECT l.*, e.fecha as fecha_ingreso,
                                              COALESCE(
                                                  (SELECT json_agg(ca.*)
                                                   FROM calibres_almacen ca
                                                   WHERE ca.lote_almacen_id = l.id), '[]'
                                              ) as calibres
                                          FROM lotes_almacen l
                                          LEFT JOIN entradas e ON l.entrada_id = e.id
                                          WHERE l.cuadrante_id = c.id
                                      ) l_data), '[]'
                                 ) as lotes
                             FROM cuadrantes c
                             WHERE c.fila_id = f.id
                         ) c_data), '[]'
                    ) as cuadrantes
                FROM filas f
                ORDER BY f.orden, f.id`;
            const { rows: filas } = await client.query(sql);

            const { rows: puchosExtraidos } = await client.query(`
                SELECT entrada_id, calibre, SUM(kg) as total_kg
                FROM puchos_detalle
                WHERE entrada_id IS NOT NULL
                GROUP BY entrada_id, calibre`);

            return { filas, puchosExtraidos };
        } finally {
            client.release();
        }
    },

    createFila: async (request, reply) => {
        const fastify = request.server;
        const { nombre, orden } = request.body;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            const { rows } = await client.query(
                'INSERT INTO filas (nombre, orden) VALUES ($1, $2) RETURNING id',
                [nombre, orden || 0]
            );
            await fastify.logActivity(user.id, 'crear', 'almacen', `Fila creada: ${nombre}`);
            return reply.code(201).send({ success: true, id: rows[0].id });
        } finally {
            client.release();
        }
    },

    updateFila: async (request, reply) => {
        const fastify = request.server;
        const { id } = request.params;
        const { nombre } = request.body;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            await client.query('UPDATE filas SET nombre = $1 WHERE id = $2', [nombre, id]);
            await fastify.logActivity(user.id, 'editar', 'almacen', `Fila editada ID: ${id}`);
            return { success: true };
        } finally {
            client.release();
        }
    },

    deleteFila: async (request, reply) => {
        const fastify = request.server;
        const { id } = request.params;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            if (user.rol !== 'admin') return reply.code(403).send({ error: 'No tiene permisos' });
            await client.query('DELETE FROM filas WHERE id = $1', [id]);
            await fastify.logActivity(user.id, 'eliminar', 'almacen', `Fila eliminada ID: ${id}`);
            return { success: true };
        } finally {
            client.release();
        }
    },

    createCuadrante: async (request, reply) => {
        const fastify = request.server;
        const { filaId, nombre, orden } = request.body;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            const { rows } = await client.query(
                'INSERT INTO cuadrantes (fila_id, nombre, orden) VALUES ($1, $2, $3) RETURNING id',
                [filaId, nombre, orden || 0]
            );
            await fastify.logActivity(user.id, 'crear', 'almacen', `Cuadrante creado: ${nombre}`);
            return reply.code(201).send({ success: true, id: rows[0].id });
        } finally {
            client.release();
        }
    },

    deleteCuadrante: async (request, reply) => {
        const fastify = request.server;
        const { id } = request.params;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            await client.query('DELETE FROM cuadrantes WHERE id = $1', [id]);
            await fastify.logActivity(user.id, 'eliminar', 'almacen', `Cuadrante eliminado ID: ${id}`);
            return { success: true };
        } finally {
            client.release();
        }
    },

    toggleZonaPuchos: async (request, reply) => {
        const fastify = request.server;
        const { id } = request.params;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            const { rows } = await client.query('SELECT es_zona_puchos FROM cuadrantes WHERE id = $1', [id]);
            if (rows.length === 0) return reply.code(404).send({ error: 'Cuadrante no encontrado' });

            const nuevoEstado = !rows[0].es_zona_puchos;
            await client.query('UPDATE cuadrantes SET es_zona_puchos = $1 WHERE id = $2', [nuevoEstado, id]);

            const accion = nuevoEstado ? 'activada' : 'desactivada';
            await fastify.logActivity(user.id, 'editar', 'almacen', `Zona puchos ${accion} cuadrante ID: ${id}`);

            return { success: true, es_zona_puchos: nuevoEstado };
        } finally {
            client.release();
        }
    },

    addLote: async (request, reply) => {
        const fastify = request.server;
        const data = request.body;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            const service = lotesService(client);
            return service.addLote(data, user.id, { logActivity: fastify.logActivity });
        } catch (err) {
            await client.query('ROLLBACK');
            const status = err.statusCode || 500;
            return reply.code(status).send({
                success: false,
                error: err.message,
                ...(err.excede_capacidad && {
                    excede_capacidad: true,
                    capacidad_max: err.capacidad_max,
                    ocupacion_actual: err.ocupacion_actual,
                    espacio_disponible: err.espacio_disponible,
                    envases_lote: err.envases_lote,
                    exceso: err.exceso
                })
            });
        } finally {
            client.release();
        }
    },

    removeLote: async (request, reply) => {
        const fastify = request.server;
        const { id } = request.params;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            const service = lotesService(client);
            return service.removeLote(client, id, user.id, { logActivity: fastify.logActivity });
        } catch (err) {
            await client.query('ROLLBACK');
            const status = err.statusCode || 500;
            return reply.code(status).send({ success: false, error: err.message });
        } finally {
            client.release();
        }
    },

    removeLoteCompleto: async (request, reply) => {
        const fastify = request.server;
        const { entradaId } = request.params;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            const service = lotesService(client);
            return service.removeLoteCompleto(client, entradaId, user.id, { logActivity: fastify.logActivity });
        } catch (err) {
            await client.query('ROLLBACK');
            const status = err.statusCode || 500;
            return reply.code(status).send({ success: false, error: err.message });
        } finally {
            client.release();
        }
    },

    moverLote: async (request, reply) => {
        const fastify = request.server;
        const { loteId, destinoCuadranteId } = request.body;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            const service = lotesService(client);
            return service.moverLote(client, { loteId, destinoCuadranteId }, user.id, { logActivity: fastify.logActivity });
        } catch (err) {
            await client.query('ROLLBACK');
            const status = err.statusCode || 500;
            return reply.code(status).send({ success: false, error: err.message });
        } finally {
            client.release();
        }
    },

    reubicarCalibre: async (request, reply) => {
        const fastify = request.server;
        const { calibreId, destinoCuadranteId } = request.body;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            const service = lotesService(client);
            return service.reubicarCalibre(client, { calibreId, destinoCuadranteId }, user.id, { logActivity: fastify.logActivity });
        } catch (err) {
            await client.query('ROLLBACK');
            const status = err.statusCode || 500;
            return reply.code(status).send({ success: false, error: err.message });
        } finally {
            client.release();
        }
    },

    extraerPucho: async (request, reply) => {
        const fastify = request.server;
        const { entradaId, loteId, destinoCuadranteId, calibres: calibresFilter } = request.body;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            await client.query('BEGIN');
            let calibresAMover = [];

            if (loteId) {
                const { rows } = await client.query(`
                    SELECT ca.*, la.entrada_id, la.codigo_lote, e.color
                    FROM calibres_almacen ca
                    JOIN lotes_almacen la ON ca.lote_almacen_id = la.id
                    LEFT JOIN entradas e ON la.entrada_id = e.id
                    WHERE ca.lote_almacen_id = $1
                        AND (ca.pucho > 0.05 OR (ca.cantidad_envases = 0 AND ca.kg > 0.05))`, [loteId]);
                calibresAMover = rows.map(c => ({
                    ...c,
                    pucho: parseFloat(c.pucho) > 0.05 ? parseFloat(c.pucho) : parseFloat(c.kg)
                }));
            } else if (entradaId) {
                let sql = 'SELECT c.*, e.color, e.id as entrada_id FROM calibres c JOIN entradas e ON c.entrada_id = e.id WHERE c.entrada_id = $1 AND c.sobras > 0';
                const params = [entradaId];
                if (calibresFilter && calibresFilter.length > 0) {
                    sql += ` AND c.calibre IN (${calibresFilter.map((_, i) => `$${i + 2}`).join(',')})`;
                    params.push(...calibresFilter);
                }
                const { rows } = await client.query(sql, params);
                calibresAMover = rows.map(c => ({
                    entrada_id: c.entrada_id, color: c.color, calibre: c.calibre,
                    pucho: c.sobras, id: null
                }));
            }

            if (calibresAMover.length === 0) {
                await client.query('ROLLBACK');
                return reply.code(400).send({ error: 'No hay puchos para extraer' });
            }

            for (let c of calibresAMover) {
                const { rows: existRows } = await client.query(
                    'SELECT id FROM puchos_detalle WHERE cuadrante_id = $1 AND entrada_id = $2 AND calibre = $3',
                    [destinoCuadranteId, c.entrada_id, c.calibre]
                );
                if (existRows.length > 0) {
                    await client.query('UPDATE puchos_detalle SET kg = kg + $1, fecha_aporte = CURRENT_TIMESTAMP WHERE id = $2', [c.pucho, existRows[0].id]);
                } else {
                    await client.query(
                        'INSERT INTO puchos_detalle (cuadrante_id, lote_origen_id, entrada_id, color, calibre, kg, usuario_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                        [destinoCuadranteId, loteId || null, c.entrada_id, c.color || 'verde', c.calibre, c.pucho, user.id]
                    );
                }

                if (c.id) {
                    await client.query('UPDATE calibres_almacen SET kg = kg - $1, pucho = 0 WHERE id = $2', [c.pucho, c.id]);
                    const { rows: checkRows } = await client.query('SELECT kg FROM calibres_almacen WHERE id = $1', [c.id]);
                    if (parseFloat(checkRows[0].kg) <= 0.05) {
                        await client.query('DELETE FROM calibres_almacen WHERE id = $1', [c.id]);
                    }
                }
            }

            await client.query('COMMIT');
            await fastify.logActivity(user.id, 'editar', 'almacen', `Puchos extraídos hacia cuadrante ${destinoCuadranteId}`);
            return { success: true };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    getPuchos: async (request, reply) => {
        const { id: cuadranteId } = request.params;
        const client = await request.server.pg.connect();
        try {
            const { rows: resumen } = await client.query(`
                SELECT color, calibre, SUM(kg) as total_kg, COUNT(*) as aportes
                FROM puchos_detalle
                WHERE cuadrante_id = $1
                GROUP BY color, calibre
                ORDER BY color, calibre`, [cuadranteId]);

            const { rows: historial } = await client.query(`
                SELECT pd.*, u.nombre as usuario_nombre,
                    COALESCE(la.codigo_lote, e.codigo_lote) as codigo_lote
                FROM puchos_detalle pd
                LEFT JOIN usuarios u ON pd.usuario_id = u.id
                LEFT JOIN lotes_almacen la ON pd.lote_origen_id = la.id
                LEFT JOIN entradas e ON pd.entrada_id = e.id
                WHERE pd.cuadrante_id = $1
                ORDER BY pd.fecha_aporte DESC`, [cuadranteId]);

            return { resumen, historial };
        } finally {
            client.release();
        }
    },

    devolverPucho: async (request, reply) => {
        const fastify = request.server;
        const { puchoId } = request.body;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            await client.query('BEGIN');
            const { rows: pRows } = await client.query('SELECT * FROM puchos_detalle WHERE id = $1', [puchoId]);
            if (pRows.length === 0) {
                await client.query('ROLLBACK');
                return reply.code(404).send({ error: 'Pucho no encontrado' });
            }
            const pucho = pRows[0];

            const { rows: origRows } = await client.query(`
                SELECT ca.id, ca.lote_almacen_id
                FROM calibres_almacen ca
                JOIN lotes_almacen la ON ca.lote_almacen_id = la.id
                WHERE la.entrada_id = $1 AND ca.calibre = $2
                LIMIT 1`, [pucho.entrada_id, pucho.calibre]);

            if (origRows.length > 0) {
                await client.query('UPDATE calibres_almacen SET pucho = pucho + $1, kg = kg + $1 WHERE id = $2', [pucho.kg, origRows[0].id]);
            } else {
                const { rows: lRows } = await client.query('SELECT id FROM lotes_almacen WHERE entrada_id = $1 LIMIT 1', [pucho.entrada_id]);
                if (lRows.length > 0) {
                    const { rows: kRows } = await client.query('SELECT kilos_por_bidon FROM calibres WHERE entrada_id = $1 AND calibre = $2 LIMIT 1', [pucho.entrada_id, pucho.calibre]);
                    await client.query(
                        'INSERT INTO calibres_almacen (lote_almacen_id, calibre, kg, cantidad_envases, kilos_por_envase, pucho) VALUES ($1, $2, $3, 0, $4, $5)',
                        [lRows[0].id, pucho.calibre, pucho.kg, kRows[0]?.kilos_por_bidon || 60, pucho.kg]
                    );
                }
            }

            await client.query('DELETE FROM puchos_detalle WHERE id = $1', [puchoId]);
            await client.query('COMMIT');
            await fastify.logActivity(user.id, 'editar', 'almacen', `Pucho devuelto (Entrada ID: ${pucho.entrada_id})`);
            return { success: true };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    devolverTodoPucho: async (request, reply) => {
        const fastify = request.server;
        const { cuadranteId } = request.body;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            await client.query('BEGIN');
            const { rows: puchos } = await client.query('SELECT * FROM puchos_detalle WHERE cuadrante_id = $1', [cuadranteId]);

            if (puchos.length === 0) {
                await client.query('ROLLBACK');
                return reply.code(400).send({ error: 'No hay puchos en esta zona' });
            }

            for (let pData of puchos) {
                const { rows: origRows } = await client.query(`
                    SELECT ca.id
                    FROM calibres_almacen ca
                    JOIN lotes_almacen la ON ca.lote_almacen_id = la.id
                    WHERE la.entrada_id = $1 AND ca.calibre = $2
                    LIMIT 1`, [pData.entrada_id, pData.calibre]);

                if (origRows.length > 0) {
                    await client.query('UPDATE calibres_almacen SET pucho = pucho + $1, kg = kg + $1 WHERE id = $2', [pData.kg, origRows[0].id]);
                } else {
                    const { rows: lRows } = await client.query('SELECT id FROM lotes_almacen WHERE entrada_id = $1 LIMIT 1', [pData.entrada_id]);
                    if (lRows.length > 0) {
                        const { rows: kRows } = await client.query('SELECT kilos_por_bidon FROM calibres WHERE entrada_id = $1 AND calibre = $2 LIMIT 1', [pData.entrada_id, pData.calibre]);
                        await client.query(
                            'INSERT INTO calibres_almacen (lote_almacen_id, calibre, kg, cantidad_envases, kilos_por_envase, pucho) VALUES ($1, $2, $3, 0, $4, $5)',
                            [lRows[0].id, pData.calibre, pData.kg, kRows[0]?.kilos_por_bidon || 60, pData.kg]
                        );
                    }
                }
                await client.query('DELETE FROM puchos_detalle WHERE id = $1', [pData.id]);
            }

            await client.query('COMMIT');
            await fastify.logActivity(user.id, 'editar', 'almacen', `Vaciado de zona de pucho (ID: ${cuadranteId})`);
            return { success: true, mensaje: `${puchos.length} registros devueltos correctamente.` };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    getDisponibilidad: async (request, reply) => {
        const { entradaId } = request.params;
        const client = await request.server.pg.connect();
        try {
            const { rows: calOriginales } = await client.query(`
                SELECT calibre, subtotal as total_original, bidones as bidones_originales, kilos_por_bidon, sobras as pucho_original
                FROM calibres
                WHERE entrada_id = $1`, [entradaId]);

            const resultado = [];
            for (let c of calOriginales) {
                const calNombre = c.calibre.trim();
                const { rows: fisRows } = await client.query(`
                    SELECT COALESCE(SUM(ca.kg), 0) as kg_fisico, COALESCE(SUM(ca.cantidad_envases), 0) as envases_fisicos
                    FROM calibres_almacen ca
                    JOIN lotes_almacen la ON ca.lote_almacen_id = la.id
                    WHERE la.entrada_id = $1 AND ca.calibre = $2`, [entradaId, calNombre]);

                const { rows: pucRows } = await client.query(
                    'SELECT COALESCE(SUM(kg), 0) as kg_puchos FROM puchos_detalle WHERE entrada_id = $1 AND calibre = $2',
                    [entradaId, calNombre]
                );

                const kgAsignados = parseFloat(fisRows[0].kg_fisico) + parseFloat(pucRows[0].kg_puchos);
                const disponibleKg = Math.round((parseFloat(c.total_original) - kgAsignados) * 100) / 100;
                const disponibleEnvases = Math.max(0, parseInt(c.bidones_originales) - parseInt(fisRows[0].envases_fisicos));
                const kgEnBidonesRestantes = disponibleEnvases * parseFloat(c.kilos_por_bidon);
                const disponiblePucho = Math.round((disponibleKg - kgEnBidonesRestantes) * 100) / 100;

                resultado.push({
                    calibre: calNombre,
                    total_original: parseFloat(c.total_original),
                    kg_en_almacen: parseFloat(fisRows[0].kg_fisico),
                    kg_en_puchos: parseFloat(pucRows[0].kg_puchos),
                    disponible_kg: Math.max(0, disponibleKg),
                    disponible_envases: disponibleEnvases,
                    disponible_pucho: Math.max(0, disponiblePucho),
                    kilos_por_envase: parseFloat(c.kilos_por_bidon)
                });
            }
            return resultado;
        } finally {
            client.release();
        }
    }
};

module.exports = almacenController;
