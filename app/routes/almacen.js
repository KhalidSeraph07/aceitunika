const almacenController = require('../controllers/almacenController');

async function almacenRoutes(fastify, options) {
    fastify.addHook('preHandler', fastify.checkAuth);

    // Acciones Administrativas (Escritura)
    fastify.post('/filas', { preHandler: fastify.isAdmin }, almacenController.createFila);
    fastify.put('/filas/:id', { preHandler: fastify.isAdmin }, almacenController.updateFila);
    fastify.delete('/filas/:id', { preHandler: fastify.isAdmin }, almacenController.deleteFila);

    fastify.post('/cuadrantes', { preHandler: fastify.isAdmin }, almacenController.createCuadrante);
    fastify.delete('/cuadrantes/:id', { preHandler: fastify.isAdmin }, almacenController.deleteCuadrante);
    fastify.post('/toggle-pucho/:id', { preHandler: fastify.isAdmin }, almacenController.toggleZonaPuchos);

    fastify.post('/lotes', { preHandler: fastify.isAdmin }, almacenController.addLote);
    fastify.delete('/lotes/:id', { preHandler: fastify.isAdmin }, almacenController.removeLote);
    fastify.delete('/lotes-completo/:entradaId', { preHandler: fastify.isAdmin }, almacenController.removeLoteCompleto);
    fastify.post('/mover-lote', { preHandler: fastify.isAdmin }, almacenController.moverLote);

    fastify.post('/reubicar-calibre', { preHandler: fastify.isAdmin }, almacenController.reubicarCalibre);
    fastify.post('/extraer-pucho', { preHandler: fastify.isAdmin }, almacenController.extraerPucho);
    fastify.post('/devolver-pucho', { preHandler: fastify.isAdmin }, almacenController.devolverPucho);
    fastify.post('/devolver-todo-pucho', { preHandler: fastify.isAdmin }, almacenController.devolverTodoPucho);

    // Acciones de Consulta (Lectura)
    fastify.get('/', { preHandler: fastify.isAdmin }, almacenController.getAll);
    fastify.get('/disponibilidad/:entradaId', almacenController.getDisponibilidad);
    fastify.get('/puchos/:id', almacenController.getPuchos);
}

module.exports = almacenRoutes;
