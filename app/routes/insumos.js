const insumosController = require('../controllers/insumosController');

async function insumosRoutes(fastify, options) {
    // Aplicar checkAuth a todas las rutas de este archivo
    fastify.addHook('preHandler', fastify.checkAuth);

    fastify.get('/', insumosController.getAll);
    fastify.post('/movimiento', { preHandler: fastify.isAdmin }, insumosController.registrarMovimiento);
    fastify.get('/alertas', insumosController.getAlertas);
}

module.exports = insumosRoutes;
