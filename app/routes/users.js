const usersController = require('../controllers/usersController');

async function usersRoutes(fastify, options) {
    fastify.addHook('preHandler', fastify.isAdmin);

    fastify.get('/', usersController.getAll);
    fastify.get('/:id', usersController.getOne);
    fastify.post('/', usersController.create);
    fastify.put('/:id', usersController.update);
    fastify.put('/:id/password', usersController.updatePassword);
    fastify.delete('/:id', usersController.delete);
}

module.exports = usersRoutes;
