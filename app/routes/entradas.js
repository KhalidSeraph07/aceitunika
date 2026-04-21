const entradasController = require('../controllers/entradasController');

async function entradasRoutes(fastify, options) {
    fastify.addHook('preHandler', fastify.checkAuth);

    fastify.get('/', entradasController.getAll);
    fastify.get('/:id', entradasController.getOne);
    fastify.post('/', entradasController.create);
    fastify.put('/:id', entradasController.update);
    fastify.delete('/:id', entradasController.delete);
    fastify.delete('/:id/force', entradasController.deleteForce);
}

module.exports = entradasRoutes;
