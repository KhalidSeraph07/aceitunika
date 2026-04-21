require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const path = require('path');

// 1. Plugins de Seguridad
fastify.register(require('@fastify/helmet'), {
    contentSecurityPolicy: false // Ajustar según necesidades del frontend
});
fastify.register(require('@fastify/cors'), {
    origin: '*', // En producción, especificar dominios
    methods: ['GET', 'POST', 'PUT', 'DELETE']
});

// 2. Plugins Propios (DB y Auth)
fastify.register(require('./app/plugins/db'));
fastify.register(require('./app/plugins/auth'));

// 3. Servir archivos estáticos (Frontend)
fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/'
});

// 4. Registrar Rutas
fastify.register(require('./app/routes/auth'), { prefix: '/api/auth' });
fastify.register(require('./app/routes/insumos'), { prefix: '/api/insumos' });
fastify.register(require('./app/routes/almacen'), { prefix: '/api/almacen' });
fastify.register(require('./app/routes/entradas'), { prefix: '/api/entradas' });
fastify.register(require('./app/routes/ventas'), { prefix: '/api/ventas' });
fastify.register(require('./app/routes/reportes'), { prefix: '/api/reportes' });
fastify.register(require('./app/routes/historial'), { prefix: '/api/historial' });
fastify.register(require('./app/routes/calibres'), { prefix: '/api/calibres' });
fastify.register(require('./app/routes/prestamos'), { prefix: '/api/prestamos' });

// 5. Middleware global de manejo de errores
fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    const statusCode = error.statusCode || 500;
    reply.code(statusCode).send({
        success: false,
        error: statusCode === 500 ? 'Error interno del servidor' : error.message
    });
});

// 6. Manejo de errores silenciosos de Node.js
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// 7. Encender Servidor
const start = async () => {
    try {
        await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
        console.log(`🚀 Servidor aceitunas_v2 encendido en puerto ${process.env.PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
