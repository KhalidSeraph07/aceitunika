import { test, expect } from 'vitest';
const build = import('./test-build.js');

test('GET /health should return ok', async () => {
    const app = await (await build).default();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.json()).toEqual({ status: 'ok' });
    await app.close();
});

test('GET /api/auth/check without session returns authenticated: false', async () => {
    const app = await (await build).default();
    const res = await app.inject({ method: 'GET', url: '/api/auth/check' });
    expect(res.json().authenticated).toBe(false);
    await app.close();
});

test('GET /api/entradas without session returns 401', async () => {
    const app = await (await build).default();
    const res = await app.inject({ method: 'GET', url: '/api/entradas' });
    expect(res.statusCode).toBe(401);
    await app.close();
});

test('GET /api/insumos without session returns 401', async () => {
    const app = await (await build).default();
    const res = await app.inject({ method: 'GET', url: '/api/insumos' });
    expect(res.statusCode).toBe(401);
    await app.close();
});

test('GET /api/insumos/alertas without session returns 401', async () => {
    const app = await (await build).default();
    const res = await app.inject({ method: 'GET', url: '/api/insumos/alertas' });
    expect(res.statusCode).toBe(401);
    await app.close();
});

test('POST /api/auth/logout without session returns success (idempotent)', async () => {
    const app = await (await build).default();
    const res = await app.inject({ method: 'POST', url: '/api/auth/logout' });
    expect(res.statusCode).toBe(200);
    await app.close();
});
