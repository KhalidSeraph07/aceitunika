const fp = require('fastify-plugin');

async function authPlugin(fastify, options) {
    fastify.register(require('@fastify/cookie'));
    fastify.register(require('@fastify/session'), {
        secret: process.env.SESSION_SECRET,
        cookie: {
            secure: process.env.NODE_ENV === 'production', // true solo en producción con HTTPS
            maxAge: 32400000 // 9 horas en milisegundos
        }
    });

    // Replicando checkAuth de PHP
    fastify.decorate('checkAuth', async (request, reply) => {
        if (!request.session.user) {
            reply.code(401).send({ error: 'No autenticado' });
        }
    });

    // Replicando isAdmin de PHP
    fastify.decorate('isAdmin', async (request, reply) => {
        if (!request.session.user || request.session.user.rol !== 'admin') {
            reply.code(403).send({ error: 'Acceso denegado: se requieren permisos de administrador' });
        }
    });
}

module.exports = fp(authPlugin);
