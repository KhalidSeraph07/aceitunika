import 'dotenv/config';
import Fastify from 'fastify';
import authPlugin from './plugins/auth.js';

async function build(opts = {}) {
    const fastify = Fastify({ logger: false, ...opts });

    await fastify.register(require('@fastify/postgres'), {
        connectionString: process.env.TEST_DB_URL || process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/aceitunas_v2'
    });

    await fastify.register(authPlugin);

    fastify.get('/health', () => ({ status: 'ok' }));

    fastify.register(import('./routes/auth.js'), { prefix: '/api/auth' });
    fastify.register(import('./routes/entradas.js'), { prefix: '/api/entradas' });
    fastify.register(import('./routes/insumos.js'), { prefix: '/api/insumos' });
    fastify.register(import('./routes/almacen.js'), { prefix: '/api/almacen' });
    fastify.register(import('./routes/ventas.js'), { prefix: '/api/ventas' });
    fastify.register(import('./routes/prestamos.js'), { prefix: '/api/prestamos' });
    fastify.register(import('./routes/reportes.js'), { prefix: '/api/reportes' });
    fastify.register(import('./routes/historial.js'), { prefix: '/api/historial' });
    fastify.register(import('./routes/calibres.js'), { prefix: '/api/calibres' });

    await fastify.ready();
    return fastify;
}

export default build;
