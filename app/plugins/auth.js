import fp from 'fastify-plugin';

class MemoryStore {
    constructor() {
        this.sessions = {};
    }
    get(id, callback) {
        callback(null, this.sessions[id]);
    }
    set(id, session, callback) {
        this.sessions[id] = session;
        callback(null);
    }
    destroy(id, callback) {
        delete this.sessions[id];
        callback(null);
    }
}

async function authPlugin(fastify, options) {
    fastify.register(require('@fastify/cookie'));
    fastify.register(require('@fastify/session'), {
        secret: process.env.SESSION_SECRET,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            maxAge: 32400000
        },
        store: new MemoryStore()
    });

    fastify.decorate('checkAuth', async (request, reply) => {
        if (!request.session.user) {
            reply.code(401).send({ error: 'No autenticado' });
        }
    });

    fastify.decorate('isAdmin', async (request, reply) => {
        if (!request.session.user || request.session.user.rol !== 'admin') {
            reply.code(403).send({ error: 'Acceso denegado: se requieren permisos de administrador' });
        }
    });
}

export default fp(authPlugin);
