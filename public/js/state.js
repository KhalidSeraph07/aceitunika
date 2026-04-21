/**
 * =============================================
 * ESTADO GLOBAL DE LA APLICACIÓN
 * Sistema Aceitunas SAS
 * =============================================
 */

const AppState = {
    // Usuario actual
    user: {
        id: null,
        username: '',
        nombre: '',
        rol: 'trabajador',
        isLoggedIn: false
    },

    // Datos principales
    entries: [],
    ventas: [],
    prestamos: [],
    almacen: { filas: [] },
    insumos: [],

    // UI
    currentSection: 'entrada',
    currentPage: 1,
    entriesPerPage: 10,
    currentSort: 'newest',

    // Modo simulación reportes
    modoSimularVenta: false,
    preciosSimulados: {},

    // Contadores
    calibreCounter: 0,
    otrosGastosCounter: 0,
    editingEntryId: null,

    /**
     * Inicializar estado desde sesión
     */
    async init() {
        try {
            const authData = await API.auth.check();
            if (authData.authenticated) {
                this.user = {
                    id: authData.user.id,
                    username: authData.user.username,
                    nombre: authData.user.nombre,
                    rol: authData.user.rol,
                    isLoggedIn: true
                };
            }
        } catch (error) {
            console.log('No autenticado');
        }
    },

    /**
     * Verificar si es admin
     */
    esAdmin() {
        return this.user.rol === 'admin';
    },

    /**
     * Verificar si puede ver precios
     */
    puedeVerPrecios() {
        return this.user.rol === 'admin';
    },

    /**
     * Verificar si puede editar ventas
     */
    puedeEditarVentas() {
        return this.user.rol === 'admin';
    },

    /**
     * Verificar si puede exportar
     */
    puedeExportar() {
        return this.user.rol === 'admin';
    },

    /**
     * Verificar si puede ver reportes
     */
    puedeVerReportes() {
        return this.user.rol === 'admin';
    },

    /**
     * Cargar entradas desde API
     */
    async cargarEntradas() {
        try {
            this.entries = await API.entradas.getAll();
            return this.entries;
        } catch (error) {
            console.error('Error cargando entradas:', error);
            return [];
        }
    },

    /**
     * Cargar almacén desde API
     */
    async cargarAlmacen() {
        try {
            const data = await API.almacen.getAll();
            this.almacen = data;
            return this.almacen;
        } catch (error) {
            console.error('Error cargando almacén:', error);
            return { filas: [] };
        }
    },

    /**
     * Cargar insumos desde API
     */
    async cargarInsumos() {
        try {
            this.insumos = await API.insumos.getAll();
            return this.insumos;
        } catch (error) {
            console.error('Error cargando insumos:', error);
            return [];
        }
    }
};

// Hacer disponible globalmente
window.AppState = AppState;
