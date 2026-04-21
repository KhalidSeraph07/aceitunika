const { toCamelCase, parseMoneda } = require('../utils/helpers');

const entradasController = {
    // GET /entradas
    getAll: async (request, reply) => {
        const fastify = request.server;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            const { rows: entradas } = await client.query(`
        SELECT e.*, u.nombre as usuario_nombre
        FROM entradas e
        LEFT JOIN usuarios u ON e.usuario_id = u.id
        ORDER BY e.fecha DESC, e.id DESC
      `);
            for (let e of entradas) {
                e.calibres = await entradasController._getCalibres(client, e.id);
                e.otrosGastos = await entradasController._getOtrosGastos(client, e.id);
                e.personalTurnos = await entradasController._getPersonalTurnos(client, e.id);
                if (user.rol !== 'admin') entradasController._ocultarPrecios(e);
            }
            return toCamelCase(entradas);
        } finally {
            client.release();
        }
    },

    // GET /entradas/:id
    getOne: async (request, reply) => {
        const { id } = request.params;
        const fastify = request.server;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            const { rows } = await client.query(`
        SELECT e.*, u.nombre as usuario_nombre
        FROM entradas e
        LEFT JOIN usuarios u ON e.usuario_id = u.id
        WHERE e.id = $1
      `, [id]);
            if (rows.length === 0) return reply.code(404).send({ error: 'Entrada no encontrada' });
            const e = rows[0];
            e.calibres = await entradasController._getCalibres(client, e.id);
            e.otrosGastos = await entradasController._getOtrosGastos(client, e.id);
            e.personalTurnos = await entradasController._getPersonalTurnos(client, e.id);
            if (user.rol !== 'admin') entradasController._ocultarPrecios(e);
            return toCamelCase(e);
        } finally {
            client.release();
        }
    },

    // POST /entradas
    create: async (request, reply) => {
        const fastify = request.server;
        const user = request.session.user;
        const data = request.body;
        const client = await fastify.pg.connect();

        if (!data.codigoLote || !data.fecha) {
            return reply.code(400).send({ error: 'Código de lote y fecha son requeridos' });
        }

        try {
            await client.query('BEGIN');

            // 1. Verificar duplicado
            const { rows: dupRows } = await client.query('SELECT id, fecha, vendedor FROM entradas WHERE codigo_lote = $1', [data.codigoLote]);
            if (dupRows.length > 0 && !data.confirmarDuplicado) {
                await client.query('ROLLBACK');
                return reply.code(409).send({ error: 'Ya existe una entrada con este código de lote', warning: true, duplicado: true, loteExistente: toCamelCase(dupRows[0]) });
            }

            // 2. Concurrencia
            const { rows: recentRows } = await client.query(`
        SELECT id FROM entradas WHERE created_at > (NOW() - INTERVAL '30 seconds')
        AND codigo_lote = $1 AND vendedor = $2 AND fecha = $3 LIMIT 1 FOR UPDATE
      `, [data.codigoLote, data.vendedor || '', data.fecha]);
            if (recentRows.length > 0) {
                await client.query('ROLLBACK');
                return { success: true, id: recentRows[0].id, duplicadoPrevenido: true };
            }

            // 3. Insertar Entrada
            const sql = `
        INSERT INTO entradas (
          codigo_lote, fecha, vendedor, supervisor, lugar, precio, cantidad,
          tipo_envase, envase_cantidad, envase_kilos, envase_puchos, acidez, grados_sal, ph,
          color, variedad, proceso, sub_proceso, destino, transporte_conductor, transporte_viajes,
          transporte_costo_viaje, transporte_traspaleadores, transporte_costo_traspaleador, transporte_total,
          salmuera_agua, salmuera_agua_precio, sorbato_potasio, sorbato_potasio_precio,
          acido_lactico, acido_lactico_precio, acido_citrico, acido_citrico_precio,
          calcio, calcio_precio, acido_acetico, acido_acetico_precio,
          acido_ascorbico, acido_ascorbico_precio, benzoato_potasio, benzoato_potasio_precio,
          salmuera_otros, salmuera_otros_costo, total_costo_salmuera,
          fecha_calibracion, responsable_calibracion, varones_qty, varones_hora_hombre, varones_hora_ingreso,
          varones_hora_final, varones_horas_trabajadas, varones_costo_total,
          mujeres_qty, mujeres_hora_hombre, mujeres_hora_ingreso, mujeres_hora_final,
          mujeres_horas_trabajadas, mujeres_costo_total,
          traspaleadores_qty, traspaleadores_costo_dia, traspaleadores_dias, traspaleadores_costo_total,
          total_costo_personal, total_otros_gastos, observaciones, aceituna_manchada_kg, usuario_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
          $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41,
          $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58, $59, $60, $61, $62,
          $63, $64, $65, $66, $67
        ) RETURNING id
      `;

            const params = [
                data.codigoLote, data.fecha, data.vendedor || null, data.supervisor || null, data.lugar || null,
                data.precio || 0, data.cantidad || 0, data.tipoEnvase || null, data.envase_cantidad || 0,
                data.envase_kilos || 0, data.envase_puchos || 0, data.acidez || null, data.gradosSal || null, data.ph || null,
                data.color || null, data.variedad || null, data.proceso || null, data.subProceso || null, data.destino || null,
                data.transporteConductor || null, data.transporteViajes || 0, data.transporteCostoViaje || 0,
                data.transporteTraspaleadores || 0, data.transporteCostoTraspaleador || 0, parseMoneda(data.transporteTotal || '0'),
                data.salmueraAgua || 0, data.salmueraAguaPrecio || 0, data.sorbatoPotasio || 0, data.sorbatoPotasioPrecio || 0,
                data.acidoLactico || 0, data.acidoLacticoPrecio || 0, data.acidoCitrico || 0, data.acidoCitricoPrecio || 0,
                data.calcio || 0, data.calcioPrecio || 0, data.acidoAcetico || 0, data.acidoAceticoPrecio || 0,
                data.acidoAscorbico || 0, data.acidoAscorbicoPrecio || 0, data.benzoatoPotasio || 0, data.benzoatoPotasioPrecio || 0,
                data.salmueraOtros || null, data.salmueraOtrosCosto || 0, parseMoneda(data.totalCostoSalmuera || '0'),
                data.fechaCalibracion || null, data.responsableCalibracion || null,
                data.varonesQty || 0, data.varonesHoraHombre || 0, data.varonesHoraIngreso || null, data.varonesHoraFinal || null,
                data.varonesHorasTrabajadas || null, parseMoneda(data.varonesCostoTotal || '0'),
                data.mujeresQty || 0, data.mujeresHoraHombre || 0, data.mujeresHoraIngreso || null, data.mujeresHoraFinal || null,
                data.mujeresHorasTrabajadas || null, parseMoneda(data.mujeresCostoTotal || '0'),
                data.traspaleadoresQty || 0, data.traspaleadoresCostoDia || 0, data.traspaleadoresDias || 1, parseMoneda(data.traspaleadoresCostoTotal || '0'),
                parseMoneda(data.totalCostoPersonal || '0'), parseMoneda(data.totalOtrosGastos || '0'),
                data.observaciones || null, data.aceitunaManchadaKg || 0, user.id
            ];

            const { rows: insertRows } = await client.query(sql, params);
            const entradaId = insertRows[0].id;

            // 4. Calibres
            if (data.calibres) await entradasController._insertCalibres(client, entradaId, data.calibres);
            // 5. Otros Gastos
            if (data.otrosGastos) await entradasController._insertOtrosGastosBulk(client, entradaId, data.otrosGastos);
            // 6. Turnos
            if (data.personalTurnos) await entradasController._insertPersonalTurnos(client, entradaId, data.personalTurnos);

            await client.query('COMMIT');
            await fastify.logActivity(user.id, 'crear', 'entradas', `Entrada creada: ${data.codigoLote}`);
            return reply.code(201).send({ success: true, id: entradaId });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    // PUT /entradas/:id
    update: async (request, reply) => {
        const { id } = request.params;
        const fastify = request.server;
        const user = request.session.user;
        const data = request.body;
        const client = await fastify.pg.connect();

        const isIngeniero = user.rol.startsWith('ing');
        if (user.rol !== 'admin' && !isIngeniero) {
            return reply.code(403).send({ error: 'No tiene permisos para editar' });
        }

        try {
            await client.query('BEGIN');
            const { rows: antRows } = await client.query('SELECT * FROM entradas WHERE id = $1', [id]);
            if (antRows.length === 0) {
                await client.query('ROLLBACK');
                return reply.code(404).send({ error: 'Entrada no encontrada' });
            }
            const anterior = antRows[0];

            const sql = `
        UPDATE entradas SET
          codigo_lote = $1, fecha = $2, vendedor = $3, supervisor = $4, lugar = $5,
          precio = $6, cantidad = $7, tipo_envase = $8, envase_cantidad = $9,
          envase_kilos = $10, envase_puchos = $11, acidez = $12, grados_sal = $13,
          ph = $14, color = $15, variedad = $16, proceso = $17,
          sub_proceso = $18, destino = $19, transporte_conductor = $20, transporte_viajes = $21,
          transporte_costo_viaje = $22, transporte_traspaleadores = $23, transporte_costo_traspaleador = $24,
          transporte_total = $25, salmuera_agua = $26, salmuera_agua_precio = $27, sorbato_potasio = $28,
          sorbato_potasio_precio = $29, acido_lactico = $30, acido_lactico_precio = $31,
          acido_citrico = $32, acido_citrico_precio = $33, calcio = $34, calcio_precio = $35,
          acido_acetico = $36, acido_acetico_precio = $37, acido_ascorbico = $38,
          acido_ascorbico_precio = $39, benzoato_potasio = $40, benzoato_potasio_precio = $41,
          salmuera_otros = $42, salmuera_otros_costo = $43, total_costo_salmuera = $44,
          fecha_calibracion = $45, responsable_calibracion = $46, total_costo_personal = $47,
          total_otros_gastos = $48, observaciones = $49, aceituna_manchada_kg = $50,
          varones_qty = $51, varones_hora_hombre = $52, varones_hora_ingreso = $53, varones_hora_final = $54,
          varones_horas_trabajadas = $55, varones_costo_total = $56,
          mujeres_qty = $57, mujeres_hora_hombre = $58, mujeres_hora_ingreso = $59, mujeres_hora_final = $60,
          mujeres_horas_trabajadas = $61, mujeres_costo_total = $62,
          traspaleadores_qty = $63, traspaleadores_costo_dia = $64, traspaleadores_dias = $65, traspaleadores_costo_total = $66
        WHERE id = $67
      `;

            const params = [
                data.codigoLote, data.fecha, data.vendedor || null, data.supervisor || null, data.lugar || null,
                isIngeniero ? anterior.precio : (data.precio || 0), data.cantidad || 0,
                data.tipoEnvase || null, data.envase_cantidad || 0, data.envase_kilos || 0,
                data.envase_puchos || 0, data.acidez || null, data.gradosSal || null, data.ph || null,
                data.color || null, data.variedad || null, data.proceso || null, data.subProceso || null,
                data.destino || null, data.transporteConductor || null, data.transporteViajes || 0,
                isIngeniero ? anterior.transporte_costo_viaje : (data.transporteCostoViaje || 0),
                data.transporteTraspaleadores || 0,
                isIngeniero ? anterior.transporte_costo_traspaleador : (data.transporteCostoTraspaleador || 0),
                isIngeniero ? anterior.transporte_total : parseMoneda(data.transporteTotal || '0'),
                data.salmueraAgua || 0,
                isIngeniero ? anterior.salmuera_agua_precio : (data.salmueraAguaPrecio || 0),
                data.sorbatoPotasio || 0,
                isIngeniero ? anterior.sorbato_potasio_precio : (data.sorbatoPotasioPrecio || 0),
                data.acidoLactico || 0,
                isIngeniero ? anterior.acido_lactico_precio : (data.acidoLacticoPrecio || 0),
                data.acidoCitrico || 0,
                isIngeniero ? anterior.acido_citrico_precio : (data.acidoCitricoPrecio || 0),
                data.calcio || 0,
                isIngeniero ? anterior.calcio_precio : (data.calcioPrecio || 0),
                data.acidoAcetico || 0,
                isIngeniero ? anterior.acido_acetico_precio : (data.acidoAceticoPrecio || 0),
                data.acidoAscorbico || 0,
                isIngeniero ? anterior.acido_ascorbico_precio : (data.acidoAscorbicoPrecio || 0),
                data.benzoatoPotasio || 0,
                isIngeniero ? anterior.benzoato_potasio_precio : (data.benzoatoPotasioPrecio || 0),
                data.salmueraOtros || null,
                isIngeniero ? anterior.salmuera_otros_costo : (data.salmueraOtrosCosto || 0),
                isIngeniero ? anterior.total_costo_salmuera : parseMoneda(data.totalCostoSalmuera || '0'),
                data.fechaCalibracion || null, data.responsableCalibracion || null,
                isIngeniero ? anterior.total_costo_personal : parseMoneda(data.totalCostoPersonal || '0'),
                isIngeniero ? anterior.total_otros_gastos : parseMoneda(data.totalOtrosGastos || '0'),
                data.observaciones || null, data.aceitunaManchadaKg || 0,
                // Nuevos campos de personal
                data.varonesQty || 0, data.varonesHoraHombre || 0, data.varonesHoraIngreso || null, data.varonesHoraFinal || null,
                data.varonesHorasTrabajadas || null, parseMoneda(data.varonesCostoTotal || '0'),
                data.mujeresQty || 0, data.mujeresHoraHombre || 0, data.mujeresHoraIngreso || null, data.mujeresHoraFinal || null,
                data.mujeresHorasTrabajadas || null, parseMoneda(data.mujeresCostoTotal || '0'),
                data.traspaleadoresQty || 0, data.traspaleadoresCostoDia || 0, data.traspaleadoresDias || 1, parseMoneda(data.traspaleadoresCostoTotal || '0'),
                id
            ];

            await client.query(sql, params);

            // Actualizar Sub-entidades
            await client.query('DELETE FROM calibres WHERE entrada_id = $1', [id]);
            if (data.calibres) await entradasController._insertCalibres(client, id, data.calibres);

            await client.query('DELETE FROM otros_gastos WHERE entrada_id = $1', [id]);
            if (data.otrosGastos) await entradasController._insertOtrosGastosBulk(client, id, data.otrosGastos);

            await client.query('DELETE FROM personal_turnos WHERE entrada_id = $1', [id]);
            if (data.personalTurnos) await entradasController._insertPersonalTurnos(client, id, data.personalTurnos);

            await client.query('COMMIT');

            // Sincronizar Almacén (fuera de la transacción principal para no bloquear)
            await entradasController._sincronizarConAlmacen(client, id, data);

            await fastify.logActivity(user.id, 'editar', 'entradas', `Entrada editada: ${data.codigoLote}`, anterior, data);
            return { success: true };
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    },

    // DELETE /entradas/:id
    delete: async (request, reply) => {
        const { id } = request.params;
        const fastify = request.server;
        const user = request.session.user;
        const client = await fastify.pg.connect();

        if (user.rol !== 'admin') return reply.code(403).send({ error: 'No tiene permisos' });

        try {
            const { rows: eRows } = await client.query('SELECT codigo_lote FROM entradas WHERE id = $1', [id]);
            if (eRows.length === 0) return reply.code(404).send({ error: 'Entrada no encontrada' });

            // Verificar almacén
            const { rows: lotes } = await client.query(`
        SELECT la.id, la.codigo_lote, c.nombre as cuadrante, f.nombre as fila
        FROM lotes_almacen la
        JOIN cuadrantes c ON la.cuadrante_id = c.id
        JOIN filas f ON c.fila_id = f.id
        WHERE la.entrada_id = $1
      `, [id]);

            if (lotes.length > 0) {
                return reply.code(409).send({
                    error: 'Esta entrada tiene lotes asignados en el almacén',
                    warning: true,
                    lotesEnAlmacen: lotes.length,
                    ubicaciones: lotes.map(l => `${l.fila}-${l.cuadrante}`),
                    mensaje: 'Si elimina esta entrada, los lotes en almacén perderán la referencia.'
                });
            }

            await client.query('DELETE FROM entradas WHERE id = $1', [id]);
            await fastify.logActivity(user.id, 'eliminar', 'entradas', `Entrada eliminada: ${eRows[0].codigo_lote}`);
            return { success: true };
        } finally {
            client.release();
        }
    },

    // DELETE /entradas/:id/force
    deleteForce: async (request, reply) => {
        const { id } = request.params;
        const fastify = request.server;
        const user = request.session.user;
        const client = await fastify.pg.connect();

        if (user.rol !== 'admin') return reply.code(403).send({ error: 'No tiene permisos' });

        try {
            const { rows: eRows } = await client.query('SELECT codigo_lote FROM entradas WHERE id = $1', [id]);
            if (eRows.length === 0) return reply.code(404).send({ error: 'Entrada no encontrada' });

            const { rows: countRows } = await client.query('SELECT COUNT(*) FROM lotes_almacen WHERE entrada_id = $1', [id]);
            const afectados = countRows[0].count;

            await client.query('DELETE FROM entradas WHERE id = $1', [id]);
            await fastify.logActivity(user.id, 'eliminar', 'entradas', `Entrada eliminada (forzado): ${eRows[0].codigo_lote}`);
            return { success: true, lotesAfectados: afectados };
        } finally {
            client.release();
        }
    },

    _sincronizarConAlmacen: async (client, entradaId, data) => {
        try {
            const { rows: lotes } = await client.query('SELECT id FROM lotes_almacen WHERE entrada_id = $1', [entradaId]);
            if (lotes.length === 0) return;

            for (let l of lotes) {
                await client.query('UPDATE lotes_almacen SET codigo_lote = $1 WHERE id = $2', [data.codigoLote, l.id]);

                if (lotes.length === 1) {
                    // Si es único, sincronizar calibres
                    await client.query('DELETE FROM calibres_almacen WHERE lote_almacen_id = $1', [l.id]);
                    if (data.calibres) {
                        for (let c of data.calibres) {
                            const pesoTotal = parseFloat(c.subtotal || 0);
                            const kEnvase = parseFloat(c.kilosPorBidon || 60);
                            const envases = Math.floor(pesoTotal / kEnvase);
                            const pucho = pesoTotal - (envases * kEnvase);

                            await client.query(`
                INSERT INTO calibres_almacen (lote_almacen_id, calibre, kg, cantidad_envases, kilos_por_envase, pucho)
                VALUES ($1, $2, $3, $4, $5, $6)
              `, [l.id, c.calibre, pesoTotal, envases, kEnvase, pucho]);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error sincronizando almacén:', err);
        }
    },

    // Helper Methods (Internos)
    _getCalibres: async (client, id) => (await client.query('SELECT * FROM calibres WHERE entrada_id = $1', [id])).rows,
    _getOtrosGastos: async (client, id) => (await client.query('SELECT * FROM otros_gastos WHERE entrada_id = $1', [id])).rows,
    _getPersonalTurnos: async (client, id) => (await client.query('SELECT * FROM personal_turnos WHERE entrada_id = $1 ORDER BY turno, tipo_personal', [id])).rows,

    _insertCalibres: async (client, id, calibres) => {
        for (const c of calibres) {
            await client.query(
                'INSERT INTO calibres (entrada_id, calibre, bidones, kilos_por_bidon, sobras, subtotal, precio, valor_total) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [id, c.calibre || '', c.bidones || 0, c.kilosPorBidon || 0, c.sobras || 0, c.subtotal || 0, c.precio || 0, c.valorTotal || 0]
            );
        }
    },

    _insertOtrosGastosBulk: async (client, id, gastos) => {
        for (const g of gastos) {
            await client.query('INSERT INTO otros_gastos (entrada_id, descripcion, monto) VALUES ($1, $2, $3)', [id, g.descripcion || '', g.monto || 0]);
        }
    },

    _insertPersonalTurnos: async (client, id, turnos) => {
        for (const t of turnos) {
            await client.query(`
        INSERT INTO personal_turnos (
          entrada_id, fecha, turno, tipo_personal, cantidad, hora_ingreso, hora_final, horas_trabajadas, incluye_almuerzo, costo_hora, costo_total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [id, t.fecha || null, t.turno || 'manana', t.tipoPersonal || 'varones', t.cantidad || 0, t.horaIngreso || null, t.horaFinal || null, t.horasTrabajadas || null, t.incluyeAlmuerzo || false, t.costoHora || 0, t.costoTotal || 0]);
        }
    },

    _ocultarPrecios: (e) => {
        const campos = ['precio', 'transporte_costo_viaje', 'transporte_costo_traspaleador', 'transporte_total', 'salmuera_agua_precio', 'sorbato_potasio_precio', 'acido_lactico_precio', 'acido_citrico_precio', 'calcio_precio', 'acido_acetico_precio', 'acido_ascorbico_precio', 'benzoato_potasio_precio', 'salmuera_otros_costo', 'total_costo_salmuera', 'varones_hora_hombre', 'varones_costo_total', 'mujeres_hora_hombre', 'mujeres_costo_total', 'traspaleadores_costo_dia', 'traspaleadores_costo_total', 'total_costo_personal', 'total_otros_gastos'];
        campos.forEach(c => { if (e[c] !== undefined) e[c] = null; });
    }
};

module.exports = entradasController;
