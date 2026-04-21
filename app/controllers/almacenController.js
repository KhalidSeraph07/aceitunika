/**
 * CONTROLADOR DE ALMACÉN (MIGRADOS DE PHP)
 * Versión profesional para Fastify + PostgreSQL
 */

const almacenController = {
    // GET /almacen
    getAll: async (request, reply) => {
        const fastify = request.server;
        const client = await fastify.pg.connect();
        try {
            // Consulta optimizada usando agregación JSON para evitar N+1
            const sql = `
                SELECT 
                    f.*,
                    COALESCE(
                        (SELECT json_agg(c_data ORDER BY c_data.orden, c_data.id)
                         FROM (
                             SELECT 
                                c.*,
                                COALESCE(
                                    (SELECT json_agg(l_data)
                                     FROM (
                                         SELECT 
                                            l.*, 
                                            e.fecha as fecha_ingreso,
                                            COALESCE(
                                                (SELECT json_agg(ca.*)
                                                 FROM calibres_almacen ca
                                                 WHERE ca.lote_almacen_id = l.id
                                                ), '[]'
                                            ) as calibres
                                         FROM lotes_almacen l
                                         LEFT JOIN entradas e ON l.entrada_id = e.id
                                         WHERE l.cuadrante_id = c.id
                                     ) l_data
                                    ), '[]'
                                ) as lotes
                             FROM cuadrantes c
                             WHERE c.fila_id = f.id
                         ) c_data
                        ), '[]'
                    ) as cuadrantes
                FROM filas f
                ORDER BY f.orden, f.id
            `;

            const { rows: filas } = await client.query(sql);

            // Resumen de puchos extraídos
            const { rows: puchosExtraidos } = await client.query(`
                SELECT entrada_id, calibre, SUM(kg) as total_kg 
                FROM puchos_detalle 
                WHERE entrada_id IS NOT NULL
                GROUP BY entrada_id, calibre
            `);

            return { filas, puchosExtraidos };
        } finally {
            client.release();
        }
    },

    // POST /almacen/filas
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

    // PUT /almacen/filas/:id
    updateFila: async (request, reply) => {
        const { id } = request.params;
        const { nombre } = request.body;
        const fastify = request.server;
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

    // DELETE /almacen/filas/:id
    deleteFila: async (request, reply) => {
        const { id } = request.params;
        const fastify = request.server;
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

    // POST /almacen/cuadrantes
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

    // DELETE /almacen/cuadrantes/:id
    deleteCuadrante: async (request, reply) => {
        const { id } = request.params;
        const fastify = request.server;
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

    // POST /almacen/toggle-pucho/:id
    toggleZonaPuchos: async (request, reply) => {
        const { id } = request.params;
        const fastify = request.server;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            // Obtener estado actual
            const { rows } = await client.query('SELECT es_zona_puchos FROM cuadrantes WHERE id = $1', [id]);
            if (rows.length === 0) {
                return reply.code(404).send({ error: 'Cuadrante no encontrado' });
            }

            // Alternar estado (PostgreSQL usa true/false nativos)
            const nuevoEstado = !rows[0].es_zona_puchos;
            await client.query('UPDATE cuadrantes SET es_zona_puchos = $1 WHERE id = $2', [nuevoEstado, id]);

            const accion = nuevoEstado ? 'activada' : 'desactivada';
            await fastify.logActivity(user.id, 'editar', 'almacen', `Zona puchos ${accion} cuadrante ID: ${id}`);

            return { success: true, es_zona_puchos: nuevoEstado };
        } finally {
            client.release();
        }
    },

    // POST /almacen/lotes
    addLote: async (request, reply) => {
        const fastify = request.server;
        const data = request.body;
        const user = request.session.user;
        const client = await fastify.pg.connect();

        try {
            await client.query('BEGIN');

            // 1. Capacidad y ocupación
            const { rows: quadRows } = await client.query('SELECT capacidad_max FROM cuadrantes WHERE id = $1', [data.cuadranteId]);
            if (quadRows.length === 0) {
                await client.query('ROLLBACK');
                return reply.code(404).send({ error: 'Cuadrante no encontrado' });
            }

            const capacidadMax = quadRows[0].capacidad_max || 300;
            const { rows: ocupRows } = await client.query(`
        SELECT COALESCE(SUM(ca.cantidad_envases), 0) as total_envases
        FROM lotes_almacen la
        JOIN calibres_almacen ca ON ca.lote_almacen_id = la.id
        WHERE la.cuadrante_id = $1
      `, [data.cuadranteId]);

            const envasesActuales = parseInt(ocupRows[0].total_envases);
            let envasesNuevos = 0;
            if (data.calibres) {
                envasesNuevos = data.calibres.reduce((acc, curr) => acc + parseInt(curr.cantidad_envases || 0), 0);
            }

            const espacioDisponible = capacidadMax - envasesActuales;

            if (envasesNuevos > espacioDisponible && !data.forzarAsignacion) {
                await client.query('ROLLBACK');
                return reply.send({
                    success: false,
                    excede_capacidad: true,
                    capacidad_max: capacidadMax,
                    ocupacion_actual: envasesActuales,
                    espacio_disponible: espacioDisponible,
                    envases_lote: envasesNuevos,
                    exceso: envasesNuevos - espacioDisponible,
                    mensaje: `El lote tiene ${envasesNuevos} bidones pero solo hay espacio para ${espacioDisponible}.`
                });
            }

            // 2. Buscar o crear lote
            let loteId;
            if (data.entradaId) {
                const { rows: existRows } = await client.query(
                    'SELECT id FROM lotes_almacen WHERE cuadrante_id = $1 AND entrada_id = $2',
                    [data.cuadranteId, data.entradaId]
                );
                if (existRows.length > 0) loteId = existRows[0].id;
            }

            if (!loteId) {
                const { rows: newLoteRows } = await client.query(
                    'INSERT INTO lotes_almacen (cuadrante_id, entrada_id, codigo_lote) VALUES ($1, $2, $3) RETURNING id',
                    [data.cuadranteId, data.entradaId || null, data.codigoLote]
                );
                loteId = newLoteRows[0].id;
            }

            // 3. Lógica de Rescate (Candado Inteligente)
            if (data.entradaId && data.calibres) {
                for (let c of data.calibres) {
                    const calNombre = c.calibre.trim();
                    let kgIntentados = parseFloat(c.kg || 0);

                    const { rows: origRows } = await client.query(
                        'SELECT subtotal FROM calibres WHERE entrada_id = $1 AND calibre = $2',
                        [data.entradaId, calNombre]
                    );
                    const totalOriginal = parseFloat(origRows[0]?.subtotal || 0);

                    const { rows: fisRows } = await client.query(`
            SELECT COALESCE(SUM(ca.kg), 0) as ya_fisico
            FROM calibres_almacen ca
            JOIN lotes_almacen la ON ca.lote_almacen_id = la.id
            WHERE la.entrada_id = $1 AND ca.calibre = $2 AND la.id != $3
          `, [data.entradaId, calNombre, loteId]);
                    const yaFisico = parseFloat(fisRows[0].ya_fisico);

                    const { rows: pucRows } = await client.query(
                        'SELECT COALESCE(SUM(kg), 0) as ya_puchos FROM puchos_detalle WHERE entrada_id = $1 AND calibre = $2',
                        [data.entradaId, calNombre]
                    );
                    let yaPuchos = parseFloat(pucRows[0].ya_puchos);

                    let disponibleReal = Math.round((totalOriginal - (yaFisico + yaPuchos)) * 100) / 100;

                    if (kgIntentados > (disponibleReal + 0.05)) {
                        let exceso = kgIntentados - disponibleReal;
                        if (yaPuchos > 0) {
                            let puchoARescatar = Math.min(exceso, yaPuchos);
                            const { rows: pDetailRows } = await client.query(
                                'SELECT id, kg FROM puchos_detalle WHERE entrada_id = $1 AND calibre = $2 ORDER BY fecha_aporte ASC',
                                [data.entradaId, calNombre]
                            );

                            let faltantePorDescontar = puchoARescatar;
                            for (let rp of pDetailRows) {
                                if (faltantePorDescontar <= 0) break;
                                if (parseFloat(rp.kg) <= (faltantePorDescontar + 0.01)) {
                                    await client.query('DELETE FROM puchos_detalle WHERE id = $1', [rp.id]);
                                    faltantePorDescontar -= parseFloat(rp.kg);
                                } else {
                                    await client.query('UPDATE puchos_detalle SET kg = kg - $1 WHERE id = $2', [faltantePorDescontar, rp.id]);
                                    faltantePorDescontar = 0;
                                }
                            }
                            disponibleReal += puchoARescatar;
                        }

                        if (kgIntentados > (disponibleReal + 0.05)) {
                            c.kg = Math.max(0, disponibleReal);
                            if (c.pucho) {
                                let puchoActual = parseFloat(c.pucho);
                                let otrosComponentes = kgIntentados - puchoActual;
                                c.pucho = Math.max(0, disponibleReal - otrosComponentes);
                            }
                        }
                    }

                    // 4. Procesar calibres
                    const { rows: calExistRows } = await client.query(
                        'SELECT id, kg, cantidad_envases, pucho FROM calibres_almacen WHERE lote_almacen_id = $1 AND calibre = $2',
                        [loteId, c.calibre]
                    );

                    if (calExistRows.length > 0) {
                        const ex = calExistRows[0];
                        await client.query(
                            'UPDATE calibres_almacen SET kg = $1, cantidad_envases = $2, pucho = $3 WHERE id = $4',
                            [parseFloat(ex.kg) + parseFloat(c.kg || 0), parseInt(ex.cantidad_envases) + parseInt(c.cantidad_envases || 0), parseFloat(ex.pucho) + parseFloat(c.pucho || 0), ex.id]
                        );
                    } else {
                        await client.query(
                            'INSERT INTO calibres_almacen (lote_almacen_id, calibre, kg, cantidad_envases, kilos_por_envase, pucho) VALUES ($1, $2, $3, $4, $5, $6)',
                            [loteId, c.calibre, c.kg || 0, c.cantidad_envases || 0, c.kilos_por_envase || 60, c.pucho || 0]
                        );
                    }
                }
            }

            await client.query('COMMIT');
            await fastify.logActivity(user.id, 'crear', 'almacen', `Lote agregado/fusionado: ${data.codigoLote}`);
            return reply.code(201).send({
                success: true,
                id: loteId,
                nueva_ocupacion: envasesActuales + envasesNuevos,
                capacidad_max: capacidadMax
            });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    // DELETE /almacen/lotes/:id
    removeLote: async (request, reply) => {
        const { id } = request.params;
        const fastify = request.server;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            await client.query('BEGIN');
            const { rows: infoRows } = await client.query('SELECT entrada_id, codigo_lote FROM lotes_almacen WHERE id = $1', [id]);
            if (infoRows.length > 0) {
                const { entrada_id: entradaId, codigo_lote: codigoLote } = infoRows[0];
                await client.query('DELETE FROM calibres_almacen WHERE lote_almacen_id = $1', [id]);
                await client.query('DELETE FROM lotes_almacen WHERE id = $1', [id]);

                await client.query('COMMIT');
                await fastify.logActivity(user.id, 'eliminar', 'almacen', `Lote ${codigoLote} retirado del cuadrante`);
                return { success: true };
            }
            await client.query('ROLLBACK');
            return reply.code(404).send({ error: 'Lote no encontrado' });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    // DELETE /almacen/lotes-completo/:entradaId
    removeLoteCompleto: async (request, reply) => {
        const { entradaId } = request.params;
        const fastify = request.server;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM calibres_almacen WHERE lote_almacen_id IN (SELECT id FROM lotes_almacen WHERE entrada_id = $1)', [entradaId]);
            await client.query('DELETE FROM lotes_almacen WHERE entrada_id = $1', [entradaId]);
            await client.query('DELETE FROM puchos_detalle WHERE entrada_id = $1', [entradaId]);
            await client.query('COMMIT');
            await fastify.logActivity(user.id, 'eliminar', 'almacen', `Lote completo y sus puchos removidos (Entrada ID: ${entradaId})`);
            return { success: true };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    // POST /almacen/mover-lote
    moverLote: async (request, reply) => {
        const fastify = request.server;
        const { loteId, destinoCuadranteId } = request.body;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            await client.query('BEGIN');
            const { rows: loteRows } = await client.query(`
        SELECT la.*, 
               (SELECT COALESCE(SUM(ca.cantidad_envases), 0) FROM calibres_almacen ca WHERE ca.lote_almacen_id = la.id) as total_envases
        FROM lotes_almacen la 
        WHERE la.id = $1 
        FOR UPDATE
      `, [loteId]);

            if (loteRows.length === 0) {
                await client.query('ROLLBACK');
                return reply.code(409).send({ error: 'El lote ya no existe.' });
            }

            const loteActual = loteRows[0];
            if (loteActual.cuadrante_id == destinoCuadranteId) {
                await client.query('ROLLBACK');
                return reply.code(400).send({ error: 'El lote ya está en ese cuadrante' });
            }

            const { rows: quadRows } = await client.query('SELECT capacidad_max FROM cuadrantes WHERE id = $1', [destinoCuadranteId]);
            const capacidadMax = quadRows[0]?.capacidad_max || 300;

            const { rows: ocupRows } = await client.query(`
        SELECT COALESCE(SUM(ca.cantidad_envases), 0) as total_envases
        FROM lotes_almacen la
        JOIN calibres_almacen ca ON ca.lote_almacen_id = la.id
        WHERE la.cuadrante_id = $1
      `, [destinoCuadranteId]);

            const ocupacionDestino = parseInt(ocupRows[0].total_envases);
            const envasesAMover = parseInt(loteActual.total_envases);

            if ((ocupacionDestino + envasesAMover) > capacidadMax) {
                await client.query('ROLLBACK');
                return reply.code(400).send({ error: 'Capacidad insuficiente en destino' });
            }

            if (loteActual.entrada_id) {
                const { rows: existRows } = await client.query(
                    'SELECT id FROM lotes_almacen WHERE cuadrante_id = $1 AND entrada_id = $2 AND id != $3',
                    [destinoCuadranteId, loteActual.entrada_id, loteId]
                );

                if (existRows.length > 0) {
                    const idDestino = existRows[0].id;
                    const { rows: cRows } = await client.query('SELECT * FROM calibres_almacen WHERE lote_almacen_id = $1', [loteId]);
                    for (let c of cRows) {
                        const { rows: dRows } = await client.query('SELECT id FROM calibres_almacen WHERE lote_almacen_id = $1 AND calibre = $2', [idDestino, c.calibre]);
                        if (dRows.length > 0) {
                            await client.query(
                                'UPDATE calibres_almacen SET kg = kg + $1, cantidad_envases = cantidad_envases + $2, pucho = pucho + $3 WHERE id = $4',
                                [c.kg, c.cantidad_envases, c.pucho, dRows[0].id]
                            );
                            await client.query('DELETE FROM calibres_almacen WHERE id = $1', [c.id]);
                        } else {
                            await client.query('UPDATE calibres_almacen SET lote_almacen_id = $1 WHERE id = $2', [idDestino, c.id]);
                        }
                    }
                    await client.query('DELETE FROM lotes_almacen WHERE id = $1', [loteId]);
                    await client.query('COMMIT');
                    await fastify.logActivity(user.id, 'editar', 'almacen', `Lote fusionado por movimiento: ${loteActual.codigo_lote}`);
                    return { success: true, merged: true };
                }
            }

            await client.query('UPDATE lotes_almacen SET cuadrante_id = $1 WHERE id = $2', [destinoCuadranteId, loteId]);
            await client.query('COMMIT');
            await fastify.logActivity(user.id, 'editar', 'almacen', `Lote movido: ${loteActual.codigo_lote}`);
            return { success: true };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    // POST /almacen/reubicar-calibre
    reubicarCalibre: async (request, reply) => {
        const fastify = request.server;
        const { calibreId, destinoCuadranteId } = request.body;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            await client.query('BEGIN');
            const { rows: calRows } = await client.query(`
        SELECT ca.*, la.entrada_id, la.codigo_lote, la.id as lote_origen_id, la.cuadrante_id as origen_cuadrante_id
        FROM calibres_almacen ca
        JOIN lotes_almacen la ON ca.lote_almacen_id = la.id
        WHERE ca.id = $1
        FOR UPDATE
      `, [calibreId]);

            if (calRows.length === 0) {
                await client.query('ROLLBACK');
                return reply.code(409).send({ error: 'El calibre ya no existe.' });
            }

            const cal = calRows[0];
            if (cal.origen_cuadrante_id == destinoCuadranteId) {
                await client.query('ROLLBACK');
                return reply.code(400).send({ error: 'El calibre ya está en ese cuadrante' });
            }

            // Capacidad
            const { rows: qRows } = await client.query('SELECT capacidad_max FROM cuadrantes WHERE id = $1', [destinoCuadranteId]);
            const capMax = qRows[0]?.capacidad_max || 300;
            const { rows: oRows } = await client.query(`
        SELECT COALESCE(SUM(ca.cantidad_envases), 0) as total_envases
        FROM lotes_almacen la
        JOIN calibres_almacen ca ON ca.lote_almacen_id = la.id
        WHERE la.cuadrante_id = $1
      `, [destinoCuadranteId]);
            if ((parseInt(oRows[0].total_envases) + parseInt(cal.cantidad_envases)) > capMax) {
                await client.query('ROLLBACK');
                return reply.code(400).send({ error: 'Capacidad insuficiente en destino' });
            }

            // Lote destino
            let idLoteDestino;
            const { rows: lRows } = await client.query(
                'SELECT id FROM lotes_almacen WHERE cuadrante_id = $1 AND entrada_id = $2',
                [destinoCuadranteId, cal.entrada_id]
            );
            if (lRows.length > 0) {
                idLoteDestino = lRows[0].id;
            } else {
                const { rows: newLRows } = await client.query(
                    'INSERT INTO lotes_almacen (cuadrante_id, entrada_id, codigo_lote) VALUES ($1, $2, $3) RETURNING id',
                    [destinoCuadranteId, cal.entrada_id, cal.codigo_lote]
                );
                idLoteDestino = newLRows[0].id;
            }

            // Check calibre destino
            const { rows: cdRows } = await client.query('SELECT id FROM calibres_almacen WHERE lote_almacen_id = $1 AND calibre = $2', [idLoteDestino, cal.calibre]);
            if (cdRows.length > 0) {
                await client.query(
                    'UPDATE calibres_almacen SET kg = kg + $1, cantidad_envases = cantidad_envases + $2, pucho = pucho + $3 WHERE id = $4',
                    [cal.kg, cal.cantidad_envases, cal.pucho, cdRows[0].id]
                );
                await client.query('DELETE FROM calibres_almacen WHERE id = $1', [cal.id]);
            } else {
                await client.query('UPDATE calibres_almacen SET lote_almacen_id = $1 WHERE id = $2', [idLoteDestino, cal.id]);
            }

            // Cleanup
            const { rows: checkRows } = await client.query('SELECT COUNT(*) FROM calibres_almacen WHERE lote_almacen_id = $1', [cal.lote_origen_id]);
            if (parseInt(checkRows[0].count) === 0) {
                await client.query('DELETE FROM lotes_almacen WHERE id = $1', [cal.lote_origen_id]);
            }

            await client.query('COMMIT');
            await fastify.logActivity(user.id, 'editar', 'almacen', `Calibre ${cal.calibre} reubicado`);
            return { success: true };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    // POST /almacen/extraer-pucho
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
          AND (ca.pucho > 0.05 OR (ca.cantidad_envases = 0 AND ca.kg > 0.05))
        `, [loteId]);
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
                    entrada_id: c.entrada_id,
                    color: c.color,
                    calibre: c.calibre,
                    pucho: c.sobras,
                    id: null
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

    // GET /almacen/puchos/:id
    getPuchos: async (request, reply) => {
        const { id: cuadranteId } = request.params;
        const client = await request.server.pg.connect();
        try {
            const { rows: resumen } = await client.query(`
        SELECT color, calibre, SUM(kg) as total_kg, COUNT(*) as aportes
        FROM puchos_detalle
        WHERE cuadrante_id = $1
        GROUP BY color, calibre
        ORDER BY color, calibre
      `, [cuadranteId]);

            const { rows: historial } = await client.query(`
        SELECT pd.*, u.nombre as usuario_nombre, 
               COALESCE(la.codigo_lote, e.codigo_lote) as codigo_lote
        FROM puchos_detalle pd
        LEFT JOIN usuarios u ON pd.usuario_id = u.id
        LEFT JOIN lotes_almacen la ON pd.lote_origen_id = la.id
        LEFT JOIN entradas e ON pd.entrada_id = e.id
        WHERE pd.cuadrante_id = $1
        ORDER BY pd.fecha_aporte DESC
      `, [cuadranteId]);

            return { resumen, historial };
        } finally {
            client.release();
        }
    },

    // POST /almacen/devolver-pucho
    devolverPucho: async (request, reply) => {
        const { puchoId } = request.body;
        const fastify = request.server;
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
        LIMIT 1
      `, [pucho.entrada_id, pucho.calibre]);

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

    // POST /almacen/devolver-todo-pucho
    devolverTodoPucho: async (request, reply) => {
        const { cuadranteId } = request.body;
        const fastify = request.server;
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
          LIMIT 1
        `, [pData.entrada_id, pData.calibre]);

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

    // GET /almacen/disponibilidad/:entradaId
    getDisponibilidad: async (request, reply) => {
        const { entradaId } = request.params;
        const client = await request.server.pg.connect();
        try {
            const { rows: calOriginales } = await client.query(`
        SELECT calibre, subtotal as total_original, bidones as bidones_originales, kilos_por_bidon, sobras as pucho_original
        FROM calibres 
        WHERE entrada_id = $1
      `, [entradaId]);

            const resultado = [];
            for (let c of calOriginales) {
                const calNombre = c.calibre.trim();
                const { rows: fisRows } = await client.query(`
          SELECT COALESCE(SUM(ca.kg), 0) as kg_fisico, COALESCE(SUM(ca.cantidad_envases), 0) as envases_fisicos
          FROM calibres_almacen ca
          JOIN lotes_almacen la ON ca.lote_almacen_id = la.id
          WHERE la.entrada_id = $1 AND ca.calibre = $2
        `, [entradaId, calNombre]);

                const { rows: pucRows } = await client.query('SELECT COALESCE(SUM(kg), 0) as kg_puchos FROM puchos_detalle WHERE entrada_id = $1 AND calibre = $2', [entradaId, calNombre]);

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
