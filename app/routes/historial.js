const historialController = require('../controllers/historialController');

async function historialRoutes(fastify, options) {
    fastify.addHook('preHandler', fastify.checkAuth);

    fastify.get('/', historialController.getAll);
}

module.exports = historialRoutes;
