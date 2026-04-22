async function lotesService(client) {
    return {
        async addLote(data, userId, { logActivity }) {
            await client.query('BEGIN');

            const { rows: quadRows } = await client.query(
                'SELECT capacidad_max FROM cuadrantes WHERE id = $1', [data.cuadranteId]
            );
            if (quadRows.length === 0) {
                await client.query('ROLLBACK');
                throw Object.assign(new Error('Cuadrante no encontrado'), { statusCode: 404 });
            }

            const capacidadMax = quadRows[0].capacidad_max || 300;
            const { rows: ocupRows } = await client.query(`
                SELECT COALESCE(SUM(ca.cantidad_envases), 0) as total_envases
                FROM lotes_almacen la
                JOIN calibres_almacen ca ON ca.lote_almacen_id = la.id
                WHERE la.cuadrante_id = $1`, [data.cuadranteId]
            );

            const envasesActuales = parseInt(ocupRows[0].total_envases);
            let envasesNuevos = 0;
            if (data.calibres) {
                envasesNuevos = data.calibres.reduce((acc, curr) => acc + parseInt(curr.cantidad_envases || 0), 0);
            }

            const espacioDisponible = capacidadMax - envasesActuales;
            if (envasesNuevos > espacioDisponible && !data.forzarAsignacion) {
                await client.query('ROLLBACK');
                throw Object.assign(new Error(`El lote tiene ${envasesNuevos} bidones pero solo hay espacio para ${espacioDisponible}.`), {
                    statusCode: 400,
                    excede_capacidad: true,
                    capacidad_max: capacidadMax,
                    ocupacion_actual: envasesActuales,
                    espacio_disponible: espacioDisponible,
                    envases_lote: envasesNuevos,
                    exceso: envasesNuevos - espacioDisponible
                });
            }

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
                        WHERE la.entrada_id = $1 AND ca.calibre = $2 AND la.id != $3`,
                        [data.entradaId, calNombre, loteId]
                    );
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
            if (logActivity) logActivity(userId, 'crear', 'almacen', `Lote agregado/fusionado: ${data.codigoLote}`);
            return { success: true, id: loteId, nueva_ocupacion: envasesActuales + envasesNuevos, capacidad_max: capacidadMax };
        },

        async removeLote(client, id, userId, { logActivity }) {
            await client.query('BEGIN');
            const { rows: infoRows } = await client.query('SELECT entrada_id, codigo_lote FROM lotes_almacen WHERE id = $1', [id]);
            if (infoRows.length > 0) {
                const { entrada_id: entradaId, codigo_lote: codigoLote } = infoRows[0];
                await client.query('DELETE FROM calibres_almacen WHERE lote_almacen_id = $1', [id]);
                await client.query('DELETE FROM lotes_almacen WHERE id = $1', [id]);
                await client.query('COMMIT');
                if (logActivity) logActivity(userId, 'eliminar', 'almacen', `Lote ${codigoLote} retirado del cuadrante`);
                return { success: true };
            }
            await client.query('ROLLBACK');
            throw Object.assign(new Error('Lote no encontrado'), { statusCode: 404 });
        },

        async removeLoteCompleto(client, entradaId, userId, { logActivity }) {
            await client.query('BEGIN');
            await client.query('DELETE FROM calibres_almacen WHERE lote_almacen_id IN (SELECT id FROM lotes_almacen WHERE entrada_id = $1)', [entradaId]);
            await client.query('DELETE FROM lotes_almacen WHERE entrada_id = $1', [entradaId]);
            await client.query('DELETE FROM puchos_detalle WHERE entrada_id = $1', [entradaId]);
            await client.query('COMMIT');
            if (logActivity) logActivity(userId, 'eliminar', 'almacen', `Lote completo y sus puchos removidos (Entrada ID: ${entradaId})`);
            return { success: true };
        },

        async moverLote(client, { loteId, destinoCuadranteId }, userId, { logActivity }) {
            await client.query('BEGIN');
            const { rows: loteRows } = await client.query(`
                SELECT la.*,
                    (SELECT COALESCE(SUM(ca.cantidad_envases), 0) FROM calibres_almacen ca WHERE ca.lote_almacen_id = la.id) as total_envases
                FROM lotes_almacen la
                WHERE la.id = $1 FOR UPDATE`, [loteId]);

            if (loteRows.length === 0) {
                await client.query('ROLLBACK');
                throw Object.assign(new Error('El lote ya no existe.'), { statusCode: 409 });
            }

            const loteActual = loteRows[0];
            if (loteActual.cuadrante_id == destinoCuadranteId) {
                await client.query('ROLLBACK');
                throw Object.assign(new Error('El lote ya está en ese cuadrante'), { statusCode: 400 });
            }

            const { rows: quadRows } = await client.query('SELECT capacidad_max FROM cuadrantes WHERE id = $1', [destinoCuadranteId]);
            const capacidadMax = quadRows[0]?.capacidad_max || 300;

            const { rows: ocupRows } = await client.query(`
                SELECT COALESCE(SUM(ca.cantidad_envases), 0) as total_envases
                FROM lotes_almacen la
                JOIN calibres_almacen ca ON ca.lote_almacen_id = la.id
                WHERE la.cuadrante_id = $1`, [destinoCuadranteId]);

            const ocupacionDestino = parseInt(ocupRows[0].total_envases);
            const envasesAMover = parseInt(loteActual.total_envases);

            if ((ocupacionDestino + envasesAMover) > capacidadMax) {
                await client.query('ROLLBACK');
                throw Object.assign(new Error('Capacidad insuficiente en destino'), { statusCode: 400 });
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
                    if (logActivity) logActivity(userId, 'editar', 'almacen', `Lote fusionado por movimiento: ${loteActual.codigo_lote}`);
                    return { success: true, merged: true };
                }
            }

            await client.query('UPDATE lotes_almacen SET cuadrante_id = $1 WHERE id = $2', [destinoCuadranteId, loteId]);
            await client.query('COMMIT');
            if (logActivity) logActivity(userId, 'editar', 'almacen', `Lote movido: ${loteActual.codigo_lote}`);
            return { success: true };
        },

        async reubicarCalibre(client, { calibreId, destinoCuadranteId }, userId, { logActivity }) {
            await client.query('BEGIN');
            const { rows: calRows } = await client.query(`
                SELECT ca.*, la.entrada_id, la.codigo_lote, la.id as lote_origen_id, la.cuadrante_id as origen_cuadrante_id
                FROM calibres_almacen ca
                JOIN lotes_almacen la ON ca.lote_almacen_id = la.id
                WHERE ca.id = $1 FOR UPDATE`, [calibreId]);

            if (calRows.length === 0) {
                await client.query('ROLLBACK');
                throw Object.assign(new Error('El calibre ya no existe.'), { statusCode: 409 });
            }

            const cal = calRows[0];
            if (cal.origen_cuadrante_id == destinoCuadranteId) {
                await client.query('ROLLBACK');
                throw Object.assign(new Error('El calibre ya está en ese cuadrante'), { statusCode: 400 });
            }

            const { rows: qRows } = await client.query('SELECT capacidad_max FROM cuadrantes WHERE id = $1', [destinoCuadranteId]);
            const capMax = qRows[0]?.capacidad_max || 300;
            const { rows: oRows } = await client.query(`
                SELECT COALESCE(SUM(ca.cantidad_envases), 0) as total_envases
                FROM lotes_almacen la
                JOIN calibres_almacen ca ON ca.lote_almacen_id = la.id
                WHERE la.cuadrante_id = $1`, [destinoCuadranteId]);
            if ((parseInt(oRows[0].total_envases) + parseInt(cal.cantidad_envases)) > capMax) {
                await client.query('ROLLBACK');
                throw Object.assign(new Error('Capacidad insuficiente en destino'), { statusCode: 400 });
            }

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

            const { rows: checkRows } = await client.query('SELECT COUNT(*) FROM calibres_almacen WHERE lote_almacen_id = $1', [cal.lote_origen_id]);
            if (parseInt(checkRows[0].count) === 0) {
                await client.query('DELETE FROM lotes_almacen WHERE id = $1', [cal.lote_origen_id]);
            }

            await client.query('COMMIT');
            if (logActivity) logActivity(userId, 'editar', 'almacen', `Calibre ${cal.calibre} reubicado`);
            return { success: true };
        }
    };
}

module.exports = lotesService;
