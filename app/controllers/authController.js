const bcrypt = require('bcryptjs');

const authController = {
    // POST /auth/login
    login: async (request, reply) => {
        const { username, password } = request.body;
        const fastify = request.server;
        const client = await fastify.pg.connect();

        try {
            const { rows } = await client.query(
                'SELECT id, username, password, nombre, rol, activo FROM usuarios WHERE username = $1 AND activo = true',
                [username]
            );
            const user = rows[0];

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return reply.code(401).send({ error: 'Credenciales incorrectas' });
            }

            // Guardar datos en la sesión (Fastify Session)
            request.session.user = {
                id: user.id,
                username: user.username,
                nombre: user.nombre,
                rol: user.rol
            };

            await fastify.logActivity(user.id, 'login', 'auth', 'Inicio de sesión');

            return {
                success: true,
                user: request.session.user
            };
        } finally {
            client.release();
        }
    },

    // POST /auth/logout
    logout: async (request, reply) => {
        const fastify = request.server;
        const user = request.session.user;

        if (user) {
            await fastify.logActivity(user.id, 'logout', 'auth', 'Cierre de sesión');
        }

        request.session.destroy();
        return { success: true, message: 'Sesión cerrada' };
    },

    // GET /auth/check
    check: async (request, reply) => {
        if (!request.session.user) {
            return { authenticated: false };
        }

        return {
            authenticated: true,
            user: request.session.user
        };
    }
};

module.exports = authController;
