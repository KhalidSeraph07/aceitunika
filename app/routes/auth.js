const authController = require('../controllers/authController');

async function authRoutes(fastify, options) {
    fastify.post('/login', authController.login);
    fastify.post('/logout', authController.logout);
    fastify.get('/check', authController.check);
}

module.exports = authRoutes;
