const prestamosController = require('../controllers/prestamosController');

async function prestamosRoutes(fastify, options) {
    fastify.addHook('preHandler', fastify.checkAuth);

    fastify.get('/', prestamosController.getAll);
    fastify.post('/', prestamosController.create);
    fastify.put('/:id', prestamosController.update);
    fastify.delete('/:id', prestamosController.delete);
}

module.exports = prestamosRoutes;
