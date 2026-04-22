const bcrypt = require('bcryptjs');

const usersController = {
    getAll: async (request, reply) => {
        const fastify = request.server;
        const client = await fastify.pg.connect();
        try {
            const { rows } = await client.query(
                'SELECT id, username, nombre, rol, activo, created_at FROM usuarios ORDER BY username'
            );
            return rows;
        } finally {
            client.release();
        }
    },

    getOne: async (request, reply) => {
        const fastify = request.server;
        const { id } = request.params;
        const client = await fastify.pg.connect();
        try {
            const { rows } = await client.query(
                'SELECT id, username, nombre, rol, activo, created_at FROM usuarios WHERE id = $1',
                [id]
            );
            if (rows.length === 0) {
                return reply.code(404).send({ error: 'Usuario no encontrado' });
            }
            return rows[0];
        } finally {
            client.release();
        }
    },

    create: async (request, reply) => {
        const fastify = request.server;
        const { username, password, nombre, rol } = request.body;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            if (!username || !password || !nombre || !rol) {
                return reply.code(400).send({ error: 'Datos incompletos' });
            }
            const hash = await bcrypt.hash(password, 10);
            const { rows } = await client.query(
                'INSERT INTO usuarios (username, password, nombre, rol) VALUES ($1, $2, $3, $4) RETURNING id, username, nombre, rol, activo',
                [username, hash, nombre, rol]
            );
            await fastify.logActivity(user.id, 'crear', 'usuarios', `Usuario creado: ${username}`);
            return reply.code(201).send({ success: true, user: rows[0] });
        } finally {
            client.release();
        }
    },

    update: async (request, reply) => {
        const fastify = request.server;
        const { id } = request.params;
        const { nombre, rol, activo } = request.body;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            const updates = [];
            const params = [];
            let i = 1;
            if (nombre !== undefined) { updates.push(`nombre = $${i++}`); params.push(nombre); }
            if (rol !== undefined) { updates.push(`rol = $${i++}`); params.push(rol); }
            if (activo !== undefined) { updates.push(`activo = $${i++}`); params.push(activo); }
            if (updates.length === 0) return reply.code(400).send({ error: 'No hay campos para actualizar' });
            params.push(id);
            const { rows } = await client.query(
                `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, username, nombre, rol, activo`,
                params
            );
            if (rows.length === 0) return reply.code(404).send({ error: 'Usuario no encontrado' });
            await fastify.logActivity(user.id, 'editar', 'usuarios', `Usuario editado ID: ${id}`);
            return { success: true, user: rows[0] };
        } finally {
            client.release();
        }
    },

    updatePassword: async (request, reply) => {
        const fastify = request.server;
        const { id } = request.params;
        const { password } = request.body;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            if (!password || password.length < 6) {
                return reply.code(400).send({ error: 'La contraseña debe tener al menos 6 caracteres' });
            }
            const hash = await bcrypt.hash(password, 10);
            await client.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hash, id]);
            await fastify.logActivity(user.id, 'editar', 'usuarios', `Password cambiado usuario ID: ${id}`);
            return { success: true };
        } finally {
            client.release();
        }
    },

    delete: async (request, reply) => {
        const fastify = request.server;
        const { id } = request.params;
        const user = request.session.user;
        const client = await fastify.pg.connect();
        try {
            if (parseInt(id) === user.id) {
                return reply.code(400).send({ error: 'No puedes eliminarte a ti mismo' });
            }
            const { rows } = await client.query(
                'DELETE FROM usuarios WHERE id = $1 RETURNING username',
                [id]
            );
            if (rows.length === 0) return reply.code(404).send({ error: 'Usuario no encontrado' });
            await fastify.logActivity(user.id, 'eliminar', 'usuarios', `Usuario eliminado: ${rows[0].username}`);
            return { success: true };
        } finally {
            client.release();
        }
    }
};

module.exports = usersController;
