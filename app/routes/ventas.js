const ventasController = require('../controllers/ventasController');

async function ventasRoutes(fastify, options) {
    fastify.addHook('preHandler', fastify.checkAuth);

    fastify.get('/', ventasController.getAll);
    fastify.get('/:id', ventasController.getOne);
    fastify.post('/', ventasController.create);
    fastify.delete('/:id', ventasController.delete);
}

module.exports = ventasRoutes;
