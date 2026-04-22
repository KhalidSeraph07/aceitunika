const insumosService = require('../services/insumosService');

const insumosController = {
    getAll: async (request, reply) => {
        const fastify = request.server;
        const client = await fastify.pg.connect();
        try {
            const service = await insumosService(client);
            return service.getAll();
        } finally {
            client.release();
        }
    },

    registrarMovimiento: async (request, reply) => {
        const fastify = request.server;
        const data = request.body;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            const service = await insumosService(client);
            const result = await service.registrarMovimiento(client, data, user.id);
            await fastify.logActivity(user.id, 'crear', 'insumos', `Movimiento: ${data.tipo} ${data.cantidad}`);
            return reply.code(201).send(result);
        } finally {
            client.release();
        }
    },

    getAlertas: async (request, reply) => {
        const fastify = request.server;
        const client = await fastify.pg.connect();
        try {
            const service = await insumosService(client);
            return service.getAlertas(client);
        } finally {
            client.release();
        }
    }
};

module.exports = insumosController;
