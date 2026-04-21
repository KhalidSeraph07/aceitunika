/**
 * =============================================
 * CAPA API - COMUNICACIÓN CON BACKEND
 * Sistema Aceitunas SAS
 * Reemplaza localStorage por fetch() a la API PHP
 * =============================================
 */

const API = {
    baseURL: '/api',

    /**
     * Realizar petición HTTP a la API
     */
    async request(endpoint, options = {}) {
        try {
            const headers = { ...options.headers };

            // Solo establecer Content-Type si hay un cuerpo
            if (options.body && !headers['Content-Type']) {
                headers['Content-Type'] = 'application/json';
            }

            const response = await fetch(`${this.baseURL}${endpoint}`, {
                credentials: 'include', // Para mantener la sesión
                ...options,
                headers: headers
            });

            // Si es descarga de archivo (Excel)
            if (response.headers.get('content-type')?.includes('vnd.ms-excel')) {
                return response;
            }

            // Manejo de redirección si no hay sesión (401 Unauthorized)
            if (response.status === 401) {
                console.warn('Sesión expirada. Redirigiendo al login...');
                sessionStorage.clear();
                window.location.href = 'index.html';
                return;
            }

            const data = await response.json();

            // Manejo especial para 409 Conflict (advertencias como lotes en almacén)
            if (response.status === 409 && data.warning) {
                const error = new Error(data.error || 'Conflicto');
                error.warning = true;
                error.data = data;
                throw error;
            }

            if (!response.ok) {
                throw new Error(data.error || 'Error en la petición');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // ========== AUTENTICACIÓN ==========

    auth: {
        async login(username, password) {
            return API.request('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
        },

        async logout() {
            return API.request('/auth/logout', { method: 'POST' });
        },

        async check() {
            return API.request('/auth/check');
        }
    },

    // ========== ENTRADAS ==========

    entradas: {
        async getAll() {
            return API.request('/entradas');
        },

        async getOne(id) {
            return API.request(`/entradas/${id}`);
        },

        async create(data) {
            return API.request('/entradas', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async update(id, data) {
            return API.request(`/entradas/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        async delete(id) {
            return API.request(`/entradas/${id}`, { method: 'DELETE' });
        },

        async deleteForce(id) {
            return API.request(`/entradas/${id}/force`, { method: 'DELETE' });
        }
    },

    // ========== VENTAS ==========

    ventas: {
        async getAll() {
            return API.request('/ventas');
        },

        async getOne(id) {
            return API.request(`/ventas/${id}`);
        },

        async create(data) {
            return API.request('/ventas', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async delete(id) {
            return API.request(`/ventas/${id}`, { method: 'DELETE' });
        }
    },

    // ========== PRÉSTAMOS ==========

    prestamos: {
        async getAll() {
            return API.request('/prestamos');
        },

        async create(data) {
            return API.request('/prestamos', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async update(id, data) {
            return API.request(`/prestamos/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        async delete(id) {
            return API.request(`/prestamos/${id}`, { method: 'DELETE' });
        }
    },

    // ========== ALMACÉN ==========

    almacen: {
        async getAll() {
            return API.request('/almacen');
        },

        async createFila(data) {
            return API.request('/almacen/filas', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async updateFila(id, data) {
            return API.request(`/almacen/filas/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        async deleteFila(id) {
            return API.request(`/almacen/filas/${id}`, { method: 'DELETE' });
        },

        async createCuadrante(data) {
            return API.request('/almacen/cuadrantes', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async deleteCuadrante(id) {
            return API.request(`/almacen/cuadrantes/${id}`, { method: 'DELETE' });
        },

        async addLote(data) {
            return API.request('/almacen/lotes', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async removeLote(id) {
            return API.request(`/almacen/lotes/${id}`, { method: 'DELETE' });
        },

        async removeLoteCompleto(entradaId) {
            return API.request(`/almacen/lotes-completo/${entradaId}`, { method: 'DELETE' });
        },

        async moverLote(data) {
            return API.request('/almacen/mover-lote', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async moverCalibre(data) {
            return API.request('/almacen/mover-calibre', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async update(data) {
            return API.request('/almacen', {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        async updateCuadrante(id, data) {
            return API.request(`/almacen/cuadrantes/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        async toggleZonaPuchos(cuadranteId) {
            return API.request(`/almacen/toggle-pucho/${cuadranteId}`, {
                method: 'POST'
            });
        },

        async extraerPucho(data) {
            return API.request('/almacen/extraer-pucho', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async getPuchos(cuadranteId) {
            return API.request(`/almacen/puchos/${cuadranteId}`);
        },

        async devolverPucho(data) {
            return API.request('/almacen/devolver-pucho', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },
        async devolverTodoPucho(data) {
            return API.request('/almacen/devolver-todo-pucho', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async reubicarCalibre(data) {
            return API.request('/almacen/reubicar-calibre', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },
        async getDisponibilidad(entradaId) {
            return API.request(`/almacen/disponibilidad/${entradaId}`);
        }
    },

    // ========== INSUMOS ==========

    insumos: {
        async getAll() {
            return API.request('/insumos');
        },

        async registrarMovimiento(data) {
            return API.request('/insumos/movimiento', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }
    },

    // ========== HISTORIAL ==========

    historial: {
        async getAll(params = {}) {
            const query = new URLSearchParams(params).toString();
            return API.request(`/historial${query ? '?' + query : ''}`);
        }
    },

    // ========== REPORTES ==========

    reportes: {
        async getData(params = {}) {
            const query = new URLSearchParams(params).toString();
            return API.request(`/reportes${query ? '?' + query : ''}`);
        },

        async getInventario() {
            return API.request('/reportes/inventario');
        },

        async exportExcel() {
            const response = await API.request('/reportes/export');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte_aceitunas_${new Date().toISOString().split('T')[0]}.xls`;
            a.click();
            window.URL.revokeObjectURL(url);
        },

        async exportLoteExcel(lote) {
            const response = await API.request(`/reportes/export-lote/${lote}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lote_${lote}_${new Date().toISOString().split('T')[0]}.xls`;
            a.click();
            window.URL.revokeObjectURL(url);
        }
    },

    // ========== CALIBRES (Precio de Venta) ==========

    calibres: {
        /**
         * Actualizar precio de venta de un calibre específico
         */
        async updatePrecioVenta(calibreId, precioVenta) {
            return API.request(`/calibres/${calibreId}/precio-venta`, {
                method: 'PUT',
                body: JSON.stringify({ precio_venta: precioVenta })
            });
        },

        /**
         * Actualizar múltiples precios de venta
         * @param {Array} precios - Array de {calibre_id, precio_venta}
         */
        async updateMultiplePrecios(precios) {
            return API.request('/calibres/precios-venta', {
                method: 'PUT',
                body: JSON.stringify({ precios })
            });
        },

        /**
         * Obtener precio de venta de un calibre
         */
        async getPrecioVenta(calibreId) {
            return API.request(`/calibres/${calibreId}/precio-venta`);
        }
    }
};

// Hacer disponible globalmente
window.API = API;
