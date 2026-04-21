const calibresController = require('../controllers/calibresController');

async function calibresRoutes(fastify, options) {
    fastify.addHook('preHandler', fastify.checkAuth);

    fastify.get('/:id/precio-venta', calibresController.getPrecioVenta);
    fastify.put('/:id/precio-venta', calibresController.updatePrecioVenta);
    fastify.put('/precios-venta', calibresController.updateMultiplePrecios);
}

module.exports = calibresRoutes;
