const reportesController = require('../controllers/reportesController');

async function reportesRoutes(fastify, options) {
    fastify.addHook('preHandler', fastify.checkAuth);

    fastify.get('/', { preHandler: fastify.isAdmin }, reportesController.getReporte);
    fastify.get('/inventario', { preHandler: fastify.isAdmin }, reportesController.getInventario);
    fastify.get('/export/excel', { preHandler: fastify.isAdmin }, reportesController.exportExcel);
    fastify.get('/dashboard', reportesController.getDashboard);
    fastify.get('/dashboard/kpis', reportesController.getKPIs);
}

module.exports = reportesRoutes;
