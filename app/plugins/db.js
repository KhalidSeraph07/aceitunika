const fp = require('fastify-plugin');
const fastifyPostgres = require('@fastify/postgres');

async function dbConnector(fastify, options) {
  fastify.register(fastifyPostgres, {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME
  });

  // Decorador para logActivity (replicando la lógica de PHP)
  fastify.decorate('logActivity', async (userId, accion, modulo, descripcion = null, datosAnteriores = null, datosNuevos = null) => {
    const client = await fastify.pg.connect();
    try {
      await client.query(
        'INSERT INTO historial_actividad (usuario_id, accion, modulo, descripcion, datos_anteriores, datos_nuevos) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, accion, modulo, descripcion, datosAnteriores, datosNuevos]
      );
    } finally {
      client.release();
    }
  });
}

module.exports = fp(dbConnector);
