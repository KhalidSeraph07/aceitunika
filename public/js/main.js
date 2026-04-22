// Check authentication
if (sessionStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'index.html';
} else {
    // Validar sesión con el servidor
    API.auth.check().catch(() => {
        // El interceptor en api.js se encargará de redirigir si es 401
    });
}

// Obtener rol del usuario actual
const currentUserRole = sessionStorage.getItem('userRole') || 'trabajador';
const currentUserName = sessionStorage.getItem('userName') || 'Usuario';

// ===== FUNCIONES HELPER GLOBALES UI =====
/**
 * Muestra notificación Toast
 */
function showToast(titulo, mensaje, tipo = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;

    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon" style="color: #16a34a"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon" style="color: #dc2626"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon" style="color: #3b82f6"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };

    toast.innerHTML = `
        ${icons[tipo] || icons.info}
        <div class="toast-content">
            <div class="toast-title">${titulo}</div>
            <div class="toast-message">${mensaje}</div>
        </div>
    `;

    container.appendChild(toast);

    // Animación de entrada
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
    });

    // Remover después de 3.5s
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 400); // Esperar que termine animación css
    }, 3500);
}

/**
 * Muestra modal de confirmación genérico
 */
let pendingConfirmCallback = null;

function showConfirm(mensaje, callback, titulo = '¿Confirmar acción?') {
    const overlay = document.getElementById('genericConfirmOverlay');
    if (!overlay) {
        // Fallback a confirm nativo si no existe el HTML
        if (confirm(`${titulo}\n\n${mensaje}`)) {
            callback();
        }
        return;
    }

    document.getElementById('confirmModalTitle').textContent = titulo;
    document.getElementById('confirmModalMsg').textContent = mensaje;
    pendingConfirmCallback = callback;
    overlay.classList.add('active');
}

function closeGenericConfirm() {
    const overlay = document.getElementById('genericConfirmOverlay');
    if (overlay) overlay.classList.remove('active');
    pendingConfirmCallback = null;
}

function executeGenericConfirm() {
    if (pendingConfirmCallback) {
        pendingConfirmCallback();
    }
    closeGenericConfirm();
}

// ===== FUNCIONES HELPER PARA DATOS SEGUROS =====
/**
 * Convierte un valor a número de forma segura
 * Retorna 0 si el valor es null, undefined, NaN o no es numérico
 */
function safeNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
}

/**
 * Formatea un número a string con decimales de forma segura
 */
function safeFixed(value, decimals = 2) {
    return safeNumber(value).toFixed(decimals);
}

/**
 * Retorna un array vacío si el valor no es un array válido
 */
function safeArray(arr) {
    return Array.isArray(arr) ? arr : [];
}

/**
 * Convierte kg a número de forma segura (alias de safeNumber para claridad)
 */
function safeKg(value) {
    return safeNumber(value);
}

/**
 * Toggle menú móvil (sidebar)
 */
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (sidebar) {
        sidebar.classList.toggle('open');
    }
    if (overlay) {
        overlay.classList.toggle('active');
    }
}

// Función para verificar si el usuario tiene acceso a funciones de admin
function esAdmin() {
    return currentUserRole === 'admin';
}

// Función para verificar si puede ver precios
function puedeVerPrecios() {
    return currentUserRole === 'admin';
}

// Función para verificar si puede ver reportes
function puedeVerReportes() {
    return currentUserRole === 'admin' || currentUserRole.startsWith('ing');
}

// Función para verificar si puede editar/eliminar ventas
// Solo admin puede editar o eliminar ventas registradas
function puedeEditarVentas() {
    return currentUserRole === 'admin';
}

// Función para verificar si puede acceder al personal de calibración
function puedeVerCalibracion() {
    return currentUserRole === 'admin' || currentUserRole === 'ing_yeny' || currentUserRole === 'ing';
}

// Varieties by color
const varietiesByColor = {
    verde: ['Manzanilla', 'Ascolana', 'Soda', 'Sal'],
    negra: ['Empeltre', 'Sevillana'],
    mulata: ['Rosada', 'Verde']
};

// ===== FUNCIÓN MODAL DE INFORMACIÓN =====
function mostrarModalInfo(titulo, contenidoHTML, icono = '📋') {
    // Eliminar modal previo si existe
    var modalPrevio = document.getElementById('modalInfoGeneral');
    if (modalPrevio) modalPrevio.remove();

    var html = '<div id="modalInfoGeneral" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 1rem;">';
    html += '<div style="background: white; border-radius: 16px; width: 100%; max-width: 550px; max-height: 85vh; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">';
    html += '<div style="background: linear-gradient(135deg, #3d4f31, #5a7247); color: white; padding: 1.2rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">';
    html += '<div style="display: flex; align-items: center; gap: 0.8rem;"><span style="font-size: 1.5rem;">' + icono + '</span><h3 style="margin: 0; font-size: 1.1rem;">' + titulo + '</h3></div>';
    html += '<button onclick="cerrarModalInfo()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 8px; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>';
    html += '</div>';
    html += '<div class="modal-scroll" style="padding: 1.5rem; max-height: 60vh; overflow-y: auto;">';
    html += contenidoHTML;
    html += '</div>';
    html += '<div style="padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end;">';
    html += '<button onclick="cerrarModalInfo()" style="background: linear-gradient(135deg, #3d4f31, #5a7247); color: white; border: none; padding: 0.7rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer;">Cerrar</button>';
    html += '</div></div></div>';

    document.body.insertAdjacentHTML('beforeend', html);
}

function cerrarModalInfo() {
    var modal = document.getElementById('modalInfoGeneral');
    if (modal) modal.remove();
}

// ===== FUNCIÓN MODAL DE CONFIRMACIÓN CUSTOM =====
function mostrarModalConfirmacion(titulo, mensaje, onConfirm, onCancel = null, icono = '❓', textConfirm = 'Aceptar', textCancel = 'Cancelar') {
    // Si onCancel es un texto de botón (string) y no se pasó icono, reajustar
    if (typeof onCancel === 'string' && icono === '❓' && arguments.length === 4) {
        icono = onCancel;
        onCancel = null;
    }

    // Si icono es una función, probablemente el desarrollador usó la firma:
    // (titulo, mensaje, onConfirm, okText, onCancel, cancelText, icon)
    if (typeof icono === 'function') {
        const tempCancel = icono;
        const tempOkText = onCancel;
        const tempCancelText = arguments[5] || 'Cancelar';
        const tempIcon = arguments[6] || '❓';

        onCancel = tempCancel;
        textConfirm = tempOkText;
        textCancel = tempCancelText;
        icono = tempIcon;
    }

    // Eliminar modal previo si existe
    var modalPrevio = document.getElementById('modalConfirmGeneral');
    if (modalPrevio) modalPrevio.remove();

    var html = `
        <div id="modalConfirmGeneral" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10001; padding: 1rem;">
            <div style="background: white; border-radius: 16px; width: 100%; max-width: 450px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: modalFadeIn 0.3s ease-out;">
                <div style="background: linear-gradient(135deg, #1e293b, #334155); color: white; padding: 1.2rem 1.5rem; display: flex; align-items: center; gap: 0.8rem;">
                    <span style="font-size: 1.5rem;">${icono}</span>
                    <h3 style="margin: 0; font-size: 1.1rem;">${titulo}</h3>
                </div>
                <div style="padding: 1.5rem; text-align: center; color: #1e293b; font-size: 1.05rem; line-height: 1.5;">
                    ${mensaje}
                </div>
                <div style="padding: 1rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 1rem;">
                    <button id="btnCancelGeneralAction" style="background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; padding: 0.7rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;">${textCancel}</button>
                    <button id="btnConfirmGeneralAction" style="background: linear-gradient(135deg, #3d4f31, #5a7247); color: white; border: none; padding: 0.7rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;">${textConfirm}</button>
                </div>
            </div>
        </div>
        <style>
            @keyframes modalFadeIn {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
        </style>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('btnConfirmGeneralAction').onclick = function () {
        cerrarModalConfirm();
        if (onConfirm) onConfirm();
    };

    document.getElementById('btnCancelGeneralAction').onclick = function () {
        cerrarModalConfirm();
        if (onCancel) onCancel();
    };
}

function cerrarModalConfirm() {
    var modal = document.getElementById('modalConfirmGeneral');
    if (modal) modal.remove();
}

// ===== SISTEMA DE NOTIFICACIONES TOAST =====
function showToast(mensaje, tipo = 'success', titulo = '') {
    // Crear contenedor si no existe
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Iconos por defecto
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };

    const icon = icons[tipo] || '🔔';
    const finalTitle = titulo || (tipo.charAt(0).toUpperCase() + tipo.slice(1));

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${finalTitle}</div>
            <div class="toast-message">${mensaje}</div>
        </div>
    `;

    container.appendChild(toast);

    // Auto-eliminar después de 4 segundos
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.5s forwards';
        setTimeout(() => {
            toast.remove();
            if (container.childNodes.length === 0) {
                container.remove();
            }
        }, 500);
    }, 4000);
}

// State - ahora se carga desde API
let entries = [];
let selectedColor = '';
let selectedVariety = '';
let selectedProcess = '';
let selectedSubProcess = '';
let selectedDestination = '';
let selectedCaliber = '';

// Función para cargar entradas desde API
async function cargarEntradasDesdeAPI() {
    try {
        entries = await API.entradas.getAll();
        if (!Array.isArray(entries)) entries = [];
    } catch (error) {
        console.error('Error cargando entradas:', error);
        entries = [];
    }
}

// Initialize - ahora es async para cargar desde API
document.addEventListener('DOMContentLoaded', async function () {
    // Añadir clase de rol al body para CSS
    document.body.classList.add('role-' + currentUserRole);

    // Cargar entradas desde API
    await cargarEntradasDesdeAPI();

    // 1. Poblamos los años disponibles en el selector basado en los datos cargados
    populateTemporalFilters();

    // 2. Ahora que el año 2025 ya existe en la lista, lo seleccionamos
    const yearFilter = document.getElementById('filterYear');
    const monthFilter = document.getElementById('filterMonth');
    if (yearFilter) yearFilter.value = currentFilterYear;
    if (monthFilter) monthFilter.value = currentFilterMonth;

    // 3. Renderizar entradas con los filtros ya aplicados
    renderEntries();

    // 4. Set default date for new entry form
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.valueAsDate = new Date();
        // Inicializar la primera pestaña de fecha automáticamente después de un pequeño delay
        setTimeout(() => {
            if (Object.keys(personalDataMap).length === 0) {
                agregarNuevaFechaPersonal(fechaInput.value);
            }
        }, 300);
    }

    // Set user info
    const userName = sessionStorage.getItem('userName') || 'Usuario';
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = userName;
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar) userAvatar.textContent = userName.charAt(0).toUpperCase();

    // Actualizar badge de rol
    const roleBadge = document.querySelector('.user-role');
    if (roleBadge) {
        if (currentUserRole === 'admin') {
            roleBadge.textContent = 'Admin';
            roleBadge.style.background = '#0f172a';
        } else if (currentUserRole === 'ing_yeny') {
            roleBadge.textContent = 'Ing. Yeny';
            roleBadge.style.background = '#7c3aed';
        } else {
            roleBadge.textContent = 'Trabajador';
            roleBadge.style.background = '#3b82f6';
        }
    }

    // Aplicar restricciones de rol
    aplicarRestriccionesRol();

    // Initialize cuadrantes
    initCuadrantes();

    // Initialize dashboard and users (admin only)
    if (esAdmin()) {
        initDashboard();
        initUsuarios();
    }

    // Initialize title bar with username and time
    updateTitleBar();
});

// Función para aplicar restricciones según el rol
function aplicarRestriccionesRol() {
    // Ocultar elementos de precio si no es admin
    if (!puedeVerPrecios()) {
        // Ocultar campo de precio en el formulario
        const precioGroup = document.getElementById('precio')?.closest('.form-group');
        if (precioGroup) precioGroup.style.display = 'none';

        // Ocultar filtros de precio
        document.querySelectorAll('.filter-select').forEach(select => {
            if (select.innerHTML.includes('Precio')) {
                select.style.display = 'none';
            }
        });

        // Ocultar totales de inversión en reportes
        const totalInversionCard = document.querySelector('[id="totalInversion"]')?.closest('div')?.closest('div');
        if (totalInversionCard) totalInversionCard.style.display = 'none';

        // Ocultar sección de costos en salmuera
        document.querySelectorAll('.salmuera-cost-field').forEach(el => el.style.display = 'none');
    }

    // Ocultar sección de reportes si no puede verlos
    if (!puedeVerReportes()) {
        const reportesNav = document.querySelector('[data-section="reportes"]');
        if (reportesNav) reportesNav.style.display = 'none';
    }

    // Ocultar Salida y Record Histórico si no es admin
    if (!esAdmin()) {
        // Ocultar Salida del menú
        const salidaNav = document.getElementById('navSalida');
        if (salidaNav) salidaNav.style.display = 'none';

        // Ocultar Record Histórico del menú
        const recordNav = document.getElementById('navRecord');
        if (recordNav) recordNav.style.display = 'none';

        // Ocultar Auditoría del menú
        const auditoriaNav = document.getElementById('navAuditoria');
        if (auditoriaNav) auditoriaNav.style.display = 'none';

        // Insumos: Mostrar solo Cantidad, ocultar Precio Unitario y Subtotal
        document.querySelectorAll('.salmuera-price-col, .salmuera-subtotal-col').forEach(el => {
            el.style.display = 'none';
        });
    }

    // Gestionar visibilidad de Personal de Calibración
    const seccionCalibracion = document.getElementById('seccionPersonalCalibracion');
    if (seccionCalibracion) {
        if (puedeVerCalibracion()) {
            seccionCalibracion.style.display = 'block';
        } else {
            seccionCalibracion.style.display = 'none';
        }
    }

    // Dashboard y Gestión de Usuarios solo para admin
    if (esAdmin()) {
        const dashNav = document.getElementById('navDashboard');
        const usuariosNav = document.getElementById('navUsuarios');
        const btnNuevoUsuario = document.getElementById('btnNuevoUsuario');
        if (dashNav) dashNav.style.display = 'flex';
        if (usuariosNav) { usuariosNav.style.display = 'flex'; if (btnNuevoUsuario) btnNuevoUsuario.style.display = 'inline-flex'; }
    }
}

// ========== ALMACÉN FUNCTIONS ==========
let almacenData = { filas: [] };
let selectedSalidaTipo = '';
let selectedVentaTipo = '';
let seleccionEnProgreso = null; // Para memorizar calibres seleccionados durante el flujo de extracción

// Función para cargar almacén desde API
async function cargarAlmacenDesdeAPI() {
    try {
        const data = await API.almacen.getAll();

        if (data && typeof data === 'object') {
            almacenData = data;
            if (!almacenData.filas) almacenData.filas = [];

            // Limpieza proactiva de ceros para evitar ruidos visuales en el plano
            almacenData.filas.forEach(f => {
                (f.cuadrantes || []).forEach(c => {
                    if (c.lotes) {
                        c.lotes = c.lotes.filter(l => {
                            if (!l.calibres) return false;
                            // Solo dejar calibres con peso real (> 50 gramos)
                            l.calibres = l.calibres.filter(cal => parseFloat(cal.kg) > 0.05);
                            return l.calibres.length > 0;
                        });
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error cargando almacén:', error);
        almacenData = { filas: [] };
    }
}

    }
}

// ========== DASHBOARD ==========
async function initDashboard() {
    const container = document.getElementById('section-dashboard');
    if (!container || container.style.display === 'none') return;
    await cargarDashboardKPIs();
    await cargarDashboardCharts();
}

async function cargarDashboardKPIs() {
    try {
        const data = await API.reportes.getDashboard();
        const kpis = document.getElementById('dashboardKpis');
        if (!kpis) return;
        const cards = [
            { label: 'Entradas Hoy', value: data.resumen.entradasHoy, icon: '📥', color: '#2D6A4F' },
            { label: 'Entradas Mes', value: data.resumen.entradasMes, icon: '📆', color: '#1B4332' },
            { label: 'Kg Mes', value: (data.resumen.kgMes || 0).toLocaleString('es-PE', {maximumFractionDigits: 0}), icon: '⚖️', color: '#40916C' },
            { label: 'Stock Almacén', value: (data.resumen.stockAlmacen || 0).toLocaleString('es-PE', {maximumFractionDigits: 0}), icon: '🏭', color: '#52B788' },
            { label: 'Ventas Mes', value: data.resumen.ventasMes, icon: '💰', color: '#74C69D' },
            { label: 'Monto Ventas', value: 'S/ ' + (data.resumen.montoVentasMes || 0).toLocaleString('es-PE', {minimumFractionDigits: 2}), icon: '📊', color: '#95D5B2' },
            { label: 'Préstamos Activos', value: data.resumen.prestamosActivos, icon: '🔄', color: '#B7E4C7' },
            { label: 'Alertas Stock', value: data.resumen.alertasStock, icon: '⚠️', color: data.resumen.alertasStock > 0 ? '#DC2626' : '#6B7280' }
        ];
        kpis.innerHTML = cards.map(c => `
            <div style="background: linear-gradient(135deg, ${c.color}22, ${c.color}11); border: 1px solid ${c.color}44; border-radius: 14px; padding: 1.2rem; position: relative; overflow: hidden;">
                <div style="position: absolute; top: -8px; right: -8px; font-size: 2.5rem; opacity: 0.12;">${c.icon}</div>
                <div style="font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: ${c.color}; margin-bottom: 0.4rem; letter-spacing: 0.05em;">${c.label}</div>
                <div style="font-size: 1.6rem; font-weight: 700; color: ${c.color};">${c.value}</div>
            </div>
        `).join('');
    } catch (e) { console.error('Error dashboard KPIs:', e); }
}

async function cargarDashboardCharts() {
    try {
        const data = await API.reportes.getDashboard();

        // Bar chart for entradas
        const chartEntradas = document.getElementById('chartEntradas');
        if (chartEntradas && data.entradasPorMes && data.entradasPorMes.length > 0) {
            const maxKg = Math.max(...data.entradasPorMes.map(m => parseFloat(m.kg) || 0));
            chartEntradas.innerHTML = data.entradasPorMes.map(m => {
                const pct = maxKg > 0 ? (parseFloat(m.kg) / maxKg * 100) : 0;
                const mesLabel = new Date(m.mes).toLocaleDateString('es-PE', {month: 'short', year: '2-digit'});
                return `<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    <div style="width: 100%; background: #e2e8f0; border-radius: 6px; height: 160px; position: relative; display: flex; align-items: flex-end;">
                        <div style="width: 100%; background: linear-gradient(180deg, #2D6A4F, #52B788); border-radius: 6px 6px 0 0; height: ${pct}%; min-height: 4px;" title="${parseFloat(m.kg).toLocaleString('es-PE')} kg"></div>
                    </div>
                    <div style="font-size: 0.65rem; color: #64748b;">${mesLabel}</div>
                </div>`;
            }).join('');
        }

        // Bar chart for ventas
        const chartVentas = document.getElementById('chartVentas');
        if (chartVentas && data.ventasPorMes && data.ventasPorMes.length > 0) {
            const maxMonto = Math.max(...data.ventasPorMes.map(m => parseFloat(m.monto) || 0));
            chartVentas.innerHTML = data.ventasPorMes.map(m => {
                const pct = maxMonto > 0 ? (parseFloat(m.monto) / maxMonto * 100) : 0;
                const mesLabel = new Date(m.mes).toLocaleDateString('es-PE', {month: 'short', year: '2-digit'});
                return `<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                    <div style="width: 100%; background: #e2e8f0; border-radius: 6px; height: 160px; position: relative; display: flex; align-items: flex-end;">
                        <div style="width: 100%; background: linear-gradient(180deg, #1B4332, #74C69D); border-radius: 6px 6px 0 0; height: ${pct}%; min-height: 4px;" title="S/ ${parseFloat(m.monto).toLocaleString('es-PE')}"></div>
                    </div>
                    <div style="font-size: 0.65rem; color: #64748b;">${mesLabel}</div>
                </div>`;
            }).join('');
        }

        // Top lotes
        const topLotes = document.getElementById('topLotes');
        if (topLotes && data.topLotes && data.topLotes.length > 0) {
            topLotes.innerHTML = `<table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                <thead><tr style="background: #f1f5f9;"><th style="padding: 0.6rem 1rem; text-align: left; color: #64748b;">Lote</th><th style="padding: 0.6rem 1rem; text-align: right; color: #64748b;">Kg</th><th style="padding: 0.6rem 1rem; text-align: left; color: #64748b;">Fecha</th></tr></thead>
                <tbody>${data.topLotes.map((l, i) => `<tr style="background: ${i % 2 ? '#f8fafc' : '#fff'};">
                    <td style="padding: 0.6rem 1rem;">${l.codigoLote || l.codigo_lote}</td>
                    <td style="padding: 0.6rem 1rem; text-align: right; font-weight: 600;">${(l.cantidad || 0).toLocaleString('es-PE')}</td>
                    <td style="padding: 0.6rem 1rem; color: #64748b;">${l.fecha ? new Date(l.fecha).toLocaleDateString('es-PE') : '-'}</td>
                </tr>`).join('')}</tbody></table>`;
        } else if (topLotes) {
            topLotes.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 1rem;">Sin datos de lotes</p>';
        }
    } catch (e) { console.error('Error dashboard charts:', e); }
}

// ========== GESTIÓN DE USUARIOS ==========
let editingUsuarioId = null;

async function initUsuarios() {
    const container = document.getElementById('section-usuarios');
    if (!container || container.style.display === 'none') return;
    await cargarUsuariosTabla();
}

async function cargarUsuariosTabla() {
    try {
        const usuarios = await API.users.getAll();
        const tbody = document.getElementById('usuariosTablaBody');
        if (!tbody) return;
        tbody.innerHTML = usuarios.map(u => {
            const rolColors = { admin: '#1B4332', ing_yeny: '#7c3aed', trabajador: '#3b82f6' };
            const rolColor = rolColors[u.rol] || '#6B7280';
            return `<tr>
                <td style="padding: 0.75rem 1rem; font-weight: 600;">${u.username}</td>
                <td style="padding: 0.75rem 1rem;">${u.nombre}</td>
                <td style="padding: 0.75rem 1rem;"><span style="background: ${rolColor}22; color: ${rolColor}; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">${u.rol}</span></td>
                <td style="padding: 0.75rem 1rem;"><span style="color: ${u.activo ? '#16a34a' : '#dc2626'}; font-weight: 600;">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td style="padding: 0.75rem 1rem; display: flex; gap: 0.5rem;">
                    <button class="btn-add" style="padding: 0.3rem 0.8rem; font-size: 0.75rem;" onclick="editarUsuario(${u.id})">Editar</button>
                    <button class="btn-add" style="padding: 0.3rem 0.8rem; font-size: 0.75rem; background: linear-gradient(135deg, #dc2626, #ef4444);" onclick="confirmarEliminarUsuario(${u.id}, '${u.username}')">Eliminar</button>
                </td>
            </tr>`;
        }).join('');
    } catch (e) { console.error('Error cargando usuarios:', e); }
}

function openNuevoUsuarioModal() {
    editingUsuarioId = null;
    document.getElementById('usuarioModalTitulo').textContent = 'Nuevo Usuario';
    document.getElementById('usuarioUsername').value = '';
    document.getElementById('usuarioNombre').value = '';
    document.getElementById('usuarioRol').value = 'trabajador';
    document.getElementById('usuarioPassword').value = '';
    document.getElementById('usuarioActivo').checked = true;
    document.getElementById('usuarioPasswordGroup').style.display = 'block';
    document.getElementById('usuarioModalOverlay').style.display = 'flex';
}

function editarUsuario(id) {
    editingUsuarioId = id;
    document.getElementById('usuarioModalTitulo').textContent = 'Editar Usuario';
    document.getElementById('usuarioPassword').value = '';
    document.getElementById('usuarioPassword').placeholder = 'Dejar vacío para no cambiar';
    document.getElementById('usuarioPasswordGroup').style.display = 'block';
    API.users.getOne(id).then(u => {
        document.getElementById('usuarioUsername').value = u.username;
        document.getElementById('usuarioNombre').value = u.nombre;
        document.getElementById('usuarioRol').value = u.rol;
        document.getElementById('usuarioActivo').checked = u.activo;
        document.getElementById('usuarioModalOverlay').style.display = 'flex';
    }).catch(e => showToast('Error', 'No se pudo cargar usuario', 'error'));
}

function closeUsuarioModal() {
    document.getElementById('usuarioModalOverlay').style.display = 'none';
    editingUsuarioId = null;
}

async function guardarUsuario() {
    const username = document.getElementById('usuarioUsername').value.trim();
    const nombre = document.getElementById('usuarioNombre').value.trim();
    const rol = document.getElementById('usuarioRol').value;
    const password = document.getElementById('usuarioPassword').value;
    const activo = document.getElementById('usuarioActivo').checked;

    if (!username || !nombre) { showToast('Error', 'Username y nombre son requeridos', 'error'); return; }

    try {
        if (editingUsuarioId) {
            const data = { nombre, rol, activo };
            if (password) await API.users.updatePassword(editingUsuarioId, password);
            await API.users.update(editingUsuarioId, data);
            showToast('Éxito', 'Usuario actualizado', 'success');
        } else {
            if (!password || password.length < 6) { showToast('Error', 'Contraseña mínimo 6 caracteres', 'error'); return; }
            await API.users.create({ username, password, nombre, rol });
            showToast('Éxito', 'Usuario creado', 'success');
        }
        closeUsuarioModal();
        await cargarUsuariosTabla();
    } catch (e) { showToast('Error', e.message || 'Error guardando usuario', 'error'); }
}

function confirmarEliminarUsuario(id, username) {
    showConfirm(`¿Eliminar usuario "${username}"?`, async () => {
        try {
            await API.users.delete(id);
            showToast('Éxito', 'Usuario eliminado', 'success');
            await cargarUsuariosTabla();
        } catch (e) { showToast('Error', e.message || 'Error eliminando usuario', 'error'); }
    });
}

function initCuadrantes() {
    const mapContainer = document.getElementById('almacenGridMap');
    if (!mapContainer) return;

    mapContainer.innerHTML = '';

    const rows = ['H', 'G', 'F', 'E', 'D', 'C', 'B', 'A']; // De arriba hacia abajo
    const cols = [1, 2, 3, 4, 5];

    rows.forEach(row => {
        cols.forEach(col => {
            const coord = row + '-' + col;

            // Buscar si existe un cuadrante en la base de datos para esta coordenada (usando búsqueda flexible)
            let dbCuadrante = buscarCuadrantePorNombre(coord);

            const isOccupied = dbCuadrante && dbCuadrante.lotes && dbCuadrante.lotes.length > 0;

            // Detectar si es un lote con puchos extraídos (0 calibres pero tiene puchos en zonas)
            let esLoteSoloPuchos = false;
            let codigoLotePuchos = '';
            if (isOccupied && dbCuadrante.lotes) {
                dbCuadrante.lotes.forEach(l => {
                    // Verificar si el lote tiene 0 kg en calibres
                    let pesoLote = 0;
                    (l.calibres || []).forEach(c => pesoLote += parseFloat(c.kg) || 0);

                    if (pesoLote <= 0.05 && l.entrada_id && almacenData.puchosExtraidos) {
                        // Verificar si tiene puchos extraídos
                        const tienePuchos = almacenData.puchosExtraidos.some(p => p.entrada_id == l.entrada_id);
                        if (tienePuchos) {
                            esLoteSoloPuchos = true;
                            codigoLotePuchos = l.codigo_lote || 'Lote';
                        }
                    }
                });
            }

            const cell = document.createElement('div');
            cell.className = 'cuadrante-cell';

            // Lógica de zonas especiales
            let zoneType = 'normal';
            if (col === 3) zoneType = 'transit-column';
            if (row === 'A' && (col === 4 || col === 5)) zoneType = 'machine';
            if (row === 'B' && col === 5) zoneType = 'temporary';

            // Aplicar clases según zona
            if (zoneType === 'transit-column') cell.classList.add('transit-column');
            if (zoneType === 'machine') cell.classList.add('machine');
            if (zoneType === 'temporary') cell.classList.add('temporary');
            if (isOccupied && !esLoteSoloPuchos) cell.classList.add('occupied');
            if (esLoteSoloPuchos) cell.classList.add('pucho-pending'); // Nueva clase para lotes con puchos fuera

            // Detectar si es zona de puchos desde la BD
            let isPuchoZone = false;
            if (dbCuadrante && (dbCuadrante.es_zona_puchos == 1 || dbCuadrante.es_zona_puchos === true)) {
                cell.classList.add('pucho-zone');
                isPuchoZone = true;
            }

            cell.onclick = () => {
                if (zoneType === 'machine') {
                    mostrarModalInfo('Zona de Maquinaria', '<p style="text-align: center;">Esta zona corresponde a la calibradora y no puede almacenar lotes.</p>', '⚙️');
                    return;
                }

                if (dbCuadrante) {
                    // Cuadrante existe en BD, abrir modal con opciones
                    abrirModalCuadrantePlano(dbCuadrante, coord);
                } else if (zoneType !== 'transit') {
                    // No existe en absoluto - mostrar modal para asignar lote de todas formas
                    var htmlVacio = '<p style="text-align: center; color: #64748b; margin-bottom: 1rem;">El cuadrante <b>' + coord + '</b> está vacío y listo para recibir lotes.</p>';
                    htmlVacio += '<div style="padding-top: 1rem; border-top: 1px dashed #cbd5e1;">';
                    htmlVacio += '<button onclick="cerrarModalInfo(); mostrarSelectorLoteParaCoord(\'' + coord + '\')" style="width: 100%; padding: 0.8rem; background: #3d4f31; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">➕ Asignar Lote</button>';
                    htmlVacio += '</div>';
                    mostrarModalInfo('CUADRANTE ' + coord, htmlVacio, '📦');
                }
            };

            // HTML Base
            let content = '';

            // Iconos SVG para Zonas de Pucho
            if (isPuchoZone) {
                content += '<div class="pucho-badge" title="Zona de Puchos"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></div>';
            } else if (esLoteSoloPuchos) {
                content += '<div class="pucho-badge" title="Puchos en Zona"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg></div>';
            }

            // Contenido de la celda
            content += '<div class="cuadrante-id">' +
                '<span>' + coord + '</span>' +
                (zoneType === 'machine' ? '<span style="font-size: 0.5rem;">MÁQUINA</span>' : '') +
                (zoneType === 'temporary' ? '<span style="font-size: 0.5rem;">ENVASADO</span>' : '') +
                '</div>';

            // NUEVO: Mostrar indicador para lotes con puchos extraídos
            if (esLoteSoloPuchos) {
                content += '<div class="cuadrante-info" style="flex-direction: column; gap: 0.2rem;">';
                content += '<div style="font-size: 0.6rem; color: #d97706; font-weight: 700;">Lote: ' + codigoLotePuchos + '</div>';
                content += '<div style="font-size: 0.55rem; color: #f59e0b; font-style: italic;">Pendiente</div>';
                content += '<div class="capacity-bar"><div class="capacity-fill level-low" style="width: 5%; background: #fbbf24;"></div></div>';
                content += '</div>';
            } else if (isOccupied) {
                const primerLote = dbCuadrante.lotes[0];
                const calibres = primerLote.calibres || [];

                // Calcular bidones totales (suma de envases de todos los lotes)
                let totalBidones = 0;
                let pesoTotal = 0;
                dbCuadrante.lotes.forEach(l => {
                    if (l.calibres) l.calibres.forEach(c => {
                        totalBidones += parseInt(c.cantidad_envases) || 0;
                        pesoTotal += parseFloat(c.kg) || 0;
                    });
                });

                content += '<div class="cuadrante-info">';
                if (primerLote.codigo_lote) content += '<div style="font-size: 0.6rem; color: #3b82f6; font-weight: 700;">L: ' + primerLote.codigo_lote + '</div>';
                if (calibres.length > 0) content += '<div style="font-size: 0.6rem;">Cal: ' + calibres[0].calibre + '</div>';
                if (dbCuadrante.lotes.length > 1) content += '<div style="font-size: 0.55rem; color: #16a34a;">+ ' + (dbCuadrante.lotes.length - 1) + ' lotes</div>';

                // Barra de capacidad (300 bidones max)
                const capacidadMax = parseInt(dbCuadrante.capacidad_max) || 300;
                let calculatedPercent = (totalBidones / capacidadMax) * 100;

                // Si no hay bidones pero sí hay peso (puchos), mostrar una barra mínima (5%) para indicar ocupación visual
                if (totalBidones <= 0 && pesoTotal > 0) {
                    calculatedPercent = 5;
                }

                const percent = Math.min(calculatedPercent, 100);
                let levelClass = 'level-low';
                if (percent > 90) levelClass = 'level-critical';
                else if (percent > 70) levelClass = 'level-high';
                else if (percent > 50) levelClass = 'level-medium';

                content += '<div class="capacity-bar"><div class="capacity-fill ' + levelClass + '" style="width: ' + percent + '%"></div></div>';

                if (totalBidones > 0) {
                    content += '<div class="capacity-text' + (percent > 90 ? ' critical' : '') + '">' + totalBidones + '/' + capacidadMax + '</div>';
                } else if (pesoTotal > 0.05) {
                    content += '<div class="capacity-text" style="color: #059669; font-weight: 800; font-size: 0.65rem;">' + pesoTotal.toFixed(1) + ' Kg</div>';
                } else {
                    content += '<div class="capacity-text">0/' + capacidadMax + '</div>';
                }
                content += '</div>';
            } else if (zoneType === 'transit') {
                content += '<div class="cuadrante-info" style="justify-content: center; align-items: center; height: 100%; opacity: 0.3;"><span style="font-size: 1.2rem;">⬆️</span></div>';
            } else if (zoneType === 'machine') {
                content += '<div class="cuadrante-info" style="justify-content: center; align-items: center; height: 100%; opacity: 0.5;"><span style="font-size: 1.5rem;">⚙️</span></div>';
            } else {
                content += '<div class="cuadrante-info" style="color:#94a3b8; font-style: italic; font-size: 0.6rem;">DISPONIBLE</div>';
            }

            cell.innerHTML = content;
            mapContainer.appendChild(cell);
        });
    });

    // Populate reubicación selects
    populateCuadranteSelects();
}

// Función para abrir el modal del cuadrante desde el plano
// Función para abrir el modal del cuadrante desde el plano
async function abrirModalCuadrantePlano(cuadrante, coord) {
    // Si es zona de puchos, mostramos vista especial de resumen
    if (cuadrante.es_zona_puchos == 1) {
        return abrirModalZonaPuchos(cuadrante, coord);
    }

    const lotes = cuadrante.lotes || [];
    let html = '<div style="display: flex; flex-direction: column; gap: 1rem;">';

    if (lotes.length === 0) {
        html += '<p style="text-align: center; color: #64748b; padding: 2rem;">Este cuadrante no tiene lotes asignados.</p>';
    } else {
        lotes.forEach(lote => {
            const calibres = lote.calibres || [];
            const totalLoteKg = calibres.reduce((s, c) => s + (parseFloat(c.kg) || 0), 0);

            // Calcular totales físicos del lote
            const totalEnvases = calibres.reduce((s, c) => s + (parseInt(c.cantidad_envases) || 0), 0);
            const totalPucho = calibres.reduce((s, c) => s + (parseFloat(c.pucho) || 0), 0);

            const kilosEnvase = calibres.length > 0 ? (parseFloat(calibres[0].kilos_por_envase) || 60) : 60;

            // Verificar si tiene puchos extraídos relacionados
            const tienePuchosExtraidos = (almacenData.puchosExtraidos || []).some(p => p.entrada_id == lote.entrada_id);
            const esLoteVacioConPuchos = totalLoteKg <= 0.05 && tienePuchosExtraidos;

            // ESCENARIO #12: Detectar si el lote está dividido en múltiples cuadrantes
            let ubicacionesLote = [];
            if (lote.entrada_id && almacenData && almacenData.filas) {
                almacenData.filas.forEach(f => {
                    (f.cuadrantes || []).forEach(c => {
                        (c.lotes || []).forEach(l => {
                            if (l.entrada_id == lote.entrada_id) {
                                ubicacionesLote.push({
                                    filaNombre: f.nombre,
                                    cuadranteNombre: c.nombre,
                                    cuadranteId: c.id,
                                    calibres: l.calibres || [],
                                    kgTotal: (l.calibres || []).reduce((s, cal) => s + (parseFloat(cal.kg) || 0), 0)
                                });
                            }
                        });
                    });
                });
            }
            const esDividido = ubicacionesLote.length > 1;

            html += '<div style="background: #f8fafc; border: 1px solid ' + (esDividido ? '#f59e0b' : '#e2e8f0') + '; border-radius: 12px; padding: 1rem;">';
            html += '<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;">';
            html += '<div>';
            html += '<div style="font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 0.5rem;">📦 Lote: ' + lote.codigo_lote;

            // Badge de lote dividido
            if (esDividido) {
                html += '<span onclick="mostrarUbicacionesLote(\'' + lote.entrada_id + '\', \'' + lote.codigo_lote + '\')" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; font-size: 0.65rem; padding: 0.15rem 0.5rem; border-radius: 20px; cursor: pointer; font-weight: 700;" title="Este lote está dividido en ' + ubicacionesLote.length + ' ubicaciones. Clic para ver todas.">📍 ' + ubicacionesLote.length + ' ubicaciones</span>';
            }

            html += '</div>';

            if (esLoteVacioConPuchos) {
                html += '<div style="font-size: 0.75rem; color: #f59e0b; font-weight: 700; margin-top: 0.2rem; background: #fff7ed; padding: 0.2rem 0.6rem; border-radius: 6px; display: inline-block; border: 1px solid #fed7aa;">⚠️ calibres en zona de pucho</div>';
            } else {
                const puchoText = totalPucho > 0 ? ' + ' + totalPucho.toFixed(1) + ' Kg pucho' : '';
                html += '<div style="font-size: 0.75rem; color: #64748b; margin-top: 0.2rem;">(' + totalEnvases + ' x ' + kilosEnvase + ' Kg)' + puchoText + '</div>';
            }

            html += '</div>';

            // Solo mostrar el peso total si es mayor que 0
            if (totalLoteKg > 0.05) {
                html += '<span style="font-weight: 800; color: #16a34a; font-size: 1.1rem;">' + totalLoteKg.toFixed(1) + ' Kg</span>';
            }

            html += '</div>';

            html += '<div style="display: grid; grid-template-columns: 1fr; gap: 0.5rem;">';

            // Ordenar calibres por su número inicial (70-90 → 70, 90-110 → 90, etc.)
            const calibresOrdenados = [...calibres].sort((a, b) => {
                const numA = parseInt((a.calibre || '').match(/\d+/)?.[0] || '999');
                const numB = parseInt((b.calibre || '').match(/\d+/)?.[0] || '999');
                return numA - numB;
            });

            calibresOrdenados.forEach(c => {
                const cantEnv = parseInt(c.cantidad_envases) || 0;
                const kEnv = parseFloat(c.kilos_por_envase) || 60;
                const pucho = parseFloat(c.pucho) || 0;
                const pesoCalibre = parseFloat(c.kg) || 0;

                // Buscar si este calibre específico tiene kilos en zona de puchos
                const puchoEnZona = (almacenData.puchosExtraidos || [])
                    .find(p => p.entrada_id == lote.entrada_id && p.calibre === c.calibre);
                const kgEnZona = puchoEnZona ? parseFloat(puchoEnZona.total_kg) : 0;

                // Ocultar si REALMENTE no hay nada ni aquí ni en zona (limpieza de decimales)
                if (pesoCalibre <= 0.05 && kgEnZona <= 0.05) return;

                html += '<div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.6rem 0.8rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; margin-bottom: 0.4rem;">';
                html += '<div><span style="font-weight: 700; color: #3d4f31; margin-right: 0.5rem;">' + c.calibre + '</span>';

                if (pesoCalibre > 0.05) {
                    const puchoCalibreText = pucho > 0 ? ' + ' + pucho.toFixed(1) + ' kg' : '';
                    html += '<span style="color: #64748b;">' + cantEnv + ' x ' + kEnv.toFixed(0) + ' kg' + puchoCalibreText + '</span>';
                }

                if (kgEnZona > 0.05) {
                    html += '<div style="font-size: 0.7rem; color: #f59e0b; font-weight: 600; margin-top: 0.1rem;">📍 En zona: ' + kgEnZona.toFixed(1) + ' Kg</div>';
                }

                html += '</div>';
                html += '<div style="display: flex; align-items: center; gap: 0.5rem;">';
                if (pesoCalibre > 0.05) {
                    html += '<span style="font-weight: 700; color: #1e293b;">' + pesoCalibre.toFixed(1) + ' Kg</span>';
                    html += '<button onclick="cerrarModalInfo(); abrirModalReubicarCalibre(' + c.id + ', \'' + c.calibre + '\', \'' + lote.codigo_lote + '\', ' + cuadrante.id + ')" style="padding: 0.3rem 0.5rem; background: #7c3aed; color: white; border: none; border-radius: 5px; font-size: 0.7rem; cursor: pointer; font-weight: 600;" title="Reubicar este calibre">⚖️</button>';
                } else {
                    html += '<span style="font-weight: 600; color: #94a3b8; font-style: italic; font-size: 0.75rem;">Extraído</span>';
                }
                html += '</div></div>';
            });
            html += '</div>';
            html += '<div style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: flex-end;">';
            if (totalPucho > 0) {
                html += '<button onclick="cerrarModalInfo(); mostrarSelectorPuchoDestino(\'' + lote.id + '\', \'' + coord + '\')" style="padding: 0.4rem 0.8rem; background: #eab308; color: #1e293b; border: none; border-radius: 6px; font-size: 0.75rem; cursor: pointer; font-weight: 600;">✨ Extraer Puchos</button>';
            }
            html += '<button onclick="cerrarModalInfo(); reubicarLoteMap(\'' + lote.id + '\')" style="padding: 0.4rem 0.8rem; background: #7c3aed; color: white; border: none; border-radius: 6px; font-size: 0.75rem; cursor: pointer;">🔄 Mover</button>';
            html += '<button onclick="cerrarModalInfo(); retirarLoteDelCuadrante(\'' + lote.id + '\')" style="padding: 0.4rem 0.8rem; background: #dc2626; color: white; border: none; border-radius: 6px; font-size: 0.75rem; cursor: pointer;">🗑️ Retirar</button>';
            html += '</div></div>';
        });
    }

    // Botón para marcar/desmarcar como zona de puchos
    const btnPuchoStyle = 'background: #fef3c7; color: #92400e; border: 2px dashed #eab308;';
    const btnPuchoText = '🫒 Marcar como Zona Puchos';

    html += '<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed #cbd5e1; display: flex; flex-direction: column; gap: 0.8rem;">';
    html += '<div style="display: flex; gap: 0.5rem;">';
    html += '<button onclick="cerrarModalInfo(); prepararAsignacionLote(\'' + cuadrante.id + '\')" style="flex: 1; padding: 0.8rem; background: #3d4f31; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;">➕ Asignar Lote</button>';
    html += '<button onclick="cerrarModalInfo(); toggleZonaPuchos(\'' + cuadrante.id + '\')" style="padding: 0.8rem 1rem; ' + btnPuchoStyle + ' border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.85rem;">' + btnPuchoText + '</button>';
    html += '</div>';
    html += '</div></div>';

    mostrarModalInfo('CUADRANTE ' + coord, html, '📍');
}

/**
 * Vista especial para cuadrantes de puchos
 */
async function abrirModalZonaPuchos(cuadrante, coord) {
    try {
        mostrarModalInfo('Cargando...', '<p style="text-align: center;">Obteniendo resumen de puchos...</p>', '⏳');
        const data = await API.almacen.getPuchos(cuadrante.id);
        cerrarModalInfo();

        let html = '<div style="display: flex; flex-direction: column; gap: 1.5rem;">';

        // 1. Resumen por Calibre/Color
        html += '<section>';
        html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">';
        html += '<h3 style="font-size: 1rem; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 0.5rem;">📊 Resumen por Calibre</h3>';

        // Botón para retornar TODO lo de la zona si hay algo
        if (data.resumen && data.resumen.length > 0) {
            html += `<button onclick="ejecutarDevolverTodoPucho('${cuadrante.id}', '${coord}')" style="background: #eff6ff; border: 1px solid #3b82f6; color: #1d4ed8; padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.4rem;">↩️ Retornar TODO</button>`;
        }
        html += '</div>';

        if (!data.resumen || data.resumen.length === 0) {
            html += '<p style="text-align: center; color: #64748b; background: #f8fafc; padding: 2rem; border-radius: 12px; border: 1px dashed #cbd5e1;">No hay puchos acumulados en este cuadrante.</p>';
        } else {
            // Ordenar calibres: primero numéricos (70-90, 90-110...), luego especiales (MANCHADA, MULATA)
            const resumenOrdenado = [...data.resumen].sort((a, b) => {
                const numA = parseInt((a.calibre || '').match(/\d+/)?.[0] || '999');
                const numB = parseInt((b.calibre || '').match(/\d+/)?.[0] || '999');
                return numA - numB;
            });

            html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.8rem;">';
            resumenOrdenado.forEach(r => {
                const colorMap = { 'verde': '#4ade80', 'negra': '#1f2937', 'mulata': '#92400e' };
                const colorBg = colorMap[r.color] || '#4ade80';
                const textColor = (r.color === 'negra') ? 'white' : 'inherit';

                html += '<div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">';
                html += '<div style="background: ' + colorBg + '; color: ' + textColor + '; padding: 0.4rem; text-align: center; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">' + r.color + '</div>';
                html += '<div style="padding: 0.8rem; text-align: center;">';
                html += '<div style="font-size: 1.1rem; font-weight: 800; color: #1e293b;">' + r.calibre + '</div>';
                html += '<div style="font-size: 1.2rem; font-weight: 900; color: #16a34a; margin: 0.3rem 0;">' + parseFloat(r.total_kg).toFixed(1) + ' Kg</div>';
                html += '<div style="font-size: 0.7rem; color: #64748b;">' + r.aportes + ' aportes</div>';
                html += '</div></div>';
            });
            html += '</div>';
        }
        html += '</section>';

        // 2. Historial de aportes
        html += '<section>';
        html += '<h3 style="font-size: 1rem; color: #1e293b; margin-bottom: 0.8rem;">🕒 Historial de Aportes</h3>';
        html += '<div style="max-height: 250px; overflow-y: auto; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">';
        if (!data.historial || data.historial.length === 0) {
            html += '<p style="padding: 1rem; text-align: center; color: #94a3b8;">Sin movimientos registrados</p>';
        } else {
            // Ordenar historial por calibre (numérico primero)
            const historialOrdenado = [...data.historial].sort((a, b) => {
                const numA = parseInt((a.calibre || '').match(/\d+/)?.[0] || '999');
                const numB = parseInt((b.calibre || '').match(/\d+/)?.[0] || '999');
                return numA - numB;
            });

            html += '<table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">';
            html += '<thead style="position: sticky; top: 0; background: #f1f5f9; text-align: left;">';
            html += '<tr><th style="padding: 0.6rem;">Fecha</th><th style="padding: 0.6rem;">Origen</th><th style="padding: 0.6rem;">Calibre</th><th style="padding: 0.6rem; text-align: right;">Kg</th><th style="padding: 0.6rem; text-align: center;">Acción</th></tr>';
            html += '</thead><tbody>';
            historialOrdenado.forEach(h => {
                const fecha = new Date(h.fecha_aporte).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                html += '<tr style="border-bottom: 1px solid #e2e8f0;">';
                html += '<td style="padding: 0.6rem; color: #64748b;">' + fecha + '</td>';
                html += '<td style="padding: 0.6rem; font-weight: 600;">' + (h.codigo_lote || 'N/A') + '</td>';
                html += '<td style="padding: 0.6rem;">' + h.calibre + ' (' + h.color + ')</td>';
                html += '<td style="padding: 0.6rem; text-align: right; font-weight: 700; color: #16a34a;">' + parseFloat(h.kg).toFixed(1) + '</td>';
                html += '<td style="padding: 0.6rem; text-align: center;">';
                html += '<button onclick="ejecutarDevolverPucho(\'' + h.id + '\', \'' + cuadrante.id + '\', \'' + coord + '\')" title="Devolver kilos al lote (Físico o Saldo)" style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 0.2rem 0.4rem; cursor: pointer;">↩️</button>';
                html += '</td>';
                html += '</tr>';
            });
            html += '</tbody></table>';
        }
        html += '</div></section>';

        // 3. Acciones de Configuración
        html += '<div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px dashed #cbd5e1; display: flex; gap: 0.8rem;">';
        html += '<button onclick="cerrarModalInfo(); toggleZonaPuchos(\'' + cuadrante.id + '\')" style="flex: 1; padding: 0.8rem; background: #eab308; color: #1e293b; border: none; border-radius: 10px; font-weight: 700; cursor: pointer;">❌ Desactivar Zona de Puchos</button>';
        html += '</div>';

        html += '</div>';

        mostrarModalInfo('ZONA DE PUCHOS: ' + coord, html, '🫒');
    } catch (error) {
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo cargar la zona de puchos: ' + error.message + '</p>', '❌');
    }
}

/**
 * Ejecuta la devolución de un pucho al lote original
 */
async function ejecutarDevolverPucho(puchoId, cuadranteId, coord) {
    try {
        const confirm = await new Promise(resolve => {
            mostrarModalConfirmacion('DEVOLVER PUCHO', '¿Desea devolver este aporte al lote de origen?', () => resolve(true), '↩️');
        });

        if (!confirm) return;

        mostrarModalInfo('Procesando...', '<p style="text-align: center;">Devolviendo pucho al lote original...</p>', '⏳');

        const response = await API.almacen.devolverPucho({ puchoId });

        if (response.success) {
            cerrarModalInfo();
            showToast('Pucho devuelto al lote original correctamente.', 'success', 'Devolución Completada');

            // Recargar datos y re-abrir el modal de la zona para refrescar
            await cargarAlmacenDesdeAPI();
            initCuadrantes();

            // Re-abrir el modal de la zona de puchos para ver los cambios
            const dbCuadrante = buscarCuadrantePorId(cuadranteId);
            if (dbCuadrante) abrirModalZonaPuchos(dbCuadrante, coord);
        } else {
            mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">' + (response.error || 'Error desconocido') + '</p>', '❌');
        }
    } catch (error) {
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">Error de red: ' + error.message + '</p>', '❌');
    }
}

/**
 * Devuelve TODOS los puchos de una zona de vuelta a sus orígenes
 */
async function ejecutarDevolverTodoPucho(cuadranteId, coord) {
    try {
        const confirm = await new Promise(resolve => {
            mostrarModalConfirmacion('RETORNAR TODO', '¿Desea devolver <b>TODOS</b> los kilos acumulados en esta zona a sus respectivos lotes?', () => resolve(true), '↩️');
        });

        if (!confirm) return;

        mostrarModalInfo('Procesando...', '<p style="text-align: center;">Devolviendo existencias al inventario...</p>', '⏳');

        const response = await API.almacen.devolverTodoPucho({ cuadranteId });

        if (response.success) {
            cerrarModalInfo();
            showToast('Todos los puchos han regresado a sus orígenes.', 'success', 'Retorno Completo');

            await cargarAlmacenDesdeAPI();
            initCuadrantes();

            const dbCuadrante = buscarCuadrantePorId(cuadranteId);
            if (dbCuadrante) abrirModalZonaPuchos(dbCuadrante, coord);
        } else {
            mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">' + (response.error || 'Error desconocido') + '</p>', '❌');
        }
    } catch (error) {
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">Error: ' + error.message + '</p>', '❌');
    }
}

/**
 * Busca un cuadrante en el estado local por su ID
 */
function buscarCuadrantePorId(id) {
    let encontrado = null;
    almacenData.filas.forEach(f => {
        (f.cuadrantes || []).forEach(c => {
            if (c.id == id) encontrado = c;
        });
    });
    return encontrado;
}

/**
 * Muestra selector de cuadrante destino para los puchos
 */
function mostrarSelectorPuchoDestino(loteId, origenCoord) {
    // Buscar todas las zonas de puchos disponibles
    let puchoZones = [];
    almacenData.filas.forEach(f => {
        (f.cuadrantes || []).forEach(c => {
            if (c.es_zona_puchos == 1) puchoZones.push(c);
        });
    });

    if (puchoZones.length === 0) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">No hay ninguna <b>Zona de Puchos</b> configurada.<br><br>Primero marca un cuadrante como zona de puchos.</p>', '⚠️');
        return;
    }

    let html = '<p style="margin-bottom: 1rem; color: #475569; text-align: center;">Seleccione a qué zona mover los puchos del lote:</p>';
    html += '<div style="display: grid; grid-template-columns: 1fr; gap: 0.6rem; max-height: 300px; overflow-y: auto; padding: 0.2rem;">';

    puchoZones.forEach(z => {
        html += `<button onclick="ejecutarExtraccionPucho('${loteId}', '${z.id}', '${origenCoord}')" 
                style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: white; border: 1px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
                <span style="font-weight: 700; color: #1e293b;">🫒 Zona ${z.nombre}</span>
                <span style="background: #ecfdf5; color: #059669; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.75rem;">Seleccionar</span>
                </button>`;
    });

    html += '</div>';

    mostrarModalInfo('MOVER PUCHOS', html, '✨');
}

/**
 * Ejecuta la llamada al API para extraer puchos
 */
async function ejecutarExtraccionPucho(loteId, destinoId, origenCoord) {
    try {
        mostrarModalInfo('Procesando...', '<p style="text-align: center;">Moviendo puchos seleccionados...</p>', '⏳');

        const response = await API.almacen.extraerPucho({
            loteAlmacenId: loteId,
            destinoCuadranteId: destinoId
        });

        if (response.success) {
            cerrarModalInfo();
            showToast('Puchos movidos correctamente a la zona seleccionada.', 'success', 'Extracción Completada');

            // Recargar datos y re-renderizar
            await cargarAlmacenDesdeAPI();
            initCuadrantes();
        } else {
            mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">' + (response.error || 'Error desconocido') + '</p>', '❌');
        }
    } catch (error) {
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">Error de red: ' + error.message + '</p>', '❌');
    }
}

function populateCuadranteSelects() {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const cols = [1, 2, 3, 4, 5];

    const origenSelect = document.getElementById('reubicacionOrigen');
    const destinoSelect = document.getElementById('reubicacionDestino');

    if (origenSelect) {
        origenSelect.innerHTML = '<option value="">Seleccionar...</option>';
        rows.forEach(row => {
            cols.forEach(col => {
                const cuadranteId = row + '-' + col;
                origenSelect.innerHTML += '<option value="' + cuadranteId + '">' + cuadranteId + '</option>';
            });
        });
    }

    if (destinoSelect) {
        destinoSelect.innerHTML = '<option value="">Seleccionar...</option><option value="ferreteria">🔧 Ferretería</option>';
        rows.forEach(row => {
            cols.forEach(col => {
                const cuadranteId = row + '-' + col;
                destinoSelect.innerHTML += '<option value="' + cuadranteId + '">' + cuadranteId + '</option>';
            });
        });
    }
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function buscarPorCodigo() {
    const codigo = document.getElementById('searchCodigo').value.trim().toUpperCase();
    if (!codigo) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese un código para buscar</p>', '⚠️');
        return;
    }

    let encontrado = null;
    let coordEncontrada = '';

    if (almacenData && almacenData.filas) {
        almacenData.filas.forEach(f => {
            (f.cuadrantes || []).forEach(c => {
                const matchLote = (c.lotes || []).find(l =>
                    l.codigo_lote && l.codigo_lote.toUpperCase().includes(codigo)
                );
                if (matchLote) {
                    encontrado = c;
                    coordEncontrada = c.nombre;
                }
            });
        });
    }

    if (encontrado) {
        abrirModalCuadrantePlano(encontrado, coordEncontrada);
    } else {
        mostrarModalInfo('Sin Resultados', '<p style="text-align: center; color: #64748b; padding: 1rem;">No se encontró ningún lote con el código: <strong>' + codigo + '</strong></p>', '🔍');
    }
}

function openCuadranteModal(cuadranteId) {
    const data = almacenData[cuadranteId] || null;

    document.getElementById('cuadranteModalTitle').textContent = 'Cuadrante ' + cuadranteId;

    let content = '';
    if (data) {
        content = '<div style="display: grid; gap: 1rem;">' +
            '<div style="background: #f0fdf4; padding: 1rem; border-radius: 10px; border: 1px solid #16a34a;">' +
            '<div style="font-size: 0.75rem; color: #16a34a; text-transform: uppercase;">Estado</div>' +
            '<div style="font-weight: 600; color: #16a34a;">Ocupado</div>' +
            '</div>' +
            '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">' +
            '<div style="background: #f8fafc; padding: 1rem; border-radius: 10px;">' +
            '<div style="font-size: 0.75rem; color: #64748b;">Tipo</div>' +
            '<div style="font-weight: 600;">' + (data.tipo === 'fibra' ? 'Fibra' : 'Bidón') + '</div>' +
            '</div>' +
            '<div style="background: #f8fafc; padding: 1rem; border-radius: 10px;">' +
            '<div style="font-size: 0.75rem; color: #64748b;">Color</div>' +
            '<div style="font-weight: 600;">' + capitalizeFirst(data.color || '-') + '</div>' +
            '</div>' +
            '<div style="background: #f8fafc; padding: 1rem; border-radius: 10px;">' +
            '<div style="font-size: 0.75rem; color: #64748b;">Calibre</div>' +
            '<div style="font-weight: 600;">' + (data.calibre || '-') + '</div>' +
            '</div>' +
            '<div style="background: #f8fafc; padding: 1rem; border-radius: 10px;">' +
            '<div style="font-size: 0.75rem; color: #64748b;">Código/QR</div>' +
            '<div style="font-weight: 600; color: #3b82f6;">' + (data.codigo || '-') + '</div>' +
            '</div>' +
            '</div>' +
            (data.cantidad ? '<div style="background: #eff6ff; padding: 1rem; border-radius: 10px;">' +
                '<div style="font-size: 0.75rem; color: #1d4ed8;">Cantidad: ' + data.cantidad + ' unidades</div>' +
                '</div>' : '') +
            '</div>';
    } else {
        content = '<div style="text-align: center; padding: 2rem;">' +
            '<div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">📦</div>' +
            '<p style="color: #64748b;">Este cuadrante está vacío</p>' +
            '</div>';
    }

    document.getElementById('cuadranteModalContent').innerHTML = content;
    document.getElementById('cuadranteModalOverlay').classList.add('active');
}

function closeCuadranteModal() {
    document.getElementById('cuadranteModalOverlay').classList.remove('active');
}

function openSalidaModal() {
    selectedSalidaTipo = '';
    selectedVentaTipo = '';
    document.querySelectorAll('.salida-option').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.salida-form').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.venta-type-btn').forEach(el => el.classList.remove('selected'));
    document.getElementById('exportacionFields').style.display = 'none';
    document.getElementById('salidaModalOverlay').classList.add('active');
}

function closeSalidaModal() {
    document.getElementById('salidaModalOverlay').classList.remove('active');
}

function selectSalidaTipo(tipo) {
    selectedSalidaTipo = tipo;
    document.querySelectorAll('.salida-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.tipo === tipo);
    });

    document.querySelectorAll('.salida-form').forEach(el => el.style.display = 'none');

    if (tipo === 'venta') {
        document.getElementById('ventaForm').style.display = 'block';
    } else if (tipo === 'prestamo') {
        document.getElementById('prestamoForm').style.display = 'block';
    } else if (tipo === 'reubicacion') {
        document.getElementById('reubicacionForm').style.display = 'block';
    }
}

function selectVentaTipo(tipo) {
    selectedVentaTipo = tipo;
    document.querySelectorAll('.venta-type-btn').forEach(el => {
        el.classList.toggle('selected', el.dataset.venta === tipo);
    });

    document.getElementById('exportacionFields').style.display = tipo === 'exportacion' ? 'block' : 'none';
}

function guardarSalida() {
    if (!selectedSalidaTipo) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Seleccione un tipo de salida</p>', '⚠️');
        return;
    }

    // Save logic here
    showToast('Salida registrada correctamente.', 'success', 'Salida Exitosa');
    closeSalidaModal();
}

// ========== SALIDA SECTION FUNCTIONS ==========
let tipoVentaSeleccionado = '';
let salidasData = [];

// Función para cargar ventas desde API
async function cargarVentasDesdeAPI() {
    try {
        salidasData = await API.ventas.getAll();
        if (!Array.isArray(salidasData)) salidasData = [];
    } catch (error) {
        console.error('Error cargando ventas:', error);
        salidasData = [];
    }
}

async function mostrarSalidaVentas() {
    document.getElementById('salidaSeleccion').style.display = 'none';
    document.getElementById('salidaVentasContent').style.display = 'block';
    document.getElementById('salidaReubicacionContent').style.display = 'none';
    // Set fecha to today
    document.getElementById('ventaFechaRegistro').value = new Date().toISOString().split('T')[0];
    cargarLotesParaVenta();
    // Cargar ventas desde API y renderizar historial
    await cargarVentasDesdeAPI();
    renderHistorialVentas();
}

function mostrarSalidaReubicacion() {
    document.getElementById('salidaSeleccion').style.display = 'none';
    document.getElementById('salidaVentasContent').style.display = 'none';
    document.getElementById('salidaReubicacionContent').style.display = 'block';
    // Set fecha to today
    document.getElementById('reubicacionFecha').value = new Date().toISOString().split('T')[0];
    // Cargar lotes disponibles
    cargarLotesParaReubicacion();
}

function volverSalidaSeleccion() {
    document.getElementById('salidaSeleccion').style.display = 'block';
    document.getElementById('salidaVentasContent').style.display = 'none';
    document.getElementById('salidaReubicacionContent').style.display = 'none';
    document.getElementById('salidaPrestamosContent').style.display = 'none';
    tipoVentaSeleccionado = '';
}

// ========== PRÉSTAMOS FUNCTIONS ==========
let prestamosData = [];

// Función para cargar préstamos desde API
async function cargarPrestamosDesdeAPI() {
    try {
        prestamosData = await API.prestamos.getAll();
        if (!Array.isArray(prestamosData)) prestamosData = [];
    } catch (error) {
        console.error('Error cargando préstamos:', error);
        prestamosData = [];
    }
}

async function mostrarSalidaPrestamos() {
    document.getElementById('salidaSeleccion').style.display = 'none';
    document.getElementById('salidaVentasContent').style.display = 'none';
    document.getElementById('salidaReubicacionContent').style.display = 'none';
    document.getElementById('salidaPrestamosContent').style.display = 'block';
    // Set fecha to today
    document.getElementById('prestamoFecha').value = new Date().toISOString().split('T')[0];
    cargarLotesParaPrestamo();
    await cargarPrestamosDesdeAPI();
    renderHistorialPrestamos();
}

function cargarLotesParaPrestamo() {
    const select = document.getElementById('prestamoLote');
    select.innerHTML = '<option value="">Seleccionar lote...</option>';

    entries.forEach(entry => {
        if (entry.codigoLote) {
            const totalKg = entry.calibres && entry.calibres.length > 0
                ? entry.calibres.reduce((sum, c) => sum + (parseFloat(c.subtotal) || 0), 0)
                : 0;
            select.innerHTML += '<option value="' + entry.id + '">' + entry.codigoLote + ' - ' + (entry.vendedor || 'Sin vendedor') + ' (' + totalKg.toFixed(1) + ' Kg)</option>';
        }
    });
}

let tipoPrestamo = ''; // 'lote' o 'calibres'
let calibresPrestamoSeleccionados = [];

function cargarCalibresPrestamo() {
    const loteId = document.getElementById('prestamoLote').value;

    // Resetear paneles
    document.getElementById('panelPrestamoLoteCompleto').style.display = 'none';
    document.getElementById('panelPrestamoCalibre').style.display = 'none';
    document.getElementById('btnPrestamoLoteCompleto').style.background = '#f1f5f9';
    document.getElementById('btnPrestamoLoteCompleto').style.borderColor = '#e2e8f0';
    document.getElementById('btnPrestamoCalibre').style.background = '#f1f5f9';
    document.getElementById('btnPrestamoCalibre').style.borderColor = '#e2e8f0';
    tipoPrestamo = '';
    calibresPrestamoSeleccionados = [];

    if (!loteId) {
        document.getElementById('resumenLotePrestamo').innerHTML = '<span style="color: #94a3b8;">Seleccione un lote primero</span>';
        document.getElementById('listaCalibresPrestamo').innerHTML = '<span style="color: #94a3b8;">Seleccione un lote primero</span>';
        return;
    }

    const entry = entries.find(e => e.id == loteId);
    if (entry && entry.calibres && entry.calibres.length > 0) {
        // Calcular totales
        let totalKg = 0;
        let calibresInfo = [];
        entry.calibres.forEach(c => {
            totalKg += parseFloat(c.subtotal) || 0;
            calibresInfo.push(c.calibre + ': ' + (c.subtotal || 0) + ' Kg');
        });

        // Actualizar resumen del lote
        document.getElementById('resumenLotePrestamo').innerHTML =
            '<div><strong>Lote:</strong> ' + entry.codigoLote + '</div>' +
            '<div><strong>Total disponible:</strong> ' + totalKg.toFixed(1) + ' Kg</div>' +
            '<div><strong>Calibres:</strong> ' + entry.calibres.length + ' (' + calibresInfo.join(', ') + ')</div>';

        // Generar lista de calibres con checkboxes y campos editables
        let html = '';
        entry.calibres.forEach((c, index) => {
            html += '<div style="background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem; display: flex; align-items: center; gap: 1rem;">';
            html += '<input type="checkbox" id="chkCalibre_' + index + '" onchange="actualizarTotalCalibresPrestamo()" style="width: 20px; height: 20px; cursor: pointer;">';
            html += '<div style="flex: 1;">';
            html += '<div style="font-weight: 600; color: #1e293b;">' + c.calibre + '</div>';
            html += '<div style="font-size: 0.8rem; color: #64748b;">Disponible: ' + (c.subtotal || 0) + ' Kg</div>';
            html += '</div>';
            html += '<div style="display: flex; align-items: center; gap: 0.5rem;">';
            html += '<input type="number" id="bidonCalibre_' + index + '" placeholder="Bidones" style="width: 80px; padding: 0.4rem; border: 1px solid #e2e8f0; border-radius: 6px; text-align: center;" oninput="actualizarTotalCalibresPrestamo()" disabled>';
            html += '<span style="color: #64748b;">×</span>';
            html += '<input type="number" id="kgBidonCalibre_' + index + '" value="60" placeholder="Kg/Bidón" step="0.1" style="width: 70px; padding: 0.4rem; border: 1px solid #e2e8f0; border-radius: 6px; text-align: center;" oninput="actualizarTotalCalibresPrestamo()" disabled>';
            html += '<span style="color: #64748b; font-size: 0.85rem;">Kg</span>';
            html += '<input type="hidden" id="calibreNombre_' + index + '" value="' + c.calibre + '">';
            html += '</div></div>';
        });
        document.getElementById('listaCalibresPrestamo').innerHTML = html;

        // Habilitar/deshabilitar campos según checkbox
        document.querySelectorAll('[id^="chkCalibre_"]').forEach((checkbox, i) => {
            checkbox.addEventListener('change', function () {
                document.getElementById('bidonCalibre_' + i).disabled = !this.checked;
                document.getElementById('kgBidonCalibre_' + i).disabled = !this.checked;
                if (!this.checked) {
                    document.getElementById('bidonCalibre_' + i).value = '';
                }
            });
        });
    } else {
        document.getElementById('resumenLotePrestamo').innerHTML = '<span style="color: #dc2626;">Este lote no tiene calibres registrados</span>';
        document.getElementById('listaCalibresPrestamo').innerHTML = '<span style="color: #dc2626;">Este lote no tiene calibres registrados</span>';
    }
}

function seleccionarTipoPrestamo(tipo) {
    tipoPrestamo = tipo;

    // Visual update
    document.getElementById('btnPrestamoLoteCompleto').style.background = tipo === 'lote' ? '#f59e0b' : '#f1f5f9';
    document.getElementById('btnPrestamoLoteCompleto').style.borderColor = tipo === 'lote' ? '#f59e0b' : '#e2e8f0';
    document.getElementById('btnPrestamoLoteCompleto').style.color = tipo === 'lote' ? 'white' : '#1e293b';
    document.getElementById('btnPrestamoCalibre').style.background = tipo === 'calibres' ? '#7c3aed' : '#f1f5f9';
    document.getElementById('btnPrestamoCalibre').style.borderColor = tipo === 'calibres' ? '#7c3aed' : '#e2e8f0';
    document.getElementById('btnPrestamoCalibre').style.color = tipo === 'calibres' ? 'white' : '#1e293b';

    // Show/hide panels
    document.getElementById('panelPrestamoLoteCompleto').style.display = tipo === 'lote' ? 'block' : 'none';
    document.getElementById('panelPrestamoCalibre').style.display = tipo === 'calibres' ? 'block' : 'none';
}

function calcularTotalPrestamoLote() {
    const bidones = parseFloat(document.getElementById('prestamoBidonesLote').value) || 0;
    const kgBidon = parseFloat(document.getElementById('prestamoKgBidonLote').value) || 0;
    const total = bidones * kgBidon;
    document.getElementById('prestamoKgTotalLote').value = total.toFixed(1) + ' Kg';
}

function actualizarTotalCalibresPrestamo() {
    let totalKg = 0;
    calibresPrestamoSeleccionados = [];

    document.querySelectorAll('[id^="chkCalibre_"]').forEach((chk, i) => {
        if (chk.checked) {
            const bidones = parseFloat(document.getElementById('bidonCalibre_' + i).value) || 0;
            const kgBidon = parseFloat(document.getElementById('kgBidonCalibre_' + i).value) || 60;
            const nombre = document.getElementById('calibreNombre_' + i).value;
            const subtotal = bidones * kgBidon;
            totalKg += subtotal;

            if (bidones > 0) {
                calibresPrestamoSeleccionados.push({
                    calibre: nombre,
                    bidones: bidones,
                    kgBidon: kgBidon,
                    kgTotal: subtotal
                });
            }
        }
    });

    document.getElementById('prestamoTotalCalibreSeleccionado').textContent = totalKg.toFixed(1) + ' Kg';
}


async function guardarPrestamo() {
    const responsable = document.getElementById('prestamoResponsable').value.trim();
    const fecha = document.getElementById('prestamoFecha').value;
    const loteId = document.getElementById('prestamoLote').value;
    const destinatario = document.getElementById('prestamoDestinatario').value.trim();
    const bodega = document.getElementById('prestamoBodega').value.trim();

    // Validaciones básicas
    if (!responsable) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese el responsable</p>', '⚠️'); return; }
    if (!fecha) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese la fecha</p>', '⚠️'); return; }
    if (!loteId) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Seleccione un lote</p>', '⚠️'); return; }
    if (!destinatario) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese el nombre del destinatario</p>', '⚠️'); return; }
    if (!bodega) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese el nombre de la bodega</p>', '⚠️'); return; }
    if (!tipoPrestamo) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Seleccione el tipo de préstamo (Lote Completo o Calibres Específicos)</p>', '⚠️'); return; }

    const entry = entries.find(e => e.id == loteId);
    const codigoLote = entry ? entry.codigoLote : loteId;

    let bidones = 0;
    let kgBidon = 60;
    let kgTotal = 0;
    let calibresDetalle = [];
    let calibreTexto = '';

    if (tipoPrestamo === 'lote') {
        bidones = parseFloat(document.getElementById('prestamoBidonesLote').value) || 0;
        kgBidon = parseFloat(document.getElementById('prestamoKgBidonLote').value) || 60;
        kgTotal = bidones * kgBidon;
        calibreTexto = 'LOTE COMPLETO';

        if (bidones <= 0) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese el número de bidones</p>', '⚠️'); return; }
    } else if (tipoPrestamo === 'calibres') {
        if (calibresPrestamoSeleccionados.length === 0) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Seleccione al menos un calibre y especifique los bidones</p>', '⚠️'); return; }

        calibresDetalle = calibresPrestamoSeleccionados;
        kgTotal = calibresDetalle.reduce((sum, c) => sum + c.kgTotal, 0);
        bidones = calibresDetalle.reduce((sum, c) => sum + c.bidones, 0);
        calibreTexto = calibresDetalle.map(c => c.calibre + ' (' + c.bidones + ' bid)').join(', ');
    }

    const prestamo = {
        id: Date.now(),
        tipo: 'prestamo',
        modoPrestamo: tipoPrestamo, // 'lote' o 'calibres'
        responsable: responsable,
        fecha: fecha,
        loteId: loteId,
        codigoLote: codigoLote,
        destinatario: destinatario,
        bodega: bodega,
        direccion: document.getElementById('prestamoDireccion').value.trim(),
        telefono: document.getElementById('prestamoTelefono').value.trim(),
        calibres: calibresDetalle,
        calibreTexto: calibreTexto,
        bidones: bidones,
        kgBidon: kgBidon,
        kgTotal: kgTotal,
        fechaDevolucion: document.getElementById('prestamoFechaDevolucion').value,
        estado: document.getElementById('prestamoEstado').value,
        observaciones: document.getElementById('prestamoObservaciones').value.trim(),
        fechaRegistro: new Date().toISOString()
    };

    // Guardar en API
    try {
        await API.prestamos.create(prestamo);
        await cargarPrestamosDesdeAPI();
    } catch (error) {
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo guardar el préstamo: ' + error.message + '</p>', '❌');
        return;
    }

    var msgPrestamo = '<div style="text-align: center;"><div style="font-size: 2.5rem; margin-bottom: 0.5rem;">✅</div>';
    msgPrestamo += '<div style="font-weight: 700; color: #16a34a; margin-bottom: 1rem;">Préstamo Registrado</div></div>';
    msgPrestamo += '<div style="background: #fef3c7; border-radius: 8px; padding: 1rem;">';
    msgPrestamo += '<div><span style="color: #92400e; font-size: 0.75rem;">DESTINATARIO</span><div style="font-weight: 600;">' + destinatario + '</div></div>';
    msgPrestamo += '<div style="margin-top: 0.5rem;"><span style="color: #92400e; font-size: 0.75rem;">BODEGA</span><div style="font-weight: 600;">' + bodega + '</div></div>';
    msgPrestamo += '<div style="margin-top: 0.5rem;"><span style="color: #92400e; font-size: 0.75rem;">LOTE</span><div style="font-weight: 600;">' + codigoLote + '</div></div>';
    msgPrestamo += '<div style="margin-top: 0.5rem;"><span style="color: #92400e; font-size: 0.75rem;">DETALLE</span><div style="font-weight: 600;">' + calibreTexto + '</div></div>';
    msgPrestamo += '<div style="margin-top: 0.5rem;"><span style="color: #92400e; font-size: 0.75rem;">TOTAL</span><div style="font-weight: 600; color: #f59e0b;">' + kgTotal.toFixed(1) + ' Kg (' + bidones + ' bidones)</div></div>';
    msgPrestamo += '</div>';
    mostrarModalInfo('Préstamo Registrado', msgPrestamo, '🤝');

    limpiarFormPrestamo();
    renderHistorialPrestamos();
}

function limpiarFormPrestamo() {
    document.getElementById('prestamoResponsable').value = '';
    document.getElementById('prestamoFecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('prestamoLote').value = '';
    document.getElementById('prestamoDestinatario').value = '';
    document.getElementById('prestamoBodega').value = '';
    document.getElementById('prestamoDireccion').value = '';
    document.getElementById('prestamoTelefono').value = '';
    document.getElementById('prestamoFechaDevolucion').value = '';
    document.getElementById('prestamoEstado').value = 'pendiente';
    document.getElementById('prestamoObservaciones').value = '';

    // Resetear paneles
    tipoPrestamo = '';
    calibresPrestamoSeleccionados = [];
    document.getElementById('panelPrestamoLoteCompleto').style.display = 'none';
    document.getElementById('panelPrestamoCalibre').style.display = 'none';
    document.getElementById('btnPrestamoLoteCompleto').style.background = '#f1f5f9';
    document.getElementById('btnPrestamoLoteCompleto').style.borderColor = '#e2e8f0';
    document.getElementById('btnPrestamoLoteCompleto').style.color = '#1e293b';
    document.getElementById('btnPrestamoCalibre').style.background = '#f1f5f9';
    document.getElementById('btnPrestamoCalibre').style.borderColor = '#e2e8f0';
    document.getElementById('btnPrestamoCalibre').style.color = '#1e293b';
    document.getElementById('prestamoBidonesLote').value = '';
    document.getElementById('prestamoKgBidonLote').value = '60';
    document.getElementById('prestamoKgTotalLote').value = '0 Kg';
    document.getElementById('listaCalibresPrestamo').innerHTML = '';
    document.getElementById('prestamoTotalCalibreSeleccionado').textContent = '0 Kg';
    document.getElementById('resumenLotePrestamo').innerHTML = '';
}

function renderHistorialPrestamos() {
    const container = document.getElementById('historialPrestamosBody');
    const noPrestamosMsg = document.getElementById('noPrestamosMessage');
    const prestamosCount = document.getElementById('prestamosCount');
    const table = document.getElementById('historialPrestamosTable');

    prestamosCount.textContent = prestamosData.length;

    if (prestamosData.length === 0) {
        table.style.display = 'none';
        noPrestamosMsg.style.display = 'block';
        return;
    }

    table.style.display = 'table';
    noPrestamosMsg.style.display = 'none';

    // Ordenar por fecha más reciente
    const prestamosOrdenados = [...prestamosData].sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));

    let html = '';
    prestamosOrdenados.forEach(p => {
        const estadoColor = p.estado === 'devuelto' ? '#16a34a' : (p.estado === 'parcial' ? '#f59e0b' : '#ef4444');
        const estadoTexto = p.estado === 'devuelto' ? 'Devuelto' : (p.estado === 'parcial' ? 'Parcial' : 'Pendiente');

        html += '<tr style="border-bottom: 1px solid #e2e8f0;">';
        html += '<td style="padding: 0.8rem;">' + formatDate(p.fecha) + '</td>';
        html += '<td style="padding: 0.8rem; font-weight: 600;">' + (p.codigoLote || '-') + '</td>';
        html += '<td style="padding: 0.8rem;">' + (p.destinatario || '-') + '</td>';
        html += '<td style="padding: 0.8rem;">' + (p.bodega || '-') + '</td>';
        html += '<td style="padding: 0.8rem; text-align: right; font-weight: 600; color: #f59e0b;">' + (p.kgTotal || 0).toFixed(1) + ' Kg</td>';
        html += '<td style="padding: 0.8rem; text-align: center;"><span style="background: ' + estadoColor + '; color: white; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem;">' + estadoTexto + '</span></td>';
        html += '<td style="padding: 0.8rem; text-align: center;">';
        html += '<button onclick="verDetallePrestamo(' + p.id + ')" style="background: #3b82f6; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 5px; font-size: 0.75rem; cursor: pointer; margin-right: 0.3rem;">👁️</button>';
        html += '<button onclick="eliminarPrestamo(' + p.id + ')" style="background: #ef4444; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 5px; font-size: 0.75rem; cursor: pointer;">🗑️</button>';
        html += '</td>';
        html += '</tr>';
    });

    container.innerHTML = html;
}

function verDetallePrestamo(id) {
    const prestamo = prestamosData.find(p => p.id === id);
    if (!prestamo) {
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">Préstamo no encontrado</p>', '❌');
        return;
    }

    const estadoColor = prestamo.estado === 'devuelto' ? '#16a34a' : (prestamo.estado === 'parcial' ? '#f59e0b' : '#ef4444');
    const estadoTexto = prestamo.estado === 'devuelto' ? 'Devuelto' : (prestamo.estado === 'parcial' ? 'Devolución Parcial' : 'Pendiente de Devolución');
    const tipoPrestamoTexto = prestamo.modoPrestamo === 'lote' ? '📦 Lote Completo' : '⚖️ Calibres Específicos';

    let contenido = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">';
    contenido += '<div><div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Lote</div><div style="font-weight: 600; color: #1e293b;">' + (prestamo.codigoLote || '-') + '</div></div>';
    contenido += '<div><div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Fecha</div><div style="color: #1e293b;">' + formatDate(prestamo.fecha) + '</div></div>';
    contenido += '<div><div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Responsable</div><div style="color: #1e293b;">' + (prestamo.responsable || '-') + '</div></div>';
    contenido += '<div><div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Tipo</div><div style="color: #1e293b;">' + tipoPrestamoTexto + '</div></div>';
    contenido += '</div>';

    // Mostrar calibres si es préstamo por calibres
    if (prestamo.calibres && prestamo.calibres.length > 0) {
        contenido += '<div style="background: #f8fafc; border-radius: 10px; padding: 1rem; margin-bottom: 1rem;">';
        contenido += '<div style="font-size: 0.8rem; color: #64748b; font-weight: 600; margin-bottom: 0.5rem;">📦 CALIBRES PRESTADOS</div>';
        prestamo.calibres.forEach(c => {
            contenido += '<div style="display: flex; justify-content: space-between; padding: 0.3rem 0; border-bottom: 1px solid #e2e8f0;">';
            contenido += '<span style="font-weight: 500;">' + c.calibre + '</span>';
            contenido += '<span style="color: #f59e0b; font-weight: 600;">' + c.bidones + ' bid × ' + c.kgBidon + ' Kg = ' + c.kgTotal.toFixed(1) + ' Kg</span>';
            contenido += '</div>';
        });
        contenido += '</div>';
    } else if (prestamo.calibreTexto) {
        contenido += '<div style="background: #f8fafc; border-radius: 10px; padding: 1rem; margin-bottom: 1rem;">';
        contenido += '<div style="font-size: 0.8rem; color: #64748b; font-weight: 600; margin-bottom: 0.5rem;">📦 DETALLE</div>';
        contenido += '<div style="font-weight: 500;">' + prestamo.calibreTexto + '</div>';
        contenido += '</div>';
    }

    contenido += '<div style="background: #fef3c7; border-radius: 10px; padding: 1rem; margin-bottom: 1rem;">';
    contenido += '<div style="font-size: 0.8rem; color: #92400e; font-weight: 600; margin-bottom: 0.5rem;">🏪 DESTINATARIO</div>';
    contenido += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">';
    contenido += '<div><strong>Nombre:</strong> ' + (prestamo.destinatario || '-') + '</div>';
    contenido += '<div><strong>Bodega:</strong> ' + (prestamo.bodega || '-') + '</div>';
    if (prestamo.direccion) contenido += '<div style="grid-column: span 2;"><strong>Dirección:</strong> ' + prestamo.direccion + '</div>';
    if (prestamo.telefono) contenido += '<div><strong>Teléfono:</strong> ' + prestamo.telefono + '</div>';
    contenido += '</div></div>';

    contenido += '<div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 1rem; border-radius: 10px; text-align: center; margin-bottom: 1rem;">';
    contenido += '<div style="font-size: 0.8rem; opacity: 0.9;">TOTAL PRESTADO</div>';
    contenido += '<div style="font-size: 1.3rem; font-weight: 700;">' + (prestamo.bidones || 0) + ' bidones = ' + (prestamo.kgTotal || 0).toFixed(1) + ' Kg</div>';
    contenido += '</div>';

    contenido += '<div style="text-align: center;"><span style="background: ' + estadoColor + '; color: white; padding: 0.4rem 1rem; border-radius: 20px; font-weight: 600;">' + estadoTexto + '</span></div>';

    if (prestamo.observaciones) {
        contenido += '<div style="margin-top: 1rem; padding: 0.8rem; background: #f8fafc; border-radius: 8px;"><strong>Observaciones:</strong> ' + prestamo.observaciones + '</div>';
    }

    mostrarModalInfo('Detalle de Préstamo', contenido, '🤝');
}

var prestamoIdParaEliminar = null;

function eliminarPrestamo(id) {
    prestamoIdParaEliminar = id;
    var html = '<div id="modalConfirmarEliminarPrestamo" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 1rem;">';
    html += '<div style="background: white; border-radius: 16px; width: 100%; max-width: 400px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">';
    html += '<div style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 1.2rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">';
    html += '<div style="display: flex; align-items: center; gap: 0.8rem;"><span style="font-size: 1.5rem;">🗑️</span><h3 style="margin: 0; font-size: 1.1rem;">Eliminar Préstamo</h3></div>';
    html += '<button onclick="cerrarModalEliminarPrestamo()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 8px; font-size: 1.2rem; cursor: pointer;">×</button>';
    html += '</div>';
    html += '<div style="padding: 1.5rem; text-align: center;">';
    html += '<p style="color: #1e293b; margin-bottom: 0.5rem;">¿Estás seguro de eliminar este préstamo?</p>';
    html += '<p style="color: #dc2626; font-size: 0.85rem;">Esta acción no se puede deshacer.</p>';
    html += '</div>';
    html += '<div style="padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.8rem;">';
    html += '<button onclick="cerrarModalEliminarPrestamo()" style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 0.7rem 1.2rem; border-radius: 8px; cursor: pointer; color: #64748b;">Cancelar</button>';
    html += '<button onclick="confirmarEliminarPrestamo()" style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; border: none; padding: 0.7rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer;">Eliminar</button>';
    html += '</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
}

function cerrarModalEliminarPrestamo() {
    var modal = document.getElementById('modalConfirmarEliminarPrestamo');
    if (modal) modal.remove();
    prestamoIdParaEliminar = null;
}

async function confirmarEliminarPrestamo() {
    if (prestamoIdParaEliminar !== null) {
        try {
            await API.prestamos.delete(prestamoIdParaEliminar);
            await cargarPrestamosDesdeAPI();
            renderHistorialPrestamos();
            cerrarModalEliminarPrestamo();
            showToast('Préstamo eliminado correctamente', 'success', 'Préstamo Eliminado');
        } catch (error) {
            mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo eliminar: ' + error.message + '</p>', '❌');
        }
    }
}


function seleccionarTipoVenta(tipo) {
    tipoVentaSeleccionado = tipo;

    // Visual update
    document.getElementById('btnExportacion').style.background = tipo === 'exportacion' ? '#16a34a' : '#f1f5f9';
    document.getElementById('btnExportacion').style.color = tipo === 'exportacion' ? 'white' : '#1e293b';
    document.getElementById('btnExportacion').style.borderColor = tipo === 'exportacion' ? '#16a34a' : '#e2e8f0';

    document.getElementById('btnMercadoNacional').style.background = tipo === 'nacional' ? '#f59e0b' : '#f1f5f9';
    document.getElementById('btnMercadoNacional').style.color = tipo === 'nacional' ? 'white' : '#1e293b';
    document.getElementById('btnMercadoNacional').style.borderColor = tipo === 'nacional' ? '#f59e0b' : '#e2e8f0';

    // Show form
    document.getElementById('formVenta').style.display = 'block';

    // Show/hide destino sections
    document.getElementById('destinoExportacion').style.display = tipo === 'exportacion' ? 'block' : 'none';
    document.getElementById('destinoNacional').style.display = tipo === 'nacional' ? 'block' : 'none';
}

function cargarLotesParaVenta() {
    const select = document.getElementById('ventaLote');
    select.innerHTML = '<option value="">Seleccionar lote...</option>';

    entries.forEach(entry => {
        if (entry.codigoLote) {
            const totalKg = entry.calibres && entry.calibres.length > 0
                ? entry.calibres.reduce((sum, c) => sum + (parseFloat(c.subtotal) || 0), 0).toFixed(1) + ' Kg'
                : 'Sin calibres';
            select.innerHTML += `<option value="${entry.id}">${entry.codigoLote} - ${formatDate(entry.fecha)} (${totalKg})</option>`;
        }
    });

    // Ocultar panel de info
    document.getElementById('ventaInfoLote').style.display = 'none';
}

function cargarLotesParaReubicacion() {
    const select = document.getElementById('reubicacionLote');
    select.innerHTML = '<option value="">Seleccionar lote...</option>';

    entries.forEach(entry => {
        if (entry.codigoLote) {
            const totalKg = entry.calibres && entry.calibres.length > 0
                ? entry.calibres.reduce((sum, c) => sum + (parseFloat(c.subtotal) || 0), 0).toFixed(1) + ' Kg'
                : 'Sin calibres';
            select.innerHTML += `<option value="${entry.id}">${entry.codigoLote} - ${formatDate(entry.fecha)} (${totalKg})</option>`;
        }
    });

    // Ocultar panel de info y limpiar calibre
    document.getElementById('reubicacionInfoLote').style.display = 'none';
    document.getElementById('reubicacionCalibre').innerHTML = '<option value="">Seleccionar...</option>';
}

function cargarCalibresPorLote(tipo) {
    let loteId, infoPanel, infoCodigo, infoVendedor, infoVariedad, infoStock, infoCalibres;

    if (tipo === 'venta') {
        loteId = document.getElementById('ventaLote').value;
        infoPanel = document.getElementById('ventaInfoLote');
        infoCodigo = document.getElementById('ventaInfoCodigo');
        infoVendedor = document.getElementById('ventaInfoVendedor');
        infoVariedad = document.getElementById('ventaInfoVariedad');
        infoStock = document.getElementById('ventaInfoStock');
        infoCalibres = document.getElementById('ventaInfoCalibres');
    } else if (tipo === 'reubicacion') {
        loteId = document.getElementById('reubicacionLote').value;
        infoPanel = document.getElementById('reubicacionInfoLote');
        infoCodigo = document.getElementById('reubicacionInfoCodigo');
        infoVendedor = document.getElementById('reubicacionInfoVendedor');
        infoVariedad = document.getElementById('reubicacionInfoVariedad');
        infoStock = document.getElementById('reubicacionInfoStock');
        infoCalibres = document.getElementById('reubicacionInfoCalibres');
        // Limpiar selector de calibre para reubicación
        document.getElementById('reubicacionCalibre').innerHTML = '<option value="">Seleccionar...</option>';
    } else {
        return;
    }

    // Si no hay lote seleccionado, ocultar paneles
    if (!loteId) {
        infoPanel.style.display = 'none';
        if (tipo === 'venta') {
            document.getElementById('ventaDetalleLote').style.display = 'none';
        }
        return;
    }

    // Buscar la entrada del lote
    const entry = entries.find(e => e.id == loteId);
    if (!entry) {
        infoPanel.style.display = 'none';
        if (tipo === 'venta') {
            document.getElementById('ventaDetalleLote').style.display = 'none';
        }
        return;
    }

    // Calcular stock total
    let stockTotal = 0;
    if (entry.calibres && entry.calibres.length > 0) {
        stockTotal = entry.calibres.reduce((sum, c) => sum + (parseFloat(c.subtotal) || 0), 0);
    }

    // Actualizar información del panel
    infoCodigo.textContent = entry.codigoLote || '-';
    infoVendedor.textContent = entry.vendedor || '-';
    infoVariedad.textContent = entry.variedad || '-';
    infoStock.textContent = stockTotal.toFixed(1) + ' Kg';

    // Generar tags de calibres disponibles
    let calibresHTML = '';
    if (entry.calibres && entry.calibres.length > 0) {
        entry.calibres.forEach(calibre => {
            const bgColor = tipo === 'venta' ? '#dcfce7' : '#ddd6fe';
            const textColor = tipo === 'venta' ? '#16a34a' : '#7c3aed';
            calibresHTML += `
                        <div style="background: ${bgColor}; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.8rem;">
                            <span style="font-weight: 600; color: ${textColor};">${calibre.calibre}</span>
                            <span style="color: #64748b; margin-left: 0.3rem;">${calibre.subtotal || 0} Kg</span>
                        </div>
                    `;
            // Para reubicación, agregar al selector
            if (tipo === 'reubicacion') {
                document.getElementById('reubicacionCalibre').innerHTML += `<option value="${calibre.calibre}">${calibre.calibre} (${calibre.subtotal || 0} Kg disponibles)</option>`;
            }
        });
    } else {
        calibresHTML = '<span style="color: #94a3b8; font-style: italic;">Sin calibres registrados</span>';
    }
    infoCalibres.innerHTML = calibresHTML;

    // Mostrar panel de info
    infoPanel.style.display = 'block';

    // Para ventas, también mostrar la tabla de detalle del lote
    if (tipo === 'venta') {
        mostrarDetalleLoteVenta(entry);
    }
}

// Mostrar tabla con todos los calibres del lote para la venta
function mostrarDetalleLoteVenta(entry) {
    const tabla = document.getElementById('ventaCalibresTabla');
    const detallePanel = document.getElementById('ventaDetalleLote');
    const totalLabel = document.getElementById('ventaTotalKgLote');

    let html = '';
    let totalKg = 0;

    if (entry.calibres && entry.calibres.length > 0) {
        entry.calibres.forEach((calibre, index) => {
            const subtotal = parseFloat(calibre.subtotal) || 0;
            const precioSugerido = parseFloat(calibre.precio) || 0;
            totalKg += subtotal;
            html += `
                        <tr style="border-bottom: 1px solid #bbf7d0;">
                            <td style="padding: 0.6rem; font-weight: 600; color: #16a34a;">${calibre.calibre}</td>
                            <td style="padding: 0.6rem; text-align: center;">${calibre.bidones || 0}</td>
                            <td style="padding: 0.6rem; text-align: center;">${calibre.kilosPorBidon || 0} Kg</td>
                            <td style="padding: 0.6rem; text-align: center;">${calibre.sobras || 0} Kg</td>
                            <td style="padding: 0.6rem; text-align: right; font-weight: 700; color: #16a34a;">${subtotal.toFixed(1)} Kg</td>
                            <td style="padding: 0.6rem; text-align: center;">
                                <input type="number" class="form-input venta-precio-input" 
                                    data-index="${index}" 
                                    value="${precioSugerido > 0 ? precioSugerido : ''}" 
                                    placeholder="0.00" step="0.01" min="0"
                                    style="width: 80px; padding: 0.3rem; text-align: right; border-color: #16a34a;">
                            </td>
                        </tr>
                    `;
        });
    } else {
        html = '<tr><td colspan="6" style="text-align: center; padding: 1rem; color: #94a3b8;">Sin calibres registrados</td></tr>';
    }

    tabla.innerHTML = html;
    totalLabel.textContent = 'Total: ' + totalKg.toFixed(1) + ' Kg';
    detallePanel.style.display = 'block';
}

function calcularKgTotalVenta() {
    const bidones = parseFloat(document.getElementById('ventaBidones').value) || 0;
    const kgBidon = parseFloat(document.getElementById('ventaKgBidon').value) || 0;
    const total = bidones * kgBidon;
    document.getElementById('ventaKgTotal').value = total.toFixed(1) + ' Kg';
}

function calcularKgTotalReubicacion() {
    const bidones = parseFloat(document.getElementById('reubicacionBidones').value) || 0;
    const kgBidon = parseFloat(document.getElementById('reubicacionKgBidon').value) || 0;
    const total = bidones * kgBidon;
    document.getElementById('reubicacionKgTotal').value = total.toFixed(1) + ' Kg';
}

function limpiarFormVenta() {
    document.getElementById('ventaResponsable').value = '';
    document.getElementById('ventaFechaRegistro').value = new Date().toISOString().split('T')[0];
    document.getElementById('ventaLote').value = '';
    document.getElementById('ventaPais').value = '';
    document.getElementById('ventaClienteExport').value = '';
    document.getElementById('ventaCiudad').value = '';
    document.getElementById('ventaDistrito').value = '';
    document.getElementById('ventaClienteNacional').value = '';
    // Ocultar paneles de info del lote
    document.getElementById('ventaInfoLote').style.display = 'none';
    document.getElementById('ventaDetalleLote').style.display = 'none';
    document.getElementById('ventaCalibresTabla').innerHTML = '';
}

function limpiarFormReubicacion() {
    document.getElementById('reubicacionResponsable').value = '';
    document.getElementById('reubicacionFecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('reubicacionLote').value = '';
    document.getElementById('reubicacionDestinoNuevo').value = '';
    document.getElementById('reubicacionCalibre').innerHTML = '<option value="">Seleccionar...</option>';
    document.getElementById('reubicacionBidones').value = '';
    document.getElementById('reubicacionKgBidon').value = '';
    document.getElementById('reubicacionKgTotal').value = '0 Kg';
    // Ocultar panel de info del lote
    document.getElementById('reubicacionInfoLote').style.display = 'none';
}

async function guardarVenta() {
    const responsable = document.getElementById('ventaResponsable').value.trim();
    const fecha = document.getElementById('ventaFechaRegistro').value;
    const loteId = document.getElementById('ventaLote').value;

    // Validations
    if (!tipoVentaSeleccionado) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Seleccione el tipo de venta (Exportación o Mercado Nacional)</p>', '⚠️');
        return;
    }
    if (!responsable) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese el responsable</p>', '⚠️'); return; }
    if (!fecha) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese la fecha</p>', '⚠️'); return; }
    if (!loteId) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Seleccione el lote</p>', '⚠️'); return; }

    // Obtener información del lote
    const entry = entries.find(e => e.id == loteId);
    if (!entry) { mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se encontró la información del lote</p>', '❌'); return; }
    if (!entry.calibres || entry.calibres.length === 0) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">El lote no tiene calibres registrados</p>', '⚠️'); return; }

    let destino = {};
    if (tipoVentaSeleccionado === 'exportacion') {
        const pais = document.getElementById('ventaPais').value;
        const cliente = document.getElementById('ventaClienteExport').value.trim();
        if (!pais) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Seleccione el país de destino</p>', '⚠️'); return; }
        if (!cliente) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese el nombre del cliente</p>', '⚠️'); return; }
        destino = { pais: pais, cliente: cliente };
    } else {
        const ciudad = document.getElementById('ventaCiudad').value.trim();
        const cliente = document.getElementById('ventaClienteNacional').value.trim();
        if (!ciudad) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese la ciudad de destino</p>', '⚠️'); return; }
        if (!cliente) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese el nombre del cliente</p>', '⚠️'); return; }
        destino = {
            ciudad: ciudad,
            distrito: document.getElementById('ventaDistrito').value.trim(),
            cliente: cliente
        };
    }

    // Capturar calibres con sus precios actualizados (negociados)
    const precioInputs = document.querySelectorAll('.venta-precio-input');
    const calibresVenta = entry.calibres.map((c, idx) => {
        const input = Array.from(precioInputs).find(inp => parseInt(inp.dataset.index) === idx);
        const precioNegociado = input ? parseFloat(input.value) : (parseFloat(c.precio) || 0);
        return {
            ...c,
            precioKg: precioNegociado, // Cambiado a precioKg para el controlador PHP
            precio: precioNegociado,
            valorTotal: (parseFloat(c.subtotal) || 0) * precioNegociado
        };
    });

    // Calcular totales del lote con los nuevos precios
    let totalBidones = 0;
    let totalKg = 0;
    let totalValorVenta = 0;

    calibresVenta.forEach(c => {
        totalBidones += parseInt(c.bidones) || 0;
        totalKg += parseFloat(c.subtotal) || 0;
        totalValorVenta += parseFloat(c.valorTotal) || 0;
    });

    const venta = {
        id: Date.now(),
        tipo: 'venta',
        tipoVenta: tipoVentaSeleccionado, // Vuelto a camelCase para PHP
        responsable: responsable,
        fecha: fecha,
        loteId: loteId, // Vuelto a camelCase para PHP
        codigoLote: entry.codigoLote || loteId, // Vuelto a camelCase para PHP
        vendedor: entry.vendedor || '-',
        variedad: entry.variedad || '-',
        calibres: calibresVenta,
        totalBidones: totalBidones,
        kgTotal: totalKg,
        valorTotalVenta: totalValorVenta,
        destino: destino,
        fechaRegistro: new Date().toISOString()
    };

    // Guardar en API
    try {
        await API.ventas.create(venta);
        await cargarVentasDesdeAPI();
    } catch (error) {
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo guardar la venta: ' + error.message + '</p>', '❌');
        return;
    }

    var contenidoExito = '<div style="text-align: center; margin-bottom: 1rem;">';
    contenidoExito += '<div style="font-size: 3rem; margin-bottom: 0.5rem;">✅</div>';
    contenidoExito += '<div style="font-size: 1.2rem; font-weight: 700; color: #16a34a;">Venta Registrada Exitosamente</div>';
    contenidoExito += '</div>';
    contenidoExito += '<div style="background: #f8fafc; border-radius: 10px; padding: 1rem;">';
    contenidoExito += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">';
    contenidoExito += '<div><span style="color: #64748b; font-size: 0.75rem;">TIPO</span><div style="font-weight: 600;">' + (tipoVentaSeleccionado === 'exportacion' ? '🌍 Exportación' : '🏠 Mercado Nacional') + '</div></div>';
    contenidoExito += '<div><span style="color: #64748b; font-size: 0.75rem;">LOTE</span><div style="font-weight: 600;">' + entry.codigoLote + '</div></div>';
    contenidoExito += '<div><span style="color: #64748b; font-size: 0.75rem;">CALIBRES</span><div style="font-weight: 600;">' + entry.calibres.length + '</div></div>';
    contenidoExito += '<div><span style="color: #64748b; font-size: 0.75rem;">TOTAL BIDONES</span><div style="font-weight: 600;">' + totalBidones + '</div></div>';
    contenidoExito += '<div><span style="color: #64748b; font-size: 0.75rem;">TOTAL KG</span><div style="font-weight: 600; color: #16a34a;">' + totalKg.toFixed(1) + ' Kg</div></div>';
    contenidoExito += '<div><span style="color: #64748b; font-size: 0.75rem;">DESTINO</span><div style="font-weight: 600;">' + (tipoVentaSeleccionado === 'exportacion' ? destino.pais : destino.ciudad) + '</div></div>';
    contenidoExito += '<div style="grid-column: span 2;"><span style="color: #64748b; font-size: 0.75rem;">CLIENTE</span><div style="font-weight: 600;">' + destino.cliente + '</div></div>';
    contenidoExito += '</div></div>';
    showToast('Venta registrada exitosamente.', 'success', 'Venta Exitosa');

    limpiarFormVenta();
    tipoVentaSeleccionado = '';
    document.getElementById('btnExportacion').style.background = '#f1f5f9';
    document.getElementById('btnExportacion').style.color = '#1e293b';
    document.getElementById('btnMercadoNacional').style.background = '#f1f5f9';
    document.getElementById('btnMercadoNacional').style.color = '#1e293b';
    document.getElementById('formVenta').style.display = 'none';
    document.getElementById('destinoExportacion').style.display = 'none';
    document.getElementById('destinoNacional').style.display = 'none';

    // Actualizar historial de ventas
    renderHistorialVentas();
}

async function guardarReubicacion() {
    const responsable = document.getElementById('reubicacionResponsable').value.trim();
    const fecha = document.getElementById('reubicacionFecha').value;
    const loteId = document.getElementById('reubicacionLote').value;
    const destino = document.getElementById('reubicacionDestinoNuevo').value.trim();
    const calibre = document.getElementById('reubicacionCalibre').value;
    const bidones = parseFloat(document.getElementById('reubicacionBidones').value) || 0;
    const kgBidon = parseFloat(document.getElementById('reubicacionKgBidon').value) || 0;

    // Validations
    if (!responsable) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese el responsable</p>', '⚠️'); return; }
    if (!fecha) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese la fecha</p>', '⚠️'); return; }
    if (!loteId) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Seleccione un lote</p>', '⚠️'); return; }
    if (!destino) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese el destino</p>', '⚠️'); return; }
    if (!calibre) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Seleccione el calibre</p>', '⚠️'); return; }
    if (bidones <= 0) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese el número de bidones</p>', '⚠️'); return; }
    if (kgBidon <= 0) { mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese los kg por bidón</p>', '⚠️'); return; }

    // Obtener info del lote para el registro
    const entry = entries.find(e => e.id == loteId);
    const codigoLote = entry ? entry.codigoLote : loteId;

    const reubicacion = {
        id: Date.now(),
        tipo: 'reubicacion',
        responsable: responsable,
        fecha: fecha,
        loteId: loteId,
        codigoLote: codigoLote,
        destino: destino,
        calibre: calibre,
        bidones: bidones,
        kgBidon: kgBidon,
        kgTotal: bidones * kgBidon,
        fechaRegistro: new Date().toISOString()
    };

    // Guardar en API (reubicación se guarda como tipo de salida)
    try {
        await API.ventas.create(reubicacion);
        await cargarVentasDesdeAPI();
    } catch (error) {
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo guardar la reubicación: ' + error.message + '</p>', '❌');
        return;
    }

    var msgReub = '<div style="text-align: center;"><div style="font-size: 2.5rem; margin-bottom: 0.5rem;">✅</div>';
    msgReub += '<div style="font-weight: 700; color: #16a34a; margin-bottom: 1rem;">Reubicación Registrada</div></div>';
    msgReub += '<div style="background: #f8fafc; border-radius: 8px; padding: 1rem;">';
    msgReub += '<div><span style="color: #64748b; font-size: 0.75rem;">DESTINO</span><div style="font-weight: 600;">' + destino + '</div></div>';
    msgReub += '<div style="margin-top: 0.5rem;"><span style="color: #64748b; font-size: 0.75rem;">CALIBRE</span><div style="font-weight: 600;">' + calibre + '</div></div>';
    msgReub += '<div style="margin-top: 0.5rem;"><span style="color: #64748b; font-size: 0.75rem;">TOTAL</span><div style="font-weight: 600; color: #16a34a;">' + (bidones * kgBidon).toFixed(1) + ' Kg</div></div>';
    msgReub += '</div>';
    mostrarModalInfo('Reubicación', msgReub, '📦');

    limpiarFormReubicacion();

    // Volver al almacén si vinimos de ahí
    if (window.reubicacionOrigenAlmacen) {
        volverDesdeReubicacion();
    }
}

// ========== HISTORIAL DE VENTAS FUNCTIONS ==========
function renderHistorialVentas() {
    const container = document.getElementById('historialVentasBody');
    const noVentasMsg = document.getElementById('noVentasMessage');
    const ventasCount = document.getElementById('ventasCount');
    const table = document.getElementById('historialVentasTable');

    // salidasData ahora son las ventas directamente de la API
    const ventas = salidasData || [];

    ventasCount.textContent = ventas.length;

    if (ventas.length === 0) {
        table.style.display = 'none';
        noVentasMsg.style.display = 'block';
        return;
    }

    table.style.display = 'table';
    noVentasMsg.style.display = 'none';

    let html = '';
    ventas.forEach(venta => {
        const fechaFormatted = formatDate(venta.fecha);
        const tipoVenta = venta.tipoVenta || venta.tipo_venta || 'exportacion';
        const tipoLabel = tipoVenta === 'exportacion'
            ? '<span style="background: #dbeafe; color: #1d4ed8; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">🌍 Exportación</span>'
            : '<span style="background: #fef3c7; color: #92400e; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">🇵🇪 Nacional</span>';

        const cliente = venta.cliente || '-';
        const destino = tipoVenta === 'exportacion'
            ? (venta.destinoPais || venta.destino_pais || '-')
            : (venta.destinoCiudad || venta.destino_ciudad || '-');

        // Obtener total de kg
        const totalKg = safeNumber(venta.totalKg || venta.total_kg);
        const codigoLote = venta.codigoLote || venta.codigo_lote || '-';

        // Generar resumen de calibres
        const calibres = safeArray(venta.calibres);
        let calibresResumen = '-';
        if (calibres.length > 0) {
            calibresResumen = calibres.map(c => c.calibre).join(', ');
            if (calibresResumen.length > 30) {
                calibresResumen = calibresResumen.substring(0, 27) + '...';
            }
        }

        html += `
                    <tr style="border-bottom: 1px solid #e2e8f0; transition: background 0.2s;" onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background='white'">
                        <td style="padding: 0.8rem; color: #64748b;">${fechaFormatted}</td>
                        <td style="padding: 0.8rem; font-weight: 600; color: #1e293b;">${codigoLote}</td>
                        <td style="padding: 0.8rem; text-align: center;">${tipoLabel}</td>
                        <td style="padding: 0.8rem;">${cliente}</td>
                        <td style="padding: 0.8rem;">${destino}</td>
                        <td style="padding: 0.8rem; text-align: right; font-weight: 700; color: #16a34a;">${totalKg.toFixed(1)} Kg</td>
                        <td style="padding: 0.8rem; text-align: center; font-size: 0.8rem; color: #64748b;" title="${calibresResumen}">${calibres.length} calibres</td>
                        <td style="padding: 0.8rem; text-align: center;">
                            <button onclick="verDetalleVenta(${venta.id})" 
                                style="background: #e0f2fe; border: none; padding: 0.4rem 0.6rem; border-radius: 6px; cursor: pointer; margin-right: 0.3rem;" 
                                title="Ver detalle">👁️</button>
                            ${puedeEditarVentas() ? `
                            <button onclick="eliminarVenta(${venta.id})" 
                                style="background: #fee2e2; border: none; padding: 0.4rem 0.6rem; border-radius: 6px; cursor: pointer; color: #dc2626;" 
                                title="Eliminar">🗑️</button>
                            ` : ''}
                        </td>
                    </tr>
                `;
    });

    container.innerHTML = html;
}

function verDetalleVenta(id) {
    const venta = salidasData.find(s => s.id === id);
    if (!venta) {
        mostrarModalInfo('Error', '<p style="color: #dc2626;">Venta no encontrada</p>', '❌');
        return;
    }

    // Obtener campos con fallback para snake_case y camelCase
    const codigoLote = venta.codigoLote || venta.codigo_lote || '-';
    const tipoVenta = venta.tipoVenta || venta.tipo_venta || 'exportacion';
    const cliente = venta.cliente || '-';
    const destinoPais = venta.destinoPais || venta.destino_pais || '-';
    const destinoCiudad = venta.destinoCiudad || venta.destino_ciudad || '-';
    const totalBidones = safeNumber(venta.totalBidones || venta.total_bidones);
    const totalKg = safeNumber(venta.totalKg || venta.total_kg);
    const usuarioNombre = venta.usuarioNombre || venta.usuario_nombre || '-';
    const calibres = safeArray(venta.calibres);

    let calibresHTML = '';
    if (calibres.length > 0) {
        calibresHTML = '<div style="margin-top: 1rem;">';
        calibres.forEach(c => {
            const calibreKg = safeNumber(c.kg);
            const calibreBidones = safeNumber(c.bidones);
            const calibrePrecio = safeNumber(c.precio);
            const calibreValorTotal = safeNumber(c.valorTotal || (calibreKg * calibrePrecio));
            calibresHTML += '<div style="background: #f8fafc; padding: 0.8rem; border-radius: 8px; margin-bottom: 0.5rem; border-left: 3px solid #3d4f31; display: flex; justify-content: space-between; align-items: center;">';
            calibresHTML += '<div>';
            calibresHTML += '<div style="font-weight: 600; color: #1e293b;">' + (c.calibre || '-') + '</div>';
            calibresHTML += '<div style="font-size: 0.85rem; color: #64748b;">' + calibreBidones + ' bidones = <strong style="color: #16a34a;">' + calibreKg.toFixed(1) + ' Kg</strong></div>';
            calibresHTML += '</div>';
            calibresHTML += '<div style="text-align: right;">';
            calibresHTML += '<div style="font-size: 0.75rem; color: #64748b;">PRECIO</div>';
            calibresHTML += '<div style="font-weight: 700; color: #0369a1;">S/' + safeFixed(calibrePrecio, 2) + '</div>';
            calibresHTML += '</div>';
            calibresHTML += '</div>';
        });
        calibresHTML += '</div>';
    } else {
        calibresHTML = '<p style="color: #94a3b8; font-style: italic;">Sin calibres registrados</p>';
    }

    const destinoInfo = tipoVenta === 'exportacion'
        ? 'País: ' + destinoPais
        : 'Ciudad: ' + destinoCiudad;

    let contenido = '';
    contenido += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">';
    contenido += '<div><div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Lote</div><div style="font-weight: 600; color: #1e293b;">' + codigoLote + '</div></div>';
    contenido += '<div><div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Fecha</div><div style="color: #1e293b;">' + formatDate(venta.fecha) + '</div></div>';
    contenido += '<div><div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Tipo</div><div style="color: #1e293b;">' + (tipoVenta === 'exportacion' ? '🌍 Exportación' : '🏠 Mercado Nacional') + '</div></div>';
    contenido += '<div><div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Responsable</div><div style="color: #1e293b;">' + usuarioNombre + '</div></div>';
    contenido += '<div><div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Cliente</div><div style="color: #1e293b;">' + cliente + '</div></div>';
    contenido += '<div><div style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 600;">Destino</div><div style="color: #1e293b;">' + destinoInfo + '</div></div>';
    contenido += '</div>';

    contenido += '<div style="border-top: 1px solid #e2e8f0; padding-top: 1rem;">';
    contenido += '<div style="font-size: 0.8rem; color: #64748b; font-weight: 600; margin-bottom: 0.5rem;">CALIBRES:</div>';
    contenido += calibresHTML;
    contenido += '</div>';

    contenido += '<div style="background: linear-gradient(135deg, #3d4f31, #5a7247); color: white; padding: 1rem; border-radius: 10px; margin-top: 1rem; text-align: center;">';
    contenido += '<div style="font-size: 0.8rem; opacity: 0.9;">TOTAL</div>';
    contenido += '<div style="font-size: 1.2rem; font-weight: 700;">' + totalBidones + ' bidones = ' + totalKg.toFixed(1) + ' Kg</div>';
    const totalValorVenta = safeNumber(venta.valorTotalVenta || venta.valor_total_venta);
    if (totalValorVenta > 0) {
        contenido += '<div style="font-size: 0.9rem; opacity: 0.9; margin-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.5rem;">MONTO TOTAL</div>';
        contenido += '<div style="font-size: 1.2rem; font-weight: 700;">S/' + safeFixed(totalValorVenta, 2) + '</div>';
    }

    contenido += '</div>';

    mostrarModalInfo('Detalle de Venta', contenido, '📋');
}

function editarVenta(id) {
    // Validación de permisos - Solo admin puede editar
    if (!puedeEditarVentas()) {
        mostrarModalInfo('Acceso Denegado', '<p style="text-align: center; color: #dc2626;">No tienes permisos para editar ventas.</p><p style="text-align: center; font-size: 0.85rem; color: #64748b; margin-top: 0.5rem;">Solo el administrador puede modificar registros.</p>', '🔒');
        return;
    }

    const venta = salidasData.find(s => s.id === id);
    if (!venta) {
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">Venta no encontrada</p>', '❌');
        return;
    }

    // Crear modal de edición
    const modalHtml = `
                <div id="editarVentaModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem;">
                    <div style="background: white; border-radius: 16px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto;">
                        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 1.5rem; border-radius: 16px 16px 0 0;">
                            <h2 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">✏️ Editar Venta</h2>
                            <p style="margin: 0.5rem 0 0 0; opacity: 0.9; font-size: 0.85rem;">Lote: ${venta.codigoLote}</p>
                        </div>
                        <div style="padding: 1.5rem;">
                            <div style="margin-bottom: 1rem;">
                                <label style="display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.3rem; font-weight: 600;">TIPO DE VENTA</label>
                                <select id="editVentaTipo" style="width: 100%; padding: 0.7rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem;">
                                    <option value="exportacion" ${venta.tipoVenta === 'exportacion' ? 'selected' : ''}>Exportación</option>
                                    <option value="nacional" ${venta.tipoVenta === 'nacional' ? 'selected' : ''}>Mercado Nacional</option>
                                </select>
                            </div>
                            <div style="margin-bottom: 1rem;">
                                <label style="display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.3rem; font-weight: 600;">CLIENTE</label>
                                <input type="text" id="editVentaCliente" value="${venta.destino?.cliente || ''}" style="width: 100%; padding: 0.7rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem;">
                            </div>
                            <div id="editDestinoExport" style="${venta.tipoVenta === 'exportacion' ? '' : 'display: none;'} margin-bottom: 1rem;">
                                <label style="display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.3rem; font-weight: 600;">PAÍS DESTINO</label>
                                <input type="text" id="editVentaPais" value="${venta.destino?.pais || ''}" style="width: 100%; padding: 0.7rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem;">
                            </div>
                            <div id="editDestinoNacional" style="${venta.tipoVenta === 'nacional' ? '' : 'display: none;'}">
                                <div style="margin-bottom: 1rem;">
                                    <label style="display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.3rem; font-weight: 600;">CIUDAD</label>
                                    <input type="text" id="editVentaCiudad" value="${venta.destino?.ciudad || ''}" style="width: 100%; padding: 0.7rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem;">
                                </div>
                                <div style="margin-bottom: 1rem;">
                                    <label style="display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.3rem; font-weight: 600;">DISTRITO</label>
                                    <input type="text" id="editVentaDistrito" value="${venta.destino?.distrito || ''}" style="width: 100%; padding: 0.7rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem;">
                                </div>
                            </div>
                            <div style="margin-bottom: 1rem;">
                                <label style="display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.3rem; font-weight: 600;">RESPONSABLE</label>
                                <input type="text" id="editVentaResponsable" value="${venta.responsable || ''}" style="width: 100%; padding: 0.7rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem;">
                            </div>
                            <div style="margin-bottom: 1.5rem;">
                                <label style="display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.3rem; font-weight: 600;">FECHA</label>
                                <input type="date" id="editVentaFecha" value="${venta.fecha || ''}" style="width: 100%; padding: 0.7rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.9rem;">
                            </div>
                            <div style="display: flex; gap: 1rem;">
                                <button onclick="cerrarEditarVenta()" style="flex: 1; padding: 0.8rem; border: 1px solid #e2e8f0; background: white; border-radius: 8px; font-weight: 600; cursor: pointer;">
                                    Cancelar
                                </button>
                                <button onclick="guardarEdicionVenta(${venta.id})" style="flex: 1; padding: 0.8rem; border: none; background: linear-gradient(135deg, #16a34a, #22c55e); color: white; border-radius: 8px; font-weight: 600; cursor: pointer;">
                                    💾 Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Agregar evento para cambiar tipo de venta
    const editVentaTipo = document.getElementById('editVentaTipo');
    if (editVentaTipo) {
        editVentaTipo.addEventListener('change', function () {
            const tipo = this.value;
            const editDestinoExport = document.getElementById('editDestinoExport');
            const editDestinoNacional = document.getElementById('editDestinoNacional');
            if (editDestinoExport) editDestinoExport.style.display = tipo === 'exportacion' ? 'block' : 'none';
            if (editDestinoNacional) editDestinoNacional.style.display = tipo === 'nacional' ? 'block' : 'none';
        });
    }
}

function cerrarEditarVenta() {
    const modal = document.getElementById('editarVentaModal');
    if (modal) modal.remove();
}

async function guardarEdicionVenta(id) {
    const index = salidasData.findIndex(s => s.id === id);
    if (index === -1) {
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">Venta no encontrada</p>', '❌');
        return;
    }

    const tipoVenta = document.getElementById('editVentaTipo').value;
    const cliente = document.getElementById('editVentaCliente').value.trim();
    const responsable = document.getElementById('editVentaResponsable').value.trim();
    const fecha = document.getElementById('editVentaFecha').value;

    // Actualizar datos
    salidasData[index].tipoVenta = tipoVenta;
    salidasData[index].responsable = responsable;
    salidasData[index].fecha = fecha;

    if (!salidasData[index].destino) {
        salidasData[index].destino = {};
    }

    salidasData[index].destino.cliente = cliente;

    if (tipoVenta === 'exportacion') {
        salidasData[index].destino.pais = document.getElementById('editVentaPais').value.trim();
    } else {
        salidasData[index].destino.ciudad = document.getElementById('editVentaCiudad').value.trim();
        salidasData[index].destino.distrito = document.getElementById('editVentaDistrito').value.trim();
    }

    // Guardar en API
    try {
        await API.ventas.update(id, salidasData[index]);
        await cargarVentasDesdeAPI();
    } catch (error) {
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo actualizar: ' + error.message + '</p>', '❌');
        return;
    }

    // Cerrar modal y actualizar tabla
    cerrarEditarVenta();
    renderHistorialVentas();

    showToast('Venta actualizada correctamente', 'success', 'Venta Actualizada');
}

var ventaIdParaEliminar = null;

function eliminarVenta(id) {
    // Validación de permisos - Solo admin puede eliminar
    if (!puedeEditarVentas()) {
        mostrarModalInfo('Acceso Denegado', '<p style="text-align: center; color: #dc2626;">No tienes permisos para eliminar ventas.</p><p style="text-align: center; font-size: 0.85rem; color: #64748b; margin-top: 0.5rem;">Solo el administrador puede eliminar registros.</p>', '🔒');
        return;
    }

    ventaIdParaEliminar = id;
    var html = '<div id="modalConfirmarEliminarVenta" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 1rem;">';
    html += '<div style="background: white; border-radius: 16px; width: 100%; max-width: 400px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">';
    html += '<div style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 1.2rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">';
    html += '<div style="display: flex; align-items: center; gap: 0.8rem;"><span style="font-size: 1.5rem;">🗑️</span><h3 style="margin: 0; font-size: 1.1rem;">Eliminar Venta</h3></div>';
    html += '<button onclick="cerrarModalEliminarVenta()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 8px; font-size: 1.2rem; cursor: pointer;">×</button>';
    html += '</div>';
    html += '<div style="padding: 1.5rem; text-align: center;">';
    html += '<p style="color: #1e293b; margin-bottom: 0.5rem;">¿Estás seguro de eliminar esta venta?</p>';
    html += '<p style="color: #dc2626; font-size: 0.85rem;">Esta acción no se puede deshacer.</p>';
    html += '</div>';
    html += '<div style="padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.8rem;">';
    html += '<button onclick="cerrarModalEliminarVenta()" style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 0.7rem 1.2rem; border-radius: 8px; cursor: pointer; color: #64748b;">Cancelar</button>';
    html += '<button onclick="confirmarEliminarVenta()" style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; border: none; padding: 0.7rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer;">Eliminar</button>';
    html += '</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
}

function cerrarModalEliminarVenta() {
    var modal = document.getElementById('modalConfirmarEliminarVenta');
    if (modal) modal.remove();
    ventaIdParaEliminar = null;
}

async function confirmarEliminarVenta() {
    if (ventaIdParaEliminar !== null) {
        try {
            await API.ventas.delete(ventaIdParaEliminar);
            await cargarVentasDesdeAPI();
            renderHistorialVentas();
            cerrarModalEliminarVenta();
            showToast('Venta eliminada correctamente', 'success', 'Venta Eliminada');
        } catch (error) {
            mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo eliminar: ' + error.message + '</p>', '❌');
        }
    }
}

// ========== RECORD HISTÓRICO FUNCTIONS ==========
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Inicializar el selector de años
async function initRecordAnos() {
    const select = document.getElementById('recordAnoSelect');
    if (!select) return;

    // Asegurar que tenemos las ventas
    if (!salidasData || salidasData.length === 0) {
        try {
            salidasData = await API.ventas.getAll();
        } catch (e) {
            console.error("Error cargando ventas para inicializar años:", e);
            salidasData = [];
        }
    }

    // Obtener años únicos de ventas y compras (entradas)
    const ventas = (salidasData || []).filter(s => (s.tipo === 'venta' || s.tipo_venta));
    const anos = new Set();
    const currentYear = new Date().getFullYear();
    anos.add(currentYear); // Siempre incluir el año actual

    // Incluir años de las Entradas (Compras)
    (entries || []).forEach(e => {
        let fechaStr = e.fecha;
        if (!fechaStr) return;
        const fecha = new Date(fechaStr.includes('T') || fechaStr.includes(' ') ? fechaStr : fechaStr + 'T12:00:00');
        if (!isNaN(fecha)) {
            anos.add(fecha.getFullYear());
        }
    });

    ventas.forEach(v => {
        let fechaStr = v.fecha || v.fecha_registro;
        if (!fechaStr) return;

        // Corregir problema de zona horaria: si es solo fecha (YYYY-MM-DD), añadir mediodía
        // para que no salte al día anterior por el offset de la zona horaria
        const fecha = new Date(fechaStr.includes('T') || fechaStr.includes(' ') ? fechaStr : fechaStr + 'T12:00:00');

        if (!isNaN(fecha)) {
            anos.add(fecha.getFullYear());
        }
    });

    // Ordenar años descendente
    const anosOrdenados = Array.from(anos).sort((a, b) => b - a);

    const valorActual = select.value;
    select.innerHTML = '';
    anosOrdenados.forEach(ano => {
        select.innerHTML += `<option value="${ano}">${ano}</option>`;
    });

    if (valorActual && anosOrdenados.includes(parseInt(valorActual))) {
        select.value = valorActual;
    } else {
        // Seleccionamos el año más reciente con datos, o el actual si no hay nada
        select.value = anosOrdenados.length > 0 ? anosOrdenados[0] : currentYear;
    }
}
async function refreshRecordData() {
    try {
        // Refrescar ambas fuentes para asegurar que aparezcan años de compras o ventas nuevas
        await cargarEntradasDesdeAPI();
        salidasData = await API.ventas.getAll();
        await initRecordAnos();
        renderRecordHistorico();
    } catch (e) {
        console.error("Error al refrescar datos del record:", e);
    }
}

// Calcular datos de ventas e inteligencia de negocios por mes para un año
function calcularDatosMensuales(ano) {
    const ventas = salidasData;
    const datosMensuales = Array(12).fill(null).map(() => ({
        ventas: 0,
        kgVendidos: 0,
        ingresos: 0,
        inversion: 0,
        utilidad: 0
    }));

    ventas.forEach(venta => {
        let fechaStr = venta.fecha;
        if (!fechaStr) return;

        const fecha = new Date(fechaStr + 'T12:00:00');
        if (isNaN(fecha) || fecha.getFullYear() !== parseInt(ano)) return;

        const mes = fecha.getMonth();
        datosMensuales[mes].ventas++;

        // 1. Kilos Vendidos
        const kg = parseFloat(venta.total_kg || venta.totalKg || 0);
        datosMensuales[mes].kgVendidos += kg;


        // 3. Ingreso Real o Recalculado (BI Recovery)
        let montoReal = parseFloat(venta.total_monto || venta.totalMonto || 0);
        if (montoReal <= 0 && kg > 0) {
            // Si el monto es cero, intentamos reconstruir usando el precio del primer calibre o el precio general de la venta
            const calibres = safeArray(venta.calibres);
            if (calibres.length > 0) {
                montoReal = calibres.reduce((sum, c) => sum + (safeNumber(c.kg || c.subtotal) * safeNumber(c.precio || c.precioKg)), 0);
            }
        }
        datosMensuales[mes].ingresos += montoReal;

        // 4. Cálculo de Inversión (Cruze con Tabla de Entradas)
        // Buscamos la entrada original del lote para saber cuánto nos costó
        const entry = entries.find(e => e.id == (venta.loteId || venta.lote_id) || e.codigoLote === venta.codigoLote);

        let costoCompra = 0;
        let gastosOpProrrateados = 0;

        if (entry) {
            const precioCompra = parseFloat(entry.precio) || 0;
            costoCompra = kg * precioCompra;

            // Prorratear gastos operativos (Total Op Entrada * (Kg Venta / Kg Entrada))
            const totalKgEntrada = entry.calibres ? entry.calibres.reduce((s, c) => s + (parseFloat(c.subtotal) || 0), 0) : (parseFloat(entry.cantidad) || 1);

            // Sumar todos los gastos de la entrada
            const getV = (v) => parseFloat((v || '0').toString().replace(/[^\d.-]/g, '')) || 0;
            const t = getV(entry.transporteTotal);
            const s = getV(entry.totalCostoSalmuera);
            const o = getV(entry.totalOtrosGastos);
            let p = 0;
            if (entry.personalTurnos && Array.isArray(entry.personalTurnos)) {
                entry.personalTurnos.forEach(turno => p += getV(turno.costoTotal));
            } else {
                p = getV(entry.varonesCostoTotal) + getV(entry.mujeresCostoTotal) + getV(entry.traspaleadoresCostoTotal);
            }
            const totalOpEntrada = t + s + o + p;

            gastosOpProrrateados = totalKgEntrada > 0 ? (totalOpEntrada * (kg / totalKgEntrada)) : 0;
        }

        const inversionTotal = costoCompra + gastosOpProrrateados;
        datosMensuales[mes].inversion += inversionTotal;
        datosMensuales[mes].utilidad += (montoReal - inversionTotal);
    });

    return datosMensuales;
}

// Renderizar todo el record histórico
async function renderRecordHistorico() {
    const anoSelect = document.getElementById('recordAnoSelect');
    if (!anoSelect) return;

    const ano = anoSelect.value || new Date().getFullYear();

    // Asegurar que los años estén poblados y los datos cargados
    if (!salidasData || salidasData.length === 0) {
        try {
            salidasData = await API.ventas.getAll();
            await initRecordAnos();
        } catch (e) {
            console.error("Error cargando ventas para histórico:", e);
        }
    } else {
        // Si ya tenemos datos pero el select está vacío (por ejemplo al entrar por primera vez)
        if (anoSelect.options.length <= 1) {
            await initRecordAnos();
        }
    }

    const datos = calcularDatosMensuales(ano);

    // Calcular totales anuales
    let totalVentas = 0;
    let totalKg = 0;
    let totalIngresos = 0;
    let totalInversion = 0;
    let totalUtilidad = 0;
    let mesesConVentas = 0;

    datos.forEach(mes => {
        totalVentas += mes.ventas;
        totalKg += mes.kgVendidos;
        totalIngresos += mes.ingresos;
    });

    const precioPromedio = totalKg > 0 ? totalIngresos / totalKg : 0;

    // Calcular tendencia comparando con el año anterior
    const datosAnterior = calcularDatosMensuales(parseInt(ano) - 1);
    let totalVentasAnt = 0, totalKgAnt = 0;
    datosAnterior.forEach(m => {
        totalVentasAnt += m.ventas;
        totalKgAnt += m.kgVendidos;
    });

    const calcTrend = (act, ant) => {
        if (ant === 0) return act > 0 ? '+100%' : '0%';
        const diff = ((act - ant) / ant) * 100;
        return (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%';
    };

    // Actualizar tarjetas simplificadas (Ventas, Kg, Facturación)
    document.getElementById('recordTotalVentas').textContent = totalVentas;
    document.getElementById('recordTotalKg').textContent = Math.round(totalKg).toLocaleString() + ' Kg';
    document.getElementById('recordTotalIngresos').textContent = 'S/' + Math.round(totalIngresos).toLocaleString();

    // Actualizar tendencias
    const vTrendEl = document.getElementById('recordVentasTrend');
    const kTrendEl = document.getElementById('recordKgTrend');
    if (vTrendEl) vTrendEl.textContent = calcTrend(totalVentas, totalVentasAnt);
    if (kTrendEl) kTrendEl.textContent = calcTrend(totalKg, totalKgAnt);

    renderGraficoBarras(datos);
    renderGraficoUtilidad(datos);
    renderTablaRecord(datos);
}

// Renderizar gráfico de Utilidad Neta
function renderGraficoUtilidad(datos) {
    const container = document.getElementById('recordGraficoUtilidad');
    if (!container) return;

    const maxUtil = Math.max(...datos.map(d => Math.abs(d.utilidad)), 1);
    const alturaMax = 180;
    let html = '';

    datos.forEach((mes, i) => {
        const alturaPx = Math.round((Math.abs(mes.utilidad) / maxUtil) * alturaMax);
        const esPositivo = mes.utilidad >= 0;
        const color = esPositivo ? '#10b981' : '#ef4444';
        const hasData = mes.utilidad !== 0;

        html += `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; position: relative;">
                <div style="font-size: 0.6rem; color: ${color}; font-weight: 700; margin-bottom: 4px; opacity: ${hasData ? 1 : 0};">
                    ${Math.abs(mes.utilidad) >= 1000 ? (mes.utilidad / 1000).toFixed(1) + 'k' : Math.round(mes.utilidad)}
                </div>
                <div style="
                    width: 70%; 
                    height: ${Math.max(alturaPx, hasData ? 4 : 0)}px; 
                    background: ${color};
                    border-radius: 4px 4px 0 0;
                    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    cursor: pointer;
                    box-shadow: 0 4px 10px ${color}30;
                " title="${MESES[i]}: S/${Math.round(mes.utilidad).toLocaleString()}"
                onmouseover="this.style.transform='scaleY(1.05)'; this.style.filter='brightness(1.1)'"
                onmouseout="this.style.transform='scaleY(1)'; this.style.filter='brightness(1)'"></div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Renderizar
// Renderizar gráfico de barras de Kg vendidos
function renderGraficoBarras(datos) {
    const container = document.getElementById('recordGraficoBarras');
    if (!container) return;

    const maxKg = Math.max(...datos.map(d => d.kgVendidos), 1);
    const colores = [
        '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4',
        '#6366f1', '#a855f7', '#f43f5e', '#eab308', '#22c55e', '#14b8a6'
    ];

    let html = '';
    const alturaMax = 220; // píxeles máximos de altura
    datos.forEach((mes, i) => {
        const alturaPx = maxKg > 0 ? Math.round((mes.kgVendidos / maxKg) * alturaMax) : 0;
        const hasVentas = mes.kgVendidos > 0;

        html += `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; position: relative;">
                <div style="font-size: 0.6rem; color: #64748b; font-weight: 700; margin-bottom: 6px; opacity: ${hasVentas ? 1 : 0};">
                    ${Math.round(mes.kgVendidos).toLocaleString()}
                </div>
                <div style="
                    width: 65%; 
                    height: ${Math.max(alturaPx, 0)}px; 
                    background: linear-gradient(180deg, #10b981, #34d399);
                    border-radius: 6px 6px 0 0;
                    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.15);
                " title="${MESES[i]}: ${Math.round(mes.kgVendidos).toLocaleString()} Kg"
                onmouseover="this.style.transform='scaleX(1.1)'; this.style.filter='brightness(1.1)'"
                onmouseout="this.style.transform='scaleX(1)'; this.style.filter='brightness(1)'"></div>
            </div>
        `;
    });

    container.innerHTML = html;
}


// Renderizar tabla de resumen mensual con enfoque BI
function renderTablaRecord(datos) {
    const tbody = document.getElementById('recordTablaBody');
    const noMessage = document.getElementById('noRecordMessage');

    if (!tbody) return;

    const totalVentasAnual = datos.reduce((sum, m) => sum + m.ventas, 0);

    if (totalVentasAnual === 0) {
        tbody.innerHTML = '';
        noMessage.style.display = 'block';
        return;
    }

    noMessage.style.display = 'none';

    let html = '';
    const numFmt = (n) => Math.round(n).toLocaleString();

    datos.forEach((mes, i) => {
        const precioKg = mes.kgVendidos > 0 ? mes.ingresos / mes.kgVendidos : 0;
        const bgColor = i % 2 === 0 ? '#ffffff' : '#f8fafc';

        const colorUtil = mes.utilidad >= 0 ? '#16a34a' : '#ef4444';

        html += `
            <tr style="background: ${bgColor}; border-bottom: 1px solid #e2e8f0; font-family: 'Inter', sans-serif;">
                <td style="padding: 1rem; font-weight: 600; color: #1e293b;">${MESES[i]}</td>
                <td style="padding: 1rem; text-align: center;">
                    <span style="background: #f1f5f9; color: #475569; padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 600;">${mes.ventas}</span>
                </td>
                <td style="padding: 1rem; text-align: right; font-weight: 500; color: #64748b;">${numFmt(mes.kgVendidos)} Kg</td>
                <td style="padding: 1rem; text-align: right; font-weight: 600; color: #1e293b;">S/${numFmt(mes.ingresos)}</td>
                <td style="padding: 1rem; text-align: right; font-weight: 700; color: ${colorUtil};">S/${numFmt(mes.utilidad)}</td>
            </tr>
        `;
    });

    // Fila de totales
    const totalVentas = datos.reduce((sum, m) => sum + m.ventas, 0);
    const totalKg = datos.reduce((sum, m) => sum + m.kgVendidos, 0);
    const totalIngresos = datos.reduce((sum, m) => sum + m.ingresos, 0);
    const totalUtilidad = datos.reduce((sum, m) => sum + m.utilidad, 0);
    const totalPrecioProm = totalKg > 0 ? totalIngresos / totalKg : 0;
    const colorTotalUtil = totalUtilidad >= 0 ? '#4ade80' : '#f87171';

    html += `
        <tr style="background: #1e293b; color: white; font-weight: 700;">
            <td style="padding: 1.2rem; border-radius: 0 0 0 8px;">TOTAL</td>
            <td style="padding: 1.2rem; text-align: center;">${totalVentas}</td>
            <td style="padding: 1.2rem; text-align: right;">${numFmt(totalKg)} Kg</td>
            <td style="padding: 1.2rem; text-align: right; color: #94a3b8;">S/${numFmt(totalIngresos)}</td>
            <td style="padding: 1.2rem; text-align: right; color: ${colorTotalUtil}; border-radius: 0 0 8px 0;">S/${numFmt(totalUtilidad)}</td>
        </tr>
    `;

    tbody.innerHTML = html;
}

// Exportar a PDF (funcionalidad básica)
function exportarRecordPDF() {
    mostrarModalInfo('Exportar PDF', '<p style="text-align: center; color: #64748b;">📄 Función de exportar a PDF - En desarrollo.</p><p style="text-align: center; color: #94a3b8; font-size: 0.9rem; margin-top: 0.5rem;">Por ahora puedes usar Ctrl+P para imprimir la página.</p>', '📄');
}

// Exportar a Excel
function exportarRecordExcel() {
    const ano = document.getElementById('recordAnoSelect').value;
    const datos = calcularDatosMensuales(ano);

    let csv = 'Mes,Ventas,Volumen (Kg),Facturacion (S/),Precio Promedio (S/kg)\n';

    datos.forEach((mes, i) => {
        const precioKg = mes.kgVendidos > 0 ? mes.ingresos / mes.kgVendidos : 0;
        csv += `${MESES[i]},${mes.ventas},${mes.kgVendidos.toFixed(2)},${mes.ingresos.toFixed(2)},${precioKg.toFixed(2)}\n`;
    });

    // Totales
    const totalVentas = datos.reduce((sum, m) => sum + m.ventas, 0);
    const totalKg = datos.reduce((sum, m) => sum + m.kgVendidos, 0);
    const totalIng = datos.reduce((sum, m) => sum + m.ingresos, 0);
    const totalProm = totalKg > 0 ? totalIng / totalKg : 0;

    csv += `TOTAL,${totalVentas},${totalKg.toFixed(2)},${totalIng.toFixed(2)},${totalProm.toFixed(2)}\n`;

    // Descargar con BOM para Excel
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `record_ventas_${ano}.csv`;
    link.click();

    mostrarModalInfo('Éxito', `<p style="text-align: center; color: #16a34a;">✅ Reporte de ventas ${ano} exportado.</p>`, '📊');
}

function openFerreteriaModal() {
    mostrarModalInfo('Ferretería', '<p style="text-align: center; color: #64748b;">🔧 Módulo de Ferretería - En desarrollo</p>', '🔧');
}

// Abrir sección de Reubicación desde Almacén de Aceitunas
function abrirReubicacionDesdeAlmacen() {
    // Ocultar el contenido de almacén de aceitunas
    document.getElementById('almacenAceitunasContent').style.display = 'none';

    // Mostrar la sección de reubicación
    document.getElementById('salidaReubicacionContent').style.display = 'block';

    // Indicar que venimos del almacén
    window.reubicacionOrigenAlmacen = true;

    // Configurar fecha de hoy
    document.getElementById('reubicacionFecha').value = new Date().toISOString().split('T')[0];

    // Cargar lotes disponibles
    cargarLotesParaReubicacion();
}

// Función para volver al almacén desde reubicación
function volverDesdeReubicacion() {
    if (window.reubicacionOrigenAlmacen) {
        // Volver al almacén de aceitunas
        document.getElementById('salidaReubicacionContent').style.display = 'none';
        document.getElementById('almacenAceitunasContent').style.display = 'block';
        window.reubicacionOrigenAlmacen = false;
    } else {
        // Comportamiento normal: volver a selección de salida
        volverSalidaSeleccion();
    }
}

// ========== ALMACÉN NAVIGATION FUNCTIONS ==========
// Stock de insumos - ahora se carga desde API
let stockInsumos = {
    Agua: 0,
    SorbatoPotasio: 0,
    AcidoLactico: 0,
    AcidoCitrico: 0,
    Calcio: 0,
    AcidoAcetico: 0,
    AcidoAscorbico: 0,
    BenzoatoPotasio: 0,
    SalIndustrial: 0,
    Otros: 0
};

let movimientosInsumos = [];

// Función para cargar insumos desde API
async function cargarInsumosDesdeAPI() {
    try {
        const data = await API.insumos.getAll();
        if (data && data.stock) {
            stockInsumos = data.stock;
        }
        if (data && data.movimientos) {
            movimientosInsumos = data.movimientos;
        }
    } catch (error) {
        console.error('Error cargando insumos:', error);
    }
}

function mostrarAlmacenInsumos() {
    document.getElementById('almacenSeleccion').style.display = 'none';
    document.getElementById('almacenInsumosContent').style.display = 'block';
    document.getElementById('almacenAceitunasContent').style.display = 'none';
    cargarStockInsumos();
    actualizarHistorial();
}

function mostrarAlmacenAceitunas() {
    document.getElementById('almacenSeleccion').style.display = 'none';
    document.getElementById('almacenInsumosContent').style.display = 'none';
    document.getElementById('almacenAceitunasContent').style.display = 'block';
    initCuadrantes();
}

function volverAlmacenSeleccion() {
    document.getElementById('almacenSeleccion').style.display = 'block';
    document.getElementById('almacenInsumosContent').style.display = 'none';
    document.getElementById('almacenAceitunasContent').style.display = 'none';
}

function cargarStockInsumos() {
    // Cargar valores de stock en la UI
    document.getElementById('stockAgua').textContent = stockInsumos.Agua.toFixed(2);
    document.getElementById('stockSorbatoPotasio').textContent = stockInsumos.SorbatoPotasio.toFixed(2);
    document.getElementById('stockAcidoLactico').textContent = stockInsumos.AcidoLactico.toFixed(2);
    document.getElementById('stockAcidoCitrico').textContent = stockInsumos.AcidoCitrico.toFixed(2);
    document.getElementById('stockCalcio').textContent = stockInsumos.Calcio.toFixed(2);
    document.getElementById('stockAcidoAcetico').textContent = stockInsumos.AcidoAcetico.toFixed(2);
    document.getElementById('stockAcidoAscorbico').textContent = stockInsumos.AcidoAscorbico.toFixed(2);
    document.getElementById('stockBenzoatoPotasio').textContent = stockInsumos.BenzoatoPotasio.toFixed(2);
    document.getElementById('stockSalIndustrial').textContent = stockInsumos.SalIndustrial.toFixed(2);
    document.getElementById('stockOtros').textContent = stockInsumos.Otros.toFixed(2);
}

async function ingresarStock(insumo, unidad) {
    const inputId = 'cant' + insumo;
    const cantidad = parseFloat(document.getElementById(inputId).value) || 0;

    if (cantidad <= 0) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese una cantidad válida mayor a 0</p>', '⚠️');
        return;
    }

    stockInsumos[insumo] += cantidad;

    // Guardar en API
    try {
        await API.insumos.registrarMovimiento({ tipo: 'ingreso', insumo, cantidad, unidad });
    } catch (error) {
        stockInsumos[insumo] -= cantidad; // Revertir
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo registrar: ' + error.message + '</p>', '❌');
        return;
    }

    // Registrar movimiento local
    guardarMovimiento('ingreso', insumo, cantidad, unidad);

    // Limpiar input y actualizar UI
    document.getElementById(inputId).value = '';
    cargarStockInsumos();
    actualizarHistorial();

    // Feedback visual
    const stockElement = document.getElementById('stock' + insumo);
    stockElement.style.animation = 'none';
    stockElement.offsetHeight; // Trigger reflow
    stockElement.style.animation = 'pulse 0.3s ease';
}

async function sacarStock(insumo, unidad) {
    const inputId = 'cant' + insumo;
    const cantidad = parseFloat(document.getElementById(inputId).value) || 0;

    if (cantidad <= 0) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese una cantidad válida mayor a 0</p>', '⚠️');
        return;
    }

    if (stockInsumos[insumo] < cantidad) {
        mostrarModalInfo('Stock Insuficiente', '<p style="text-align: center; color: #dc2626;">No hay suficiente stock de ' + getNombreInsumo(insumo) + '</p><p style="text-align: center; font-size: 0.9rem; color: #64748b; margin-top: 0.5rem;">Stock actual: ' + stockInsumos[insumo].toFixed(2) + ' ' + unidad + '</p>', '❌');
        return;
    }

    stockInsumos[insumo] -= cantidad;

    // Guardar en API
    try {
        await API.insumos.registrarMovimiento({ tipo: 'salida', insumo, cantidad, unidad });
    } catch (error) {
        stockInsumos[insumo] += cantidad; // Revertir
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo registrar: ' + error.message + '</p>', '❌');
        return;
    }

    // Registrar movimiento local
    guardarMovimiento('salida', insumo, cantidad, unidad);

    // Limpiar input y actualizar UI
    document.getElementById(inputId).value = '';
    cargarStockInsumos();
    actualizarHistorial();
}

function guardarMovimiento(tipo, insumo, cantidad, unidad) {
    const movimiento = {
        id: Date.now(),
        tipo: tipo,
        insumo: getNombreInsumo(insumo),
        cantidad: cantidad,
        unidad: unidad,
        fecha: new Date().toISOString(),
        usuario: currentUserName
    };

    movimientosInsumos.unshift(movimiento);
    // Guardar solo los últimos 50 movimientos
    if (movimientosInsumos.length > 50) {
        movimientosInsumos = movimientosInsumos.slice(0, 50);
    }
    // Los movimientos ya se guardaron en la API via registrarMovimiento
}

function getNombreInsumo(key) {
    const nombres = {
        'Agua': 'Agua',
        'SorbatoPotasio': 'Sorbato de Potasio',
        'AcidoLactico': 'Ácido Láctico',
        'AcidoCitrico': 'Ácido Cítrico',
        'Calcio': 'Calcio',
        'AcidoAcetico': 'Ácido Acético',
        'AcidoAscorbico': 'Ácido Ascórbico',
        'BenzoatoPotasio': 'Benzoato de Potasio',
        'SalIndustrial': 'Sal Industrial',
        'Otros': 'Otros Insumos'
    };
    return nombres[key] || key;
}

function actualizarHistorial() {
    const container = document.getElementById('historialMovimientos');

    if (movimientosInsumos.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 1rem;">No hay movimientos registrados</p>';
        return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 0.5rem;">';

    movimientosInsumos.slice(0, 10).forEach(mov => {
        const isIngreso = mov.tipo === 'ingreso';
        const bgColor = isIngreso ? '#f0fdf4' : '#fef2f2';
        const borderColor = isIngreso ? '#16a34a' : '#dc2626';
        const icon = isIngreso ? '↑' : '↓';
        const color = isIngreso ? '#16a34a' : '#dc2626';
        const fecha = new Date(mov.fecha);
        const fechaStr = fecha.toLocaleDateString('es-PE') + ' ' + fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

        html += `
                    <div style="background: ${bgColor}; border-left: 3px solid ${borderColor}; padding: 0.6rem 1rem; border-radius: 0 6px 6px 0; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="color: ${color}; font-weight: 700;">${icon}</span>
                            <strong style="color: #1e293b;">${mov.insumo}</strong>
                            <span style="color: ${color}; font-weight: 600;">${isIngreso ? '+' : '-'}${mov.cantidad} ${mov.unidad}</span>
                        </div>
                        <div style="font-size: 0.75rem; color: #64748b;">
                            ${fechaStr} - ${mov.usuario}
                        </div>
                    </div>
                `;
    });

    html += '</div>';
    container.innerHTML = html;
}



// ========== INSUMOS FUNCTIONS ==========
let insumosData = [];

function openInsumoModal() {
    resetInsumoForm();
    // Set fecha to today
    document.getElementById('insumoFecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('insumoModalOverlay').style.display = 'flex';
}

function closeInsumoModal() {
    document.getElementById('insumoModalOverlay').style.display = 'none';
    resetInsumoForm();
}

function handleInsumoChange() {
    const insumoSelect = document.getElementById('insumoNombre');
    const otroGroup = document.getElementById('insumoOtroGroup');
    const unidadSelect = document.getElementById('insumoUnidad');

    if (insumoSelect.value === 'Otro') {
        otroGroup.style.display = 'block';
    } else {
        otroGroup.style.display = 'none';
    }

    // Auto-set unidad based on insumo
    if (insumoSelect.value === 'Agua') {
        unidadSelect.value = 'm3';
    } else if (['Ácido Láctico', 'Ácido Acético'].includes(insumoSelect.value)) {
        unidadSelect.value = 'Lt';
    } else if (['Sorbato de Potasio', 'Ácido Cítrico', 'Calcio', 'Ácido Ascórbico', 'Benzoato de Potasio', 'Sal Industrial'].includes(insumoSelect.value)) {
        unidadSelect.value = 'Kg';
    }
}

function calcularTotalInsumo() {
    const cantidad = parseFloat(document.getElementById('insumoCantidad').value) || 0;
    const precioUnitario = parseFloat(document.getElementById('insumoPrecioUnitario').value) || 0;
    const total = cantidad * precioUnitario;
    document.getElementById('insumoTotal').value = 'S/' + total.toFixed(2);
}

async function saveInsumo() {
    const nombreSelect = document.getElementById('insumoNombre').value;
    const nombreOtro = document.getElementById('insumoOtroNombre').value;
    const cantidad = parseFloat(document.getElementById('insumoCantidad').value) || 0;
    const precioUnitario = parseFloat(document.getElementById('insumoPrecioUnitario').value) || 0;
    const fecha = document.getElementById('insumoFecha').value;

    // Validation
    if (!nombreSelect) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Seleccione un insumo</p>', '⚠️');
        return;
    }
    if (nombreSelect === 'Otro' && !nombreOtro.trim()) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Especifique el nombre del insumo</p>', '⚠️');
        return;
    }
    if (cantidad <= 0) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese una cantidad válida</p>', '⚠️');
        return;
    }
    if (precioUnitario <= 0) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese un precio unitario válido</p>', '⚠️');
        return;
    }
    if (!fecha) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese la fecha de ingreso</p>', '⚠️');
        return;
    }

    const insumo = {
        id: Date.now(),
        nombre: nombreSelect === 'Otro' ? nombreOtro.trim() : nombreSelect,
        categoria: document.getElementById('insumoCategoria').value,
        unidad: document.getElementById('insumoUnidad').value,
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        total: cantidad * precioUnitario,
        proveedor: document.getElementById('insumoProveedor').value.trim(),
        fecha: fecha,
        factura: document.getElementById('insumoFactura').value.trim(),
        observaciones: document.getElementById('insumoObservaciones').value.trim(),
        fechaRegistro: new Date().toISOString()
    };

    // Guardar en API
    try {
        await API.insumos.create(insumo);
    } catch (error) {
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo guardar el insumo: ' + error.message + '</p>', '❌');
        return;
    }

    insumosData.push(insumo);

    var msgInsumo = '<div style="text-align: center;"><div style="font-size: 2.5rem; margin-bottom: 0.5rem;">✅</div>';
    msgInsumo += '<div style="font-weight: 700; color: #16a34a; margin-bottom: 1rem;">Insumo Registrado</div></div>';
    msgInsumo += '<div style="background: #f8fafc; border-radius: 8px; padding: 1rem;">';
    msgInsumo += '<div style="font-weight: 600;">' + insumo.nombre + '</div>';
    msgInsumo += '<div style="color: #64748b;">' + insumo.cantidad + ' ' + insumo.unidad + '</div>';
    msgInsumo += '<div style="color: #16a34a; font-weight: 600; margin-top: 0.5rem;">Total: S/' + insumo.total.toFixed(2) + '</div>';
    msgInsumo += '</div>';
    mostrarModalInfo('Insumo Registrado', msgInsumo, '📦');

    renderInsumosTable();
    closeInsumoModal();
}

function resetInsumoForm() {
    document.getElementById('insumoNombre').value = '';
    document.getElementById('insumoOtroNombre').value = '';
    document.getElementById('insumoCategoria').value = 'salmuera';
    document.getElementById('insumoUnidad').value = 'Kg';
    document.getElementById('insumoCantidad').value = '';
    document.getElementById('insumoPrecioUnitario').value = '';
    document.getElementById('insumoTotal').value = 'S/0.00';
    document.getElementById('insumoProveedor').value = '';
    document.getElementById('insumoFecha').value = '';
    document.getElementById('insumoFactura').value = '';
    document.getElementById('insumoObservaciones').value = '';
    document.getElementById('insumoOtroGroup').style.display = 'none';
}


// Logout
function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}

// Calculate total Kg from envase (cantidad × kilos) + puchos
function calcularTotalKg() {
    const cantidad = parseFloat(document.getElementById('envase_cantidad').value) || 0;
    const kilos = parseFloat(document.getElementById('envase_kilos').value) || 0;
    const puchos = parseFloat(document.getElementById('envase_puchos').value) || 0;
    const total = (cantidad * kilos) + puchos;

    document.getElementById('cantidad').value = total.toFixed(1);
    document.getElementById('totalKgCalculado').textContent = total.toFixed(1) + ' Kg';
}

// Calculate total transport cost
function calcularTotalTransporte() {
    const viajes = parseFloat(document.getElementById('transporteViajes').value) || 0;
    const costoViaje = parseFloat(document.getElementById('transporteCostoViaje').value) || 0;

    const total = viajes * costoViaje;

    document.getElementById('transporteTotal').value = 'S/' + total.toFixed(2);
}

// Calcular costo del personal de calibración
function calcularCostoPersonal() {
    // Función auxiliar para calcular horas entre dos tiempos
    // Si la hora final es menor y resultaría en más de 12 horas, asume que la hora final es PM
    const calcularHoras = (horaIngreso, horaFinal) => {
        if (!horaIngreso || !horaFinal) return 0;
        let [h1, m1] = horaIngreso.split(':').map(Number);
        let [h2, m2] = horaFinal.split(':').map(Number);

        // Si hora final es menor que hora ingreso y hora final < 12 (formato 12h)
        // Asumir que el usuario quiso decir PM (agregar 12 horas)
        if (h2 < h1 && h2 < 12) {
            h2 += 12; // Convertir a PM (ej: 03:00 -> 15:00)
        }

        let minutos = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (minutos < 0) minutos += 24 * 60; // Solo si realmente cruza medianoche
        return minutos / 60;
    };

    // Función auxiliar para formatear horas (muestra "8 hrs" en vez de "8:00")
    const formatearHoras = (horasDecimales) => {
        const horas = Math.floor(horasDecimales);
        const minutos = Math.round((horasDecimales - horas) * 60);
        if (minutos > 0) {
            return `${horas} hrs ${minutos} min`;
        }
        return `${horas} hrs`;
    };

    // Calcular Varones
    const varonesQty = parseFloat(document.getElementById('varonesQty').value) || 0;
    const varonesHoraHombre = parseFloat(document.getElementById('varonesHoraHombre').value) || 0;
    const varonesHoraIngreso = document.getElementById('varonesHoraIngreso').value;
    const varonesHoraFinal = document.getElementById('varonesHoraFinal').value;
    const varonesTrabajoCorrido = document.getElementById('varonesTrabajoCorrido')?.checked || false;
    let varonesHorasTrabajadas = calcularHoras(varonesHoraIngreso, varonesHoraFinal);

    // Descontar 1 hora de almuerzo si NO es trabajo corrido y jornada > 5 horas
    if (!varonesTrabajoCorrido && varonesHorasTrabajadas > 5) {
        varonesHorasTrabajadas -= 1;
    }

    const varonesCosto = varonesQty * varonesHoraHombre * varonesHorasTrabajadas;

    document.getElementById('varonesHorasTrabajadas').value = formatearHoras(varonesHorasTrabajadas);
    document.getElementById('varonesCostoTotal').value = 'S/' + varonesCosto.toFixed(2);

    // Calcular Mujeres
    const mujeresQty = parseFloat(document.getElementById('mujeresQty').value) || 0;
    const mujeresHoraHombre = parseFloat(document.getElementById('mujeresHoraHombre').value) || 0;
    const mujeresHoraIngreso = document.getElementById('mujeresHoraIngreso').value;
    const mujeresHoraFinal = document.getElementById('mujeresHoraFinal').value;
    const mujeresTrabajoCorrido = document.getElementById('mujeresTrabajoCorrido')?.checked || false;
    let mujeresHorasTrabajadas = calcularHoras(mujeresHoraIngreso, mujeresHoraFinal);

    // Descontar 1 hora de almuerzo si NO es trabajo corrido y jornada > 5 horas
    if (!mujeresTrabajoCorrido && mujeresHorasTrabajadas > 5) {
        mujeresHorasTrabajadas -= 1;
    }

    const mujeresCosto = mujeresQty * mujeresHoraHombre * mujeresHorasTrabajadas;

    document.getElementById('mujeresHorasTrabajadas').value = formatearHoras(mujeresHorasTrabajadas);
    document.getElementById('mujeresCostoTotal').value = 'S/' + mujeresCosto.toFixed(2);

    // Calcular Traspaleadores
    const traspaleadoresQty = parseFloat(document.getElementById('traspaleadoresQty').value) || 0;
    const traspaleadoresCostoDia = parseFloat(document.getElementById('traspaleadoresCostoDia').value) || 0;
    const traspaleadoresDias = parseFloat(document.getElementById('traspaleadoresDias').value) || 1;
    const traspaleadoresCosto = traspaleadoresQty * traspaleadoresCostoDia * traspaleadoresDias;

    document.getElementById('traspaleadoresCostoTotal').value = 'S/' + traspaleadoresCosto.toFixed(2);

    // Total Personal (Varones + Mujeres + Traspaleadores)
    const totalPersonal = varonesCosto + mujeresCosto + traspaleadoresCosto;
    document.getElementById('totalCostoPersonal').textContent = 'S/' + totalPersonal.toFixed(2);
}

// ========== SISTEMA DE TURNOS ==========

// Cambiar entre tabs de turnos
function cambiarTurno(turno) {
    // Ocultar todos los contenidos
    document.getElementById('turnoMananaContent').style.display = 'none';
    document.getElementById('turnoTardeContent').style.display = 'none';
    document.getElementById('turnoNocheContent').style.display = 'none';

    // Resetear estilos de tabs
    document.getElementById('tabTurnoManana').style.background = '#e2e8f0';
    document.getElementById('tabTurnoManana').style.color = '#64748b';
    document.getElementById('tabTurnoTarde').style.background = '#e2e8f0';
    document.getElementById('tabTurnoTarde').style.color = '#64748b';
    document.getElementById('tabTurnoNoche').style.background = '#e2e8f0';
    document.getElementById('tabTurnoNoche').style.color = '#64748b';

    // Mostrar contenido seleccionado y activar tab
    if (turno === 'manana') {
        document.getElementById('turnoMananaContent').style.display = 'block';
        document.getElementById('tabTurnoManana').style.background = 'linear-gradient(135deg, #fbbf24, #f59e0b)';
        document.getElementById('tabTurnoManana').style.color = 'white';
    } else if (turno === 'tarde') {
        document.getElementById('turnoTardeContent').style.display = 'block';
        document.getElementById('tabTurnoTarde').style.background = 'linear-gradient(135deg, #fb923c, #ea580c)';
        document.getElementById('tabTurnoTarde').style.color = 'white';
    } else if (turno === 'noche') {
        document.getElementById('turnoNocheContent').style.display = 'block';
        document.getElementById('tabTurnoNoche').style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
        document.getElementById('tabTurnoNoche').style.color = 'white';
    }
}

// --- Sistema de Pestañas para Personal de Calibración ---
let personalDataMap = {}; // Guarda { "YYYY-MM-DD": { turnosData } }
let currentPersonnelDate = null; // Fecha seleccionada actualmente en las pestañas

// Lógica del modal para solicitar fecha (Reemplazo del prompt nativo)
function showDateInputModal() {
    const inputDate = document.getElementById('dateInputField');
    // Default a la fecha general del lote hoy, si existe
    const defaultDate = document.getElementById('fecha')?.value || new Date().toISOString().split('T')[0];
    inputDate.value = defaultDate;

    document.getElementById('dateInputOverlay').classList.add('active');
    inputDate.focus();
}

function closeDateInputModal() {
    document.getElementById('dateInputOverlay').classList.remove('active');
}

function confirmDateInput() {
    const selectedDate = document.getElementById('dateInputField').value;
    if (!selectedDate) {
        showToast('Atención', 'Por favor, selecciona una fecha válida.', 'error');
        return;
    }
    closeDateInputModal();
    agregarNuevaFechaPersonal(selectedDate);
}

// Función para agregar una nueva fecha desde el botón (+) o modal
function agregarNuevaFechaPersonal(fechaPredefinida = null) {
    let nuevaFecha = fechaPredefinida;

    if (!nuevaFecha) {
        // En vez del feo prompt, mostramos el modal moderno
        showDateInputModal();
        return;
    }

    if (personalDataMap[nuevaFecha]) {
        // Si la fecha ya existe, solo la seleccionamos
        switchPersonnelDate(nuevaFecha);
        return;
    }

    // Inicializar datos vacíos para esta fecha
    personalDataMap[nuevaFecha] = {
        varonesManana: {}, mujeresManana: {},
        varonesTarde: {}, mujeresTarde: {},
        varonesNoche: {}, mujeresNoche: {},
        traspaleadores: {}
    };

    renderDateTabs();
    switchPersonnelDate(nuevaFecha);
}

// Renderiza los "rectángulos" de fecha
function renderDateTabs() {
    const container = document.getElementById('personnelDateTabs');
    if (!container) return;

    container.innerHTML = '';
    const fechas = Object.keys(personalDataMap).sort();

    fechas.forEach(fecha => {
        const isActive = (fecha === currentPersonnelDate);
        const tab = document.createElement('div');
        tab.textContent = fecha.split('-').slice(1).reverse().join('/'); // DD/MM
        tab.title = fecha;
        tab.className = 'date-tab';
        if (isActive) tab.classList.add('active');
        tab.onclick = () => switchPersonnelDate(fecha);

        // Botón eliminar fecha
        const delBtn = document.createElement('span');
        delBtn.innerHTML = ' &times;';
        delBtn.style.marginLeft = '5px';
        delBtn.style.cursor = 'pointer';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            showConfirm(
                `Se eliminarán los datos temporales del ${fecha}.`,
                () => {
                    delete personalDataMap[fecha];
                    if (currentPersonnelDate === fecha) {
                        currentPersonnelDate = Object.keys(personalDataMap)[0] || null;
                    }
                    renderDateTabs();
                    if (currentPersonnelDate) switchPersonnelDate(currentPersonnelDate);
                    else clearPersonnelInputs();

                    showToast('Eliminada', `La fecha ${fecha} ha sido removida.`, 'info');
                },
                '¿Eliminar fecha?'
            );
        };
        tab.appendChild(delBtn);
        container.appendChild(tab);
    });
}

// Cambia la fecha activa y carga sus datos en los inputs
function switchPersonnelDate(nuevaFecha) {
    if (currentPersonnelDate && personalDataMap[currentPersonnelDate]) {
        saveCurrentDateToMap();
    }
    currentPersonnelDate = nuevaFecha;
    renderDateTabs();
    const data = personalDataMap[nuevaFecha];
    if (data) fillPersonnelInputs(data);
    else clearPersonnelInputs();
    calcularCostoPersonalTurnos();
}

// Guarda lo que hay en los inputs en el mapa para la fecha actual
function saveCurrentDateToMap() {
    if (!currentPersonnelDate) return;
    const blocks = document.querySelectorAll('.personnel-block-fixed');
    const data = {};
    blocks.forEach(block => {
        const tipo = block.dataset.tipo;
        const turno = block.dataset.turno;
        const key = tipo + (tipo === 'traspaleadores' ? '' : turno.charAt(0).toUpperCase() + turno.slice(1));
        data[key] = {
            cantidad: block.querySelector('.p-qty')?.value || "",
            costoHora: block.querySelector('.p-costo')?.value || "",
            horaIngreso: block.querySelector('.p-ingreso')?.value || "",
            horaFinal: block.querySelector('.p-salida')?.value || "",
            incluyeAlmuerzo: block.querySelector('.p-corrido')?.checked || false,
            horasTrabajadas: block.querySelector('.p-ht')?.value || ""
        };
    });
    personalDataMap[currentPersonnelDate] = data;
}

// Llena los inputs con datos del mapa
function fillPersonnelInputs(data) {
    const blocks = document.querySelectorAll('.personnel-block-fixed');
    blocks.forEach(block => {
        const tipo = block.dataset.tipo;
        const turno = block.dataset.turno;
        const key = tipo + (tipo === 'traspaleadores' ? '' : turno.charAt(0).toUpperCase() + turno.slice(1));
        const item = data[key] || {};
        if (block.querySelector('.p-qty')) block.querySelector('.p-qty').value = item.cantidad || "";
        if (block.querySelector('.p-costo')) block.querySelector('.p-costo').value = item.costoHora || "";
        if (block.querySelector('.p-ingreso')) block.querySelector('.p-ingreso').value = item.horaIngreso || "";
        if (block.querySelector('.p-salida')) block.querySelector('.p-salida').value = item.horaFinal || "";
        if (block.querySelector('.p-corrido')) block.querySelector('.p-corrido').checked = item.incluyeAlmuerzo || false;
        if (block.querySelector('.p-ht')) block.querySelector('.p-ht').value = item.horasTrabajadas || "";
    });
}

function clearPersonnelInputs() {
    const inputs = document.querySelectorAll('.personnel-block-fixed input');
    inputs.forEach(input => {
        if (input.type === 'checkbox') input.checked = false;
        else input.value = "";
    });
}

// Contador para IDs únicos de filas de personal
let personalRowsCounter = 0;

// Calcular costo del personal por turnos (Versión para Pestañas de Fecha)
function calcularCostoPersonalTurnos() {
    const calcularHoras = (horaIngreso, horaFinal, turno = '') => {
        if (!horaIngreso || !horaFinal) return 0;
        let [h1, m1] = horaIngreso.split(':').map(Number);
        let [h2, m2] = horaFinal.split(':').map(Number);
        if (turno === 'tarde' && h2 < 12 && h2 < h1) h2 += 12;
        else if (turno === 'noche' && h1 < 12 && h1 >= 1) h1 += 12;
        let minutos = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (minutos < 0) minutos += 24 * 60;
        return minutos / 60;
    };

    const formatearHoras = (horasDecimales) => {
        const horas = Math.floor(horasDecimales);
        const minutos = Math.round((horasDecimales - horas) * 60);
        return minutos > 0 ? `${horas}h ${minutos}m` : `${horas}h`;
    };

    // 1. Sincronizar fecha actual al mapa antes de calcular totales globales
    if (currentPersonnelDate) {
        saveCurrentDateToMap();
    }

    // 2. Calcular totales globales recorriendo el mapa
    let totalManana = 0, totalTarde = 0, totalNoche = 0, totalTrasp = 0;

    // Auxiliar para cálculos de la fecha VISIBLE
    const blocks = document.querySelectorAll('.personnel-block-fixed');
    let subtotalVisibleManana = 0, subtotalVisibleTarde = 0, subtotalVisibleNoche = 0, subtotalVisibleTrasp = 0;

    blocks.forEach(block => {
        const tipo = block.dataset.tipo;
        const turno = block.dataset.turno;
        const isTrasp = (tipo === 'traspaleadores');

        const qty = parseFloat(block.querySelector('.p-qty')?.value) || 0;
        const costoHora = parseFloat(block.querySelector('.p-costo')?.value) || 0;
        let horas = 0;

        if (!isTrasp) {
            horas = calcularHoras(block.querySelector('.p-ingreso').value, block.querySelector('.p-salida').value, turno);
            if (!block.querySelector('.p-corrido').checked && horas > 5) horas -= 1;
            if (block.querySelector('.p-ht')) block.querySelector('.p-ht').value = formatearHoras(horas);
        } else {
            horas = parseFloat(block.querySelector('.p-ht').value) || 0;
        }

        const subtotal = qty * costoHora * horas;
        if (block.querySelector('.p-total')) block.querySelector('.p-total').value = 'S/' + subtotal.toFixed(2);

        if (isTrasp) subtotalVisibleTrasp += subtotal;
        else if (turno === 'manana') subtotalVisibleManana += subtotal;
        else if (turno === 'tarde') subtotalVisibleTarde += subtotal;
        else if (turno === 'noche') subtotalVisibleNoche += subtotal;
    });

    // Ahora sumamos TODO el mapa para los totales acumulados
    Object.keys(personalDataMap).forEach(fecha => {
        const data = personalDataMap[fecha];
        Object.keys(data).forEach(key => {
            const item = data[key];
            const qty = parseFloat(item.cantidad) || 0;
            const costoHora = parseFloat(item.costoHora) || 0;
            let horas = 0;

            if (key !== 'traspaleadores') {
                const turno = key.includes('Manana') ? 'manana' : (key.includes('Tarde') ? 'tarde' : 'noche');
                horas = calcularHoras(item.horaIngreso, item.horaFinal, turno);
                if (!item.incluyeAlmuerzo && horas > 5) horas -= 1;
            } else {
                horas = parseFloat(item.horasTrabajadas) || 0;
            }

            const subtotal = qty * costoHora * horas;
            if (key.includes('Manana')) totalManana += subtotal;
            else if (key.includes('Tarde')) totalTarde += subtotal;
            else if (key.includes('Noche')) totalNoche += subtotal;
            else if (key === 'traspaleadores') totalTrasp += subtotal;
        });
    });

    // Actualizar subtotales UI de la fecha seleccionada
    if (document.getElementById('totalTurnoManana')) document.getElementById('totalTurnoManana').textContent = 'S/' + subtotalVisibleManana.toFixed(2);
    if (document.getElementById('totalTurnoTarde')) document.getElementById('totalTurnoTarde').textContent = 'S/' + subtotalVisibleTarde.toFixed(2);
    if (document.getElementById('totalTurnoNoche')) document.getElementById('totalTurnoNoche').textContent = 'S/' + subtotalVisibleNoche.toFixed(2);
    if (document.getElementById('traspaleadoresCostoTotal')) document.getElementById('traspaleadoresCostoTotal').value = 'S/' + subtotalVisibleTrasp.toFixed(2);

    // Actualizar resumen TOTAL (Acumulado todas las fechas)
    if (document.getElementById('resumenTurnoManana')) document.getElementById('resumenTurnoManana').textContent = 'S/' + totalManana.toFixed(2);
    if (document.getElementById('resumenTurnoTarde')) document.getElementById('resumenTurnoTarde').textContent = 'S/' + totalTarde.toFixed(2);
    if (document.getElementById('resumenTurnoNoche')) document.getElementById('resumenTurnoNoche').textContent = 'S/' + totalNoche.toFixed(2);
    if (document.getElementById('resumenTraspaleadores')) document.getElementById('resumenTraspaleadores').textContent = 'S/' + totalTrasp.toFixed(2);

    const totalPersonal = totalManana + totalTarde + totalNoche + totalTrasp;
    if (document.getElementById('totalCostoPersonal')) document.getElementById('totalCostoPersonal').textContent = 'S/' + totalPersonal.toFixed(2);

    return { totalManana, totalTarde, totalNoche, totalTrasp, total: totalPersonal };
}

// Obtener datos de personal de TODAS las fechas para guardar en DB
function obtenerDatosPersonalTurnos() {
    saveCurrentDateToMap();
    const result = [];

    Object.keys(personalDataMap).forEach(fecha => {
        const data = personalDataMap[fecha];
        Object.keys(data).forEach(key => {
            const item = data[key];
            const qty = parseFloat(item.cantidad) || 0;
            if (qty > 0) {
                const isTrasp = (key === 'traspaleadores');
                let tipo = isTrasp ? 'traspaleadores' : (key.toLowerCase().includes('varones') ? 'varones' : 'mujeres');
                let turno = isTrasp ? 'manana' : (key.includes('Manana') ? 'manana' : (key.includes('Tarde') ? 'tarde' : 'noche'));

                const entry = {
                    turno: turno,
                    tipoPersonal: tipo,
                    fecha: fecha,
                    cantidad: qty,
                    costoHora: parseFloat(item.costoHora) || 0,
                    costoTotal: qty * (parseFloat(item.costoHora) || 0) * (parseFloat(item.horasTrabajadas) || 0)
                };

                if (!isTrasp) {
                    entry.horaIngreso = item.horaIngreso || null;
                    entry.horaFinal = item.horaFinal || null;
                    entry.horasTrabajadas = item.horasTrabajadas || '';
                    entry.incluyeAlmuerzo = item.incluyeAlmuerzo || false;
                } else {
                    entry.horasTrabajadas = (parseFloat(item.horasTrabajadas) || 0) + ' hrs';
                    entry.incluyeAlmuerzo = false;
                }
                result.push(entry);
            }
        });
    });
    return result;
}

// Cargar datos de la DB al mapa (para edición)
function cargarPersonalTurnos(personalTurnos) {
    personalDataMap = {};
    if (!personalTurnos || !Array.isArray(personalTurnos)) return;

    personalTurnos.forEach(t => {
        const fecha = t.fecha ? t.fecha.split('T')[0] : (document.getElementById('fecha')?.value || new Date().toISOString().split('T')[0]);
        if (!personalDataMap[fecha]) {
            personalDataMap[fecha] = {
                varonesManana: {}, mujeresManana: {},
                varonesTarde: {}, mujeresTarde: {},
                varonesNoche: {}, mujeresNoche: {},
                traspaleadores: {}
            };
        }

        let key = t.tipoPersonal === 'traspaleadores' ? 'traspaleadores' :
            (t.tipoPersonal + (t.turno.charAt(0).toUpperCase() + t.turno.slice(1)));

        personalDataMap[fecha][key] = {
            cantidad: t.cantidad,
            costoHora: t.costoHora,
            horaIngreso: t.horaIngreso,
            horaFinal: t.horaFinal,
            incluyeAlmuerzo: t.incluyeAlmuerzo,
            horasTrabajadas: t.horasTrabajadas?.toString().replace(' hrs', '') || ""
        };
    });

    const fechas = Object.keys(personalDataMap).sort();
    if (fechas.length > 0) {
        currentPersonnelDate = fechas[0];
        renderDateTabs();
        fillPersonnelInputs(personalDataMap[currentPersonnelDate]);
    }
    calcularCostoPersonalTurnos();
}

// Contador para IDs únicos de otros gastos
let otrosGastosCounter = 0;

// Agregar un nuevo gasto
function agregarOtroGasto() {
    const container = document.getElementById('otrosGastosContainer');
    const noMessage = document.getElementById('noOtrosGastos');
    const totalRow = document.getElementById('totalOtrosGastosRow');

    otrosGastosCounter++;
    const gastoId = 'otroGasto_' + otrosGastosCounter;

    const gastoHTML = `
                <div id="${gastoId}" class="otro-gasto-item" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;">
                    <input type="text" placeholder="Descripción del gasto" 
                        style="flex: 2; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem;">
                    <div style="display: flex; align-items: center; gap: 0.3rem;">
                        <span style="color: #3d4f31; font-weight: 600;">S/</span>
                        <input type="number" placeholder="0.00" step="0.01" min="0" 
                            style="width: 90px; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem; font-weight: 600;"
                            oninput="calcularTotalOtrosGastos()">
                    </div>
                    <button type="button" onclick="eliminarOtroGasto('${gastoId}')"
                        style="padding: 0.4rem 0.6rem; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.75rem;">
                        ✕
                    </button>
                </div>
            `;

    container.insertAdjacentHTML('beforeend', gastoHTML);
    noMessage.style.display = 'none';
    totalRow.style.display = 'flex';
    calcularTotalOtrosGastos();
}

// Eliminar un gasto
function eliminarOtroGasto(gastoId) {
    const elemento = document.getElementById(gastoId);
    if (elemento) {
        elemento.remove();
        calcularTotalOtrosGastos();

        const container = document.getElementById('otrosGastosContainer');
        if (container.children.length === 0) {
            document.getElementById('noOtrosGastos').style.display = 'block';
            document.getElementById('totalOtrosGastosRow').style.display = 'none';
        }
    }
}

// Calcular total de otros gastos
function calcularTotalOtrosGastos() {
    const container = document.getElementById('otrosGastosContainer');
    const inputs = container.querySelectorAll('input[type="number"]');
    let total = 0;

    inputs.forEach(input => {
        total += parseFloat(input.value) || 0;
    });

    document.getElementById('totalOtrosGastos').textContent = 'S/' + total.toFixed(2);
    return total;
}

// Obtener datos de otros gastos para guardar
function getOtrosGastosData() {
    const container = document.getElementById('otrosGastosContainer');
    const items = container.querySelectorAll('.otro-gasto-item');
    const gastos = [];

    items.forEach(item => {
        const descripcion = item.querySelector('input[type="text"]').value;
        const monto = parseFloat(item.querySelector('input[type="number"]').value) || 0;
        if (descripcion || monto > 0) {
            gastos.push({ descripcion, monto });
        }
    });

    return gastos;
}

// Calcular costo total de salmuera
function calcularCostoSalmuera() {
    let total = 0;

    // Agua
    const aguaCant = parseFloat(document.getElementById('salmueraAgua')?.value) || 0;
    const aguaPrecio = parseFloat(document.getElementById('salmueraAguaPrecio')?.value) || 0;
    const aguaSubtotal = aguaCant * aguaPrecio;
    const aguaSubtotalEl = document.getElementById('salmueraAguaSubtotal');
    if (aguaSubtotalEl) aguaSubtotalEl.value = 'S/' + aguaSubtotal.toFixed(2);
    total += aguaSubtotal;

    // Sorbato de Potasio
    const sorbatoCant = parseFloat(document.getElementById('sorbatoPotasio')?.value) || 0;
    const sorbatoPrecio = parseFloat(document.getElementById('sorbatoPotasioPrecio')?.value) || 0;
    const sorbatoSubtotal = sorbatoCant * sorbatoPrecio;
    const sorbatoSubtotalEl = document.getElementById('sorbatoPotasioSubtotal');
    if (sorbatoSubtotalEl) sorbatoSubtotalEl.value = 'S/' + sorbatoSubtotal.toFixed(2);
    total += sorbatoSubtotal;

    // Ácido Láctico
    const lacticoCant = parseFloat(document.getElementById('acidoLactico')?.value) || 0;
    const lacticoPrecio = parseFloat(document.getElementById('acidoLacticoPrecio')?.value) || 0;
    const lacticoSubtotal = lacticoCant * lacticoPrecio;
    const lacticoSubtotalEl = document.getElementById('acidoLacticoSubtotal');
    if (lacticoSubtotalEl) lacticoSubtotalEl.value = 'S/' + lacticoSubtotal.toFixed(2);
    total += lacticoSubtotal;

    // Ácido Cítrico
    const citricoCant = parseFloat(document.getElementById('acidoCitrico')?.value) || 0;
    const citricoPrecio = parseFloat(document.getElementById('acidoCitricoPrecio')?.value) || 0;
    const citricoSubtotal = citricoCant * citricoPrecio;
    const citricoSubtotalEl = document.getElementById('acidoCitricoSubtotal');
    if (citricoSubtotalEl) citricoSubtotalEl.value = 'S/' + citricoSubtotal.toFixed(2);
    total += citricoSubtotal;

    // Calcio
    const calcioCant = parseFloat(document.getElementById('calcio')?.value) || 0;
    const calcioPrecio = parseFloat(document.getElementById('calcioPrecio')?.value) || 0;
    const calcioSubtotal = calcioCant * calcioPrecio;
    const calcioSubtotalEl = document.getElementById('calcioSubtotal');
    if (calcioSubtotalEl) calcioSubtotalEl.value = 'S/' + calcioSubtotal.toFixed(2);
    total += calcioSubtotal;

    // Ácido Acético
    const aceticoCant = parseFloat(document.getElementById('acidoAcetico')?.value) || 0;
    const aceticoPrecio = parseFloat(document.getElementById('acidoAceticoPrecio')?.value) || 0;
    const aceticoSubtotal = aceticoCant * aceticoPrecio;
    const aceticoSubtotalEl = document.getElementById('acidoAceticoSubtotal');
    if (aceticoSubtotalEl) aceticoSubtotalEl.value = 'S/' + aceticoSubtotal.toFixed(2);
    total += aceticoSubtotal;

    // Ácido Ascórbico
    const ascorbicoCant = parseFloat(document.getElementById('acidoAscorbico')?.value) || 0;
    const ascorbicoPrecio = parseFloat(document.getElementById('acidoAscorbicoPrecio')?.value) || 0;
    const ascorbicoSubtotal = ascorbicoCant * ascorbicoPrecio;
    const ascorbicoSubtotalEl = document.getElementById('acidoAscorbicoSubtotal');
    if (ascorbicoSubtotalEl) ascorbicoSubtotalEl.value = 'S/' + ascorbicoSubtotal.toFixed(2);
    total += ascorbicoSubtotal;

    // Benzoato de Potasio
    const benzoatoCant = parseFloat(document.getElementById('benzoatoPotasio')?.value) || 0;
    const benzoatoPrecio = parseFloat(document.getElementById('benzoatoPotasioPrecio')?.value) || 0;
    const benzoatoSubtotal = benzoatoCant * benzoatoPrecio;
    const benzoatoSubtotalEl = document.getElementById('benzoatoPotasioSubtotal');
    if (benzoatoSubtotalEl) benzoatoSubtotalEl.value = 'S/' + benzoatoSubtotal.toFixed(2);
    total += benzoatoSubtotal;

    // Otros costos
    const otrosCosto = parseFloat(document.getElementById('salmueraOtrosCosto')?.value) || 0;
    total += otrosCosto;

    // Actualizar total
    document.getElementById('totalCostoSalmuera').textContent = 'S/' + total.toFixed(2);
    return total;
}

// Toggle envase fields visibility
function toggleEnvaseFields() {
    const tipoEnvase = document.getElementById('tipoEnvase').value;
    const container = document.getElementById('envaseFieldsContainer');

    if (tipoEnvase) {
        container.style.display = 'block';

        // Si es Bidones de Exportación, actualizar los calibres existentes
        if (tipoEnvase === 'bidones') {
            calibresLote.forEach(calibre => {
                const kilosInput = document.getElementById('calibre_kilos_' + calibre.id);
                if (kilosInput && !kilosInput.value) {
                    // Solo rellenar si está vacío
                    kilosInput.value = '60';
                    kilosInput.placeholder = '60';
                }
            });
            actualizarTotalCalibres();
        }
    } else {
        container.style.display = 'none';
        document.getElementById('envase_cantidad').value = '';
        document.getElementById('envase_kilos').value = '';
        document.getElementById('envase_puchos').value = '';
        calcularTotalKg();
    }
}

// Lista de calibres estándar (ordenados)
const CALIBRES_ESTANDAR = [
    '70-90', '90-110', '110-130', '130-150', '150-180', '180-200',
    '200-240', '240-280', '280-320', '320-360', '360-400', '400-500', '500+'
];

// Lista de calibres personalizados (se agregan dinámicamente)
let calibresPersonalizados = [];

// Array para almacenar los calibres del lote
let calibresLote = [];
let calibreIdCounter = 0;

// Agregar nuevo calibre al lote
function agregarCalibre(calibrePreseleccionado = '') {
    calibreIdCounter++;
    const calibreId = calibreIdCounter;

    // Obtener todos los calibres disponibles
    const todosCalibres = [...CALIBRES_ESTANDAR, ...calibresPersonalizados];

    // Determinar si es Bidones de Exportación para prellenar 60kg
    const tipoEnvase = document.getElementById('tipoEnvase').value;
    const esBidones = tipoEnvase === 'bidones' || selectedDestination === 'exportacion';
    const kilosPorDefecto = esBidones ? '60' : '';

    // Campo de precio solo visible para admin
    const precioCampoHTML = puedeVerPrecios() ? `
                <div class="form-group">
                    <label class="form-label">Precio S/Kg</label>
                    <input type="number" class="form-input" id="calibre_precio_${calibreId}" placeholder="0.00" step="0.01" oninput="actualizarTotalCalibres()">
                </div>
            ` : '';

    const valorTotalHTML = puedeVerPrecios() ? `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed #e2e8f0;">
                    <span style="color: #64748b; font-size: 0.85rem;">Valor Total:</span>
                    <strong id="calibre_valor_${calibreId}" style="color: #16a34a; font-size: 1rem;">S/0.00</strong>
                </div>
            ` : '';

    const calibreHTML = `
                <div class="calibre-item" id="calibre-${calibreId}" style="padding: 1rem; background: #fff; border: 2px solid #e2e8f0; border-radius: 10px; position: relative;">
                    <button type="button" onclick="eliminarCalibre(${calibreId})" style="position: absolute; top: 0.5rem; right: 0.5rem; background: #ef4444; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 1rem; line-height: 1;">×</button>
                    
                    <div class="form-grid" style="margin-bottom: 0.8rem;">
                        <div class="form-group">
                            <label class="form-label">Calibre</label>
                            <select class="form-select" id="calibre_select_${calibreId}" onchange="actualizarTotalCalibres()">
                                <option value="">Seleccionar...</option>
                                ${todosCalibres.map(c => `<option value="${c}"${c === calibrePreseleccionado ? ' selected' : ''}>${c}</option>`).join('')}
                            </select>
                        </div>
                        ${precioCampoHTML}
                    </div>
                    
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Cant. Bidones</label>
                            <input type="number" class="form-input" id="calibre_bidones_${calibreId}" placeholder="0" oninput="actualizarTotalCalibres()">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Kg por Bidon${esBidones ? ' (60kg)' : ''}</label>
                            <input type="number" class="form-input" id="calibre_kilos_${calibreId}" placeholder="${esBidones ? '60' : '0'}" value="${kilosPorDefecto}" step="0.1" oninput="actualizarTotalCalibres()">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Puchos (Kg)</label>
                            <input type="number" class="form-input" id="calibre_sobras_${calibreId}" placeholder="0" step="0.1" oninput="actualizarTotalCalibres()">
                        </div>
                    </div>
                    
                    <div style="margin-top: 0.5rem; text-align: right; font-size: 0.9rem;">
                        <span style="color: #64748b;">Subtotal:</span>
                        <strong id="calibre_subtotal_${calibreId}" style="color: #3d4f31;">0 Kg</strong>
                    </div>
                    ${valorTotalHTML}
                </div>
            `;

    document.getElementById('calibresLista').insertAdjacentHTML('beforeend', calibreHTML);
    calibresLote.push({ id: calibreId });
    actualizarTotalCalibres();
}

// Llenado rápido de calibres
function llenadoRapidoCalibres() {
    const desde = document.getElementById('llenadoDesde').value;
    const hasta = document.getElementById('llenadoHasta').value;

    const todosCalibres = [...CALIBRES_ESTANDAR, ...calibresPersonalizados];
    const startIdx = todosCalibres.indexOf(desde);
    const endIdx = todosCalibres.indexOf(hasta);

    if (startIdx === -1 || endIdx === -1) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Seleccione calibres válidos</p>', '⚠️');
        return;
    }

    if (startIdx > endIdx) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">El calibre inicial debe ser menor o igual al final</p>', '⚠️');
        return;
    }

    // Limpiar calibres existentes
    limpiarTodosCalibres();

    // Agregar calibres en el rango
    for (let i = startIdx; i <= endIdx; i++) {
        agregarCalibre(todosCalibres[i]);
    }
}

// Limpiar todos los calibres
function limpiarTodosCalibres() {
    document.getElementById('calibresLista').innerHTML = '';
    calibresLote = [];
    calibreIdCounter = 0;
    actualizarTotalCalibres();
}

// Agregar calibre personalizado a la lista
function agregarCalibrePersonalizado() {
    const input = document.getElementById('calibrePersonalizado');
    const valor = input.value.trim();

    if (!valor) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Ingrese un valor para el calibre personalizado</p>', '⚠️');
        return;
    }

    // Verificar si ya existe
    if (CALIBRES_ESTANDAR.includes(valor) || calibresPersonalizados.includes(valor)) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Este calibre ya existe</p>', '⚠️');
        return;
    }

    // Agregar a la lista de personalizados
    calibresPersonalizados.push(valor);

    // Agregar un calibre con este valor preseleccionado
    agregarCalibre(valor);

    // Limpiar input
    input.value = '';

    // Actualizar los selectores de llenado rápido
    actualizarSelectoresLlenado();
}

// Actualizar los selectores de llenado rápido con calibres personalizados
function actualizarSelectoresLlenado() {
    const todosCalibres = [...CALIBRES_ESTANDAR, ...calibresPersonalizados];
    const desdeSelect = document.getElementById('llenadoDesde');
    const hastaSelect = document.getElementById('llenadoHasta');

    const desdeValor = desdeSelect.value;
    const hastaValor = hastaSelect.value;

    const opciones = todosCalibres.map(c => `<option value="${c}">${c}</option>`).join('');

    desdeSelect.innerHTML = opciones;
    hastaSelect.innerHTML = opciones;

    // Restaurar selección o poner por defecto
    if (todosCalibres.includes(desdeValor)) {
        desdeSelect.value = desdeValor;
    }
    if (todosCalibres.includes(hastaValor)) {
        hastaSelect.value = hastaValor;
    } else {
        hastaSelect.value = todosCalibres[todosCalibres.length - 1];
    }
}

// Eliminar calibre del lote
function eliminarCalibre(calibreId) {
    const elemento = document.getElementById('calibre-' + calibreId);
    if (elemento) {
        elemento.remove();
        calibresLote = calibresLote.filter(c => c.id !== calibreId);
        actualizarTotalCalibres();
    }
}

// Calcular y actualizar totales de todos los calibres
function actualizarTotalCalibres() {
    let totalGeneral = 0;
    let valorTotalGeneral = 0;

    calibresLote.forEach(calibre => {
        const bidonesInput = document.getElementById('calibre_bidones_' + calibre.id);
        const kilosInput = document.getElementById('calibre_kilos_' + calibre.id);
        const sobrasInput = document.getElementById('calibre_sobras_' + calibre.id);
        const precioInput = document.getElementById('calibre_precio_' + calibre.id);

        let bidones = parseFloat(bidonesInput?.value) || 0;
        let kilos = parseFloat(kilosInput?.value) || 60; // Por defecto 60 si no hay
        let sobras = parseFloat(sobrasInput?.value) || 0;
        const precio = parseFloat(precioInput?.value) || 0;

        const subtotal = (bidones * kilos) + sobras;
        const valorTotal = subtotal * precio;

        const subtotalEl = document.getElementById('calibre_subtotal_' + calibre.id);
        if (subtotalEl) {
            subtotalEl.textContent = subtotal.toFixed(1) + ' Kg';
        }

        // Actualizar valor total del calibre (solo si existe el elemento)
        const valorEl = document.getElementById('calibre_valor_' + calibre.id);
        if (valorEl) {
            valorEl.textContent = 'S/' + valorTotal.toFixed(2);
        }

        totalGeneral += subtotal;
        valorTotalGeneral += valorTotal;
    });

    const resumenEl = document.getElementById('totalCalibresResumen');
    if (calibresLote.length > 0) {
        resumenEl.style.display = 'block';
        document.getElementById('totalTodosCalibres').textContent = totalGeneral.toFixed(1) + ' Kg';
    } else {
        resumenEl.style.display = 'none';
    }
}

// Obtener todos los calibres como array
function obtenerCalibresData() {
    const calibresData = [];
    calibresLote.forEach(calibre => {
        const select = document.getElementById('calibre_select_' + calibre.id);
        const bidones = document.getElementById('calibre_bidones_' + calibre.id);
        const kilos = document.getElementById('calibre_kilos_' + calibre.id);
        const sobras = document.getElementById('calibre_sobras_' + calibre.id);
        const precio = document.getElementById('calibre_precio_' + calibre.id);

        if (select && select.value) {
            const bidonesVal = parseFloat(bidones?.value) || 0;
            const kilosVal = parseFloat(kilos?.value) || 0;
            const sobrasVal = parseFloat(sobras?.value) || 0;
            const precioVal = parseFloat(precio?.value) || 0;
            const subtotal = (bidonesVal * kilosVal) + sobrasVal;
            const valorTotal = subtotal * precioVal;

            calibresData.push({
                calibre: select.value,
                bidones: bidonesVal,
                kilosPorBidon: kilosVal,
                sobras: sobrasVal,
                subtotal: subtotal,
                precio: precioVal,
                valorTotal: valorTotal
            });
        }
    });
    return calibresData;
}

// Cargar calibres existentes en el formulario
function cargarCalibres(calibresArray) {
    document.getElementById('calibresLista').innerHTML = '';
    calibresLote = [];
    calibreIdCounter = 0;

    if (calibresArray && calibresArray.length > 0) {
        calibresArray.forEach(calibreData => {
            // Si el calibre no existe en estándar ni personalizado, agregarlo
            const calibreValor = calibreData.calibre || '';
            if (calibreValor && !CALIBRES_ESTANDAR.includes(calibreValor) && !calibresPersonalizados.includes(calibreValor)) {
                calibresPersonalizados.push(calibreValor);
            }

            agregarCalibre(calibreValor);
            const lastId = calibreIdCounter;

            document.getElementById('calibre_bidones_' + lastId).value = calibreData.bidones || '';
            document.getElementById('calibre_kilos_' + lastId).value = calibreData.kilosPorBidon || '';
            document.getElementById('calibre_sobras_' + lastId).value = calibreData.sobras || '';

            // Cargar precio si existe el campo (solo admin)
            const precioField = document.getElementById('calibre_precio_' + lastId);
            if (precioField && calibreData.precio) {
                precioField.value = calibreData.precio;
            }
        });
        actualizarTotalCalibres();
        actualizarSelectoresLlenado();
    }
}

// Section navigation
async function showSection(section) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });
    document.querySelectorAll('.section-container').forEach(container => {
        container.classList.remove('active');
    });
    document.getElementById('section-' + section).classList.add('active');

    // Inicializaciones específicas por sección
    if (section === 'record') {
        // Forzar recarga completa para asegurar que aparezcan años nuevos (como 2026)
        if (typeof refreshRecordData === 'function') {
            await refreshRecordData();
        } else {
            renderRecordHistorico();
        }
    } else if (section === 'reportes') {
        if (typeof renderReportes === 'function') renderReportes();
    }
}

// Modal functions
function openModal() {
    document.getElementById('modalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    resetForm();
}

function closeModal() {
    // Mostrar confirmación antes de cerrar
    document.getElementById('closeConfirmOverlay').classList.add('active');
}

function cerrarFormulas() {
    document.getElementById('modalFormulas').classList.remove('active');
}

/**
 * Muestra un reporte detallado del inventario actual
 * Fusiona datos de lotes físicos y puchos en zonas especializadas
 */
async function abrirModalInventarioDetallado() {
    try {
        showToast('Cargando inventario...', 'info', 'Espere');
        const data = await API.reportes.getInventario();

        if (!data || data.error) throw new Error(data.error || 'Error al obtener datos');

        let html = `
            <div id="modalInventarioDetallado" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(10px); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 1.5rem;">
                <div style="background: #f8fafc; border-radius: 30px; width: 100%; max-width: 1100px; height: 90vh; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); display: flex; flex-direction: column; animation: modalPremiumIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);">
                    
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #059669, #065f46); color: white; padding: 1.5rem 2rem; position: relative; flex-shrink: 0;">
                        <button onclick="document.getElementById('modalInventarioDetallado').remove()" style="position: absolute; right: 2rem; top: 1.5rem; background: rgba(255,255,255,0.2); border: none; color: white; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; transition: all 0.3s;">✕</button>
                        <div style="display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div>
                                    <h2 style="margin: 0; font-size: 1.4rem; font-weight: 800; letter-spacing: -0.025em;">Localizador</h2>
                                    <p style="margin: 0; font-size: 0.85rem; opacity: 0.9;">Encuentre calibres y lotes en tiempo real</p>
                                </div>
                            </div>
                            
                            <!-- BARRA DE BÚSQUEDA DEL MODAL -->
                            <div style="flex: 1; min-width: 280px; position: relative; margin-left: 1rem;">
                                <input type="text" id="inputBusquedaInterna" 
                                       onkeyup="ejecutarFiltroInterno()" 
                                       placeholder="Escriba Lote o Calibre para localizar..." 
                                       style="width: 100%; padding: 0.8rem 1rem 0.8rem 1rem; border-radius: 12px; border: none; background: rgba(255,255,255,0.15); color: white; font-weight: 500; font-size: 0.95rem; outline: none; transition: all 0.3s; backdrop-filter: blur(5px); box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);">
                            </div>
                        </div>
                    </div>

                    <!-- Tabs/Navegación -->
                    <div style="display: flex; background: white; border-bottom: 1px solid #e2e8f0; padding: 0 2rem; flex-shrink: 0;">
                        <button onclick="switchTabInventario('fisico')" id="tabInvFisico" style="padding: 1.2rem 2rem; border: none; background: none; font-weight: 700; color: #059669; border-bottom: 4px solid #059669; cursor: pointer; transition: all 0.2s;">📦 Físico (Tanques)</button>
                        <button onclick="switchTabInventario('puchos')" id="tabInvPuchos" style="padding: 1.2rem 2rem; border: none; background: none; font-weight: 700; color: #64748b; border-bottom: 4px solid transparent; cursor: pointer; transition: all 0.2s;">🫒 Zonas de Puchos</button>
                    </div>

                    <!-- Scrollable Content -->
                    <div id="inventarioScrollContent" style="flex: 1; overflow-y: auto; padding: 2rem; background: #f1f5f9;">
                        
                        <!-- Sección Físico -->
                        <div id="contentInvFisico">
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
                                ${data.fisico.length === 0 ? '<p style="text-align:center; grid-column: 1/-1; padding: 3rem; color: #64748b;">No hay lotes físicos registrados</p>' : ''}
                                ${groupInventarioByFila(data.fisico).map(fila => `
                                    <div style="background: white; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                                        <div style="background: #f8fafc; padding: 1rem 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                                            <h4 style="margin: 0; color: #1e293b; font-weight: 800; font-size: 1.1rem;">Fila ${fila.nombre}</h4>
                                            <span style="background: #dcfce7; color: #166534; padding: 0.2rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">${fila.items.length} Lotes</span>
                                        </div>
                                        <div style="padding: 1rem;">
                                            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                                                <thead>
                                                    <tr style="text-align: left; color: #64748b;">
                                                        <th style="padding: 0.5rem;">C.</th>
                                                        <th style="padding: 0.5rem;">Lote</th>
                                                        <th style="padding: 0.5rem;">Calibre</th>
                                                        <th style="padding: 0.5rem; text-align: right;">Total Kg</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${fila.items.map((item, idx) => `
                                                        <tr style="border-top: 1px solid #f1f5f9; ${idx % 2 === 0 ? '' : 'background: #fafafa;'}">
                                                            <td style="padding: 0.8rem 0.5rem; font-weight: 700; color: #059669;">${item.cuadrante}</td>
                                                            <td style="padding: 0.8rem 0.5rem; color: #1e293b;">${item.codigo_lote}</td>
                                                            <td style="padding: 0.8rem 0.5rem; color: #64748b;">${item.calibre}</td>
                                                            <td style="padding: 0.8rem 0.5rem; text-align: right; font-weight: 700; color: #0f172a;">${parseFloat(item.kg).toLocaleString()} Kg</td>
                                                        </tr>
                                                    `).join('')}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Sección Puchos (Oculta por defecto) -->
                        <div id="contentInvPuchos" style="display: none;">
                            <div style="background: white; border-radius: 24px; padding: 1.5rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <thead>
                                        <tr style="text-align: left; background: #f8fafc; color: #64748b; font-size: 0.75rem; text-transform: uppercase;">
                                            <th style="padding: 1rem; border-bottom: 2px solid #e2e8f0;">Ubicación</th>
                                            <th style="padding: 1rem; border-bottom: 2px solid #e2e8f0;">Lote Origen</th>
                                            <th style="padding: 1rem; border-bottom: 2px solid #e2e8f0;">Color</th>
                                            <th style="padding: 1rem; border-bottom: 2px solid #e2e8f0;">Calibre</th>
                                            <th style="padding: 1rem; border-bottom: 2px solid #e2e8f0; text-align: right;">Peso</th>
                                            <th style="padding: 1rem; border-bottom: 2px solid #e2e8f0; text-align: center;">Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.puchos.length === 0 ? '<tr><td colspan="6" style="padding: 3rem; text-align: center; color: #94a3b8;">No hay puchos en stock</td></tr>' : ''}
                                        ${data.puchos.map((p, idx) => `
                                            <tr style="border-bottom: 1px solid #f1f5f9; ${idx % 2 === 0 ? '' : 'background: #fafafa;'}">
                                                <td style="padding: 1rem;">
                                                    <span style="background: #fefce8; color: #854d0e; border: 1px solid #fde047; padding: 0.3rem 0.6rem; border-radius: 8px; font-weight: 700; font-size: 0.8rem;">📍 ${p.fila}-${p.cuadrante}</span>
                                                </td>
                                                <td style="padding: 1rem; font-weight: 500; color: #1e293b;">${p.codigo_lote || 'N/A'}</td>
                                                <td style="padding: 1rem;"><span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${p.color === 'verde' ? '#16a34a' : (p.color === 'negra' ? '#1a1a1a' : '#fbbf24')}; margin-right: 0.5rem;"></span>${capitalize(p.color)}</td>
                                                <td style="padding: 1rem; color: #64748b;">${p.calibre}</td>
                                                <td style="padding: 1rem; text-align: right; font-weight: 900; color: #ea580c; font-size: 1rem;">${parseFloat(p.kg).toFixed(1)} Kg</td>
                                                <td style="padding: 1rem; text-align: center; color: #94a3b8; font-size: 0.8rem;">${formatDate(p.fecha_aporte)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="background: white; padding: 1.5rem 2rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
                        <div style="font-size: 0.9rem; color: #64748b;">
                            Total General en Almacén: <b style="color: #059669; font-size: 1.1rem;">${calcularTotalKilosInv(data).toLocaleString()} Kg</b>
                        </div>
                        <button onclick="document.getElementById('modalInventarioDetallado').remove()" style="padding: 0.8rem 2rem; background: #1e293b; color: white; border: none; border-radius: 12px; font-weight: 700; cursor: pointer;">Cerrar Reporte</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        // Autofocus al buscador
        setTimeout(() => {
            const input = document.getElementById('inputBusquedaInterna');
            if (input) input.focus();
        }, 100);

        // Helper functions locales para el modal
        window.ejecutarFiltroInterno = () => {
            const query = document.getElementById('inputBusquedaInterna').value.toLowerCase().trim();

            // Filtrar Físico (Tarjetas de Filas)
            const cards = document.querySelectorAll('#contentInvFisico > div > div');
            cards.forEach(card => {
                let matches = false;
                const rows = card.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const rowText = row.textContent.toLowerCase();
                    if (rowText.includes(query)) {
                        row.style.display = '';
                        matches = true;
                    } else {
                        row.style.display = 'none';
                    }
                });
                card.style.display = (matches || query === '') ? 'block' : 'none';
            });

            // Filtrar Puchos (Filas de Tabla)
            const puchoRows = document.querySelectorAll('#contentInvPuchos tbody tr');
            puchoRows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        };

        window.switchTabInventario = (tab) => {
            const isFisico = tab === 'fisico';
            document.getElementById('contentInvFisico').style.display = isFisico ? 'block' : 'none';
            document.getElementById('contentInvPuchos').style.display = isFisico ? 'none' : 'block';

            document.getElementById('tabInvFisico').style.color = isFisico ? '#059669' : '#64748b';
            document.getElementById('tabInvFisico').style.borderBottomColor = isFisico ? '#059669' : 'transparent';

            document.getElementById('tabInvPuchos').style.color = !isFisico ? '#059669' : '#64748b';
            document.getElementById('tabInvPuchos').style.borderBottomColor = !isFisico ? '#059669' : 'transparent';
        };

    } catch (error) {
        console.error('Error:', error);
        showToast('Error al cargar inventario: ' + error.message, 'error');
    }
}

function groupInventarioByFila(data) {
    const groups = {};
    data.forEach(item => {
        if (!groups[item.fila]) groups[item.fila] = [];
        groups[item.fila].push(item);
    });
    return Object.keys(groups).sort().map(fila => ({
        nombre: fila,
        items: groups[fila]
    }));
}

function calcularTotalKilosInv(data) {
    const f = data.fisico.reduce((acc, current) => acc + parseFloat(current.kg || 0), 0);
    const p = data.puchos.reduce((acc, current) => acc + parseFloat(current.kg || 0), 0);
    return f + p;
}

function confirmCloseModal() {
    document.getElementById('closeConfirmOverlay').classList.remove('active');
    document.getElementById('modalOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

function closeCloseConfirm() {
    document.getElementById('closeConfirmOverlay').classList.remove('active');
}

// Cerrar modal directamente (sin confirmación) - usado después de guardar
function closeModalDirect() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

function resetForm() {
    selectedColor = '';
    selectedVariety = '';
    selectedProcess = '';
    selectedSubProcess = '';
    selectedDestination = '';
    selectedCaliber = '';
    editingEntryId = null; // Reset editing state

    // Restaurar título y botón a valores por defecto (nueva entrada)
    const tituloModal = document.getElementById('modalEntradaTitulo');
    const btnGuardar = document.getElementById('btnGuardarEntrada');
    if (tituloModal) tituloModal.innerHTML = '🫒 Nueva Entrada de Aceituna';
    if (btnGuardar) btnGuardar.textContent = 'Guardar Entrada';

    document.querySelectorAll('.color-option, .variety-option, .process-btn, .destination-btn, .caliber-option').forEach(el => {
        el.classList.remove('selected');
    });

    document.getElementById('varietySection').classList.remove('active');
    document.getElementById('verdeSalSection').classList.remove('active');
    document.getElementById('calibrationSection').classList.remove('active');
    document.querySelectorAll('.subprocess-section').forEach(el => el.classList.remove('active'));

    // Reset campos básicos
    document.getElementById('codigoLote').value = '';
    document.getElementById('fecha').valueAsDate = new Date();
    document.getElementById('vendedor').value = '';
    document.getElementById('supervisor').value = '';
    document.getElementById('precio').value = '';
    document.getElementById('lugar').value = '';
    document.getElementById('cantidad').value = '';

    // Reset parámetros de calidad
    document.getElementById('acidez').value = '';
    document.getElementById('gradosSal').value = '';
    document.getElementById('ph').value = '';

    // Reset observaciones
    document.getElementById('observaciones').value = '';

    // Reset información de salmuera (cantidades y precios)
    document.getElementById('salmueraAgua').value = '';
    document.getElementById('salmueraAguaPrecio').value = '';
    document.getElementById('salmueraAguaSubtotal').value = '';
    document.getElementById('sorbatoPotasio').value = '';
    document.getElementById('sorbatoPotasioPrecio').value = '';
    document.getElementById('sorbatoPotasioSubtotal').value = '';
    document.getElementById('acidoLactico').value = '';
    document.getElementById('acidoLacticoPrecio').value = '';
    document.getElementById('acidoLacticoSubtotal').value = '';
    document.getElementById('acidoCitrico').value = '';
    document.getElementById('acidoCitricoPrecio').value = '';
    document.getElementById('acidoCitricoSubtotal').value = '';
    document.getElementById('calcio').value = '';
    document.getElementById('calcioPrecio').value = '';
    document.getElementById('calcioSubtotal').value = '';
    document.getElementById('acidoAcetico').value = '';
    document.getElementById('acidoAceticoPrecio').value = '';
    document.getElementById('acidoAceticoSubtotal').value = '';
    document.getElementById('acidoAscorbico').value = '';
    document.getElementById('acidoAscorbicoPrecio').value = '';
    document.getElementById('acidoAscorbicoSubtotal').value = '';
    document.getElementById('benzoatoPotasio').value = '';
    document.getElementById('benzoatoPotasioPrecio').value = '';
    document.getElementById('benzoatoPotasioSubtotal').value = '';
    document.getElementById('salmueraOtros').value = '';
    document.getElementById('salmueraOtrosCosto').value = '';
    document.getElementById('totalCostoSalmuera').textContent = 'S/0.00';

    document.getElementById('fechaCalibracion').value = '';
    document.getElementById('responsableCalibracion').value = '';

    // Reset envase dropdown
    document.getElementById('tipoEnvase').value = '';
    document.getElementById('envase_cantidad').value = '';
    document.getElementById('envase_kilos').value = '';
    document.getElementById('envase_puchos').value = '';
    document.getElementById('envaseFieldsContainer').style.display = 'none';
    document.getElementById('totalKgCalculado').textContent = '0 Kg';

    // Reset transporte
    document.getElementById('transporteConductor').value = '';
    document.getElementById('transporteViajes').value = '';
    document.getElementById('transporteCostoViaje').value = '';
    document.getElementById('transporteTotal').value = '';

    // Reset calibres múltiples
    document.getElementById('calibresLista').innerHTML = '';
    calibresLote = [];
    calibreIdCounter = 0;
    calibresPersonalizados = []; // Limpiar calibres personalizados
    document.getElementById('totalCalibresResumen').style.display = 'none';
    document.getElementById('totalTodosCalibres').textContent = '0 Kg';

    // Limpiar input de calibre personalizado
    const inputPersonalizado = document.getElementById('calibrePersonalizado');
    if (inputPersonalizado) inputPersonalizado.value = '';

    // Resetear selectores de llenado rápido
    actualizarSelectoresLlenado();

    // Reset sección de proceso negro
    const negraSection = document.getElementById('negraProcessSection');
    if (negraSection) {
        negraSection.classList.remove('active');
        negraSection.querySelectorAll('.process-btn').forEach(btn => btn.classList.remove('selected'));
    }

    // Reset Personal de Calibración por Turnos (Sistema Dinámico Multi-Fecha)
    ['varonesManana', 'mujeresManana', 'varonesTarde', 'mujeresTarde', 'varonesNoche', 'mujeresNoche', 'traspaleadores'].forEach(c => {
        const element = document.getElementById(c + 'Container');
        if (element) element.innerHTML = '';
    });
    personalRowsCounter = 0;

    // Reset Total Personal
    const totalCostoPersonal = document.getElementById('totalCostoPersonal');
    if (totalCostoPersonal) totalCostoPersonal.textContent = 'S/0.00';

    // Reset Otros Gastos
    document.getElementById('otrosGastosContainer').innerHTML = '';
    document.getElementById('noOtrosGastos').style.display = 'block';
    document.getElementById('totalOtrosGastosRow').style.display = 'none';
    document.getElementById('totalOtrosGastos').textContent = 'S/0.00';
    otrosGastosCounter = 0;

    // Reset Calibres
}

// Color selection
/**
 * Modal para seleccionar qué calibres del lote se van a asignar a este cuadrante
 */
function mostrarModalSeleccionCalibres(loteDataCompleto, entry, fi, ci, disponibilidad) {
    const cuadranteObj = almacenData.filas[fi].cuadrantes[ci];
    const nombreCuadrante = almacenData.filas[fi].nombre + '-' + cuadranteObj.nombre;

    let html = `
        <div id="modalSeleccionCalibresAsignar" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; justify-content: center; align-items: center; z-index: 9999; padding: 1rem;">
            <div style="background: white; border-radius: 28px; width: 100%; max-width: 550px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); animation: modalPremiumIn 0.3s ease-out;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #1e293b, #0f172a); color: white; padding: 1.5rem; position: relative; border-radius: 28px 28px 0 0;">
                    <button onclick="document.getElementById('modalSeleccionCalibresAsignar').remove()" style="position: absolute; right: 1.5rem; top: 1.5rem; background: rgba(255,255,255,0.1); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;">✕</button>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 48px; height: 48px; background: #3b82f6; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">📦</div>
                        <div>
                            <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700;">Seleccionar Calibres</h3>
                            <p style="margin: 0; font-size: 0.85rem; opacity: 0.8;">Destino: Cuadrante <b>${nombreCuadrante}</b></p>
                        </div>
                    </div>
                </div>

                <div style="padding: 1.5rem; max-height: 60vh; overflow-y: auto;">
                    <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem;">Elija los calibres del lote <b>${loteDataCompleto.codigoLote}</b> que desea guardar en este tanque:</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        ${disponibilidad.map((d, index) => {
        const hasSaldo = d.disponible_kg > 0.05;
        const hasPuchoInZone = d.kg_en_puchos > 0.05;
        const isSelectable = hasSaldo || hasPuchoInZone;

        let statusText = "";
        if (hasSaldo) {
            statusText = `${d.disponible_envases > 0 ? d.disponible_envases + ' Bid. + ' : ''}${d.disponible_pucho.toFixed(1)} Kg`;
        } else if (hasPuchoInZone) {
            statusText = `<span style="color: #f59e0b; font-weight: 600;">En zona de pucho</span>`;
        } else {
            statusText = `<span style="color: #ef4444; font-weight: 600;">Ya asignado por completo</span>`;
        }

        const totalPosible = d.disponible_kg + d.kg_en_puchos;

        return `
                            <div class="caliber-select-item" ${isSelectable ? `onclick="toggleCalibreSelection(${index})"` : ''} id="cal_item_${index}" 
                                 style="padding: 1rem; border: 2px solid ${isSelectable ? '#f1f5f9' : '#fee2e2'}; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; cursor: ${isSelectable ? 'pointer' : 'not-allowed'}; transition: all 0.2s; opacity: ${isSelectable ? '1' : '0.6'}; background: ${isSelectable ? '#fff' : '#f8fafc'};">
                                <div style="display: flex; align-items: center; gap: 1rem;">
                                    <div class="checkbox-ui" style="width: 24px; height: 24px; border: 2px solid ${isSelectable ? '#cbd5e1' : '#f1f5f9'}; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                                        <div class="check-mark" style="width: 12px; height: 12px; background: #3b82f6; border-radius: 2px; display: none;"></div>
                                    </div>
                                    <div>
                                        <span style="display: block; font-weight: 700; color: #1e293b;">${d.calibre}</span>
                                        <span style="font-size: 0.75rem; color: #64748b;">${statusText}</span>
                                        ${hasSaldo && hasPuchoInZone ? `<div style="font-size: 0.65rem; color: #f59e0b;">(+ ${d.kg_en_puchos.toFixed(1)} Kg en zona)</div>` : ''}
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <span style="display: block; font-weight: 700; color: ${isSelectable ? '#3b82f6' : '#94a3b8'};">${totalPosible.toFixed(1)} Kg</span>
                                </div>
                                <input type="checkbox" id="chk_cal_${index}" style="display: none;" ${isSelectable ? 'checked' : ''}>
                            </div>`;
    }).join('')}
                    </div>
                </div>

                <!-- Footer -->
                <div style="padding: 1.5rem; background: #f8fafc; display: flex; gap: 1rem;">
                    <button onclick="document.getElementById('modalSeleccionCalibresAsignar').remove()" style="flex: 1; padding: 1rem; border: none; background: #e2e8f0; color: #475569; font-weight: 700; border-radius: 14px; cursor: pointer;">Cancelar</button>
                    <button id="btnConfirmarAsignacionCalibres" style="flex: 2; padding: 1rem; border: none; background: #3b82f6; color: white; font-weight: 700; border-radius: 14px; cursor: pointer; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);">Continuar con Asignación</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);

    // Lógica para manejar la selección visual
    window.toggleCalibreSelection = (index) => {
        const item = document.getElementById(`cal_item_${index}`);
        const chk = document.getElementById(`chk_cal_${index}`);
        const checkMark = item.querySelector('.check-mark');
        const checkboxUi = item.querySelector('.checkbox-ui');

        chk.checked = !chk.checked;
        if (chk.checked) {
            item.style.borderColor = '#3b82f6';
            item.style.background = '#eff6ff';
            checkMark.style.display = 'block';
            checkboxUi.style.borderColor = '#3b82f6';
        } else {
            item.style.borderColor = '#f1f5f9';
            item.style.background = 'white';
            checkMark.style.display = 'none';
            checkboxUi.style.borderColor = '#cbd5e1';
        }
    };

    // Inicializar visualmente como todos seleccionados (solo los disponibles)
    disponibilidad.forEach((d, i) => {
        const item = document.getElementById(`cal_item_${i}`);
        const isSelectable = (d.disponible_kg > 0.05) || (d.kg_en_puchos > 0.05);
        if (isSelectable && item) {
            item.style.borderColor = '#3b82f6';
            item.style.background = '#eff6ff';
            item.querySelector('.check-mark').style.display = 'block';
            item.querySelector('.checkbox-ui').style.borderColor = '#3b82f6';
        }
    });

    // Evento de confirmación
    document.getElementById('btnConfirmarAsignacionCalibres').onclick = () => {
        const seleccionados = [];
        disponibilidad.forEach((d, i) => {
            const chk = document.getElementById(`chk_cal_${i}`);
            if (chk && chk.checked) {
                // Sumamos lo disponible en entrada + lo que está en zona de pucho
                const kgFinal = d.disponible_kg + d.kg_en_puchos;
                const puchoFinal = d.disponible_pucho + d.kg_en_puchos;

                // Mapear al formato esperado por el backend
                seleccionados.push({
                    calibre: d.calibre,
                    kg: kgFinal,
                    cantidad_envases: d.disponible_envases,
                    kilos_por_envase: d.kilos_por_envase,
                    pucho: puchoFinal
                });
            }
        });

        if (seleccionados.length === 0) {
            showToast('Debe seleccionar al menos un calibre.', 'warning', 'Atención');
            return;
        }

        // Crear nuevo loteData solo con los seleccionados
        const loteDataFinal = {
            ...loteDataCompleto,
            calibres: seleccionados
        };

        // Cerrar modal de selección
        document.getElementById('modalSeleccionCalibresAsignar').remove();
        // Ya no llamamos a cerrarModalSeleccionLote() aquí porque se cerró al inicio del flujo

        // NUEVO: Memorizar la selección para que, si hay extracción, no tengamos que volver a elegir
        seleccionEnProgreso = seleccionados.map(c => c.calibre);

        // Ejecutar asignación directamente (sin confirmaciones intermedias)
        seleccionEnProgreso = null;
        ejecutarAsignacionFinal(loteDataFinal);
    };
}

function selectColor(color) {
    selectedColor = color;
    selectedVariety = '';

    document.querySelectorAll('.color-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.color === color);
    });

    const varietySection = document.getElementById('varietySection');
    varietySection.classList.add('active');

    const varietyGrid = document.getElementById('varietyGrid');
    const varieties = varietiesByColor[color] || [];
    varietyGrid.innerHTML = varieties.map(v => `
                <div class="variety-option" data-variety="${v.toLowerCase()}" onclick="selectVariety('${v.toLowerCase()}')">
                    ${v}
                </div>
            `).join('');

    document.getElementById('verdeSalSection').classList.remove('active');

    // Ocultar sección de proceso negra si existe
    const negraSection = document.getElementById('negraProcessSection');
    if (negraSection) {
        negraSection.classList.remove('active');
    }

    // Ocultar sección de calibración
    document.getElementById('calibrationSection').classList.remove('active');
}

// Variety selection
function selectVariety(variety) {
    selectedVariety = variety;

    document.querySelectorAll('.variety-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.variety === variety);
    });

    // Si es Verde y variedad Sal, ir directo a calibración (sin proceso)
    if (selectedColor === 'verde' && variety === 'sal') {
        selectedProcess = '';
        selectedSubProcess = '';
        document.getElementById('verdeSalSection').classList.remove('active');
        const negraSection = document.getElementById('negraProcessSection');
        if (negraSection) negraSection.classList.remove('active');
        document.getElementById('calibrationSection').classList.add('active');
        return;
    }

    // Si es Mulata, ir directo a calibración (no tiene proceso)
    if (selectedColor === 'mulata') {
        selectedProcess = '';
        selectedSubProcess = '';
        document.getElementById('verdeSalSection').classList.remove('active');
        const negraSection = document.getElementById('negraProcessSection');
        if (negraSection) negraSection.classList.remove('active');
        document.getElementById('calibrationSection').classList.add('active');
        return;
    }

    // Si es Negra, mostrar opciones de proceso para negra
    if (selectedColor === 'negra') {
        mostrarProcesoNegra();
        return;
    }

    // Para Verde (no Sal), mostrar sección de proceso verde
    if (selectedColor === 'verde') {
        document.getElementById('verdeSalSection').classList.add('active');
        // Ocultar sección negra si existe
        const negraSection = document.getElementById('negraProcessSection');
        if (negraSection) negraSection.classList.remove('active');
    }
}

// Mostrar opciones de proceso para Negra
function mostrarProcesoNegra() {
    let negraSection = document.getElementById('negraProcessSection');

    // Crear la sección si no existe
    if (!negraSection) {
        const html = `
                    <div class="process-section" id="negraProcessSection">
                        <h4 class="process-title">Tipo de Proceso - ${capitalize(selectedVariety)}</h4>
                        <div class="process-options">
                            <button type="button" class="process-btn" data-negra-process="entera" onclick="selectNegraProcess('entera')">Entera</button>
                            <button type="button" class="process-btn" data-negra-process="rodaja" onclick="selectNegraProcess('rodaja')">Rodaja</button>
                            <button type="button" class="process-btn" data-negra-process="deshuesada" onclick="selectNegraProcess('deshuesada')">Deshuesada</button>
                        </div>
                    </div>
                `;

        // Insertar después de la sección de variedad
        const varietySection = document.getElementById('varietySection');
        varietySection.insertAdjacentHTML('afterend', html);
        negraSection = document.getElementById('negraProcessSection');
    } else {
        // Actualizar título
        negraSection.querySelector('.process-title').textContent = `Tipo de Proceso - ${capitalize(selectedVariety)}`;
        // Resetear selección
        negraSection.querySelectorAll('.process-btn').forEach(btn => btn.classList.remove('selected'));
    }

    negraSection.classList.add('active');
    document.getElementById('verdeSalSection').classList.remove('active');
}

// Selección de proceso para negra (Entera, Rodaja, Deshuesada)
function selectNegraProcess(proceso) {
    selectedProcess = proceso;

    // Actualizar UI
    document.querySelectorAll('#negraProcessSection .process-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.negraProcess === proceso);
    });

    // Mostrar sección de calibración
    document.getElementById('calibrationSection').classList.add('active');
}

// Process selection
function selectProcess(process) {
    selectedProcess = process;
    document.querySelectorAll('#verdeSalSection > .process-options > .process-btn').forEach(el => {
        el.classList.toggle('selected', el.dataset.process === process);
    });

    document.querySelectorAll('.subprocess-section').forEach(el => el.classList.remove('active'));
    document.getElementById('calibrationSection').classList.remove('active');

    if (process === 'entera') {
        document.getElementById('enteraOptions').classList.add('active');
    } else if (process === 'rodaja') {
        document.getElementById('rodajaOptions').classList.add('active');
    } else if (process === 'deshuesada') {
        document.getElementById('deshuesadaOptions').classList.add('active');
    }
}

// Sub-process selection
function selectSubProcess(subprocess) {
    selectedSubProcess = subprocess;
    document.querySelectorAll('.subprocess-section.active .process-btn').forEach(el => {
        el.classList.toggle('selected', el.dataset.subprocess === subprocess);
    });
    document.getElementById('calibrationSection').classList.add('active');
}

// Destination selection
function selectDestination(dest) {
    selectedDestination = dest;
    document.querySelectorAll('.destination-btn').forEach(el => {
        el.classList.toggle('selected', el.dataset.dest === dest);
    });

    // Si es Bidones de Exportación, rellenar Kg por Bidón con 60
    if (dest === 'exportacion') {
        calibresLote.forEach(calibre => {
            const kilosInput = document.getElementById('calibre_kilos_' + calibre.id);
            if (kilosInput && !kilosInput.value) {
                kilosInput.value = '60';
            }
        });
        actualizarTotalCalibres();
    }
}

// Caliber selection
function selectCaliber(caliber) {
    selectedCaliber = caliber;
    document.querySelectorAll('.caliber-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.caliber === caliber);
    });
}

// Save entry (Create or Update) - ahora async para API
async function saveEntry() {
    const personalTurnosData = obtenerDatosPersonalTurnos();
    const entryData = {
        // Código de Lote
        codigoLote: document.getElementById('codigoLote').value,
        fecha: document.getElementById('fecha').value,
        vendedor: document.getElementById('vendedor').value,
        supervisor: document.getElementById('supervisor').value,
        precio: document.getElementById('precio').value,
        lugar: document.getElementById('lugar').value,
        cantidad: document.getElementById('cantidad').value,
        // Parámetros de Calidad
        acidez: document.getElementById('acidez').value,
        gradosSal: document.getElementById('gradosSal').value,
        ph: document.getElementById('ph').value,
        // Tipo de Envase
        tipoEnvase: document.getElementById('tipoEnvase').value,
        envase_cantidad: document.getElementById('envase_cantidad').value,
        envase_kilos: document.getElementById('envase_kilos').value,
        envase_puchos: document.getElementById('envase_puchos').value,
        // Transporte
        transporteConductor: document.getElementById('transporteConductor').value,
        transporteViajes: document.getElementById('transporteViajes').value,
        transporteCostoViaje: document.getElementById('transporteCostoViaje').value,
        transporteTotal: document.getElementById('transporteTotal').value,
        // Observaciones
        observaciones: document.getElementById('observaciones').value,
        // Información de Salmuera con precios
        salmueraAgua: document.getElementById('salmueraAgua').value,
        salmueraAguaPrecio: document.getElementById('salmueraAguaPrecio').value,
        sorbatoPotasio: document.getElementById('sorbatoPotasio').value,
        sorbatoPotasioPrecio: document.getElementById('sorbatoPotasioPrecio').value,
        acidoLactico: document.getElementById('acidoLactico').value,
        acidoLacticoPrecio: document.getElementById('acidoLacticoPrecio').value,
        acidoCitrico: document.getElementById('acidoCitrico').value,
        acidoCitricoPrecio: document.getElementById('acidoCitricoPrecio').value,
        calcio: document.getElementById('calcio').value,
        calcioPrecio: document.getElementById('calcioPrecio').value,
        acidoAcetico: document.getElementById('acidoAcetico').value,
        acidoAceticoPrecio: document.getElementById('acidoAceticoPrecio').value,
        acidoAscorbico: document.getElementById('acidoAscorbico').value,
        acidoAscorbicoPrecio: document.getElementById('acidoAscorbicoPrecio').value,
        benzoatoPotasio: document.getElementById('benzoatoPotasio').value,
        benzoatoPotasioPrecio: document.getElementById('benzoatoPotasioPrecio').value,
        salmueraOtros: document.getElementById('salmueraOtros').value,
        salmueraOtrosCosto: document.getElementById('salmueraOtrosCosto').value,
        totalCostoSalmuera: document.getElementById('totalCostoSalmuera').textContent,
        // Color y Variedad
        color: selectedColor,
        variedad: selectedVariety,
        proceso: selectedProcess,
        subProceso: selectedSubProcess,
        // Calibración
        fechaCalibracion: document.getElementById('fechaCalibracion').value,
        responsableCalibracion: document.getElementById('responsableCalibracion').value,
        destino: 'exportacion',
        // Calibres (múltiples)
        calibres: obtenerCalibresData(),
        // Personal de Calibración por Turnos (nueva estructura multi-fecha)
        personalTurnos: personalTurnosData,
        // Totales de resumen para tabla 'entradas' (compatibilidad)
        varonesQty: personalTurnosData.filter(t => t.tipoPersonal === 'varones').reduce((acc, t) => acc + (parseFloat(t.cantidad) || 0), 0),
        mujeresQty: personalTurnosData.filter(t => t.tipoPersonal === 'mujeres').reduce((acc, t) => acc + (parseFloat(t.cantidad) || 0), 0),
        traspaleadoresQty: personalTurnosData.filter(t => t.tipoPersonal === 'traspaleadores').reduce((acc, t) => acc + (parseFloat(t.cantidad) || 0), 0),
        // Costo Total Personal
        totalCostoPersonal: 'S/' + (personalTurnosData.reduce((acc, t) => acc + (parseFloat(t.costoTotal) || 0), 0)).toFixed(2),
        totalOtrosGastos: document.getElementById('totalOtrosGastos').textContent
    };

    if (!entryData.codigoLote) {
        mostrarModalInfo('Campo Requerido', '<p style="text-align: center; color: #64748b;">Por favor ingrese el Código de Lote</p>', '⚠️');
        document.getElementById('codigoLote').focus();
        return;
    }

    if (!entryData.fecha) {
        mostrarModalInfo('Campo Requerido', '<p style="text-align: center; color: #64748b;">Por favor seleccione la Fecha</p>', '⚠️');
        document.getElementById('fecha').focus();
        return;
    }

    if (!entryData.vendedor) {
        mostrarModalInfo('Campo Requerido', '<p style="text-align: center; color: #64748b;">Por favor ingrese el nombre del Vendedor</p>', '⚠️');
        document.getElementById('vendedor').focus();
        return;
    }

    if (!entryData.supervisor) {
        mostrarModalInfo('Campo Requerido', '<p style="text-align: center; color: #64748b;">Por favor ingrese el nombre del Supervisor</p>', '⚠️');
        document.getElementById('supervisor').focus();
        return;
    }

    if (!entryData.tipoEnvase) {
        mostrarModalInfo('Campo Requerido', '<p style="text-align: center; color: #64748b;">Por favor seleccione el Tipo de Envase</p>', '⚠️');
        document.getElementById('tipoEnvase').focus();
        return;
    }

    if (!entryData.cantidad || parseFloat(entryData.cantidad) <= 0) {
        mostrarModalInfo('Campo Requerido', '<p style="text-align: center; color: #64748b;">Por favor ingrese la Cantidad (debe ser mayor a 0)</p>', '⚠️');
        document.getElementById('envase_cantidad').focus();
        return;
    }

    // Forzar precios a 0 si no es admin para evitar errores de seguridad o inconsistencias
    if (!puedeVerPrecios()) {
        entryData.precio = 0;
        if (entryData.calibres) {
            entryData.calibres.forEach(c => {
                c.precio = 0;
                c.valorTotal = 0;
            });
        }
        entryData.transporteCostoViaje = 0;
        entryData.transporteTotal = 0;
        entryData.totalCostoSalmuera = "S/0.00";
        entryData.totalOtrosGastos = "S/0.00";

        // Si NO puede ver calibración, entonces sí limpiamos personal
        if (!puedeVerCalibracion()) {
            entryData.personalTurnos = null;
            entryData.totalCostoPersonal = "S/0.00";
            entryData.traspaleadoresQty = 0;
            entryData.traspaleadoresCostoDia = 0;
            entryData.traspaleadoresDias = 1;
            entryData.traspaleadoresCostoTotal = "S/0.00";
            entryData.observaciones = "";
        }
        // Nota: Si puedeVerCalibracion(), se enviará el personalTurnos con los IDs de campo que llenó (Qty, Horas, etc.)
        // y los que están ocultos (precios) enviarán su valor por defecto
    }

    if (!selectedColor) {
        mostrarModalInfo('Campo Requerido', '<p style="text-align: center; color: #64748b;">Por favor seleccione el Color de la aceituna</p>', '⚠️');
        return;
    }

    if (!selectedVariety) {
        mostrarModalInfo('Campo Requerido', '<p style="text-align: center; color: #64748b;">Por favor seleccione la Variedad de la aceituna</p>', '⚠️');
        return;
    }

    if (editingEntryId !== null) {
        // Update existing entry via API
        try {
            // Deshabilitar botón para evitar doble click
            const btnGuardar = document.querySelector('.btn-save');
            if (btnGuardar) {
                btnGuardar.disabled = true;
                btnGuardar.textContent = 'Guardando...';
            }

            await API.entradas.update(editingEntryId, entryData);
            await cargarEntradasDesdeAPI(); // Recargar desde BD

            // Sincronizar UI del Almacén por si el lote está asignado
            try {
                await cargarAlmacenDesdeAPI();
                if (typeof initCuadrantes === 'function') initCuadrantes();
            } catch (e) { console.warn('Error refrescando almacén:', e); }

            editingEntryId = null;

            // Mostrar mensaje de éxito
            renderEntries();
            try { filtrarReportes(); } catch (e) { console.warn('Error actualizando reportes:', e); }
            closeModalDirect();
            showToast('Entrada actualizada correctamente', 'success', 'Entrada Actualizada');
            return;
        } catch (error) {
            const btnGuardar = document.querySelector('.btn-save');
            if (btnGuardar) {
                btnGuardar.disabled = false;
                btnGuardar.textContent = 'Guardar Entrada';
            }
            mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo actualizar: ' + error.message + '</p>', '❌');
            return;
        }
    } else {
        // Create new entry via API
        try {
            // Deshabilitar botón para evitar doble click
            const btnGuardar = document.querySelector('.btn-save');
            if (btnGuardar) {
                btnGuardar.disabled = true;
                btnGuardar.textContent = 'Guardando...';
            }

            await API.entradas.create(entryData);
            await cargarEntradasDesdeAPI(); // Recargar desde BD

            // Mostrar mensaje de éxito
            renderEntries();
            try { filtrarReportes(); } catch (e) { console.warn('Error actualizando reportes:', e); }
            closeModalDirect();
            showToast('Entrada guardada correctamente.', 'success', 'Entrada Guardada');
            return;
        } catch (error) {
            const btnGuardar = document.querySelector('.btn-save');
            if (btnGuardar) {
                btnGuardar.disabled = false;
                btnGuardar.textContent = 'Guardar Entrada';
            }

            // Manejar advertencia de código de lote duplicado
            if (error.warning && error.data && error.data.duplicado) {
                const data = error.data;
                const loteInfo = data.loteExistente || {};

                mostrarModalConfirmacion(
                    '⚠️ Código de Lote Duplicado',
                    `<div style="text-align: center;">
                        <p style="color: #dc2626; font-weight: 600; margin-bottom: 1rem;">
                            ${data.error}
                        </p>
                        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
                            <p style="color: #92400e; font-size: 0.9rem; margin: 0;">
                                <strong>Lote existente:</strong><br>
                                Fecha: ${formatDate(loteInfo.fecha) || 'N/A'}<br>
                                Vendedor: ${loteInfo.vendedor || 'N/A'}
                            </p>
                        </div>
                        <p style="color: #64748b; font-size: 0.9rem;">
                            ¿Desea crear una nueva entrada con el mismo código de lote o prefiere ver el registro existente?
                        </p>
                    </div>`,
                    async () => {
                        // Si confirma, crear con flag de confirmación
                        try {
                            entryData.confirmarDuplicado = true;
                            await API.entradas.create(entryData);
                            await cargarEntradasDesdeAPI();
                            renderEntries();
                            try { filtrarReportes(); } catch (e) { console.warn('Error actualizando reportes:', e); }
                            closeModalDirect();
                            showToast('Entrada guardada (código duplicado)', 'warning', 'Entrada Guardada');
                        } catch (createError) {
                            mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo crear: ' + createError.message + '</p>', '❌');
                        }
                    },
                    () => {
                        // Función onCancel - Opcionalmente podemos usarla para navegar al lote
                        if (loteInfo.fecha) {
                            irAloteExistente(loteInfo.fecha);
                        }
                    },
                    '⚠️',
                    'Crear Duplicate',
                    'Localizar Existente'
                );
                return;
            }

            mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo guardar: ' + error.message + '</p>', '❌');
            return;
        }
    }
}

// Pagination and sorting state
let currentPage = 1;
const entriesPerPage = 6;
let currentSort = 'newest';
// Inicializar con la fecha actual
const now_init = new Date();
let currentFilterYear = now_init.getFullYear().toString();
let currentFilterMonth = now_init.getMonth().toString();

function renderEntries() {
    const entriesList = document.getElementById('entriesList');
    const paginationContainer = document.getElementById('paginationContainer');

    // Filtrar entradas por fecha antes de ordenar y paginar
    let filteredEntries = [...entries];

    if (currentFilterYear !== 'all') {
        filteredEntries = filteredEntries.filter(e => {
            if (!e.fecha) return false;
            const year = e.fecha.split('-')[0];
            return year === currentFilterYear;
        });
    }

    if (currentFilterMonth !== 'all') {
        filteredEntries = filteredEntries.filter(e => {
            if (!e.fecha) return false;
            const month = parseInt(e.fecha.split('-')[1]) - 1;
            return month === parseInt(currentFilterMonth);
        });
    }

    if (filteredEntries.length === 0) {
        entriesList.innerHTML = `
                    <div class="no-entries" style="grid-column: 1 / -1;">
                        <div class="no-entries-icon">📭</div>
                        <p>No hay ventas registradas aún</p>
                    </div>
                `;
        paginationContainer.innerHTML = '';
        return;
    }

    // Sort entries based on current sort
    let sortedEntries = [...filteredEntries];
    switch (currentSort) {
        case 'newest':
            sortedEntries.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            break;
        case 'oldest':
            sortedEntries.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            break;
        case 'price-high':
            sortedEntries.sort((a, b) => parseFloat(b.precio || 0) - parseFloat(a.precio || 0));
            break;
        case 'price-low':
            sortedEntries.sort((a, b) => parseFloat(a.precio || 0) - parseFloat(b.precio || 0));
            break;
        case 'weight-high':
            sortedEntries.sort((a, b) => parseFloat(b.cantidad || 0) - parseFloat(a.cantidad || 0));
            break;
        case 'weight-low':
            sortedEntries.sort((a, b) => parseFloat(a.cantidad || 0) - parseFloat(b.cantidad || 0));
            break;
    }

    // Calculate pagination
    const totalPages = Math.ceil(sortedEntries.length / entriesPerPage);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    const paginatedEntries = sortedEntries.slice(startIndex, endIndex);

    entriesList.innerHTML = paginatedEntries.map(entry => `
                <div class="entry-card" data-id="${entry.id}" onclick="viewEntry(${entry.id})" style="cursor: pointer;">
                    <div class="entry-card-header">
                        <span class="color-tag ${entry.color}">${capitalize(entry.color)}</span>
                        <span class="entry-date">${formatDate(entry.fecha)}</span>
                    </div>
                    ${entry.codigoLote ? `
                    <div style="padding: 0.5rem 1.2rem; background: linear-gradient(90deg, #0f172a, #1e293b); color: #4ade80; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.5px;">
                        📦 LOTE: ${entry.codigoLote}
                    </div>
                    ` : ''}
                    <div class="entry-card-body">
                        <div class="entry-field">
                            <span class="entry-field-label">Cliente</span>
                            <span class="entry-field-value">${entry.vendedor}</span>
                        </div>
                        <div class="entry-field">
                            <span class="entry-field-label">Peso</span>
                            <span class="entry-field-value highlight">${entry.cantidad} Kg</span>
                        </div>
                        ${puedeVerPrecios() ? `
                        <div class="entry-field">
                            <span class="entry-field-label">Precio</span>
                            <span class="entry-field-value">S/${entry.precio || '0'}</span>
                        </div>
                        ` : ''}
                        <div class="entry-field">
                            <span class="entry-field-label">Variedad</span>
                            <span class="entry-field-value">${entry.variedad ? capitalize(entry.variedad) : '-'}</span>
                        </div>
                        ${entry.calibres && entry.calibres.length > 0 ? `
                        <div class="entry-field" style="grid-column: 1 / -1;">
                            <span class="entry-field-label">Calibres (${entry.calibres.length})</span>
                            <span class="entry-field-value">${entry.calibres.map(c => c.calibre).join(', ')}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="entry-card-footer" onclick="event.stopPropagation();">
                        <button class="btn-icon view" onclick="viewEntry(${entry.id})" title="Ver Detalle">
                            <svg viewBox="0 0 24 24">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        ${puedeEditarVentas() ? `
                        <button class="btn-icon edit" onclick="editEntry(${entry.id})" title="Editar">
                            <svg viewBox="0 0 24 24">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="btn-icon delete" onclick="showDeleteConfirm(${entry.id})" title="Eliminar">
                            <svg viewBox="0 0 24 24">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');

    // Render pagination
    renderPagination(totalPages);

    // Actualizar selectores temporales si es necesario
    populateTemporalFilters();
}

// Función para poblar los selectores de Año basado en los datos únicos de entries
function populateTemporalFilters() {
    const yearSelect = document.getElementById('filterYear');
    if (!yearSelect) return;

    // Obtener años únicos de las entradas
    const years = new Set();

    // SIEMPRE agregar el año actual para que el filtro tenga sentido
    const currentYear = new Date().getFullYear().toString();
    years.add(currentYear);

    entries.forEach(e => {
        if (e.fecha) {
            // Extraer año directamente del string YYYY-MM-DD
            const year = e.fecha.split('-')[0];
            if (year && year.length === 4) {
                years.add(year);
            }
        }
    });

    // Obtener años ya presentes en el select (excluyendo "all")
    const currentOptions = Array.from(yearSelect.options)
        .map(opt => opt.value)
        .filter(v => v !== 'all');

    // Verificar si hay cambios (años nuevos o faltantes)
    const hasChanges = years.size !== currentOptions.length ||
        Array.from(years).some(y => !currentOptions.includes(y));

    if (hasChanges) {
        const currentValue = yearSelect.value; // Guardar selección actual

        // Limpiar y repoblar
        yearSelect.innerHTML = '<option value="all">Todos</option>';

        const sortedYears = Array.from(years).sort((a, b) => b - a);
        sortedYears.forEach(y => {
            const option = document.createElement('option');
            option.value = y;
            option.textContent = y;
            yearSelect.appendChild(option);
        });

        // Restaurar selección si el año sigue existiendo, sino seleccionar el actual
        if (Array.from(yearSelect.options).some(opt => opt.value === currentValue)) {
            yearSelect.value = currentValue;
        } else {
            yearSelect.value = currentYear;
            currentFilterYear = currentYear;
        }
    }
}

// Función que se dispara al cambiar los selectores de Año o Mes
function filterEntriesByDate() {
    currentFilterYear = document.getElementById('filterYear').value;
    currentFilterMonth = document.getElementById('filterMonth').value;
    currentPage = 1; // Resetear a la primera página
    renderEntries();
}

/**
 * Navega automáticamente al año y mes de una fecha específica
 * Útil para localizar lotes duplicados en meses anteriores
 */
function irAloteExistente(fechaISO) {
    if (!fechaISO) return;
    
    // Extraer YYYY y MM (formato esperado 2026-02...)
    const parts = fechaISO.split('T')[0].split('-');
    const targetYear = parts[0];
    const targetMonth = (parseInt(parts[1]) - 1).toString(); // 0-indexed para match con currentFilterMonth
    
    const yearSelect = document.getElementById('filterYear');
    const monthSelect = document.getElementById('filterMonth');
    
    if (yearSelect && monthSelect) {
        // Actualizar variables globales
        currentFilterYear = targetYear;
        currentFilterMonth = targetMonth;
        
        // Actualizar selectores visuales
        yearSelect.value = targetYear;
        monthSelect.value = targetMonth;
        
        // Resetear página y renderizar
        currentPage = 1;
        renderEntries();
        
        closeModalDirect();
        showToast(`Vista ajustada a ${targetMonth === 'all' ? 'Todos' : parts[1]}/${targetYear}`, 'info', 'Lote Localizado');
    }
}

function renderPagination(totalPages) {
    const paginationContainer = document.getElementById('paginationContainer');

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let paginationHTML = `
                <button class="pagination-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                    ‹ Anterior
                </button>
            `;

    // Show page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHTML += `
                        <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>
                    `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += `<span class="pagination-info">...</span>`;
        }
    }

    paginationHTML += `
                <span class="pagination-info">Página ${currentPage} de ${totalPages}</span>
                <button class="pagination-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                    Siguiente ›
                </button>
            `;

    paginationContainer.innerHTML = paginationHTML;
}

function goToPage(page) {
    const totalPages = Math.ceil(entries.length / entriesPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderEntries();
    }
}

function sortEntries(sortType) {
    if (!sortType) return;

    currentSort = sortType;
    currentPage = 1; // Reset to first page when sorting

    // Update active state for filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.sort === sortType) {
            btn.classList.add('active');
        }
    });

    // Reset dropdowns if using buttons
    if (sortType === 'newest' || sortType === 'oldest') {
        document.querySelectorAll('.filter-select').forEach(select => {
            select.selectedIndex = 0;
        });
    }

    renderEntries();
}

// Update title bar with username and time
function updateTitleBar() {
    const titleEl = document.getElementById('titleBarName');
    const dateEl = document.getElementById('currentDate');
    const timeEl = document.getElementById('currentTime');

    // Si ninguno de los elementos existe, no hacemos nada
    if (!titleEl && !dateEl && !timeEl) return;

    const userName = sessionStorage.getItem('userName') || 'Usuario';
    if (titleEl) titleEl.textContent = `Bienvenido, ${userName}`;

    const now = new Date();
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };

    if (dateEl) dateEl.textContent = now.toLocaleDateString('es-ES', dateOptions);
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// Start time update interval
setInterval(updateTitleBar, 1000);

// Delete confirmation
let deleteEntryId = null;

function showDeleteConfirm(id) {
    // Validación de permisos - Solo admin puede eliminar
    if (!puedeEditarVentas()) {
        mostrarModalInfo('Acceso Denegado', '<p style="text-align: center; color: #dc2626;">No tienes permisos para eliminar registros.</p><p style="text-align: center; font-size: 0.85rem; color: #64748b; margin-top: 0.5rem;">Solo el administrador puede eliminar datos.</p>', '🔒');
        return;
    }

    deleteEntryId = id;
    document.getElementById('confirmOverlay').classList.add('active');
}

function closeConfirm() {
    deleteEntryId = null;
    document.getElementById('confirmOverlay').classList.remove('active');
}

async function confirmDelete() {
    if (deleteEntryId !== null) {
        try {
            await API.entradas.delete(deleteEntryId);
            await cargarEntradasDesdeAPI(); // Recargar desde BD
        } catch (error) {
            // Manejar advertencia de lotes en almacén
            if (error.warning && error.data) {
                closeConfirm();
                const data = error.data;
                const ubicaciones = data.ubicaciones ? data.ubicaciones.join(', ') : 'Desconocidas';

                // Mostrar modal de confirmación especial
                mostrarModalConfirmacion(
                    '⚠️ Advertencia',
                    `<div style="text-align: center;">
                        <p style="color: #dc2626; font-weight: 600; margin-bottom: 1rem;">
                            ${data.error}
                        </p>
                        <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 0.5rem;">
                            <strong>Ubicaciones:</strong> ${ubicaciones}
                        </p>
                        <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1rem;">
                            Si elimina esta entrada, los lotes en almacén perderán la referencia a la compra original.
                        </p>
                        <p style="color: #f59e0b; font-weight: 600;">
                            ¿Desea continuar con la eliminación?
                        </p>
                    </div>`,
                    async () => {
                        // Si confirma, forzar eliminación
                        try {
                            await API.entradas.deleteForce(deleteEntryId);
                            await cargarEntradasDesdeAPI();
                            renderEntries();
                            try { filtrarReportes(); } catch (e) { console.warn('Error al actualizar reportes:', e); }
                            deleteEntryId = null;
                            showToast('Entrada eliminada (lotes huérfanos en almacén)', 'warning', 'Eliminación Forzada');
                        } catch (forceError) {
                            mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo eliminar: ' + forceError.message + '</p>', '❌');
                        }
                    },
                    () => {
                        // Cancelar
                        deleteEntryId = null;
                    }
                );
                return;
            }

            mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo eliminar: ' + error.message + '</p>', '❌');
            return;
        }

        // Actualizar UI (con manejo de errores separado)
        renderEntries();
        try {
            filtrarReportes(); // Esto puede fallar si hay datos incompletos
        } catch (e) {
            console.warn('Error al actualizar reportes:', e);
        }
        closeConfirm();
        showToast('Entrada eliminada correctamente', 'success', 'Entrada Eliminada');
    }
}

// Edit entry - now properly updates instead of deleting
let editingEntryId = null;

function editEntry(id) {
    // Validación de permisos - Solo admin puede editar
    if (!puedeEditarVentas()) {
        mostrarModalInfo('Acceso Denegado', '<p style="text-align: center; color: #dc2626;">No tienes permisos para editar registros.</p><p style="text-align: center; font-size: 0.85rem; color: #64748b; margin-top: 0.5rem;">Solo el administrador puede modificar datos.</p>', '🔒');
        return;
    }

    // Usar == para comparación flexible de tipos (string vs number)
    const entry = entries.find(e => e.id == id);
    if (!entry) {
        console.error('Entrada no encontrada con id:', id);
        return;
    }

    openModal(); // This calls resetForm() which clears editingEntryId
    editingEntryId = id; // Set AFTER openModal so it's not reset

    // Cambiar título y botón para modo edición
    const tituloModal = document.getElementById('modalEntradaTitulo');
    const btnGuardar = document.getElementById('btnGuardarEntrada');
    if (tituloModal) tituloModal.innerHTML = '✏️ Editar Entrada de Aceituna';
    if (btnGuardar) btnGuardar.textContent = 'Guardar Cambios';

    // Código de Lote e Información General
    document.getElementById('codigoLote').value = entry.codigoLote || '';
    document.getElementById('fecha').value = formatDateForInput(entry.fecha);
    document.getElementById('vendedor').value = entry.vendedor;
    document.getElementById('supervisor').value = entry.supervisor || '';
    document.getElementById('precio').value = entry.precio;
    document.getElementById('lugar').value = entry.lugar || '';
    document.getElementById('cantidad').value = entry.cantidad;

    // Parámetros de Calidad
    document.getElementById('acidez').value = entry.acidez || '';
    document.getElementById('gradosSal').value = entry.gradosSal || '';
    document.getElementById('ph').value = entry.ph || '';

    // Observaciones
    document.getElementById('observaciones').value = entry.observaciones || '';

    // Información de Salmuera (cantidades y precios)
    document.getElementById('salmueraAgua').value = entry.salmueraAgua || '';
    document.getElementById('salmueraAguaPrecio').value = entry.salmueraAguaPrecio || '';
    document.getElementById('sorbatoPotasio').value = entry.sorbatoPotasio || '';
    document.getElementById('sorbatoPotasioPrecio').value = entry.sorbatoPotasioPrecio || '';
    document.getElementById('acidoLactico').value = entry.acidoLactico || '';
    document.getElementById('acidoLacticoPrecio').value = entry.acidoLacticoPrecio || '';
    document.getElementById('acidoCitrico').value = entry.acidoCitrico || '';
    document.getElementById('acidoCitricoPrecio').value = entry.acidoCitricoPrecio || '';
    document.getElementById('calcio').value = entry.calcio || '';
    document.getElementById('calcioPrecio').value = entry.calcioPrecio || '';
    document.getElementById('acidoAcetico').value = entry.acidoAcetico || '';
    document.getElementById('acidoAceticoPrecio').value = entry.acidoAceticoPrecio || '';
    document.getElementById('acidoAscorbico').value = entry.acidoAscorbico || '';
    document.getElementById('acidoAscorbicoPrecio').value = entry.acidoAscorbicoPrecio || '';
    document.getElementById('benzoatoPotasio').value = entry.benzoatoPotasio || '';
    document.getElementById('benzoatoPotasioPrecio').value = entry.benzoatoPotasioPrecio || '';
    document.getElementById('salmueraOtros').value = entry.salmueraOtros || '';
    document.getElementById('salmueraOtrosCosto').value = entry.salmueraOtrosCosto || '';
    // Recalcular costos de salmuera
    calcularCostoSalmuera();

    // Tipo de Envase
    if (entry.tipoEnvase) {
        document.getElementById('tipoEnvase').value = entry.tipoEnvase;
        document.getElementById('envaseFieldsContainer').style.display = 'block';
        document.getElementById('envase_cantidad').value = entry.envaseCantidad || '';
        document.getElementById('envase_kilos').value = entry.envaseKilos || '';
        document.getElementById('envase_puchos').value = entry.envasePuchos || '';
        document.getElementById('totalKgCalculado').textContent = (entry.cantidad || '0') + ' Kg';
    }

    // Transporte
    document.getElementById('transporteConductor').value = entry.transporteConductor || '';
    document.getElementById('transporteViajes').value = entry.transporteViajes || '';
    document.getElementById('transporteCostoViaje').value = entry.transporteCostoViaje || '';
    document.getElementById('transporteTotal').value = entry.transporteTotal || '';

    // Color y Variedad
    if (entry.color) selectColor(entry.color);
    if (entry.variedad) setTimeout(() => selectVariety(entry.variedad), 100);

    // Proceso: depende del color
    if (entry.proceso) {
        setTimeout(() => {
            if (entry.color === 'negra' && (entry.variedad === 'empeltre' || entry.variedad === 'sevillana')) {
                selectNegraProcess(entry.proceso);
            } else if (entry.color === 'verde' && entry.variedad === 'sal') {
                selectProcess(entry.proceso);
            }
        }, 200);
    }
    if (entry.subProceso) setTimeout(() => selectSubProcess(entry.subProceso), 300);

    // Calibración
    setTimeout(() => {
        document.getElementById('fechaCalibracion').value = formatDateForInput(entry.fechaCalibracion);
        document.getElementById('responsableCalibracion').value = entry.responsableCalibracion || '';

        if (entry.destino) selectDestination(entry.destino);

        // Cargar calibres múltiples
        if (entry.calibres && entry.calibres.length > 0) {
            cargarCalibres(entry.calibres);
        }

        // Cargar Personal de Calibración por Turnos (nuevo sistema)
        if (entry.personalTurnos && entry.personalTurnos.length > 0) {
            cargarPersonalTurnos(entry.personalTurnos);
        }

        // Cargar Total Personal
        document.getElementById('totalCostoPersonal').textContent = entry.totalCostoPersonal || 'S/0.00';

        // Cargar Otros Gastos
        if (entry.otrosGastos && entry.otrosGastos.length > 0) {
            const container = document.getElementById('otrosGastosContainer');
            container.innerHTML = '';
            document.getElementById('noOtrosGastos').style.display = 'none';
            document.getElementById('totalOtrosGastosRow').style.display = 'flex';

            entry.otrosGastos.forEach(gasto => {
                otrosGastosCounter++;
                const gastoId = 'otroGasto_' + otrosGastosCounter;
                const gastoHTML = `
                            <div id="${gastoId}" class="otro-gasto-item" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;">
                                <input type="text" placeholder="Descripción del gasto" value="${gasto.descripcion || ''}"
                                    style="flex: 2; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem;">
                                <div style="display: flex; align-items: center; gap: 0.3rem;">
                                    <span style="color: #3d4f31; font-weight: 600;">S/</span>
                                    <input type="number" placeholder="0.00" step="0.01" min="0" value="${gasto.monto || 0}"
                                        style="width: 90px; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem; font-weight: 600;"
                                        oninput="calcularTotalOtrosGastos()">
                                </div>
                                <button type="button" onclick="eliminarOtroGasto('${gastoId}')"
                                    style="padding: 0.4rem 0.6rem; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.75rem;">
                                    ✕
                                </button>
                            </div>
                        `;
                container.insertAdjacentHTML('beforeend', gastoHTML);
            });
            calcularTotalOtrosGastos();
        }
    }, 400);
}

// View entry - show all details
let viewingEntryId = null;

function viewEntry(id) {
    try {
        const entry = entries.find(e => e.id === id);
        if (!entry) {
            console.error('Entrada no encontrada con id:', id);
            return;
        }

        viewingEntryId = id;
        const content = document.getElementById('viewContent');

        // Format envase name
        const envaseNames = {
            'margaritos': 'Margaritos',
            'chavitos': 'Chavitos',
            'bidones': 'Bidones de Exportación',
            'tarzas': 'Tarzas'
        };

        content.innerHTML = '<div style="display: grid; gap: 1rem;">' +
            // Código de Lote destacado - SIEMPRE mostrar
            '<div style="background: linear-gradient(135deg, #0f172a, #1e293b); padding: 1rem; border-radius: 10px; text-align: center;">' +
            '<div style="font-size: 0.75rem; color: #4ade80; text-transform: uppercase; margin-bottom: 0.3rem;">Código de Lote</div>' +
            '<div style="font-weight: 700; color: #ffffff; font-size: 1.3rem; letter-spacing: 1px;">' + (entry.codigoLote || 'Sin asignar') + '</div>' +
            '</div>' +
            // Información General - Grid 3 columnas
            '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.8rem;">' +
            '<div style="background: #FAF8F5; padding: 0.8rem; border-radius: 10px;">' +
            '<div style="font-size: 0.7rem; color: #64748b; text-transform: uppercase;">Fecha</div>' +
            '<div style="font-weight: 600; color: #0f172a;">' + formatDate(entry.fecha) + '</div>' +
            '</div>' +
            '<div style="background: #FAF8F5; padding: 0.8rem; border-radius: 10px;">' +
            '<div style="font-size: 0.7rem; color: #64748b; text-transform: uppercase;">Vendedor</div>' +
            '<div style="font-weight: 600; color: #0f172a;">' + (entry.vendedor || '-') + '</div>' +
            '</div>' +
            '<div style="background: #FAF8F5; padding: 0.8rem; border-radius: 10px;">' +
            '<div style="font-size: 0.7rem; color: #64748b; text-transform: uppercase;">Supervisor</div>' +
            '<div style="font-weight: 600; color: #0f172a;">' + (entry.supervisor || '-') + '</div>' +
            '</div>' +
            '<div style="background: #FAF8F5; padding: 0.8rem; border-radius: 10px;">' +
            '<div style="font-size: 0.7rem; color: #64748b; text-transform: uppercase;">Lugar</div>' +
            '<div style="font-weight: 600; color: #0f172a;">' + (entry.lugar || '-') + '</div>' +
            '</div>' +
            (puedeVerPrecios() ?
                '<div style=\"background: #FAF8F5; padding: 0.8rem; border-radius: 10px;\">' +
                '<div style=\"font-size: 0.7rem; color: #64748b; text-transform: uppercase;\">Precio</div>' +
                '<div style=\"font-weight: 600; color: #0f172a;\">S/' + (entry.precio || '0') + '</div>' +
                '</div>' : '') +
            '<div style="background: #f0fdf4; padding: 0.8rem; border-radius: 10px; border: 1px solid #bbf7d0;">' +
            '<div style="font-size: 0.7rem; color: #16a34a; text-transform: uppercase;">Cantidad Total</div>' +
            '<div style="font-weight: 700; color: #16a34a; font-size: 1.1rem;">' + (entry.cantidad || '0') + ' Kg</div>' +
            '</div>' +
            '</div>' +
            // Parámetros de Calidad - SIEMPRE mostrar
            '<div style="background: #f8fafc; padding: 1rem; border-radius: 10px; border: 1px solid #e2e8f0;">' +
            '<div style="font-size: 0.75rem; color: #3d4f31; text-transform: uppercase; margin-bottom: 0.5rem; font-weight: 600;">Parámetros de Calidad</div>' +
            '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">' +
            '<div><div style="font-size: 0.7rem; color: #94a3b8;">Acidez</div><div style="font-weight: 600;">' + (entry.acidez || '-') + ' %</div></div>' +
            '<div><div style="font-size: 0.7rem; color: #94a3b8;">Grados de Sal</div><div style="font-weight: 600;">' + (entry.gradosSal || '-') + ' °Bé</div></div>' +
            '<div><div style="font-size: 0.7rem; color: #94a3b8;">pH</div><div style="font-weight: 600;">' + (entry.ph || '-') + '</div></div>' +
            '</div>' +
            '</div>' +
            // Tipo de Envase - SIEMPRE mostrar
            '<div style="background: #f8fafc; padding: 1rem; border-radius: 10px; border: 1px solid #e2e8f0;">' +
            '<div style="font-size: 0.75rem; color: #3d4f31; text-transform: uppercase; margin-bottom: 0.5rem; font-weight: 600;">Tipo de Envase</div>' +
            '<div style="font-weight: 600; color: #0f172a; font-size: 1.1rem;">' + (envaseNames[entry.tipoEnvase] || entry.tipoEnvase || '-') + '</div>' +
            '<div style="margin-top: 0.5rem; font-size: 0.9rem; color: #64748b;">' +
            'Envases: <strong>' + (entry.envaseCantidad || '0') + '</strong> × Kilos: <strong>' + (entry.envaseKilos || '0') + '</strong> + Puchos: <strong>' + (entry.envasePuchos || '0') + ' Kg</strong>' +
            '</div>' +
            '</div>' +
            // Transporte - SIEMPRE mostrar
            '<div style="background: #f8fafc; padding: 1rem; border-radius: 10px; border: 1px solid #e2e8f0;">' +
            '<div style="font-size: 0.75rem; color: #3d4f31; text-transform: uppercase; margin-bottom: 0.5rem; font-weight: 600;">Transporte</div>' +
            '<div style="display: grid; grid-template-columns: repeat(' + (esAdmin() ? '3' : '2') + ', 1fr); gap: 0.6rem; font-size: 0.85rem;">' +
            '<div><span style="color: #64748b;">Conductor:</span> <strong>' + (getConductorName(entry.transporteConductor) || '-') + '</strong></div>' +
            '<div><span style="color: #64748b;">Viajes:</span> <strong>' + (entry.transporteViajes || '0') + '</strong></div>' +
            (esAdmin() ?
                '<div><span style="color: #64748b;">Costo/Viaje:</span> <strong>S/' + (entry.transporteCostoViaje || '0') + '</strong></div>' +
                '<div style="background: #f0f9e8; padding: 0.5rem; border-radius: 6px; grid-column: span 3;"><span style="color: #3d4f31; font-weight: 600;">Total Transporte:</span> <strong style="color: #3d4f31;">' + (entry.transporteTotal || 'S/0') + '</strong></div>'
                : '') +
            '</div>' +
            '</div>' +
            // Aceituna
            '<div style="background: #f8fafc; padding: 1rem; border-radius: 10px; border: 1px solid #e2e8f0;">' +
            '<div style="font-size: 0.75rem; color: #3d4f31; text-transform: uppercase; margin-bottom: 0.5rem; font-weight: 600;">Aceituna</div>' +
            '<div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">' +
            '<span class="color-tag ' + entry.color + '" style="padding: 0.4rem 1rem;">' + capitalize(entry.color) + '</span>' +
            '<span style="background: #e2e8f0; padding: 0.4rem 1rem; border-radius: 20px; font-weight: 500;">' + (entry.variedad ? capitalize(entry.variedad) : '-') + '</span>' +
            (entry.proceso ? '<span style="background: #e2e8f0; padding: 0.4rem 1rem; border-radius: 20px; font-weight: 500;">' + capitalize(entry.proceso) + '</span>' : '') +
            (entry.subProceso ? '<span style="background: #e2e8f0; padding: 0.4rem 1rem; border-radius: 20px; font-weight: 500;">' + capitalize(entry.subProceso) + '</span>' : '') +
            '</div>' +
            '</div>' +
            // Información de Salmuera - SIEMPRE mostrar (con costos si tiene permisos)
            '<div style="background: #f8fafc; padding: 1rem; border-radius: 10px; border: 1px solid #e2e8f0;">' +
            '<div style="font-size: 0.75rem; color: #3d4f31; text-transform: uppercase; margin-bottom: 0.5rem; font-weight: 600;">Información de Salmuera</div>' +
            // Agua destacado
            '<div style="background: #e0f2fe; padding: 0.6rem; border-radius: 8px; margin-bottom: 0.8rem; border: 1px solid #7dd3fc;">' +
            '<div style="display: flex; justify-content: space-between; align-items: center;">' +
            '<span style="color: #0369a1; font-weight: 600;">Agua</span>' +
            '<span style="font-weight: 600;">' + (entry.salmueraAgua || '0') + ' m³</span>' +
            (puedeVerPrecios() ? '<span style="color: #64748b;">× S/' + (entry.salmueraAguaPrecio || '0') + '/m³</span>' +
                '<span style="font-weight: 700; color: #0369a1;">= S/' + ((parseFloat(entry.salmueraAgua || 0) * parseFloat(entry.salmueraAguaPrecio || 0)).toFixed(2)) + '</span>' : '') +
            '</div>' +
            '</div>' +
            // Grid de insumos
            '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; font-size: 0.85rem;">' +
            '<div style="display: flex; justify-content: space-between; padding: 0.4rem; background: #fff; border-radius: 6px; border: 1px solid #e2e8f0;"><span style="color: #64748b;">Sorbato de Potasio:</span> <strong>' + (entry.sorbatoPotasio || '-') + ' Kg</strong>' + (puedeVerPrecios() && entry.sorbatoPotasioPrecio ? ' <span style="color: #3d4f31; font-weight: 600;">S/' + ((parseFloat(entry.sorbatoPotasio || 0) * parseFloat(entry.sorbatoPotasioPrecio || 0)).toFixed(2)) + '</span>' : '') + '</div>' +
            '<div style="display: flex; justify-content: space-between; padding: 0.4rem; background: #fff; border-radius: 6px; border: 1px solid #e2e8f0;"><span style="color: #64748b;">Ácido Láctico:</span> <strong>' + (entry.acidoLactico || '-') + ' Lt</strong>' + (puedeVerPrecios() && entry.acidoLacticoPrecio ? ' <span style="color: #3d4f31; font-weight: 600;">S/' + ((parseFloat(entry.acidoLactico || 0) * parseFloat(entry.acidoLacticoPrecio || 0)).toFixed(2)) + '</span>' : '') + '</div>' +
            '<div style="display: flex; justify-content: space-between; padding: 0.4rem; background: #fff; border-radius: 6px; border: 1px solid #e2e8f0;"><span style="color: #64748b;">Ácido Cítrico:</span> <strong>' + (entry.acidoCitrico || '-') + ' Kg</strong>' + (puedeVerPrecios() && entry.acidoCitricoPrecio ? ' <span style="color: #3d4f31; font-weight: 600;">S/' + ((parseFloat(entry.acidoCitrico || 0) * parseFloat(entry.acidoCitricoPrecio || 0)).toFixed(2)) + '</span>' : '') + '</div>' +
            '<div style="display: flex; justify-content: space-between; padding: 0.4rem; background: #fff; border-radius: 6px; border: 1px solid #e2e8f0;"><span style="color: #64748b;">Calcio:</span> <strong>' + (entry.calcio || '-') + ' Kg</strong>' + (puedeVerPrecios() && entry.calcioPrecio ? ' <span style="color: #3d4f31; font-weight: 600;">S/' + ((parseFloat(entry.calcio || 0) * parseFloat(entry.calcioPrecio || 0)).toFixed(2)) + '</span>' : '') + '</div>' +
            '<div style="display: flex; justify-content: space-between; padding: 0.4rem; background: #fff; border-radius: 6px; border: 1px solid #e2e8f0;"><span style="color: #64748b;">Ácido Acético:</span> <strong>' + (entry.acidoAcetico || '-') + ' Lt</strong>' + (puedeVerPrecios() && entry.acidoAceticoPrecio ? ' <span style="color: #3d4f31; font-weight: 600;">S/' + ((parseFloat(entry.acidoAcetico || 0) * parseFloat(entry.acidoAceticoPrecio || 0)).toFixed(2)) + '</span>' : '') + '</div>' +
            '<div style="display: flex; justify-content: space-between; padding: 0.4rem; background: #fff; border-radius: 6px; border: 1px solid #e2e8f0;"><span style="color: #64748b;">Ácido Ascórbico:</span> <strong>' + (entry.acidoAscorbico || '-') + ' Kg</strong>' + (puedeVerPrecios() && entry.acidoAscorbicoPrecio ? ' <span style="color: #3d4f31; font-weight: 600;">S/' + ((parseFloat(entry.acidoAscorbico || 0) * parseFloat(entry.acidoAscorbicoPrecio || 0)).toFixed(2)) + '</span>' : '') + '</div>' +
            '<div style="display: flex; justify-content: space-between; padding: 0.4rem; background: #fff; border-radius: 6px; border: 1px solid #e2e8f0;"><span style="color: #64748b;">Benzoato de Potasio:</span> <strong>' + (entry.benzoatoPotasio || '-') + ' Kg</strong>' + (puedeVerPrecios() && entry.benzoatoPotasioPrecio ? ' <span style="color: #3d4f31; font-weight: 600;">S/' + ((parseFloat(entry.benzoatoPotasio || 0) * parseFloat(entry.benzoatoPotasioPrecio || 0)).toFixed(2)) + '</span>' : '') + '</div>' +
            '<div style="display: flex; justify-content: space-between; padding: 0.4rem; background: #fff; border-radius: 6px; border: 1px solid #e2e8f0;"><span style="color: #64748b;">Otros:</span> <strong>' + (entry.salmueraOtros || '-') + '</strong>' + (puedeVerPrecios() && entry.salmueraOtrosCosto ? ' <span style="color: #3d4f31; font-weight: 600;">S/' + (parseFloat(entry.salmueraOtrosCosto || 0).toFixed(2)) + '</span>' : '') + '</div>' +
            '</div>' +
            // Total Costo Salmuera (solo si tiene permisos)
            (puedeVerPrecios() ? '<div style="margin-top: 0.8rem; padding: 0.6rem; background: linear-gradient(135deg, #0369a1, #0ea5e9); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">' +
                '<span style="color: #fff; font-weight: 500;">Total Costo Salmuera:</span>' +
                '<span style="color: #ffffff; font-weight: 700; font-size: 1.1rem;">' + (entry.totalCostoSalmuera || 'S/0.00') + '</span>' +
                '</div>' : '') +
            '</div>' +
            (esAdmin() ?
                '<div style="background: #f8fafc; padding: 1rem; border-radius: 10px; border: 1px solid #e2e8f0;">' +
                '<div style="font-size: 0.75rem; color: #3d4f31; text-transform: uppercase; margin-bottom: 0.5rem; font-weight: 600;">Observaciones</div>' +
                '<div style="font-size: 0.9rem; color: #0f172a;">' + (entry.observaciones || 'Sin observaciones') + '</div>' +
                '</div>' : '') +
            // Calibración - SIEMPRE mostrar
            '<div style="background: #f8fafc; padding: 1rem; border-radius: 10px; border: 1px solid #e2e8f0;">' +
            '<div style="font-size: 0.75rem; color: #3d4f31; text-transform: uppercase; margin-bottom: 0.5rem; font-weight: 600;">Calibración</div>' +
            '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.8rem; margin-bottom: 0.8rem;">' +
            '<div><div style="font-size: 0.7rem; color: #94a3b8;">Fecha de Calibración</div><div style="font-weight: 500;">' + (entry.fechaCalibracion ? formatDate(entry.fechaCalibracion) : '-') + '</div></div>' +
            '<div><div style="font-size: 0.7rem; color: #94a3b8;">Responsable</div><div style="font-weight: 500;">' + (entry.responsableCalibracion || '-') + '</div></div>' +
            '</div>' +
            // Mostrar calibres múltiples
            (entry.calibres && entry.calibres.length > 0 ?
                '<div style="margin-top: 0.8rem;">' +
                '<div style="font-size: 0.7rem; color: #3d4f31; margin-bottom: 0.5rem; font-weight: 600;">Calibres del Lote (' + entry.calibres.length + ')</div>' +
                entry.calibres.map((c, i) =>
                    '<div style="background: #e2e8f0; padding: 0.8rem; border-radius: 8px; margin-bottom: 0.5rem;">' +
                    '<div style="display: flex; justify-content: space-between; align-items: center;">' +
                    '<span style="font-weight: 600; color: #3d4f31;">' + c.calibre + '</span>' +
                    '<span style="font-weight: 600; color: #0f172a;">' + safeFixed(c.subtotal, 1) + ' Kg</span>' +
                    '</div>' +
                    '<div style="font-size: 0.8rem; color: #64748b; margin-top: 0.3rem;">' +
                    'Bidones: ' + c.bidones + ' × ' + c.kilosPorBidon + ' Kg + Puchos: ' + c.sobras + ' Kg' +
                    '</div>' +
                    '</div>'
                ).join('') +
                '<div style="background: linear-gradient(135deg, #3d4f31, #5a7247); padding: 0.8rem; border-radius: 8px; margin-top: 0.5rem;">' +
                '<div style="display: flex; justify-content: space-between; color: white;">' +
                '<span>TOTAL CALIBRES:</span>' +
                '<strong>' + safeFixed(entry.calibres.reduce((sum, c) => sum + safeNumber(c.subtotal), 0), 1) + ' Kg</strong>' +
                '</div></div>' +
                '</div>'
                : '<div style="color: #94a3b8; font-style: italic;">Sin calibres registrados</div>') +
            '</div>' +
            // Personal de Calibración - DINÁMICO basado en personalTurnos
            (esAdmin() ?
                '<div style="background: #f8fafc; padding: 1rem; border-radius: 10px; border: 1px solid #e2e8f0;">' +
                '<div style="font-size: 0.75rem; color: #3d4f31; text-transform: uppercase; margin-bottom: 0.5rem; font-weight: 600;">Personal de Calibración</div>' +
                // Generar contenido dinámico según turnos registrados
                (function () {
                    const turnos = safeArray(entry.personalTurnos);
                    if (turnos.length === 0) {
                        return '<div style="color: #94a3b8; font-style: italic;">Sin personal registrado</div>';
                    }

                    // Separar por tipo de personal
                    const varones = turnos.filter(t => t.tipoPersonal === 'varones');
                    const mujeres = turnos.filter(t => t.tipoPersonal === 'mujeres');
                    const traspaleadores = turnos.filter(t => t.tipoPersonal === 'traspaleadores');

                    let html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">';

                    // Renderizar Varones si hay
                    if (varones.length > 0) {
                        html += '<div style="background: #fff; padding: 0.8rem; border-radius: 8px; border: 1px solid #e2e8f0;">';
                        html += '<div style="font-size: 0.7rem; color: #3d4f31; font-weight: 600; margin-bottom: 0.5rem;">👷 Varones</div>';
                        varones.forEach(t => {
                            const turnoLabel = { manana: '☀️ Mañana', tarde: '🌤️ Tarde', noche: '🌙 Noche' }[t.turno] || t.turno;
                            html += '<div style="background: #f8fafc; padding: 0.5rem; border-radius: 6px; margin-bottom: 0.4rem;">';
                            html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">';
                            html += '<span style="font-size: 0.75rem; font-weight: 600; color: #3d4f31;">' + turnoLabel + '</span>';
                            if (t.fecha) {
                                html += '<span style="font-size: 0.7rem; color: #64748b; background: #e2e8f0; padding: 0.1rem 0.4rem; border-radius: 4px;">📅 ' + formatDate(t.fecha) + '</span>';
                            }
                            html += '</div>';
                            html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.2rem; font-size: 0.75rem;">';
                            html += '<div><span style="color: #64748b;">Cant:</span> <strong>' + (t.cantidad || 0) + '</strong></div>';
                            html += '<div><span style="color: #64748b;">S/Hr:</span> <strong>S/' + safeFixed(t.costoHora) + '</strong></div>';
                            html += '<div><span style="color: #64748b;">Ingreso:</span> <strong>' + (t.horaIngreso || '-') + '</strong></div>';
                            html += '<div><span style="color: #64748b;">Salida:</span> <strong>' + (t.horaFinal || '-') + '</strong></div>';
                            html += '<div><span style="color: #64748b;">Horas:</span> <strong>' + (t.horasTrabajadas || '-') + '</strong></div>';
                            html += '<div style="background: #dcfce7; padding: 0.2rem 0.4rem; border-radius: 4px;"><strong style="color: #16a34a;">S/' + safeFixed(t.costoTotal) + '</strong></div>';
                            html += '</div></div>';
                        });
                        html += '</div>';
                    }

                    // Renderizar Mujeres si hay
                    if (mujeres.length > 0) {
                        html += '<div style="background: #fff; padding: 0.8rem; border-radius: 8px; border: 1px solid #e2e8f0;">';
                        html += '<div style="font-size: 0.7rem; color: #475569; font-weight: 600; margin-bottom: 0.5rem;">👩 Mujeres</div>';
                        mujeres.forEach(t => {
                            const turnoLabel = { manana: '☀️ Mañana', tarde: '🌤️ Tarde', noche: '🌙 Noche' }[t.turno] || t.turno;
                            html += '<div style="background: #f8fafc; padding: 0.5rem; border-radius: 6px; margin-bottom: 0.4rem;">';
                            html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">';
                            html += '<span style="font-size: 0.75rem; font-weight: 600; color: #475569;">' + turnoLabel + '</span>';
                            if (t.fecha) {
                                html += '<span style="font-size: 0.7rem; color: #64748b; background: #e2e8f0; padding: 0.1rem 0.4rem; border-radius: 4px;">📅 ' + formatDate(t.fecha) + '</span>';
                            }
                            html += '</div>';
                            html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.2rem; font-size: 0.75rem;">';
                            html += '<div><span style="color: #64748b;">Cant:</span> <strong>' + (t.cantidad || 0) + '</strong></div>';
                            html += '<div><span style="color: #64748b;">S/Hr:</span> <strong>S/' + safeFixed(t.costoHora) + '</strong></div>';
                            html += '<div><span style="color: #64748b;">Ingreso:</span> <strong>' + (t.horaIngreso || '-') + '</strong></div>';
                            html += '<div><span style="color: #64748b;">Salida:</span> <strong>' + (t.horaFinal || '-') + '</strong></div>';
                            html += '<div><span style="color: #64748b;">Horas:</span> <strong>' + (t.horasTrabajadas || '-') + '</strong></div>';
                            html += '<div style="background: #dcfce7; padding: 0.2rem 0.4rem; border-radius: 4px;"><strong style="color: #16a34a;">S/' + safeFixed(t.costoTotal) + '</strong></div>';
                            html += '</div></div>';
                        });
                        html += '</div>';
                    }

                    html += '</div>';

                    // Traspaleadores si hay
                    if (traspaleadores.length > 0) {
                        const t = traspaleadores[0];
                        html += '<div style="margin-top: 0.8rem; background: #fff; padding: 0.8rem; border-radius: 8px; border: 1px solid #e2e8f0;">';
                        html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">';
                        html += '<span style="font-size: 0.7rem; color: #0369a1; font-weight: 600;">🚜 Traspaleadores</span>';
                        if (t.fecha) {
                            html += '<span style="font-size: 0.7rem; color: #64748b; background: #e2e8f0; padding: 0.1rem 0.4rem; border-radius: 4px;">📅 ' + formatDate(t.fecha) + '</span>';
                        }
                        html += '</div>';
                        html += '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; font-size: 0.8rem;">';
                        html += '<div><span style="color: #64748b;">Cant:</span> <strong>' + (t.cantidad || 0) + '</strong></div>';
                        html += '<div><span style="color: #64748b;">S/ Hora:</span> <strong>S/' + safeFixed(t.costoHora) + '</strong></div>';
                        html += '<div><span style="color: #64748b;">Horas:</span> <strong>' + (t.horasTrabajadas || '0 hrs') + '</strong></div>';
                        html += '<div style="background: #e0f2fe; padding: 0.3rem; border-radius: 4px;"><span style="color: #0369a1;">Total:</span> <strong style="color: #0369a1;">S/' + safeFixed(t.costoTotal) + '</strong></div>';
                        html += '</div></div>';
                    }

                    let totalPersonalNumerico = 0;
                    if (turnos && turnos.length > 0) {
                        turnos.forEach(t => {
                            const costoRaw = (t.costoTotal || '0').toString().replace('S/', '').replace(',', '');
                            totalPersonalNumerico += (parseFloat(costoRaw) || 0);
                        });
                    } else {
                        // Fallback a campos legacy si no hay turnos
                        const getV = (v) => parseFloat((v || '0').toString().replace('S/', '').replace(',', '')) || 0;
                        totalPersonalNumerico = getV(entry.varonesCostoTotal) + getV(entry.mujeresCostoTotal) + getV(entry.traspaleadoresCostoTotal);
                    }

                    return html +
                        // Total Personal de Calibración
                        '<div style="margin-top: 0.5rem; background: linear-gradient(135deg, #3d4f31, #1a1a1a); padding: 0.6rem 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">' +
                        '<span style="color: #fff; font-weight: 500;">Total Personal:</span>' +
                        '<span style="color: #ffffff; font-weight: 700; font-size: 1.1rem;">S/' + totalPersonalNumerico.toFixed(2) + '</span>' +
                        '</div>';
                })() +
                '</div>' : '') +
            // Otros Gastos
            (esAdmin() ?
                '<div style="background: #f8fafc; padding: 1rem; border-radius: 10px; border: 1px solid #e2e8f0;">' +
                '<div style="font-size: 0.75rem; color: #475569; text-transform: uppercase; margin-bottom: 0.5rem; font-weight: 600;">Otros Gastos</div>' +
                (entry.otrosGastos && entry.otrosGastos.length > 0 ?
                    entry.otrosGastos.map(g =>
                        '<div style="display: flex; justify-content: space-between; padding: 0.4rem; background: #fff; border-radius: 6px; margin-bottom: 0.3rem; border: 1px solid #e2e8f0;">' +
                        '<span style="color: #64748b;">' + (g.descripcion || 'Sin descripción') + '</span>' +
                        '<strong style="color: #3d4f31;">S/' + safeFixed(g.monto) + '</strong>' +
                        '</div>'
                    ).join('') +
                    '<div style="margin-top: 0.5rem; background: linear-gradient(135deg, #475569, #334155); padding: 0.6rem 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">' +
                    '<span style="color: #fff; font-weight: 500;">Total Otros Gastos:</span>' +
                    '<span style="color: #ffffff; font-weight: 700; font-size: 1.1rem;">' + (entry.totalOtrosGastos || 'S/0.00') + '</span>' +
                    '</div>'
                    : '<div style="color: #94a3b8; font-style: italic;">No hay otros gastos registrados</div>'
                ) +
                '</div>' : '') +
            '</div>';

        document.getElementById('viewOverlay').classList.add('active');
    } catch (error) {
        console.error('Error en viewEntry:', error);
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">Error al mostrar detalles: ' + error.message + '</p>', '❌');
    }
}

function closeViewModal() {
    document.getElementById('viewOverlay').classList.remove('active');
    viewingEntryId = null;
}

function editFromView() {
    if (viewingEntryId) {
        closeViewModal();
        editEntry(viewingEntryId);
    }
}

// Utilities
function formatDate(dateStr) {
    if (!dateStr || dateStr === '0000-00-00') return '-';
    // Para evitar desfase de zona horaria, agregamos la diferencia horaria
    const date = new Date(dateStr);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const correctedDate = new Date(date.getTime() + userTimezoneOffset);

    return correctedDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Formatea una fecha para ser usada en un input type="date" (YYYY-MM-DD)
 */
function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper para obtener nombre de conductor
function getConductorName(value) {
    const conductorNames = {
        'costa_verde': 'Empresa Costa Verde',
        'mario': 'Mario',
        'john': 'John',
        'otro': 'Otro'
    };
    return conductorNames[value] || value || '';
}

// Modal events
const modalOverlay = document.getElementById('modalOverlay');
if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
        if (e.target === this) closeModal();
    });
}

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
});

// ==================== MÓDULO DE REPORTES ====================

// Poblar filtros de año dinámicamente en reportes y establecer valores por defecto
function populateReportFilters() {
    const yearSelect = document.getElementById('reporteFilterYear');
    const monthSelect = document.getElementById('reporteFilterMonth');
    if (!yearSelect || !monthSelect) return;

    const years = [...new Set(entries.map(e => {
        const date = new Date(e.fecha);
        return date.getFullYear();
    }))].sort((a, b) => b - a);

    // Si no hay selecciones previas, poner el mes y año actual
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = now.getMonth().toString();

    let html = '<option value="all">Todos</option>';
    years.forEach(y => {
        html += `<option value="${y}">${y}</option>`;
    });
    yearSelect.innerHTML = html;

    // Establecer valores por defecto solo la primera vez que se cargan
    if (yearSelect.value === 'all' && monthSelect.value === 'all') {
        // Verificar si el año actual está en la lista, si no, poner el más reciente
        if (years.includes(parseInt(currentYear))) {
            yearSelect.value = currentYear;
        } else if (years.length > 0) {
            yearSelect.value = years[0];
        }
        monthSelect.value = currentMonth;
    }
}

// Filter reports based on year, month and other filters (Implementación en cascada)
function filtrarReportes() {
    const year = document.getElementById('reporteFilterYear').value;
    const month = document.getElementById('reporteFilterMonth').value;
    const tipoEnvaseSelect = document.getElementById('reporteTipoEnvase');
    const loteSelect = document.getElementById('reporteLote');

    const tipoEnvaseActual = tipoEnvaseSelect.value;
    const loteActual = loteSelect.value;

    // 1. PRIMER NIVEL: Filtrar por fecha (Año y Mes)
    let filteredByDate = [...entries];

    if (year !== 'all') {
        filteredByDate = filteredByDate.filter(e => {
            const entryDate = new Date(e.fecha);
            return entryDate.getFullYear().toString() === year;
        });
    }

    if (month !== 'all') {
        filteredByDate = filteredByDate.filter(e => {
            const entryDate = new Date(e.fecha);
            return entryDate.getMonth().toString() === month;
        });
    }

    // 2. SEGUNDO NIVEL: Actualizar selectores dependientes (Lotes y Envases) basados en filteredByDate

    // Actualizar Lotes
    const lotesDisponibles = [...new Set(filteredByDate.map(e => e.codigoLote).filter(l => l))].sort();
    loteSelect.innerHTML = '<option value="">Todos los Lotes</option>' +
        lotesDisponibles.map(l => `<option value="${l}"${l === loteActual ? ' selected' : ''}>${l}</option>`).join('');

    // Actualizar Envases
    const envasesDisponibles = [...new Set(filteredByDate.map(e => e.tipoEnvase).filter(t => t))];
    const envaseNames = {
        'margaritos': 'Margaritos',
        'chavitos': 'Chavitos',
        'bidones': 'Bidones de Exportación',
        'tarzas': 'Tarzas'
    };

    tipoEnvaseSelect.innerHTML = '<option value="">Todos</option>' +
        envasesDisponibles.map(t => `<option value="${t}"${t === tipoEnvaseActual ? ' selected' : ''}>${envaseNames[t] || t}</option>`).join('');

    // 3. TERCER NIVEL: Filtrar por los selectores dependientes
    let filteredEntries = [...filteredByDate];

    const finalTipoEnvase = tipoEnvaseSelect.value;
    const finalLote = loteSelect.value;

    if (finalTipoEnvase) {
        filteredEntries = filteredEntries.filter(e => e.tipoEnvase === finalTipoEnvase);
    }

    if (finalLote) {
        filteredEntries = filteredEntries.filter(e => e.codigoLote === finalLote);
    }

    renderReporteTable(filteredEntries);
}

// ==================== LOCALIZADOR INTELIGENTE (ADMIN) ====================

/**
 * Busca todas las ubicaciones físicas y virtuales de un lote o calibre específico
 */
function obtenerUbicacionesLoteCalibre(entradaId, nombreCalibre = null) {
    let ubicaciones = [];

    if (!almacenData || !almacenData.filas) return ubicaciones;

    // 1. Buscar en ALMACÉN FÍSICO (Tanques)
    almacenData.filas.forEach(f => {
        (f.cuadrantes || []).forEach(c => {
            (c.lotes || []).forEach(l => {
                if (l.entrada_id == entradaId) {
                    const calibresLote = l.calibres || [];

                    // Si buscamos un calibre específico
                    if (nombreCalibre) {
                        const target = calibresLote.find(cal => (cal.calibre || '').trim() === nombreCalibre.trim());
                        if (target && (parseInt(target.cantidad_envases) > 0 || parseFloat(target.pucho) > 0)) {
                            ubicaciones.push({
                                coord: `${f.nombre}-${c.nombre}`,
                                bidones: parseInt(target.cantidad_envases) || 0,
                                pucho: parseFloat(target.pucho) || 0,
                                tipo: 'físico'
                            });
                        }
                    } else {
                        // Resumen general del lote en esta ubicación
                        const totalBidones = calibresLote.reduce((s, cal) => s + (parseInt(cal.cantidad_envases) || 0), 0);
                        const totalPucho = calibresLote.reduce((s, cal) => s + (parseFloat(cal.pucho) || 0), 0);

                        if (totalBidones > 0 || totalPucho > 0) {
                            ubicaciones.push({
                                coord: `${f.nombre}-${c.nombre}`,
                                bidones: totalBidones,
                                pucho: totalPucho,
                                tipo: 'físico resumido'
                            });
                        }
                    }
                }
            });
        });
    });

    // 2. Buscar en ZONA DE PUCHOS (Virtual)
    if (almacenData.puchosExtraidos) {
        almacenData.puchosExtraidos.forEach(p => {
            if (p.entrada_id == entradaId) {
                const calNombrePucho = (p.calibre || '').trim();
                const matched = nombreCalibre ? (calNombrePucho === nombreCalibre.trim()) : true;

                if (matched) {
                    const label = p.cuadrante_nombre || 'Zona Puchos';
                    ubicaciones.push({
                        coord: label,
                        bidones: 0,
                        pucho: parseFloat(p.total_kg) || 0,
                        tipo: 'pucho'
                    });
                }
            }
        });
    }

    return ubicaciones;
}

/**
 * Muestra el tooltip del localizador
 */
function showLocatorTooltip(event, entradaId, nombreCalibre = null) {
    if (!esAdmin()) return;

    let tooltip = document.getElementById('globalLocatorTooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'globalLocatorTooltip';
        tooltip.className = 'locator-tooltip';
        document.body.appendChild(tooltip);
    }

    const ubicaciones = obtenerUbicacionesLoteCalibre(entradaId, nombreCalibre);

    if (ubicaciones.length === 0) {
        tooltip.innerHTML = '<div style="text-align: center; color: #64748b; font-style: italic; font-size: 0.8rem;">Sin existencias en almacen</div>';
    } else {
        const titulo = nombreCalibre ? `📍 Ubicación: ${nombreCalibre}` : `📦 Lote: Ubicaciones`;
        let html = `<div class="locator-header">${titulo}</div>`;

        ubicaciones.forEach(u => {
            const icon = u.tipo === 'pucho' ? '🫒' : '📍';
            const bidonesText = u.bidones > 0 ? `<span class="locator-badge">${u.bidones} Bid.</span>` : '';
            const puchoText = u.pucho > 0 ? `<div class="locator-pucho">+ ${u.pucho.toFixed(1)} Kg</div>` : '';

            html += `
                <div class="locator-item" style="border-left: 3px solid ${u.tipo === 'pucho' ? '#eab308' : '#16a34a'}; padding-left: 0.6rem; background: #f8fafc; border-radius: 8px; margin-bottom: 0.5rem; padding: 0.4rem;">
                    <div>
                        <div style="font-weight: 700; color: #1e293b; font-size: 0.85rem;">${icon} ${u.coord}</div>
                        ${puchoText}
                    </div>
                    ${bidonesText}
                </div>
            `;
        });

        tooltip.innerHTML = html;
    }

    // Posicionamiento
    const rect = event.target.getBoundingClientRect();
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        tooltip.classList.add('active');
    } else {
        tooltip.style.left = (rect.left + window.scrollX) + 'px';
        tooltip.style.top = (rect.bottom + window.scrollY + 10) + 'px';
        tooltip.classList.add('active');
    }
}

function hideLocatorTooltip() {
    const tooltip = document.getElementById('globalLocatorTooltip');
    if (tooltip) tooltip.classList.remove('active');
}

// Render report table with Excel-like format
function renderReporteTable(data) {
    const tbody = document.getElementById('reporteTableBody');
    const noMessage = document.getElementById('noReportesMessage');
    const table = document.getElementById('reporteTable');

    const envaseNames = {
        'margaritos': 'Margaritos',
        'chavitos': 'Chavitos',
        'bidones': 'Bidones Exp.',
        'tarzas': 'Tarzas'
    };

    // Ocultar columnas de precio para no-admin (ing y trabajador)
    // Columnas a ocultar: Precio Compra, Valor Compra, Precio Venta, Valor Venta, Utilidad
    // Columnas que SÍ pueden ver: Gastos Op. (Transp, Pers, Salm, Otros, Total Gastos Op)
    const ocultarPrecios = !puedeVerPrecios();
    const columnasOcultar = [
        'thCompraCol', 'thValorCalibre', 'thVentaCol', 'thValorVentaCol', 'thGananciaCol',
        'thTranspCol', 'thPersCol', 'thSalmCol', 'thOtrosCol', 'thGastosOpCol'
    ];

    if (ocultarPrecios) {
        columnasOcultar.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
        const valorCard = document.getElementById('valorCalibresCard');
        if (valorCard) valorCard.style.display = 'none';
    } else {
        columnasOcultar.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = '';
        });
        const valorCard = document.getElementById('valorCalibresCard');
        if (valorCard) valorCard.style.display = '';
    }

    if (data.length === 0) {
        tbody.innerHTML = '';
        table.style.display = 'none';
        noMessage.style.display = 'block';
        document.getElementById('totalRegistros').textContent = '0';
        document.getElementById('totalKilosReporte').textContent = '0 Kg';
        if (!ocultarPrecios) {
            document.getElementById('totalValorCalibres').textContent = 'S/0';
        }
        return;
    }

    table.style.display = 'table';
    noMessage.style.display = 'none';

    let totalKilosGlobal = 0;
    let totalValorVentaGlobal = 0;
    let totalValorCompraGlobal = 0;
    let totalGastosOpGlobal = 0;
    let totalGananciaGlobal = 0;
    // Acumuladores detalle global
    let totalTranspGlobal = 0;
    let totalPersGlobal = 0;
    let totalSalmGlobal = 0;
    let totalOtrosGlobal = 0;

    let rowIndex = 0;

    // Sort by date descending
    data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    let html = '';
    let currentLote = null;
    let loteKilosSum = 0;
    let loteValorCompraSum = 0;
    let loteValorVentaSum = 0;
    let loteGastosOpSum = 0;
    let loteGananciaSum = 0;
    // Acumuladores detalle lote
    let loteTranspSum = 0;
    let lotePersSum = 0;
    let loteSalmSum = 0;
    let loteOtrosSum = 0;

    const agregarSubtotalLote = (lote) => {
        if (lote && (loteKilosSum > 0 || loteValorVentaSum > 0)) {
            const colorGanancia = loteGananciaSum >= 0 ? '#16a34a' : '#dc2626';
            // Número de columnas antes de Subtotal Kg: 6 cuando hay precios, 6 cuando no hay precios
            // Columnas visibles comunes: Fecha, Lote, Vendedor, Supervisor, Envase, Calibre, Bidones, Kg/Bid, Puchos, Subtotal Kg
            const colspanSubtotal = ocultarPrecios ? 9 : 10;
            return `
                <tr style="background: #f1f5f9; font-weight: 700; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1;">
                    <td colspan="${colspanSubtotal}" style="padding: 0.6rem; text-align: right; color: #475569;">Subtotal ${lote}</td>
                    <td style="padding: 0.6rem; text-align: right; font-weight: 700; border-left: 1px solid #cbd5e1;">${safeFixed(loteKilosSum, 1)} Kg</td>
                    ${!ocultarPrecios ? `
                        <td style="padding: 0.6rem; text-align: right;">S/${safeFixed(loteValorCompraSum, 2)}</td>
                        <td></td>
                        <td style="padding: 0.6rem; text-align: right; color: #94a3b8; font-size: 0.8rem;">S/${safeFixed(loteTranspSum, 2)}</td>
                        <td style="padding: 0.6rem; text-align: right; color: #94a3b8; font-size: 0.8rem;">S/${safeFixed(lotePersSum, 2)}</td>
                        <td style="padding: 0.6rem; text-align: right; color: #94a3b8; font-size: 0.8rem;">S/${safeFixed(loteSalmSum, 2)}</td>
                        <td style="padding: 0.6rem; text-align: right; color: #94a3b8; font-size: 0.8rem;">S/${safeFixed(loteOtrosSum, 2)}</td>
                        <td style="padding: 0.6rem; text-align: right; color: #f59e0b;">S/${safeFixed(loteGastosOpSum, 2)}</td>
                        <td style="padding: 0.6rem; text-align: right;">S/${safeFixed(loteValorVentaSum, 2)}</td>
                        <td style="padding: 0.6rem; text-align: right; color: ${colorGanancia};">S/${safeFixed(loteGananciaSum, 2)}</td>
                    ` : ''}
                </tr>
            `;
        }
        return '';
    };

    data.forEach((entry, index) => {
        // Lógica de agrupación por lote para subtotales visuales
        if (entry.codigoLote !== currentLote) {
            if (currentLote !== null) {
                html += agregarSubtotalLote(currentLote);
            }
            currentLote = entry.codigoLote;
            loteKilosSum = 0;
            loteValorCompraSum = 0;
            loteValorVentaSum = 0;
            loteGastosOpSum = 0;
            loteGananciaSum = 0;

            // Fila de encabezado de lote
            html += `
                <tr style="background: #ecfdf5; border-bottom: 1px solid #e2e8f0;">
                    <td colspan="20" style="padding: 0.8rem; font-weight: 700; color: #3d4f31;">
                        <span class="${esAdmin() ? 'locator-trigger' : ''}" 
                              ${esAdmin() ? `onmouseenter="showLocatorTooltip(event, ${entry.id})" onmouseleave="hideLocatorTooltip()" onclick="showLocatorTooltip(event, ${entry.id})"` : ''}>
                            📦 Lote: ${currentLote}
                        </span>
                    </td>
                </tr>
            `;
        }

        if (entry.calibres && entry.calibres.length > 0) {
            const getVal = (v) => parseFloat((v || '0').toString().replace('S/', '').replace(',', '')) || 0;
            const precioCompraEntry = parseFloat(entry.precio) || 0;

            // Calcular gastos operativos totales de esta entrada
            const t_ent = getVal(entry.transporteTotal);
            const s_ent = getVal(entry.totalCostoSalmuera);
            const o_ent = getVal(entry.totalOtrosGastos);
            let p_ent = 0;
            if (entry.personalTurnos && Array.isArray(entry.personalTurnos)) {
                entry.personalTurnos.forEach(turno => p_ent += getVal(turno.costoTotal));
            } else {
                p_ent = getVal(entry.varonesCostoTotal) + getVal(entry.mujeresCostoTotal) + getVal(entry.traspaleadoresCostoTotal);
            }
            const totalGastosOperativosEntry = t_ent + p_ent + s_ent + o_ent;

            const totalKgEntry = entry.calibres.reduce((sum, c) => sum + (parseFloat(c.subtotal) || 0), 0);

            entry.calibres.forEach((calibre, cIdx) => {
                const calibreId = `${entry.id}_${cIdx}`;
                const calibreDbId = calibre.id; // ID real de la BD
                const subtotalKg = parseFloat(calibre.subtotal) || 0;

                // LÓGICA DE PRECIOS:
                // - entry.precio = PRECIO DE COMPRA (campo general de la entrada)
                // - calibre.precio = PRECIO DE VENTA ORIGINAL (ingresado en formulario)
                // - calibre.precio_venta = PRECIO DE VENTA AJUSTADO (editado desde Reportes)

                const precioCompra = parseFloat(entry.precio) || 0; // Precio de COMPRA general
                const valorCompra = subtotalKg * precioCompra;

                // Prorrateo detalle
                const ratio = totalKgEntry > 0 ? (subtotalKg / totalKgEntry) : 0;
                const t_cal = t_ent * ratio;
                const p_cal = p_ent * ratio;
                const s_cal = s_ent * ratio;
                const o_cal = o_ent * ratio;
                const totalGastoCal = t_cal + p_cal + s_cal + o_cal;

                // PRECIO DE VENTA:
                // 1. Si hay precio_venta en BD (ajustado), usarlo
                // 2. Si no, usar precio original del formulario
                // 3. Si hay edición en curso, usar el precio editado
                const precioVentaOriginal = parseFloat(calibre.precio) || 0; // Del formulario
                const precioVentaAjustado = parseFloat(calibre.precioVenta || calibre.precio_venta) || null; // De BD (ajustado)
                const precioVentaBase = precioVentaAjustado !== null ? precioVentaAjustado : precioVentaOriginal;
                const precioVenta = preciosEditados[calibreId] ? preciosEditados[calibreId].precio_venta : precioVentaBase;

                const valorVenta = subtotalKg * precioVenta;
                const ganancia = valorVenta - valorCompra - totalGastoCal;

                // ACUMULAR EN LOTE Y GLOBAL (Incluyendo detalles)
                loteKilosSum += subtotalKg; totalKilosGlobal += subtotalKg;
                loteValorCompraSum += valorCompra; totalValorCompraGlobal += valorCompra;
                loteValorVentaSum += valorVenta; totalValorVentaGlobal += valorVenta;
                loteGastosOpSum += totalGastoCal; totalGastosOpGlobal += totalGastoCal;
                loteGananciaSum += ganancia; totalGananciaGlobal += ganancia;

                loteTranspSum += t_cal; totalTranspGlobal += t_cal;
                lotePersSum += p_cal; totalPersGlobal += p_cal;
                loteSalmSum += s_cal; totalSalmGlobal += s_cal;
                loteOtrosSum += o_cal; totalOtrosGlobal += o_cal;

                const colorGanancia = ganancia >= 0 ? '#16a34a' : '#dc2626';
                const colorRow = rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc';

                html += `
                    <tr style="background: ${colorRow}; border-bottom: 1px solid #f1f5f9;" class="reporte-row">
                        <td style="padding: 0.6rem;">${formatDate(entry.fecha)}</td>
                        <td style="padding: 0.6rem; font-weight: 600;">${entry.codigoLote}</td>
                        <td style="padding: 0.6rem;">${entry.vendedor || '-'}</td>
                        <td style="padding: 0.6rem;">${entry.supervisor || '-'}</td>
                        <td style="padding: 0.6rem;">${envaseNames[entry.tipoEnvase] || '-'}</td>
                        <td style="padding: 0.6rem; font-weight: 600;">${calibre.calibre}</td>
                        ${!ocultarPrecios ? `<td style="padding: 0.6rem; text-align: right;">S/${safeFixed(precioCompra, 2)}</td>` : ''}
                        <td style="padding: 0.6rem; text-align: right;">
                            <span class="${esAdmin() ? 'locator-trigger' : ''}" 
                                  ${esAdmin() ? `onmouseenter="showLocatorTooltip(event, ${entry.id}, '${calibre.calibre}')" onmouseleave="hideLocatorTooltip()" onclick="showLocatorTooltip(event, ${entry.id}, '${calibre.calibre}')"` : ''}>
                                ${calibre.bidones}
                            </span>
                        </td>
                        <td style="padding: 0.6rem; text-align: right;">${calibre.kilosPorBidon}</td>
                        <td style="padding: 0.6rem; text-align: right;">${calibre.sobras}</td>
                        <td style="padding: 0.6rem; text-align: right; font-weight: 700;">${safeFixed(subtotalKg, 1)} Kg</td>
                        ${!ocultarPrecios ? `
                            <td style="padding: 0.6rem; text-align: right;">S/${safeFixed(valorCompra, 2)}</td>
                            <td style="padding: 0.6rem; text-align: right;">
                                ${modoEdicionPrecio ? `
                                    <input type="number" class="precio-edicion-input" 
                                        data-calibre-id="${calibreId}" 
                                        data-calibre-db-id="${calibreDbId}"
                                        data-subtotal="${subtotalKg}" 
                                        data-precio-compra="${precioCompra}"
                                        data-gastos-op="${totalGastoCal}"
                                        value="${precioVenta || ''}" 
                                        oninput="registrarPrecioEditado('${calibreId}', ${calibreDbId}, this.value, ${precioVentaBase})"
                                        style="width: 70px; border: 2px solid #8b5cf6; border-radius: 6px; padding: 4px; text-align: right; font-weight: 600; background: #faf5ff;">
                                ` : `S/${safeFixed(precioVenta, 2)}`}
                            </td>
                            <td style="padding: 0.6rem; text-align: right; color: #94a3b8;">S/${safeFixed(t_cal, 2)}</td>
                            <td style="padding: 0.6rem; text-align: right; color: #94a3b8;">S/${safeFixed(p_cal, 2)}</td>
                            <td style="padding: 0.6rem; text-align: right; color: #94a3b8; font-size: 0.8rem;">S/${safeFixed(s_cal, 2)}</td>
                            <td style="padding: 0.6rem; text-align: right; color: #94a3b8;">S/${safeFixed(o_cal, 2)}</td>
                            <td style="padding: 0.6rem; text-align: right; color: #f59e0b;">S/${safeFixed(totalGastoCal, 2)}</td>
                            <td style="padding: 0.6rem; text-align: right;" data-valor-venta="${calibreId}">S/${safeFixed(valorVenta, 2)}</td>
                            <td style="padding: 0.6rem; text-align: right; font-weight: 700; color: ${colorGanancia};" data-utilidad="${calibreId}">S/${safeFixed(ganancia, 2)}</td>
                        ` : ''}
                    </tr>
                `;
                rowIndex++;
            });
        }
    });

    if (currentLote !== null) {
        html += agregarSubtotalLote(currentLote);
    }

    // Fila Total General
    const colspanTotal = ocultarPrecios ? 9 : 10;
    html += `
        <tr style="background: #0f172a; color: white; font-weight: 700;">
            <td colspan="${colspanTotal}" style="padding: 1rem; text-align: right;">TOTAL GENERAL</td>
            <td style="padding: 1rem; text-align: right; font-weight: 700; border-left: 1px solid #334155;">${safeFixed(totalKilosGlobal, 1)} Kg</td>
            ${!ocultarPrecios ? `
                <td style="padding: 1rem; text-align: right;">S/${safeFixed(totalValorCompraGlobal, 2)}</td>
                <td></td>
                <td style="padding: 1rem; text-align: right; color: #94a3b8; font-size: 0.8rem;">S/${safeFixed(totalTranspGlobal, 2)}</td>
                <td style="padding: 1rem; text-align: right; color: #94a3b8; font-size: 0.8rem;">S/${safeFixed(totalPersGlobal, 2)}</td>
                <td style="padding: 1rem; text-align: right; color: #94a3b8; font-size: 0.8rem;">S/${safeFixed(totalSalmGlobal, 2)}</td>
                <td style="padding: 1rem; text-align: right; color: #94a3b8; font-size: 0.8rem;">S/${safeFixed(totalOtrosGlobal, 2)}</td>
                <td style="padding: 1rem; text-align: right; color: #fbbf24;">S/${safeFixed(totalGastosOpGlobal, 2)}</td>
                <td style="padding: 1rem; text-align: right;">S/${safeFixed(totalValorVentaGlobal, 2)}</td>
                <td style="padding: 1rem; text-align: right; color: ${totalGananciaGlobal >= 0 ? '#4ade80' : '#f87171'};">S/${safeFixed(totalGananciaGlobal, 2)}</td>
            ` : ''}
        </tr>
    `;

    tbody.innerHTML = html;

    // Actualizar tarjetas de resumen
    document.getElementById('totalRegistros').textContent = data.length;
    document.getElementById('totalKilosReporte').textContent = safeFixed(totalKilosGlobal, 1) + ' Kg';
    if (!ocultarPrecios) {
        document.getElementById('totalValorCalibres').textContent = 'S/' + safeFixed(totalValorVentaGlobal, 2);
    }
}

// Calcular ganancia del reporte
function calcularGananciaReporte() {
    const data = window.reporteData || { costoVenta: 0, costoCompra: 0, costoTransporte: 0, costoPersonal: 0, totalKilos: 0 };
    const otrosGastos = parseFloat(document.getElementById('otrosGastosReporte').value) || 0;

    // Costos Operativos = Personal + Transporte + Otros Gastos
    const totalOperativos = data.costoPersonal + data.costoTransporte + otrosGastos;
    document.getElementById('totalCostosOperativos').textContent = 'S/' + safeFixed(totalOperativos, 2);

    // Actualizar costos totales en el simulador
    const costosTotales = data.costoCompra + totalOperativos;
    document.getElementById('costosTotalesSimulador').textContent = 'S/' + safeFixed(costosTotales, 2);

    // Llamar al simulador para actualizar valores
    simularGanancia();
}

// Simular ganancia basado en precio de venta editable
function simularGanancia() {
    const data = window.reporteData || { costoVenta: 0, costoCompra: 0, costoTransporte: 0, costoPersonal: 0, totalKilos: 0 };
    const otrosGastos = parseFloat(document.getElementById('otrosGastosReporte').value) || 0;

    // Obtener precio de venta del input
    const precioVenta = parseFloat(document.getElementById('precioVentaSimulador').value) || 0;
    const totalKilos = data.totalKilos || 0;

    // Calcular Ingreso de Venta = Precio de Venta × Total Kg
    const ingresoVenta = precioVenta * totalKilos;
    document.getElementById('ingresoVentaSimulador').textContent = 'S/' + safeFixed(ingresoVenta, 2);

    // Costos Totales = Compra + Operativos
    const totalOperativos = data.costoPersonal + data.costoTransporte + otrosGastos;
    const costosTotales = data.costoCompra + totalOperativos;
    document.getElementById('costosTotalesSimulador').textContent = 'S/' + safeFixed(costosTotales, 2);

    // Ganancia = Ingreso de Venta - Costos Totales
    const ganancia = ingresoVenta - costosTotales;

    const gananciaEl = document.getElementById('gananciaSimulador');
    const gananciaCard = document.getElementById('gananciaSimuladorCard');

    gananciaEl.textContent = 'S/' + safeFixed(ganancia, 2);

    // Cambiar color según ganancia positiva o negativa
    if (ganancia >= 0) {
        gananciaEl.style.color = '#4ade80'; // Verde
        gananciaCard.style.background = 'linear-gradient(135deg, #3d4f31, #5a7247)';
        gananciaCard.style.borderColor = '#4ade80';
    } else {
        gananciaEl.style.color = '#ef4444'; // Rojo
        gananciaCard.style.background = 'linear-gradient(135deg, #7f1d1d, #991b1b)';
        gananciaCard.style.borderColor = '#ef4444';
    }
}

// ========== MODO EDICIÓN PRECIO DE VENTA (PERMANENTE) ==========

// Variables para modo edición de precios
let modoEdicionPrecio = false;
let preciosOriginales = {}; // Para cancelar y restaurar
let preciosEditados = {};   // Almacena los precios editados

// Toggle modo edición de precios
function toggleModoEdicionPrecio() {
    modoEdicionPrecio = !modoEdicionPrecio;
    const btn = document.getElementById('btnActualizarPrecio');

    if (modoEdicionPrecio) {
        btn.style.background = 'linear-gradient(135deg, #dc2626, #ef4444)';
        btn.innerHTML = 'Cancelar Edición';
        preciosOriginales = {};
        preciosEditados = {};
    } else {
        btn.style.background = 'linear-gradient(135deg, #8b5cf6, #a855f7)';
        btn.innerHTML = 'Actualizar Precio';
    }

    // Mostrar/ocultar panel de edición
    const panelEdicion = document.getElementById('panelEdicionPrecios');
    if (panelEdicion) {
        panelEdicion.style.display = modoEdicionPrecio ? 'block' : 'none';
    }

    // Volver a renderizar la tabla con/sin modo edición
    filtrarReportes();
}

// Registrar precio editado
function registrarPrecioEditado(calibreId, calibreDbId, nuevoPrecio, precioOriginal) {
    if (!preciosOriginales[calibreId]) {
        preciosOriginales[calibreId] = precioOriginal;
    }
    preciosEditados[calibreId] = {
        calibre_id: calibreDbId,
        precio_venta: parseFloat(nuevoPrecio) || 0
    };

    // Recalcular la fila en tiempo real
    recalcularFilaPrecio(calibreId, nuevoPrecio);
}

// Recalcular valores de la fila cuando cambia el precio
function recalcularFilaPrecio(calibreId, nuevoPrecio) {
    const input = document.querySelector(`[data-calibre-id="${calibreId}"]`);
    if (!input) return;

    const subtotalKg = parseFloat(input.dataset.subtotal) || 0;
    const precioCompra = parseFloat(input.dataset.precioCompra) || 0;
    const gastosOp = parseFloat(input.dataset.gastosOp) || 0;
    const precioVenta = parseFloat(nuevoPrecio) || 0;

    const valorVenta = subtotalKg * precioVenta;
    const utilidad = valorVenta - (subtotalKg * precioCompra) - gastosOp;

    // Actualizar celda de Valor Venta
    const valorVentaCell = document.querySelector(`[data-valor-venta="${calibreId}"]`);
    if (valorVentaCell) {
        valorVentaCell.textContent = `S/${safeFixed(valorVenta, 2)}`;
    }

    // Actualizar celda de Utilidad
    const utilidadCell = document.querySelector(`[data-utilidad="${calibreId}"]`);
    if (utilidadCell) {
        utilidadCell.textContent = `S/${safeFixed(utilidad, 2)}`;
        utilidadCell.style.color = utilidad >= 0 ? '#16a34a' : '#dc2626';
    }
}

// Guardar todos los precios editados en la BD
async function guardarTodosPrecios() {
    const preciosArray = Object.values(preciosEditados);

    if (preciosArray.length === 0) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">No hay precios para guardar. Edite al menos un precio.</p>', '⚠️');
        return;
    }

    try {
        // Mostrar loading
        mostrarModalInfo('Guardando...', '<p style="text-align: center; color: #64748b;">Actualizando precios de venta...</p>', '⏳');

        const response = await API.calibres.updateMultiplePrecios(preciosArray);

        if (response.success) {
            cerrarModalInfo();
            showToast(`Se actualizaron ${response.actualizados} precios de venta correctamente.`, 'success', 'Precios Actualizados');

            // Limpiar estado y recargar datos
            preciosEditados = {};
            preciosOriginales = {};

            // Recargar entradas desde la API para reflejar cambios
            await cargarEntradasDesdeAPI();

            // Salir del modo edición
            modoEdicionPrecio = false;
            const btn = document.getElementById('btnActualizarPrecio');
            if (btn) {
                btn.style.background = 'linear-gradient(135deg, #8b5cf6, #a855f7)';
                btn.innerHTML = 'Actualizar Precio';
            }
            const panelEdicion = document.getElementById('panelEdicionPrecios');
            if (panelEdicion) panelEdicion.style.display = 'none';

            // Re-renderizar tabla
            filtrarReportes();
        } else {
            cerrarModalInfo();
            mostrarModalInfo('Error', `<p style="text-align: center; color: #dc2626;">${response.error || 'Error al guardar precios'}</p>`, '❌');
        }
    } catch (error) {
        cerrarModalInfo();
        mostrarModalInfo('Error', `<p style="text-align: center; color: #dc2626;">Error de conexión: ${error.message}</p>`, '❌');
    }
}

// Cancelar edición - simplemente sale del modo edición y descarta cambios no guardados
function cancelarEdicionPrecios() {
    // Limpiar estado de edición
    preciosEditados = {};
    preciosOriginales = {};

    // Salir del modo edición (toggleModoEdicionPrecio cambiará modoEdicionPrecio a false)
    // y re-renderizará la tabla con los valores originales de la BD
    modoEdicionPrecio = true; // Ponemos en true porque toggle lo va a cambiar a false
    toggleModoEdicionPrecio();
}

// Mantener compatibilidad con variables antiguas (por si hay código que las use)
let modoSimularVenta = false;
let preciosSimulados = {};
function toggleSimularVenta() { toggleModoEdicionPrecio(); }

// Llenar todos los precios con un valor
function llenarTodosPrecios() {
    const precio = parseFloat(document.getElementById('precioLlenadoTodos').value) || 0;
    if (precio <= 0) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Por favor ingrese un precio válido</p>', '⚠️');
        return;
    }

    document.querySelectorAll('.precio-simulado-input').forEach(input => {
        input.value = precio.toFixed(2);
        const calibreId = input.dataset.calibreId;
        preciosSimulados[calibreId] = precio;
    });

    recalcularTotalesSimulados();
}

// Llenar precios por rango (distribuye proporcionalmente)
function llenarPreciosPorRango() {
    const precioDesde = parseFloat(document.getElementById('precioDesde').value) || 0;
    const precioHasta = parseFloat(document.getElementById('precioHasta').value) || 0;

    if (precioDesde <= 0 || precioHasta <= 0) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">Por favor ingrese precios válidos para el rango</p>', '⚠️');
        return;
    }

    const inputs = document.querySelectorAll('.precio-simulado-input');
    const total = inputs.length;

    if (total === 0) return;

    const incremento = total > 1 ? (precioHasta - precioDesde) / (total - 1) : 0;

    inputs.forEach((input, index) => {
        const precio = precioDesde + (incremento * index);
        input.value = precio.toFixed(2);
        const calibreId = input.dataset.calibreId;
        preciosSimulados[calibreId] = precio;
    });

    recalcularTotalesSimulados();
}

// Limpiar todos los precios
function limpiarTodosPrecios() {
    document.querySelectorAll('.precio-simulado-input').forEach(input => {
        input.value = '';
        const calibreId = input.dataset.calibreId;
        preciosSimulados[calibreId] = 0;
    });

    // Limpiar inputs del panel
    document.getElementById('precioLlenadoTodos').value = '';
    document.getElementById('precioDesde').value = '';
    document.getElementById('precioHasta').value = '';

    recalcularTotalesSimulados();
}

// Actualizar precio simulado
function actualizarPrecioSimulado(calibreId, nuevoPrecio) {
    preciosSimulados[calibreId] = parseFloat(nuevoPrecio) || 0;
    recalcularTotalesSimulados();
}

// Recalcular totales cuando se cambian precios simulados
function recalcularTotalesSimulados() {
    let totalValorSimulado = 0;
    let totalGananciasSimuladas = 0;

    // Recalcular cada valor de calibre y ganancia
    document.querySelectorAll('.precio-simulado-input').forEach(input => {
        const calibreId = input.dataset.calibreId;
        const subtotal = parseFloat(input.dataset.subtotal) || 0;
        const precioCompra = parseFloat(input.dataset.precioCompra) || 0;
        const precioVenta = parseFloat(input.value) || 0;
        const valorCalc = precioVenta * subtotal;
        const gananciaCalc = (precioVenta - precioCompra) * subtotal;

        // Actualizar celda de valor
        const valorCell = document.querySelector(`[data-valor-calibre="${calibreId}"]`);
        if (valorCell) {
            valorCell.textContent = valorCalc > 0 ? 'S/' + valorCalc.toFixed(2) : '-';
        }

        // Actualizar celda de ganancia
        const gananciaCell = document.querySelector(`[data-ganancia-calibre="${calibreId}"]`);
        if (gananciaCell) {
            gananciaCell.textContent = precioVenta > 0 ? 'S/' + gananciaCalc.toFixed(2) : '-';
            // Cambiar color según positivo o negativo
            if (gananciaCalc >= 0) {
                gananciaCell.style.background = '#dcfce7';
                gananciaCell.style.color = '#22c55e';
            } else {
                gananciaCell.style.background = '#fee2e2';
                gananciaCell.style.color = '#ef4444';
            }
        }

        totalValorSimulado += valorCalc;
        totalGananciasSimuladas += gananciaCalc;
    });

    // Actualizar total de valor calibres
    document.getElementById('totalValorCalibres').textContent = 'S/' + totalValorSimulado.toFixed(2);

    // Actualizar simulador de ganancia
    if (window.reporteData) {
        window.reporteData.costoVenta = totalValorSimulado;
        simularGanancia();
    }
}

// Mostrar modal con fórmulas del sistema
function mostrarFormulas() {
    const modalHtml = `
                <div id="formulasModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem;">
                    <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 16px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; border: 2px solid #3d4f31;">
                        <div style="padding: 1.5rem; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
                            <h2 style="color: #4ade80; margin: 0; font-size: 1.3rem;">📖 Fórmulas del Sistema</h2>
                            <button onclick="cerrarFormulas()" style="background: #dc2626; color: white; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; font-size: 1.2rem;">✕</button>
                        </div>
                        
                        <div style="padding: 1.5rem;">
                            <!-- Calibración -->
                            <div style="background: #334155; padding: 1rem; border-radius: 10px; margin-bottom: 1rem;">
                                <h3 style="color: #fbbf24; margin: 0 0 0.8rem 0; font-size: 1rem;">📦 Calibración</h3>
                                <div style="background: #0f172a; padding: 0.8rem; border-radius: 8px; font-family: monospace; color: #a5f3fc;">
                                    <p style="margin: 0.3rem 0;"><strong style="color: #4ade80;">Subtotal Calibre</strong> = Bidones × Kg/Bidón + Puchos</p>
                                    <p style="margin: 0.3rem 0;"><strong style="color: #4ade80;">Total Kg</strong> = Σ (Subtotal de todos los calibres del lote)</p>
                                </div>
                            </div>

                            <!-- Costos de Compra -->
                            <div style="background: #334155; padding: 1rem; border-radius: 10px; margin-bottom: 1rem;">
                                <h3 style="color: #f87171; margin: 0 0 0.8rem 0; font-size: 1rem;">💰 Costos de Compra</h3>
                                <div style="background: #0f172a; padding: 0.8rem; border-radius: 8px; font-family: monospace; color: #a5f3fc;">
                                    <p style="margin: 0.3rem 0;"><strong style="color: #f87171;">Precio Compra</strong> = Precio por Kg ingresado al añadir compra</p>
                                    <p style="margin: 0.3rem 0;"><strong style="color: #f87171;">Valor Total de Compra</strong> = Precio Compra × Subtotal Calibre</p>
                                    <p style="margin: 0.3rem 0;"><strong style="color: #f87171;">Costo Total Aceitunas</strong> = Σ (Precio × Cantidad de cada entrada)</p>
                                </div>
                            </div>

                            <!-- Costos Operativos -->
                            <div style="background: #334155; padding: 1rem; border-radius: 10px; margin-bottom: 1rem;">
                                <h3 style="color: #fb923c; margin: 0 0 0.8rem 0; font-size: 1rem;">🏭 Costos Operativos</h3>
                                <div style="background: #0f172a; padding: 0.8rem; border-radius: 8px; font-family: monospace; color: #a5f3fc;">
                                    <p style="margin: 0.3rem 0;"><strong style="color: #fb923c;">Costo Varones</strong> = Cantidad × Hora/Hombre × Horas Trabajadas</p>
                                    <p style="margin: 0.3rem 0;"><strong style="color: #fb923c;">Costo Mujeres</strong> = Cantidad × Hora/Hombre × Horas Trabajadas</p>
                                    <p style="margin: 0.3rem 0;"><strong style="color: #fb923c;">Costo Traspaleadores</strong> = Cantidad × Costo/Día × Días</p>
                                    <p style="margin: 0.3rem 0;"><strong style="color: #fb923c;">Costo Transporte</strong> = Viajes × Costo por Viaje</p>
                                    <p style="margin: 0.3rem 0;"><strong style="color: #fb923c;">Costo Salmuera</strong> = Σ (Cantidad × Precio) de cada insumo</p>
                                    <p style="margin: 0.3rem 0;"><strong style="color: #fbbf24;">Total Operativos</strong> = Personal + Transporte + Otros Gastos + Salmuera</p>
                                </div>
                            </div>

                            <!-- Ventas y Ganancias -->
                            <div style="background: #334155; padding: 1rem; border-radius: 10px; margin-bottom: 1rem;">
                                <h3 style="color: #4ade80; margin: 0 0 0.8rem 0; font-size: 1rem;">📈 Ventas y Ganancias</h3>
                                <div style="background: #0f172a; padding: 0.8rem; border-radius: 8px; font-family: monospace; color: #a5f3fc;">
                                    <p style="margin: 0.3rem 0;"><strong style="color: #4ade80;">Precio de Venta</strong> = Precio al que vendemos cada Kg</p>
                                    <p style="margin: 0.3rem 0;"><strong style="color: #4ade80;">Ingreso por Calibre</strong> = Precio Venta × Subtotal Calibre</p>
                                    <p style="margin: 0.3rem 0;"><strong style="color: #22d3ee;">Utilidad por Calibre</strong> = (Precio Venta - Precio Compra) × Subtotal</p>
                                    <p style="margin: 0.3rem 0;"><strong style="color: #22d3ee;">Utilidad Total</strong> = Σ (Utilidades de todos los calibres)</p>
                                </div>
                            </div>

                            <!-- Simulación -->
                            <div style="background: #334155; padding: 1rem; border-radius: 10px;">
                                <h3 style="color: #a78bfa; margin: 0 0 0.8rem 0; font-size: 1rem;">🎯 Modo Simulación</h3>
                                <div style="background: #0f172a; padding: 0.8rem; border-radius: 8px; font-family: monospace; color: #a5f3fc;">
                                    <p style="margin: 0.3rem 0;">Al activar "Simular Venta", puedes editar el <strong style="color: #4ade80;">Precio de Venta</strong></p>
                                    <p style="margin: 0.3rem 0;">de cada calibre y ver cómo cambia la <strong style="color: #fbbf24;">Utilidad neta</strong> en tiempo real.</p>
                                    <p style="margin: 0.3rem 0; color: #94a3b8; font-size: 0.85rem;">Los cambios en simulación NO se guardan permanentemente.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Cerrar modal de fórmulas
function cerrarFormulas() {
    const modal = document.getElementById('formulasModal');
    if (modal) modal.remove();
}

// Export report to Excel (.xlsx) - 14 Columns Format (Clean Implementation)
function exportarReporteExcel() {
    const yearSelect = document.getElementById('reporteFilterYear');
    const monthSelect = document.getElementById('reporteFilterMonth');
    const year = yearSelect ? yearSelect.value : 'all';
    const month = monthSelect ? monthSelect.value : 'all';
    const tipoEnvase = document.getElementById('reporteTipoEnvase').value;
    const loteSeleccionado = document.getElementById('reporteLote').value;

    let filteredEntries = [...entries];

    if (year !== 'all') {
        filteredEntries = filteredEntries.filter(e => new Date(e.fecha).getFullYear().toString() === year);
    }
    if (month !== 'all') {
        filteredEntries = filteredEntries.filter(e => new Date(e.fecha).getMonth().toString() === month);
    }
    if (tipoEnvase) filteredEntries = filteredEntries.filter(e => e.tipoEnvase === tipoEnvase);
    if (loteSeleccionado) filteredEntries = filteredEntries.filter(e => e.codigoLote === loteSeleccionado);

    if (filteredEntries.length === 0) {
        mostrarModalInfo('Aviso', '<p style="text-align: center;">No hay datos para exportar con los filtros actuales.</p>', '⚠️');
        return;
    }

    const envaseNames = { 'margaritos': 'Margaritos', 'chavitos': 'Chavitos', 'bidones': 'Bidones Exportacion', 'tarzas': 'Tarzas' };
    filteredEntries.sort((a, b) => (a.codigoLote || '').localeCompare(b.codigoLote || '') || (b.fecha || '').localeCompare(a.fecha || ''));

    let excel = '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles>';
    excel += '<Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0f172a" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>';
    excel += '<Style ss:ID="Data"><Interior ss:Color="#f2f2f2" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/></Style>';
    excel += '<Style ss:ID="Number"><Interior ss:Color="#f2f2f2" ss:Pattern="Solid"/><NumberFormat ss:Format="#,##0.00"/><Alignment ss:Horizontal="Right"/></Style>';
    excel += '<Style ss:ID="TotalLote"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0f172a" ss:Pattern="Solid"/><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="#,##0.00"/></Style>';
    excel += '<Style ss:ID="TotalLoteLabel"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0f172a" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>';
    excel += '<Style ss:ID="Total"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0f172a" ss:Pattern="Solid"/><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="#,##0.00"/></Style>';
    excel += '<Style ss:ID="ResumenLabel"><Font ss:Bold="1"/><Alignment ss:Horizontal="Right"/></Style>';
    excel += '<Style ss:ID="ResumenGasto"><Font ss:Color="#dc2626"/><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="#,##0.00"/></Style>';
    excel += '<Style ss:ID="ResumenUtilidad"><Font ss:Color="#1e40af" ss:Bold="1"/><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="#,##0.00"/></Style>';
    excel += '<Style ss:ID="ResumenUtilidadNeg"><Font ss:Color="#dc2626" ss:Bold="1"/><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="#,##0.00"/></Style>';
    excel += '</Styles><Worksheet ss:Name="Reporte"><Table ss:DefaultRowHeight="16">';

    const isAdmin = esAdmin();
    const headers = isAdmin
        ? ["Fecha", "Lote", "Vendedor", "Supervisor", "Envase", "Calibre", "P. Compra", "Bidones", "Kg/Bid", "Puchos", "Subtotal Kg", "Valor Compra", "P. Venta", "Valor Venta"]
        : ["Fecha", "Lote", "Vendedor", "Supervisor", "Envase", "Calibre", "Bidones", "Kg/Bid", "Puchos", "Subtotal Kg"];

    excel += '<Row ss:Height="20">' + headers.map(h => `<Cell ss:StyleID="Header"><Data ss:Type="String">${h}</Data></Cell>`).join('') + '</Row>';

    let currentLote = null;
    let lK = 0, lVC = 0, lVV = 0;
    let lTrans = 0, lSalm = 0, lCalMan = 0, lCalTar = 0, lCalNoc = 0, lTrasp = 0;
    let lPersonalDias = {}; // Mapa para acumular costos por día del lote actual
    let tK = 0, tVC = 0, tVV = 0;

    const getV = (v) => parseFloat((v || '0').toString().replace(/[^\d.-]/g, '')) || 0;

    const addLoteResumen = (lote) => {
        if (!lote || lK === 0) return;

        if (isAdmin) {
            excel += `<Row ss:Height="20"><Cell ss:StyleID="TotalLoteLabel" ss:MergeAcross="9"><Data ss:Type="String">TOTAL LOTE ${lote}</Data></Cell>`;
            excel += `<Cell ss:StyleID="TotalLote"><Data ss:Type="Number">${lK.toFixed(2)}</Data></Cell>`;
            excel += `<Cell ss:StyleID="TotalLote"><Data ss:Type="Number">${lVC.toFixed(2)}</Data></Cell>`;
            excel += `<Cell ss:StyleID="TotalLote"><Data ss:Type="String"></Data></Cell>`;
            excel += `<Cell ss:StyleID="TotalLote"><Data ss:Type="Number">${lVV.toFixed(2)}</Data></Cell></Row>`;
        } else {
            excel += `<Row ss:Height="20"><Cell ss:StyleID="TotalLoteLabel" ss:MergeAcross="8"><Data ss:Type="String">TOTAL LOTE ${lote}</Data></Cell>`;
            excel += `<Cell ss:StyleID="TotalLote"><Data ss:Type="Number">${lK.toFixed(2)}</Data></Cell></Row>`;
        }

        if (isAdmin) {
            excel += '<Row ss:Height="5"><Cell></Cell></Row>';

            const gTotal = lTrans + lSalm + lCalMan + lCalTar + lCalNoc + lTrasp;
            const utilidad = lVV - lVC - gTotal;

            const resumen = [
                ['COSTO DE COMPRA', lVC],
                ['TRANSPORTE', lTrans],
                ['COSTO DE SALMUERA', lSalm],
                ['CALIBRACION MAÑANA', lCalMan],
                ['CALIBRACION TARDE', lCalTar],
                ['CALIBRACION NOCHE', lCalNoc]
            ];

            // Añadir cada día de calibración al resumen (desglose)
            Object.keys(lPersonalDias).sort().forEach(fecha => {
                resumen.push([`SBT. CALIBRACION ${fecha}`, lPersonalDias[fecha]]);
            });

            resumen.push(['TRASPALEO', lTrasp]);

            resumen.forEach(item => {
                excel += `<Row><Cell ss:Index="13" ss:StyleID="ResumenLabel"><Data ss:Type="String">${item[0]}</Data></Cell>`;
                excel += `<Cell ss:StyleID="ResumenGasto"><Data ss:Type="Number">${item[1].toFixed(2)}</Data></Cell></Row>`;
            });

            const styleUtil = utilidad >= 0 ? 'ResumenUtilidad' : 'ResumenUtilidadNeg';
            excel += `<Row><Cell ss:Index="13" ss:StyleID="ResumenLabel"><Data ss:Type="String">UTILIDAD</Data></Cell>`;
            excel += `<Cell ss:StyleID="${styleUtil}"><Data ss:Type="Number">${utilidad.toFixed(2)}</Data></Cell></Row>`;
        }
        excel += '<Row ss:Height="25"><Cell></Cell></Row>';
    };

    filteredEntries.forEach(entry => {
        const pC = getV(entry.precio);
        const trans = getV(entry.transporteTotal);
        const salm = getV(entry.totalCostoSalmuera);

        let localCalMan = 0, localCalTar = 0, localCalNoc = 0, localTrasp = 0;
        if (entry.personalTurnos && Array.isArray(entry.personalTurnos)) {
            entry.personalTurnos.forEach(t => {
                const val = getV(t.costoTotal);
                const fechaT = t.fecha ? t.fecha.split('T')[0] : (entry.fecha ? entry.fecha.split('T')[0] : 'N/A');

                if (t.tipoPersonal === 'traspaleadores') {
                    localTrasp += val;
                } else {
                    if (!lPersonalDias[fechaT]) lPersonalDias[fechaT] = 0;
                    lPersonalDias[fechaT] += val;

                    if (t.turno === 'manana') localCalMan += val;
                    else if (t.turno === 'tarde') localCalTar += val;
                    else if (t.turno === 'noche') localCalNoc += val;
                }
            });
        } else {
            localTrasp = getV(entry.traspaleadoresCostoTotal);
            const fechaE = entry.fecha ? entry.fecha.split('T')[0] : 'N/A';
            if (!lPersonalDias[fechaE]) lPersonalDias[fechaE] = 0;
            const cM = getV(entry.varonesCostoTotal);
            const cT = getV(entry.mujeresCostoTotal);
            lPersonalDias[fechaE] += cM + cT;
            localCalMan += cM;
            localCalTar += cT;
        }

        if (entry.codigoLote !== currentLote) {
            addLoteResumen(currentLote);
            currentLote = entry.codigoLote;
            lK = 0; lVC = 0; lVV = 0;
            lTrans = 0; lSalm = 0; lCalMan = 0; lCalTar = 0; lCalNoc = 0; lTrasp = 0;
            lPersonalDias = {};
        }

        lTrans += trans; lSalm += salm; lCalMan += localCalMan; lCalTar += localCalTar; lCalNoc += localCalNoc; lTrasp += localTrasp;
        const cals = (entry.calibres && entry.calibres.length > 0) ? entry.calibres : [{ calibre: 'General', subtotal: entry.cantidad || 0, bidones: 0, kilosPorBidon: 0, sobras: 0 }];

        cals.forEach((c, idx) => {
            const calibreId = `${entry.id}_${idx}`;
            const sk = getV(c.subtotal);

            // LÓGICA DE PRECIO FINAL (Idéntica a la UI)
            let pV_final = 0;
            if (typeof preciosEditados !== 'undefined' && preciosEditados[calibreId]) {
                pV_final = parseFloat(preciosEditados[calibreId].precio_venta);
            } else {
                // Prioridad 1: Precio de Venta Ajustado (BD)
                const pV_ajustado = parseFloat(c.precioVenta || c.precio_venta || c.precio_ajustado) || null;
                // Prioridad 2: Precio Original (Formulario)
                const pV_original = parseFloat(c.precio) || 0;

                if (pV_ajustado !== null && pV_ajustado !== 0) {
                    pV_final = pV_ajustado;
                } else if (pV_original !== 0) {
                    pV_final = pV_original;
                } else {
                    pV_final = pV_General; // Respaldo del lote
                }
            }

            const vc = pC * sk;
            const vv = pV_final * sk;

            lK += sk; lVC += vc; lVV += vv;
            tK += sk; tVC += vc; tVV += vv;

            excel += `<Row><Cell ss:StyleID="Data"><Data ss:Type="String">${entry.fecha || ''}</Data></Cell>`;
            excel += `<Cell ss:StyleID="Data"><Data ss:Type="String">${entry.codigoLote || ''}</Data></Cell>`;
            excel += `<Cell ss:StyleID="Data"><Data ss:Type="String">${entry.vendedor || ''}</Data></Cell>`;
            excel += `<Cell ss:StyleID="Data"><Data ss:Type="String">${entry.supervisor || ''}</Data></Cell>`;
            excel += `<Cell ss:StyleID="Data"><Data ss:Type="String">${envaseNames[entry.tipoEnvase] || ''}</Data></Cell>`;
            excel += `<Cell ss:StyleID="Data"><Data ss:Type="String">${c.calibre || ''}</Data></Cell>`;

            if (isAdmin) {
                excel += `<Cell ss:StyleID="Number"><Data ss:Type="Number">${pC.toFixed(2)}</Data></Cell>`;
            }

            excel += `<Cell ss:StyleID="Number"><Data ss:Type="Number">${getV(c.bidones)}</Data></Cell>`;
            excel += `<Cell ss:StyleID="Number"><Data ss:Type="Number">${getV(c.kilosPorBidon)}</Data></Cell>`;
            excel += `<Cell ss:StyleID="Number"><Data ss:Type="Number">${getV(c.sobras)}</Data></Cell>`;
            excel += `<Cell ss:StyleID="Number"><Data ss:Type="Number">${sk.toFixed(2)}</Data></Cell>`;

            if (isAdmin) {
                excel += `<Cell ss:StyleID="Number"><Data ss:Type="Number">${vc.toFixed(2)}</Data></Cell>`;
                excel += `<Cell ss:StyleID="Number"><Data ss:Type="Number">${pV_final.toFixed(2)}</Data></Cell>`;
                excel += `<Cell ss:StyleID="Number"><Data ss:Type="Number">${vv.toFixed(2)}</Data></Cell>`;
            }

            excel += `</Row>`;
        });
    });

    addLoteResumen(currentLote);

    if (isAdmin) {
        excel += `<Row ss:Height="22"><Cell ss:StyleID="Total" ss:MergeAcross="9"><Data ss:Type="String">TOTAL GENERAL</Data></Cell>`;
        excel += `<Cell ss:StyleID="Total"><Data ss:Type="Number">${tK.toFixed(2)}</Data></Cell>`;
        excel += `<Cell ss:StyleID="Total"><Data ss:Type="Number">${tVC.toFixed(2)}</Data></Cell>`;
        excel += `<Cell ss:StyleID="Total"><Data ss:Type="String"></Data></Cell>`;
        excel += `<Cell ss:StyleID="Total"><Data ss:Type="Number">${tVV.toFixed(2)}</Data></Cell></Row>`;
    } else {
        excel += `<Row ss:Height="22"><Cell ss:StyleID="Total" ss:MergeAcross="8"><Data ss:Type="String">TOTAL GENERAL</Data></Cell>`;
        excel += `<Cell ss:StyleID="Total"><Data ss:Type="Number">${tK.toFixed(2)}</Data></Cell></Row>`;
    }

    excel += '</Table></Worksheet></Workbook>';
    const blob = new Blob([excel], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `Reporte_General_${new Date().toLocaleDateString('en-CA')}.xls`; link.click();
}

function exportarLoteExcel() {
    const lote = document.getElementById('reporteLote').value;
    if (!lote) {
        mostrarModalInfo('Aviso', '<p style="text-align: center;">Seleccione un lote específico.</p>', '⚠️');
        return;
    }
    const filteredEntries = entries.filter(e => e.codigoLote === lote);
    if (filteredEntries.length === 0) return;

    const envaseNames = { 'margaritos': 'Margaritos', 'chavitos': 'Chavitos', 'bidones': 'Bidones Exportacion', 'tarzas': 'Tarzas' };

    let excel = '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles>';
    excel += '<Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0f172a" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>';
    excel += '<Style ss:ID="Data"><Interior ss:Color="#f2f2f2" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/></Style>';
    excel += '<Style ss:ID="Number"><Interior ss:Color="#f2f2f2" ss:Pattern="Solid"/><NumberFormat ss:Format="#,##0.00"/><Alignment ss:Horizontal="Right"/></Style>';
    excel += '<Style ss:ID="TotalLote"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0f172a" ss:Pattern="Solid"/><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="#,##0.00"/></Style>';
    excel += '<Style ss:ID="TotalLoteLabel"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0f172a" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>';
    excel += '<Style ss:ID="ResumenLabel"><Font ss:Bold="1"/><Alignment ss:Horizontal="Right"/></Style>';
    excel += '<Style ss:ID="ResumenGasto"><Font ss:Color="#dc2626"/><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="#,##0.00"/></Style>';
    excel += '<Style ss:ID="ResumenUtilidad"><Font ss:Color="#1e40af" ss:Bold="1"/><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="#,##0.00"/></Style>';
    excel += '<Style ss:ID="ResumenUtilidadNeg"><Font ss:Color="#dc2626" ss:Bold="1"/><Alignment ss:Horizontal="Right"/><NumberFormat ss:Format="#,##0.00"/></Style>';
    excel += '</Styles><Worksheet ss:Name="Lote ' + lote + '"><Table ss:DefaultRowHeight="16">';

    const isAdmin = esAdmin();
    const headers = isAdmin
        ? ["Fecha", "Lote", "Vendedor", "Supervisor", "Envase", "Calibre", "P. Compra", "Bidones", "Kg/Bid", "Puchos", "Subtotal Kg", "Valor Compra", "P. Venta", "Valor Venta"]
        : ["Fecha", "Lote", "Vendedor", "Supervisor", "Envase", "Calibre", "Bidones", "Kg/Bid", "Puchos", "Subtotal Kg"];

    excel += '<Row ss:Height="20">' + headers.map(h => `<Cell ss:StyleID="Header"><Data ss:Type="String">${h}</Data></Cell>`).join('') + '</Row>';

    let tK = 0, tVC = 0, tVV = 0;
    let tTrans = 0, tSalm = 0, tCalMan = 0, tCalTar = 0, tCalNoc = 0, tTrasp = 0;
    let tPersonalDias = {}; // Mapa para desglose del lote
    const getV = (v) => parseFloat((v || '0').toString().replace(/[^\d.-]/g, '')) || 0;

    filteredEntries.forEach(entry => {
        const pC = getV(entry.precio);
        let localCalMan = 0, localCalTar = 0, localCalNoc = 0, localTrasp = 0;
        if (entry.personalTurnos && Array.isArray(entry.personalTurnos)) {
            entry.personalTurnos.forEach(t => {
                const val = getV(t.costoTotal);
                const fechaT = t.fecha ? t.fecha.split('T')[0] : (entry.fecha ? entry.fecha.split('T')[0] : 'N/A');

                if (t.tipoPersonal === 'traspaleadores') {
                    localTrasp += val;
                } else {
                    if (!tPersonalDias[fechaT]) tPersonalDias[fechaT] = 0;
                    tPersonalDias[fechaT] += val;

                    if (t.turno === 'manana') localCalMan += val;
                    else if (t.turno === 'tarde') localCalTar += val;
                    else if (t.turno === 'noche') localCalNoc += val;
                }
            });
        } else {
            localTrasp = getV(entry.traspaleadoresCostoTotal);
            const fechaE = entry.fecha ? entry.fecha.split('T')[0] : 'N/A';
            if (!tPersonalDias[fechaE]) tPersonalDias[fechaE] = 0;
            const cM = getV(entry.varonesCostoTotal);
            const cT = getV(entry.mujeresCostoTotal);
            tPersonalDias[fechaE] += cM + cT;
            localCalMan += cM;
            localCalTar += cT;
        }
        tTrans += getV(entry.transporteTotal);
        tSalm += getV(entry.totalCostoSalmuera);
        tCalMan += localCalMan; tCalTar += localCalTar; tCalNoc += localCalNoc; tTrasp += localTrasp;
        const pV_General = parseFloat(entry.precioVenta || entry.precio_venta) || 0;

        const cals = (entry.calibres && entry.calibres.length > 0) ? entry.calibres : [{ calibre: 'General', subtotal: entry.cantidad || 0, bidones: 0, kilosPorBidon: 0, sobras: 0 }];
        cals.forEach((c, idx) => {
            const calibreId = `${entry.id}_${idx}`;
            const sk = getV(c.subtotal);

            let pV_final = 0;
            if (typeof preciosEditados !== 'undefined' && preciosEditados[calibreId]) {
                pV_final = parseFloat(preciosEditados[calibreId].precio_venta);
            } else {
                const pV_ajustado = parseFloat(c.precioVenta || c.precio_venta || c.precio_ajustado) || null;
                const pV_original = parseFloat(c.precio) || 0;

                if (pV_ajustado !== null && pV_ajustado !== 0) {
                    pV_final = pV_ajustado;
                } else if (pV_original !== 0) {
                    pV_final = pV_original;
                } else {
                    pV_final = pV_General;
                }
            }

            const vc = pC * sk; const vv = pV_final * sk;
            tK += sk; tVC += vc; tVV += vv;

            excel += `<Row><Cell ss:StyleID="Data"><Data ss:Type="String">${entry.fecha || ''}</Data></Cell>`;
            excel += `<Cell ss:StyleID="Data"><Data ss:Type="String">${entry.codigoLote || ''}</Data></Cell>`;
            excel += `<Cell ss:StyleID="Data"><Data ss:Type="String">${entry.vendedor || ''}</Data></Cell>`;
            excel += `<Cell ss:StyleID="Data"><Data ss:Type="String">${entry.supervisor || ''}</Data></Cell>`;
            excel += `<Cell ss:StyleID="Data"><Data ss:Type="String">${envaseNames[entry.tipoEnvase] || ''}</Data></Cell>`;
            excel += `<Cell ss:StyleID="Data"><Data ss:Type="String">${c.calibre || ''}</Data></Cell>`;

            if (isAdmin) {
                excel += `<Cell ss:StyleID="Number"><Data ss:Type="Number">${pC.toFixed(2)}</Data></Cell>`;
            }

            excel += `<Cell ss:StyleID="Number"><Data ss:Type="Number">${getV(c.bidones)}</Data></Cell>`;
            excel += `<Cell ss:StyleID="Number"><Data ss:Type="Number">${getV(c.kilosPorBidon)}</Data></Cell>`;
            excel += `<Cell ss:StyleID="Number"><Data ss:Type="Number">${getV(c.sobras)}</Data></Cell>`;
            excel += `<Cell ss:StyleID="Number"><Data ss:Type="Number">${sk.toFixed(2)}</Data></Cell>`;

            if (isAdmin) {
                excel += `<Cell ss:StyleID="Number"><Data ss:Type="Number">${vc.toFixed(2)}</Data></Cell>`;
                excel += `<Cell ss:StyleID="Number"><Data ss:Type="Number">${pV_final.toFixed(2)}</Data></Cell>`;
                excel += `<Cell ss:StyleID="Number"><Data ss:Type="Number">${vv.toFixed(2)}</Data></Cell>`;
            }
            excel += `</Row>`;
        });
    });

    if (isAdmin) {
        excel += `<Row ss:Height="20"><Cell ss:StyleID="TotalLoteLabel" ss:MergeAcross="9"><Data ss:Type="String">TOTAL LOTE ${lote}</Data></Cell>`;
        excel += `<Cell ss:StyleID="TotalLote"><Data ss:Type="Number">${tK.toFixed(2)}</Data></Cell>`;
        excel += `<Cell ss:StyleID="TotalLote"><Data ss:Type="Number">${tVC.toFixed(2)}</Data></Cell>`;
        excel += `<Cell ss:StyleID="TotalLote"><Data ss:Type="String"></Data></Cell>`;
        excel += `<Cell ss:StyleID="TotalLote"><Data ss:Type="Number">${tVV.toFixed(2)}</Data></Cell></Row>`;
    } else {
        excel += `<Row ss:Height="20"><Cell ss:StyleID="TotalLoteLabel" ss:MergeAcross="8"><Data ss:Type="String">TOTAL LOTE ${lote}</Data></Cell>`;
        excel += `<Cell ss:StyleID="TotalLote"><Data ss:Type="Number">${tK.toFixed(2)}</Data></Cell></Row>`;
    }
    if (isAdmin) {
        excel += '<Row ss:Height="5"><Cell></Cell></Row>';

        const gT = tTrans + tSalm + tCalMan + tCalTar + tCalNoc + tTrasp;
        const ut = tVV - tVC - gT;
        const res = [
            ['COSTO DE COMPRA', tVC],
            ['TRANSPORTE', tTrans],
            ['COSTO DE SALMUERA', tSalm],
            ['CALIBRACION MAÑANA', tCalMan],
            ['CALIBRACION TARDE', tCalTar],
            ['CALIBRACION NOCHE', tCalNoc]
        ];

        Object.keys(tPersonalDias).sort().forEach(fecha => {
            res.push([`SBT. CALIBRACION ${fecha}`, tPersonalDias[fecha]]);
        });

        res.push(['TRASPALEO', tTrasp]);
        res.forEach(i => {
            excel += `<Row><Cell ss:Index="13" ss:StyleID="ResumenLabel"><Data ss:Type="String">${i[0]}</Data></Cell><Cell ss:StyleID="ResumenGasto"><Data ss:Type="Number">${i[1].toFixed(2)}</Data></Cell></Row>`;
        });
        excel += `<Row><Cell ss:Index="13" ss:StyleID="ResumenLabel"><Data ss:Type="String">UTILIDAD</Data></Cell><Cell ss:StyleID="${ut >= 0 ? 'ResumenUtilidad' : 'ResumenUtilidadNeg'}"><Data ss:Type="Number">${ut.toFixed(2)}</Data></Cell></Row>`;
    }

    excel += '</Table></Worksheet></Workbook>';
    const blob = new Blob([excel], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `Detalle_Lote_${lote}.xls`; link.click();
}

// =====================================================
// SISTEMA DE ALMACÉN DINÁMICO
// Jerarquía: Almacén > Filas > Cuadrantes > Lotes > Calibres
// =====================================================

// Asegurar que almacenData tenga estructura de filas
if (!almacenData.filas) {
    almacenData.filas = [];
}

// Abrir modal de reubicación desde el botón principal
function abrirReubicacionDesdeAlmacen() {
    let html = `
        <div id="modalReubicacionMenu" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 1rem;">
            <div style="background: white; border-radius: 24px; width: 100%; max-width: 420px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); animation: modalPremiumIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <div style="background: linear-gradient(135deg, #1e293b, #0f172a); color: white; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <span style="font-size: 1.5rem;">🔄</span>
                        <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; letter-spacing: -0.025em;">Reubicación</h3>
                    </div>
                    <button onclick="cerrarModalReubicacionMenu()" style="background: rgba(255,255,255,0.1); border: none; color: white; width: 36px; height: 36px; border-radius: 10px; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">×</button>
                </div>
                <div style="padding: 2rem;">
                    <p style="color: #64748b; margin-bottom: 2rem; font-size: 0.95rem; text-align: center; font-weight: 500;">Seleccione el tipo de movimiento que desea realizar</p>

                    <div onclick="abrirReubicacionLote()" style="padding: 1.5rem; border: 1.5px solid #f1f5f9; background: #f8fafc; border-radius: 16px; margin-bottom: 1rem; cursor: pointer; display: flex; align-items: center; gap: 1.2rem; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);" 
                         onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='#3d4f31'; this.style.background='white'; this.style.boxShadow='0 10px 15px -3px rgba(0,0,0,0.05)';" 
                         onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='#f1f5f9'; this.style.background='#f8fafc'; this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.02)';">
                        <div style="width: 54px; height: 54px; background: linear-gradient(135deg, #3d4f31, #5a7247); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; flex-shrink: 0; box-shadow: 0 8px 16px -4px rgba(61, 79, 49, 0.4);">📦</div>
                        <div>
                            <div style="font-weight: 700; color: #0f172a; font-size: 1.15rem; margin-bottom: 0.2rem;">Lote Completo</div>
                            <div style="font-size: 0.85rem; color: #64748b; line-height: 1.4;">Mover la totalidad de un lote a una nueva posición.</div>
                        </div>
                    </div>

                    <div onclick="abrirReubicacionCalibre()" style="padding: 1.5rem; border: 1.5px solid #f1f5f9; background: #f8fafc; border-radius: 16px; cursor: pointer; display: flex; align-items: center; gap: 1.2rem; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);"
                         onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='#7c3aed'; this.style.background='white'; this.style.boxShadow='0 10px 15px -3px rgba(0,0,0,0.05)';" 
                         onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='#f1f5f9'; this.style.background='#f8fafc'; this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.02)';">
                        <div style="width: 54px; height: 54px; background: linear-gradient(135deg, #7c3aed, #8b5cf6); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; flex-shrink: 0; box-shadow: 0 8px 16px -4px rgba(124, 58, 237, 0.4);">⚖️</div>
                        <div>
                            <div style="font-weight: 700; color: #0f172a; font-size: 1.15rem; margin-bottom: 0.2rem;">Calibre Específico</div>
                            <div style="font-size: 0.85rem; color: #64748b; line-height: 1.4;">Mover solo una parte o tamaño de un lote.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <style>
            @keyframes modalPremiumIn {
                from { opacity: 0; transform: scale(0.9) translateY(20px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
        </style>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function cerrarModalReubicacionMenu() {
    var modal = document.getElementById('modalReubicacionMenu');
    if (modal) modal.remove();
}

// ===== REUBICAR LOTE =====
function abrirReubicacionLote() {
    cerrarModalReubicacionMenu();
    var lotesDisponibles = [];
    for (var fi = 0; fi < almacenData.filas.length; fi++) {
        var fila = almacenData.filas[fi];
        for (var ci = 0; ci < fila.cuadrantes.length; ci++) {
            var cuad = fila.cuadrantes[ci];
            for (var li = 0; li < cuad.lotes.length; li++) {
                var lote = cuad.lotes[li];
                const calibresLote = safeArray(lote.calibres);
                var totalKg = 0;
                for (var c = 0; c < calibresLote.length; c++) {
                    totalKg += parseFloat(calibresLote[c].kg || 0);
                }
                lotesDisponibles.push({
                    fi: fi, ci: ci, li: li,
                    filaNombre: fila.nombre, cuadNombre: cuad.nombre,
                    codigo: lote.codigo_lote || lote.codigoLote || 'Lote',
                    numCal: calibresLote.length,
                    kg: totalKg,
                    fecha: lote.fecha_ingreso || 'N/A'
                });
            }
        }
    }
    if (lotesDisponibles.length === 0) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">No hay lotes en el almacén para reubicar.</p>', '⚠️');
        return;
    }
    var html = `
        <div id="modalReubicacionLote" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 1rem;">
            <div style="background: white; border-radius: 24px; width: 100%; max-width: 580px; max-height: 90vh; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); animation: modalPremiumIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <div style="background: linear-gradient(135deg, #1e293b, #334155); color: white; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <span style="font-size: 1.5rem;">📦</span>
                        <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700;">Reubicar Lote</h3>
                    </div>
                    <button onclick="cerrarModalReubicacionLote()" style="background: rgba(255,255,255,0.1); border: none; color: white; width: 36px; height: 36px; border-radius: 10px; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
                </div>
                <div class="modal-scroll" style="padding: 1.5rem; max-height: 65vh; overflow-y: auto;">
                    <p style="color: #64748b; margin-bottom: 1.5rem; font-size: 0.95rem; font-weight: 500;">Selecciona el lote que deseas mover:</p>
                    ${lotesDisponibles.map(item => `
                        <div onclick="seleccionarLoteParaReubicar(${item.fi}, ${item.ci}, ${item.li})" style="padding: 1.2rem; border: 1.5px solid #f1f5f9; background: #fff; border-radius: 16px; margin-bottom: 0.8rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                            <div style="display: flex; gap: 1rem; align-items: center;">
                                <div style="width: 42px; height: 42px; border-radius: 10px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">📦</div>
                                <div>
                                    <div style="font-weight: 700; color: #0f172a; font-size: 1.05rem; margin-bottom: 0.2rem;">${item.codigo}</div>
                                    <div style="font-size: 0.8rem; color: #64748b; font-weight: 500;">📍 ${item.filaNombre} › ${item.cuadNombre}</div>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: 700; color: #3d4f31; font-size: 1rem;">${parseFloat(item.kg || 0).toFixed(1)} Kg</div>
                                <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">${item.numCal} calibre(s)</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function cerrarModalReubicacionLote() {
    var modal = document.getElementById('modalReubicacionLote');
    if (modal) modal.remove();
}

function seleccionarLoteParaReubicar(fi, ci, li) {
    cerrarModalReubicacionLote();
    var lote = almacenData.filas[fi].cuadrantes[ci].lotes[li];
    var totalKg = 0;
    if (lote.calibres) {
        for (var c = 0; c < lote.calibres.length; c++) totalKg += parseFloat(lote.calibres[c].kg || 0);
    }
    var destinos = [];
    for (var f = 0; f < almacenData.filas.length; f++) {
        for (var c = 0; c < almacenData.filas[f].cuadrantes.length; c++) {
            if (f !== fi || c !== ci) {
                destinos.push({
                    f: f,
                    c: c,
                    nombre: almacenData.filas[f].cuadrantes[c].nombre,
                    fila: almacenData.filas[f].nombre
                });
            }
        }
    }
    if (destinos.length === 0) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">No hay otros cuadrantes disponibles.</p>', '⚠️');
        return;
    }
    var html = `
        <div id="modalDestinoLote" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 1rem;">
            <div style="background: white; border-radius: 24px; width: 100%; max-width: 440px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); animation: modalPremiumIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <div style="background: linear-gradient(135deg, #3d4f31, #0f172a); color: white; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <span style="font-size: 1.5rem;">📍</span>
                        <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700;">Destino del Lote</h3>
                    </div>
                    <button onclick="cerrarModalDestinoLote()" style="background: rgba(255,255,255,0.1); border: none; color: white; width: 36px; height: 36px; border-radius: 10px; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
                </div>
                <div class="modal-scroll" style="padding: 1.5rem; max-height: 60vh; overflow-y: auto;">
                    <div style="background: #f8fafc; padding: 1rem; border-radius: 12px; border: 1.5px dashed #cbd5e1; margin-bottom: 1.5rem;">
                        <p style="margin: 0; color: #64748b; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem;">Moviendo Lote:</p>
                        <div style="font-weight: 700; color: #1e293b; font-size: 1.1rem;">📦 ${lote.codigo_lote || lote.codigoLote || 'Lote'}</div>
                        <div style="font-size: 0.9rem; color: #3d4f31; font-weight: 600; margin-top: 0.2rem;">${parseFloat(totalKg || 0).toFixed(1)} Kg</div>
                    </div>
                    <p style="color: #64748b; margin-bottom: 1rem; font-size: 0.95rem; font-weight: 500;">Selecciona el cuadrante de destino:</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
                        ${destinos.map(d => `
                            <div onclick="ejecutarMoverLote(${fi}, ${ci}, ${li}, ${d.f}, ${d.c})" style="padding: 1rem; border: 1.5px solid #f1f5f9; background: #fff; border-radius: 14px; cursor: pointer; transition: all 0.2s; text-align: center;"
                                 onmouseover="this.style.borderColor='#3d4f31'; this.style.background='#f0fdf4';" 
                                 onmouseout="this.style.borderColor='#f1f5f9'; this.style.background='#fff';">
                                <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 0.2rem;">${d.fila}</div>
                                <div style="font-weight: 700; color: #1e293b; font-size: 1.1rem;">${d.nombre}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function cerrarModalDestinoLote() {
    var modal = document.getElementById('modalDestinoLote');
    if (modal) modal.remove();
}

async function ejecutarMoverLote(ofi, oci, oli, dfi, dci) {
    try {
        var lote = almacenData.filas[ofi].cuadrantes[oci].lotes[oli];
        var destinoCuadrante = almacenData.filas[dfi].cuadrantes[dci];

        if (!lote || !lote.id) {
            mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">El lote no tiene ID válido</p>', '❌');
            cerrarModalDestinoLote();
            return;
        }

        if (!destinoCuadrante || !destinoCuadrante.id) {
            mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">El cuadrante destino no tiene ID válido</p>', '❌');
            cerrarModalDestinoLote();
            return;
        }

        // Validar que no sea zona de maquinaria
        const destNombre = (destinoCuadrante.nombre || '').toUpperCase().replace(/[-\s]/g, '');
        if (destNombre === 'A4' || destNombre === 'A5') {
            mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No puedes mover lotes a la zona de maquinaria (A-4, A-5).</p>', '⚙️');
            cerrarModalDestinoLote();
            return;
        }

        // Mover en la BD
        await API.almacen.moverLote({
            loteId: lote.id,
            destinoCuadranteId: destinoCuadrante.id
        });

        // Recargar datos y actualizar mapa
        await cargarAlmacenDesdeAPI();

        cerrarModalDestinoLote();
        initCuadrantes();

        showToast('Lote movido correctamente.', 'success', 'Movimiento Exitoso');
    } catch (error) {
        console.error('Error moviendo lote:', error);
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo mover: ' + error.message + '</p>', '❌');
        cerrarModalDestinoLote();
    }
}

// ===== REUBICAR CALIBRE =====
function abrirReubicacionCalibre() {
    cerrarModalReubicacionMenu();
    var calibres = [];
    for (var fi = 0; fi < almacenData.filas.length; fi++) {
        var fila = almacenData.filas[fi];
        for (var ci = 0; ci < fila.cuadrantes.length; ci++) {
            var cuad = fila.cuadrantes[ci];
            for (var li = 0; li < cuad.lotes.length; li++) {
                var lote = cuad.lotes[li];
                const calibresLote = safeArray(lote.calibres);
                for (var cali = 0; cali < calibresLote.length; cali++) {
                    var cal = calibresLote[cali];
                    calibres.push({
                        fi: fi, ci: ci, li: li, cali: cali,
                        filaNombre: fila.nombre, cuadNombre: cuad.nombre,
                        loteCodigo: lote.codigo_lote || lote.codigoLote || 'Lote',
                        calibre: cal.calibre,
                        kg: parseFloat(cal.kg || 0)
                    });
                }
            }
        }
    }
    if (calibres.length === 0) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">No hay calibres en el almacén para reubicar.</p>', '⚠️');
        return;
    }
    var html = `
        <div id="modalReubicacionGeneral" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 1rem;">
            <div style="background: white; border-radius: 24px; width: 100%; max-width: 580px; max-height: 90vh; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); animation: modalPremiumIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <div style="background: linear-gradient(135deg, #7c3aed, #4c1d95); color: white; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <span style="font-size: 1.5rem;">⚖️</span>
                        <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700;">Reubicar Calibre</h3>
                    </div>
                    <button onclick="cerrarModalReubicacionGeneral()" style="background: rgba(255,255,255,0.1); border: none; color: white; width: 36px; height: 36px; border-radius: 10px; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
                </div>
                <div class="modal-scroll" style="padding: 1.5rem; max-height: 65vh; overflow-y: auto;">
                    <p style="color: #64748b; margin-bottom: 1.5rem; font-size: 0.95rem; font-weight: 500;">Selecciona el calibre que deseas mover:</p>
                    ${calibres.map(item => `
                        <div onclick="seleccionarCalibreParaReubicar(${item.fi}, ${item.ci}, ${item.li}, ${item.cali})" style="padding: 1.2rem; border: 1.5px solid #f1f5f9; background: #fff; border-radius: 16px; margin-bottom: 0.8rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                            <div style="display: flex; gap: 1rem; align-items: center;">
                                <div style="width: 42px; height: 42px; border-radius: 10px; background: #f5f3ff; color: #7c3aed; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 700;">${item.calibre.charAt(0)}</div>
                                <div>
                                    <div style="font-weight: 800; color: #0f172a; font-size: 1.05rem; margin-bottom: 0.1rem;">⚖️ ${item.calibre}</div>
                                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">📦 ${item.loteCodigo} • 📍 ${item.cuadNombre}</div>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: 700; color: #7c3aed; font-size: 1.1rem;">${item.kg.toFixed(1)} Kg</div>
                                <div style="font-size: 0.7rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Mover</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function cerrarModalReubicacionGeneral() {
    var modal = document.getElementById('modalReubicacionGeneral');
    if (modal) modal.remove();
}

function seleccionarCalibreParaReubicar(fi, ci, li, cali) {
    cerrarModalReubicacionGeneral();
    moverCalibre(fi, ci, li, cali);
}

// Guardar datos del almacén (Las operaciones individuales ya guardan en BD automáticamente)
async function guardarAlmacen() {
    // Esta función se mantiene por compatibilidad
    // Las operaciones como createFila, createCuadrante, etc. ya guardan en BD
}

// Renderizar el almacén completo
function renderizarAlmacen() {
    const container = document.getElementById('filasAlmacenContainer');
    const sinFilas = document.getElementById('sinFilas');

    if (!container) return;

    const filas = safeArray(almacenData.filas);

    if (filas.length === 0) {
        container.innerHTML = `
                    <div id="sinFilas" style="text-align: center; padding: 3rem; color: #94a3b8;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
                        <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No hay filas en el almacén</p>
                        <p style="font-size: 0.9rem;">Haz clic en "Nueva Fila" para comenzar a organizar tu almacén</p>
                    </div>
                `;
        return;
    }

    let html = '';
    filas.forEach((fila, filaIndex) => {
        const cuadrantes = safeArray(fila.cuadrantes);
        html += `
                    <div class="fila-almacen" style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 1.5rem;">
                        <!-- Header de la Fila -->
                        <div style="background: linear-gradient(135deg, #3d4f31, #5a7247); color: white; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                            <div style="display: flex; align-items: center; gap: 0.8rem;">
                                <span style="font-size: 1.5rem;">📍</span>
                                <div>
                                    <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700;">${fila.nombre}</h3>
                                    <p style="margin: 0; font-size: 0.8rem; opacity: 0.8;">${cuadrantes.length} cuadrante(s)</p>
                                </div>
                            </div>
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                <button onclick="agregarCuadrante(${filaIndex})" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 500;">
                                    ➕ Cuadrante
                                </button>
                                <button onclick="editarFila(${filaIndex})" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">
                                    ✏️
                                </button>
                                <button onclick="eliminarFila(${filaIndex})" style="background: rgba(239,68,68,0.8); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">
                                    🗑️
                                </button>
                            </div>
                        </div>
                        
                        <!-- Cuadrantes de la Fila -->
                        <div style="padding: 1rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
                    ${cuadrantes.length === 0 ? `
                                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #94a3b8; border: 2px dashed #e2e8f0; border-radius: 10px;">
                                    <p style="margin: 0;">Sin cuadrantes - Haz clic en "+ Cuadrante"</p>
                                </div>
                            ` : cuadrantes.map((cuadrante, cuadranteIndex) => renderizarCuadrante(cuadrante, filaIndex, cuadranteIndex)).join('')}
                        </div>
                    </div>
                `;
    });

    container.innerHTML = html;
}

// Renderizar un cuadrante
function renderizarCuadrante(cuadrante, filaIndex, cuadranteIndex) {
    const lotes = safeArray(cuadrante.lotes);
    const totalKg = lotes.reduce((sum, lote) => {
        const calibres = safeArray(lote.calibres);
        return sum + calibres.reduce((s, c) => s + safeKg(c.kg), 0);
    }, 0);

    return `
                <div class="cuadrante-card" style="background: white; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">
                    <!-- Header Cuadrante -->
                    <div style="background: #1e293b; color: white; padding: 0.8rem 1rem; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="font-weight: 600; font-size: 0.95rem;">${cuadrante.nombre}</span>
                            <span style="font-size: 0.75rem; opacity: 0.7; margin-left: 0.5rem;">(${totalKg.toFixed(1)} Kg)</span>
                        </div>
                        <div style="display: flex; gap: 0.3rem;">
                            <button onclick="agregarLoteACuadrante(${filaIndex}, ${cuadranteIndex})" style="background: #3d4f31; color: white; border: none; padding: 0.3rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.7rem;">
                                + Lote
                            </button>
                            <button onclick="eliminarCuadrante(${filaIndex}, ${cuadranteIndex})" style="background: #dc2626; color: white; border: none; padding: 0.3rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.7rem;">
                                ✕
                            </button>
                        </div>
                    </div>
                    
                    <!-- Contenido del Cuadrante -->
                    <div style="padding: 0.8rem; max-height: 300px; overflow-y: auto;">
                        ${lotes.length === 0 ? `
                            <p style="text-align: center; color: #94a3b8; font-size: 0.85rem; padding: 1rem;">Sin lotes asignados</p>
                        ` : lotes.map((lote, loteIndex) => renderizarLoteEnCuadrante(lote, filaIndex, cuadranteIndex, loteIndex)).join('')}
                    </div>
                </div>
            `;
}

// Renderizar un lote dentro de un cuadrante
function renderizarLoteEnCuadrante(lote, filaIndex, cuadranteIndex, loteIndex) {
    const calibres = safeArray(lote.calibres);
    const totalLoteKg = calibres.reduce((sum, c) => sum + safeKg(c.kg), 0);

    return `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 0.5rem; overflow: hidden;">
                    <!-- Header del Lote -->
                    <div style="background: #e2e8f0; padding: 0.5rem 0.8rem; display: flex; flex-direction: column;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
                            <span style="font-weight: 600; font-size: 0.85rem; color: #1e293b;">📦 ${lote.codigo_lote || lote.codigoLote || 'Lote'}</span>
                            <div style="display: flex; align-items: center; gap: 0.3rem;">
                                <button onclick="quitarLoteDeCuadrante(${filaIndex}, ${cuadranteIndex}, ${loteIndex})" style="background: transparent; border: none; color: #dc2626; cursor: pointer; font-size: 0.8rem;">✕</button>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.7rem; color: #64748b;">📅 ${lote.fecha_ingreso || 'N/A'}</span>
                            <span style="font-size: 0.75rem; font-weight: 600; color: #3d4f31;">${totalLoteKg.toFixed(1)} Kg</span>
                        </div>
                    </div>
                    
                    <!-- Calibres del Lote -->
                    <div style="padding: 0.5rem;">
                        ${calibres.map((calibre, calibreIndex) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.3rem 0.5rem; background: white; border-radius: 4px; margin-bottom: 0.3rem; font-size: 0.8rem;">
                                <span style="color: #3d4f31; font-weight: 500;">${calibre.calibre}</span>
                                <span style="color: #64748b;">${safeKg(calibre.kg)} Kg</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
}

// Abrir modal para nueva fila
function abrirModalNuevaFila() {
    var html = '<div id="modalNuevaFila" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 1rem;">';
    html += '<div style="background: white; border-radius: 16px; width: 100%; max-width: 400px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">';
    html += '<div style="background: linear-gradient(135deg, #3d4f31, #5a7247); color: white; padding: 1.2rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">';
    html += '<div style="display: flex; align-items: center; gap: 0.8rem;"><span style="font-size: 1.5rem;">📁</span><h3 style="margin: 0; font-size: 1.1rem;">Nueva Fila</h3></div>';
    html += '<button onclick="cerrarModalNuevaFila()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 8px; font-size: 1.2rem; cursor: pointer;">×</button>';
    html += '</div>';
    html += '<div style="padding: 1.5rem;">';
    html += '<label style="display: block; font-size: 0.85rem; color: #64748b; margin-bottom: 0.5rem; font-weight: 600;">Nombre de la nueva fila:</label>';
    html += '<input type="text" id="inputNuevaFila" placeholder="Ej: Zona A" style="width: 100%; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 1rem; box-sizing: border-box;">';
    html += '</div>';
    html += '<div style="padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.8rem;">';
    html += '<button onclick="cerrarModalNuevaFila()" style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 0.7rem 1.2rem; border-radius: 8px; cursor: pointer; color: #64748b;">Cancelar</button>';
    html += '<button onclick="confirmarNuevaFila()" style="background: linear-gradient(135deg, #3d4f31, #5a7247); color: white; border: none; padding: 0.7rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer;">Crear Fila</button>';
    html += '</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('inputNuevaFila').focus();
}

function cerrarModalNuevaFila() {
    var modal = document.getElementById('modalNuevaFila');
    if (modal) modal.remove();
}

async function confirmarNuevaFila() {
    var nombre = document.getElementById('inputNuevaFila').value.trim();

    if (!nombre) {
        cerrarModalNuevaFila();
        return;
    }

    try {
        // Guardar en BD
        const response = await API.almacen.createFila({
            nombre: nombre,
            orden: almacenData.filas ? almacenData.filas.length : 0
        });

        // Recargar datos del almacén
        await cargarAlmacenDesdeAPI();
        renderizarAlmacen();

        cerrarModalNuevaFila();
    } catch (error) {
        console.error('Error creando fila:', error);
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo crear la fila: ' + error.message + '</p>', '❌');
        cerrarModalNuevaFila();
    }
}

// Editar nombre de fila
function editarFila(filaIndex) {
    var fila = almacenData.filas[filaIndex];
    var html = '<div id="modalEditarFila" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 1rem;">';
    html += '<div style="background: white; border-radius: 16px; width: 100%; max-width: 400px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">';
    html += '<div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 1.2rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">';
    html += '<div style="display: flex; align-items: center; gap: 0.8rem;"><span style="font-size: 1.5rem;">✏️</span><h3 style="margin: 0; font-size: 1.1rem;">Editar Fila</h3></div>';
    html += '<button onclick="cerrarModalEditarFila()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 8px; font-size: 1.2rem; cursor: pointer;">×</button>';
    html += '</div>';
    html += '<div style="padding: 1.5rem;">';
    html += '<label style="display: block; font-size: 0.85rem; color: #64748b; margin-bottom: 0.5rem; font-weight: 600;">Nuevo nombre de la fila:</label>';
    html += '<input type="text" id="inputEditarFila" value="' + fila.nombre + '" style="width: 100%; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 1rem; box-sizing: border-box;">';
    html += '<input type="hidden" id="indexEditarFila" value="' + filaIndex + '">';
    html += '</div>';
    html += '<div style="padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.8rem;">';
    html += '<button onclick="cerrarModalEditarFila()" style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 0.7rem 1.2rem; border-radius: 8px; cursor: pointer; color: #64748b;">Cancelar</button>';
    html += '<button onclick="confirmarEditarFila()" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; border: none; padding: 0.7rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer;">Guardar</button>';
    html += '</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('inputEditarFila').focus();
    document.getElementById('inputEditarFila').select();
}

function cerrarModalEditarFila() {
    var modal = document.getElementById('modalEditarFila');
    if (modal) modal.remove();
}

async function confirmarEditarFila() {
    var nombre = document.getElementById('inputEditarFila').value.trim();
    var index = parseInt(document.getElementById('indexEditarFila').value);

    if (!nombre) {
        cerrarModalEditarFila();
        return;
    }

    try {
        var fila = almacenData.filas[index];

        if (!fila || !fila.id) {
            mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">La fila no tiene ID válido</p>', '❌');
            cerrarModalEditarFila();
            return;
        }

        // Actualizar en la BD
        await API.almacen.updateFila(fila.id, { nombre: nombre });

        // Recargar datos del almacén
        await cargarAlmacenDesdeAPI();
        renderizarAlmacen();

        cerrarModalEditarFila();
    } catch (error) {
        console.error('Error editando fila:', error);
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo editar: ' + error.message + '</p>', '❌');
        cerrarModalEditarFila();
    }
}

// Eliminar fila
function eliminarFila(filaIndex) {
    var fila = almacenData.filas[filaIndex];
    var html = '<div id="modalConfirmarEliminar" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 1rem;">';
    html += '<div style="background: white; border-radius: 16px; width: 100%; max-width: 400px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">';
    html += '<div style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 1.2rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">';
    html += '<div style="display: flex; align-items: center; gap: 0.8rem;"><span style="font-size: 1.5rem;">🗑️</span><h3 style="margin: 0; font-size: 1.1rem;">Eliminar Fila</h3></div>';
    html += '<button onclick="cerrarModalConfirmarEliminar()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 8px; font-size: 1.2rem; cursor: pointer;">×</button>';
    html += '</div>';
    html += '<div style="padding: 1.5rem; text-align: center;">';
    html += '<p style="color: #1e293b; margin-bottom: 0.5rem;">¿Eliminar la fila <strong>"' + fila.nombre + '"</strong>?</p>';
    html += '<p style="color: #dc2626; font-size: 0.85rem;">Esta acción eliminará todos sus cuadrantes y no se puede deshacer.</p>';
    html += '<input type="hidden" id="indexEliminarFila" value="' + filaIndex + '">';
    html += '</div>';
    html += '<div style="padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.8rem;">';
    html += '<button onclick="cerrarModalConfirmarEliminar()" style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 0.7rem 1.2rem; border-radius: 8px; cursor: pointer; color: #64748b;">Cancelar</button>';
    html += '<button onclick="confirmarEliminarFila()" style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; border: none; padding: 0.7rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer;">Eliminar</button>';
    html += '</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
}

function cerrarModalConfirmarEliminar() {
    var modal = document.getElementById('modalConfirmarEliminar');
    if (modal) modal.remove();
}

async function confirmarEliminarFila() {
    try {
        var index = parseInt(document.getElementById('indexEliminarFila').value);
        var fila = almacenData.filas[index];

        if (!fila || !fila.id) {
            mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">La fila no tiene ID válido</p>', '❌');
            cerrarModalConfirmarEliminar();
            return;
        }

        // Eliminar de la BD
        await API.almacen.deleteFila(fila.id);

        // Recargar datos del almacén
        await cargarAlmacenDesdeAPI();
        renderizarAlmacen();

        cerrarModalConfirmarEliminar();
    } catch (error) {
        console.error('Error eliminando fila:', error);
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo eliminar: ' + error.message + '</p>', '❌');
        cerrarModalConfirmarEliminar();
    }
}

// Agregar cuadrante a una fila
function agregarCuadrante(filaIndex) {
    var html = '<div id="modalNuevoCuadrante" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 1rem;">';
    html += '<div style="background: white; border-radius: 16px; width: 100%; max-width: 400px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">';
    html += '<div style="background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; padding: 1.2rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">';
    html += '<div style="display: flex; align-items: center; gap: 0.8rem;"><span style="font-size: 1.5rem;">📦</span><h3 style="margin: 0; font-size: 1.1rem;">Nuevo Cuadrante</h3></div>';
    html += '<button onclick="cerrarModalNuevoCuadrante()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 8px; font-size: 1.2rem; cursor: pointer;">×</button>';
    html += '</div>';
    html += '<div style="padding: 1.5rem;">';
    html += '<label style="display: block; font-size: 0.85rem; color: #64748b; margin-bottom: 0.5rem; font-weight: 600;">Nombre del cuadrante:</label>';
    html += '<input type="text" id="inputNuevoCuadrante" placeholder="Ej: Cuadrante 1" style="width: 100%; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 1rem; box-sizing: border-box;">';
    html += '<input type="hidden" id="indexFilaCuadrante" value="' + filaIndex + '">';
    html += '</div>';
    html += '<div style="padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.8rem;">';
    html += '<button onclick="cerrarModalNuevoCuadrante()" style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 0.7rem 1.2rem; border-radius: 8px; cursor: pointer; color: #64748b;">Cancelar</button>';
    html += '<button onclick="confirmarNuevoCuadrante()" style="background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; border: none; padding: 0.7rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer;">Crear</button>';
    html += '</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('inputNuevoCuadrante').focus();
}

function cerrarModalNuevoCuadrante() {
    var modal = document.getElementById('modalNuevoCuadrante');
    if (modal) modal.remove();
}

async function confirmarNuevoCuadrante() {
    var nombre = document.getElementById('inputNuevoCuadrante').value.trim();
    var filaIndex = parseInt(document.getElementById('indexFilaCuadrante').value);

    if (!nombre) {
        cerrarModalNuevoCuadrante();
        return;
    }

    try {
        // Obtener el ID de la fila de la BD
        const fila = almacenData.filas[filaIndex];
        if (!fila || !fila.id) {
            mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">La fila no tiene ID. Recarga la página.</p>', '❌');
            cerrarModalNuevoCuadrante();
            return;
        }

        // Guardar en BD
        const response = await API.almacen.createCuadrante({
            filaId: fila.id,
            nombre: nombre,
            orden: fila.cuadrantes ? fila.cuadrantes.length : 0
        });

        // Recargar datos del almacén
        await cargarAlmacenDesdeAPI();
        renderizarAlmacen();

        cerrarModalNuevoCuadrante();
    } catch (error) {
        console.error('Error creando cuadrante:', error);
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo crear el cuadrante: ' + error.message + '</p>', '❌');
        cerrarModalNuevoCuadrante();
    }
}

// Eliminar cuadrante
function eliminarCuadrante(filaIndex, cuadranteIndex) {
    var cuadrante = almacenData.filas[filaIndex].cuadrantes[cuadranteIndex];
    var html = '<div id="modalConfirmarEliminarCuad" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 1rem;">';
    html += '<div style="background: white; border-radius: 16px; width: 100%; max-width: 400px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">';
    html += '<div style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; padding: 1.2rem 1.5rem; display: flex; justify-content: space-between; align-items: center;">';
    html += '<div style="display: flex; align-items: center; gap: 0.8rem;"><span style="font-size: 1.5rem;">🗑️</span><h3 style="margin: 0; font-size: 1.1rem;">Eliminar Cuadrante</h3></div>';
    html += '<button onclick="cerrarModalConfirmarEliminarCuad()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 8px; font-size: 1.2rem; cursor: pointer;">×</button>';
    html += '</div>';
    html += '<div style="padding: 1.5rem; text-align: center;">';
    html += '<p style="color: #1e293b; margin-bottom: 0.5rem;">¿Eliminar el cuadrante <strong>"' + cuadrante.nombre + '"</strong>?</p>';
    html += '<p style="color: #dc2626; font-size: 0.85rem;">Esta acción no se puede deshacer.</p>';
    html += '<input type="hidden" id="indexFilaElimCuad" value="' + filaIndex + '">';
    html += '<input type="hidden" id="indexCuadElimCuad" value="' + cuadranteIndex + '">';
    html += '</div>';
    html += '<div style="padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.8rem;">';
    html += '<button onclick="cerrarModalConfirmarEliminarCuad()" style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 0.7rem 1.2rem; border-radius: 8px; cursor: pointer; color: #64748b;">Cancelar</button>';
    html += '<button onclick="confirmarEliminarCuadrante()" style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; border: none; padding: 0.7rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer;">Eliminar</button>';
    html += '</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
}

function cerrarModalConfirmarEliminarCuad() {
    var modal = document.getElementById('modalConfirmarEliminarCuad');
    if (modal) modal.remove();
}

async function confirmarEliminarCuadrante() {
    try {
        var filaIndex = parseInt(document.getElementById('indexFilaElimCuad').value);
        var cuadranteIndex = parseInt(document.getElementById('indexCuadElimCuad').value);
        var cuadrante = almacenData.filas[filaIndex].cuadrantes[cuadranteIndex];

        if (!cuadrante || !cuadrante.id) {
            mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">El cuadrante no tiene ID válido</p>', '❌');
            cerrarModalConfirmarEliminarCuad();
            return;
        }

        // Eliminar de la BD
        await API.almacen.deleteCuadrante(cuadrante.id);

        // Recargar datos del almacén
        await cargarAlmacenDesdeAPI();
        renderizarAlmacen();

        cerrarModalConfirmarEliminarCuad();
    } catch (error) {
        console.error('Error eliminando cuadrante:', error);
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo eliminar: ' + error.message + '</p>', '❌');
        cerrarModalConfirmarEliminarCuad();
    }
}

// Agregar lote a un cuadrante (seleccionar de los lotes registrados)
function agregarLoteACuadrante(filaIndex, cuadranteIndex) {
    // 1. Obtener todos los lotes ya asignados en el almacén para calcular saldos
    const asignacionesPorEntrada = {}; // entradaId -> { calibre -> kgAsignados }

    if (almacenData && almacenData.filas) {
        almacenData.filas.forEach(f => {
            (f.cuadrantes || []).forEach(c => {
                (c.lotes || []).forEach(l => {
                    if (l.entrada_id) {
                        if (!asignacionesPorEntrada[l.entrada_id]) asignacionesPorEntrada[l.entrada_id] = {};
                        (l.calibres || []).forEach(cal => {
                            const calNombre = (cal.calibre || '').trim();
                            if (!asignacionesPorEntrada[l.entrada_id][calNombre]) asignacionesPorEntrada[l.entrada_id][calNombre] = 0;
                            asignacionesPorEntrada[l.entrada_id][calNombre] += parseFloat(cal.kg) || 0;
                        });
                    }
                });
            });
        });
    }

    // 2. Filtrar lotes que tengan saldo disponible
    const lotesDisponibles = entries.filter(e => {
        if (!e.codigoLote || !e.calibres || e.calibres.length === 0) return false;
        const asignado = asignacionesPorEntrada[e.id] || {};
        let tieneSaldo = false;
        e.calibres.forEach(c => {
            const kgRestantes = (parseFloat(c.subtotal) || 0) - (asignado[c.calibre] || 0);
            if (kgRestantes > 0.1) tieneSaldo = true;
        });
        return tieneSaldo;
    }).map(lote => {
        const asignado = asignacionesPorEntrada[lote.id] || {};
        const calibresConSaldo = lote.calibres.map(c => {
            const kgTotal = parseFloat(c.subtotal) || 0;
            const kgAsignado = asignado[c.calibre] || 0;
            const kgRestante = Math.max(0, kgTotal - kgAsignado);
            return { ...c, kgRestante, isSplit: kgAsignado > 0 };
        });
        return { ...lote, calibresConSaldo };
    });

    if (lotesDisponibles.length === 0) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">No hay lotes con saldo disponible para asignar. Todos los lotes registrados ya están en el almacén.</p>', '⚠️');
        return;
    }

    let html = `
        <div id="modalSeleccionLote" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 1rem;">
            <div style="background: white; border-radius: 24px; width: 100%; max-width: 580px; max-height: 85vh; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); animation: modalPremiumIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <div style="background: linear-gradient(135deg, #3d4f31, #1e293b); color: white; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em;">Asignar Lote a Almacén</h3>
                        <p style="margin: 0; font-size: 0.8rem; opacity: 0.8; font-weight: 500;">Mostrando solo el saldo restante de cada lote</p>
                    </div>
                    <button onclick="cerrarModalSeleccionLote()" style="background: rgba(255,255,255,0.1); border: none; color: white; width: 36px; height: 36px; border-radius: 10px; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
                </div>
                <div class="modal-scroll" style="padding: 1.5rem; max-height: 65vh; overflow-y: auto;">
                    ${lotesDisponibles.map(lote => {
        const isSplit = lote.calibresConSaldo.some(c => c.isSplit);
        return `
                        <div onclick="seleccionarLote(${filaIndex}, ${cuadranteIndex}, ${lote.id})" style="padding: 1.2rem; border: 1.5px solid ${isSplit ? '#fbbf24' : '#f1f5f9'}; background: ${isSplit ? '#fffbeb' : '#fff'}; border-radius: 18px; margin-bottom: 1rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
                                <div style="display: flex; flex-direction: column;">
                                    <div style="font-weight: 800; color: #0f172a; font-size: 1.15rem; letter-spacing: -0.01em;">📦 ${lote.codigoLote}</div>
                                    <div style="font-size: 0.85rem; color: #64748b; font-weight: 600; margin-top: 0.1rem;">👤 ${lote.vendedor || 'Proveedor'}</div>
                                </div>
                                ${isSplit ? '<span style="background: #f59e0b; color: white; font-size: 0.65rem; padding: 0.3rem 0.6rem; border-radius: 6px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Dividido</span>' : ''}
                            </div>
                            
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.6rem;">
                                ${lote.calibresConSaldo.map(c => `
                                    <div style="font-size: 0.85rem; background: ${c.isSplit ? 'rgba(255,251,235,0.8)' : '#f8fafc'}; padding: 0.6rem; border-radius: 10px; border: 1px solid ${c.isSplit ? '#fde68a' : '#f1f5f9'};">
                                        <div style="color: #64748b; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.2rem;">${c.calibre}</div>
                                        <div style="color: ${c.isSplit ? '#b45309' : '#3d4f31'}; font-weight: 800; font-size: 0.95rem;">${c.kgRestante.toFixed(1)} Kg</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

// Cerrar modal de selección de lote
function cerrarModalSeleccionLote() {
    const modal = document.getElementById('modalSeleccionLote');
    if (modal) modal.remove();
}

// Seleccionar un lote para agregar al cuadrante
async function seleccionarLote(filaIndex, cuadranteIndex, loteId) {
    try {
        const entry = entries.find(e => e.id === loteId);
        if (!entry) return;

        // 1. Obtener disponibilidad REAL desde el servidor (Unificada)
        const disponibilidad = await API.almacen.getDisponibilidad(loteId);

        // 2. Determinar si ya tiene presencia física en el almacén
        const tieneAsignacionesFisicas = disponibilidad.some(d => d.kg_en_almacen > 0.05);

        // 3. Obtener el ID del cuadrante destino
        const cuadrante = almacenData.filas[filaIndex].cuadrantes[cuadranteIndex];
        if (!cuadrante || !cuadrante.id) return;

        // 4. Construir estructura del lote para la API
        const loteData = {
            cuadranteId: cuadrante.id,
            entradaId: loteId,
            codigoLote: tieneAsignacionesFisicas ? entry.codigoLote + ' (Resto)' : entry.codigoLote,
            calibres: disponibilidad.map(d => ({
                calibre: d.calibre,
                kg: d.disponible_kg,
                cantidad_envases: d.disponible_envases,
                kilos_por_envase: d.kilos_por_envase,
                pucho: d.disponible_pucho
            })).filter(c => c.kg > 0.05)
        };

        cerrarModalSeleccionLote();

        // 5. Manejo de calibres vacíos (para permitir registro fantasma si hay puchos)
        if (loteData.calibres.length === 0) {
            const tienePuchosVivos = disponibilidad.some(d => d.kg_en_puchos > 0.05);
            if (tienePuchosVivos) {
                loteData.calibres = disponibilidad.map(d => ({
                    calibre: d.calibre,
                    kg: 0,
                    cantidad_envases: 0,
                    kilos_por_envase: d.kilos_por_envase,
                    pucho: 0
                }));
            }
        }

        // 6. Si venimos de una selección previa (vía checkbox en Entradas)
        if (seleccionEnProgreso && seleccionEnProgreso.length > 0) {
            const calibresFiltrados = loteData.calibres.filter(c => seleccionEnProgreso.includes(c.calibre));
            if (calibresFiltrados.length > 0) {
                const loteFinal = { ...loteData, calibres: calibresFiltrados };
                seleccionEnProgreso = null;
                ejecutarAsignacionFinal(loteFinal);
                return;
            }
        }


        // Ir directo al selector de calibres (sin confirmaciones intermedias)
        mostrarModalSeleccionCalibres(loteData, entry, filaIndex, cuadranteIndex, disponibilidad);
    } catch (error) {
        console.error('Error agregando lote:', error);
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo agregar el lote: ' + error.message + '</p>', '❌');
    }
}

/**
 * Función separada para la ejecución final de la asignación
 */
async function ejecutarAsignacionFinal(loteData) {
    try {
        const response = await API.almacen.addLote(loteData);

        if (response.excede_capacidad) {
            const fi = -1, ci = -1; // No necesitamos índices si usamos cuadranteId
            const cuadranteObj = buscarCuadrantePorId(loteData.cuadranteId);
            mostrarModalDivisionLote(loteData, response, cuadranteObj);
            return;
        }

        await cargarAlmacenDesdeAPI();
        initCuadrantes();
        showToast('Lote asignado correctamente.', 'success', 'Asignación Exitosa');
    } catch (error) {
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">' + error.message + '</p>', '❌');
    }
}

/**
 * Muestra selector de zona de puchos para una ENTRADA que aún no está en el almacén
 */
function mostrarSelectorPuchoParaEntrada(entradaId, codigoLote, filaIndex, cuadranteIndex, calibresSeleccionados = null) {
    // Buscar zonas de puchos disponibles
    const zonas = [];
    almacenData.filas.forEach(f => {
        (f.cuadrantes || []).forEach(c => {
            if (c.es_zona_puchos) {
                // Si el nombre del cuadrante ya contiene el nombre de la fila (ej: 'C-5'), lo usamos directo.
                // Si no, lo concatenamos.
                const label = c.nombre.includes(f.nombre) ? c.nombre : `${f.nombre}-${c.nombre}`;
                zonas.push({ ...c, coord: label });
            }
        });
    });

    if (zonas.length === 0) {
        mostrarModalInfo('Aviso', '<p style="text-align: center;">No hay <b>Zonas de Puchos</b> activadas. Primero marque un cuadrante vacío como zona de puchos.</p>', '⚠️');
        return;
    }

    let html = '<div style="padding: 1rem;">';
    html += '<p style="margin-bottom: 1rem; color: #64748b; font-size: 0.9rem;">Seleccione el destino para los puchos del lote <b>' + codigoLote + '</b>:</p>';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.8rem;">';
    zonas.forEach(z => {
        // Enviar el array de calibres a la función de ejecución
        const calData = calibresSeleccionados ? JSON.stringify(calibresSeleccionados).replace(/"/g, '&quot;') : 'null';
        html += `
            <button onclick="ejecutarExtraccionPuchoEntrada(${entradaId}, ${z.id}, ${filaIndex}, ${cuadranteIndex}, ${calData})" 
                    style="padding: 1.2rem; background: #f0fdf4; border: 2px solid #16a34a; border-radius: 12px; font-weight: 800; color: #166534; cursor: pointer; font-size: 1.1rem; transition: all 0.2s;"
                    onmouseover="this.style.background='#dcfce7'; this.style.transform='scale(1.02)';"
                    onmouseout="this.style.background='#f0fdf4'; this.style.transform='scale(1)';">
                📍 ${z.coord}
            </button>`;
    });
    html += '</div></div>';

    mostrarModalInfo('DESTINO DE PUCHOS', html, '🫒');
}

/**
 * Muestra selector de zona de puchos para un LOTE que YA ESTÁ en el almacén
 */
function mostrarSelectorPuchoDestino(loteId, coordOrigen) {
    // Buscar zonas de puchos disponibles
    const zonas = [];
    almacenData.filas.forEach(f => {
        (f.cuadrantes || []).forEach(c => {
            if (c.es_zona_puchos) {
                const label = c.nombre.includes(f.nombre) ? c.nombre : `${f.nombre}-${c.nombre}`;
                zonas.push({ ...c, coord: label });
            }
        });
    });

    if (zonas.length === 0) {
        mostrarModalInfo('Aviso', '<p style="text-align: center;">No hay <b>Zonas de Puchos</b> activadas. Primero marque un cuadrante vacío como zona de puchos.</p>', '⚠️');
        return;
    }

    let html = '<div style="padding: 1rem;">';
    html += '<p style="margin-bottom: 1rem; color: #64748b; font-size: 0.9rem;">Seleccione el destino para los puchos acumulados en <b>' + coordOrigen + '</b>:</p>';
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 1rem;">';
    zonas.forEach(z => {
        html += `
            <button onclick="ejecutarExtraccionPuchoLote(${loteId}, ${z.id})" 
                    style="padding: 1.25rem; background: #f0fdf4; border: 2px solid #16a34a; border-radius: 14px; font-weight: 800; color: #166534; cursor: pointer; font-size: 1.15rem; transition: all 0.2s;"
                    onmouseover="this.style.background='#dcfce7'; this.style.transform='translateY(-2px)';"
                    onmouseout="this.style.background='#f0fdf4'; this.style.transform='translateY(0)';">
                📍 ${z.coord}
            </button>`;
    });
    html += '</div></div>';

    mostrarModalInfo('DESTINO DE PUCHOS', html, '🫒');
}

/**
 * Ejecuta la extracción de puchos de un lote existente
 */
async function ejecutarExtraccionPuchoLote(loteId, destinoCuadranteId) {
    try {
        const response = await API.almacen.extraerPucho({
            loteId: loteId,
            destinoCuadranteId: destinoCuadranteId
        });

        if (response.success) {
            showToast('Puchos extraídos correctamente.', 'success', 'Extracción Lista');
            await cargarAlmacenDesdeAPI();
            initCuadrantes();
        } else {
            showToast((response.error || 'Error desconocido'), 'error', 'Error');
        }
    } catch (error) {
        showToast('Error: ' + error.message, 'error', 'Error');
    }
}

/**
 * Ejecuta la extracción de puchos directamente desde la Entrada
 */
async function ejecutarExtraccionPuchoEntrada(entradaId, destinoCuadranteId, fi, ci, calibresSeleccionados = null) {
    try {
        const response = await API.almacen.extraerPucho({
            entradaId: entradaId,
            destinoCuadranteId: destinoCuadranteId,
            calibres: calibresSeleccionados
        });

        if (response.success) {
            showToast('Puchos extraídos. Continuando asignación...', 'success', 'Extracción Lista');
            const entry = entries.find(e => e.id === entradaId);
            reintentarAsignacionSinPuchos(entry, fi, ci);
        } else {
            showToast((response.error || 'Error desconocido'), 'error', 'Error');
        }
    } catch (error) {
        showToast('Error de red: ' + error.message, 'error', 'Error');
    }
}

async function reintentarAsignacionSinPuchos(entry, fi, ci) {
    // Recargar datos del almacén para obtener puchosExtraidos actualizado
    await cargarAlmacenDesdeAPI();

    // Pequeño delay para asegurar que la UI se actualice
    await new Promise(resolve => setTimeout(resolve, 150));

    // Ahora seleccionarLote usará los saldos correctos (restando los puchos ya extraídos)
    seleccionarLote(fi, ci, entry.id);
}

// Modal para dividir lote cuando excede capacidad
function mostrarModalDivisionLote(loteData, capacidadInfo, cuadranteActual) {
    const { espacio_disponible, envases_lote, exceso, capacidad_max } = capacidadInfo;

    let html = `
        <div id="modalDivisionLote" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 1rem;">
            <div style="background: white; border-radius: 24px; width: 100%; max-width: 480px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); animation: modalPremiumIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <div style="background: linear-gradient(135deg, #f59e0b, #9a3412); color: white; padding: 1.5rem; display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem;">⚠️</div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700;">Capacidad Excedida</h3>
                        <p style="margin: 0; font-size: 0.85rem; opacity: 0.9;">El lote no cabe completo en este cuadrante</p>
                    </div>
                </div>
                <div style="padding: 2rem;">
                    <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 16px; padding: 1.2rem; margin-bottom: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <p style="margin: 0; color: #92400e; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">📦 Lote</p>
                                <p style="margin: 0.2rem 0 0 0; color: #1e293b; font-size: 1rem; font-weight: 700;">${loteData.codigoLote}</p>
                            </div>
                            <div>
                                <p style="margin: 0; color: #92400e; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">🔢 Bidones Totales</p>
                                <p style="margin: 0.2rem 0 0 0; color: #1e293b; font-size: 1rem; font-weight: 700;">${envases_lote}</p>
                            </div>
                            <div>
                                <p style="margin: 0; color: #92400e; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">📍 Espacio Cuadrante</p>
                                <p style="margin: 0.2rem 0 0 0; color: #1e293b; font-size: 1rem; font-weight: 700;">${espacio_disponible} / ${capacidad_max}</p>
                            </div>
                            <div>
                                <p style="margin: 0; color: #dc2626; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">❌ Excedente</p>
                                <p style="margin: 0.2rem 0 0 0; color: #dc2626; font-size: 1.1rem; font-weight: 800;">${exceso} bidones</p>
                            </div>
                        </div>
                    </div>

                    <p style="color: #64748b; font-size: 0.95rem; margin-bottom: 1.5rem; text-align: center; font-weight: 500;">¿Qué deseas hacer?</p>

                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <button onclick="ejecutarDivisionLote()" style="padding: 1.2rem; background: ${espacio_disponible <= 0 ? 'linear-gradient(135deg, #0369a1, #075985)' : 'linear-gradient(135deg, #3d4f31, #1e293b)'}; color: white; border: none; border-radius: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 1rem;"
                                onmouseover="this.style.transform='translateY(-2px)';" onmouseout="this.style.transform='translateY(0)';">
                            <span style="font-size: 1.8rem;">${espacio_disponible <= 0 ? '📍' : '✂️'}</span>
                            <div style="text-align: left;">
                                <div style="font-size: 1.1rem; margin-bottom: 0.1rem;">${espacio_disponible <= 0 ? 'Repartir en otro lugar' : 'Dividir y Repartir'}</div>
                                <div style="font-size: 0.8rem; opacity: 0.8; font-weight: 500;">${espacio_disponible <= 0 ? `Asignar todo el lote (${envases_lote} bidones) en otro cuadrante` : `Asignar ${espacio_disponible} aquí y ${exceso} en otro lugar`}</div>
                            </div>
                        </button>

                        <button onclick="cerrarModalDivisionLote()" style="padding: 1rem; background: #fff; color: #64748b; border: 1.5px solid #e2e8f0; border-radius: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s;"
                                onmouseover="this.style.background='#f8fafc'; this.style.borderColor='#cbd5e1';">
                            Cancelar y elegir otro cuadrante
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Guardar datos para uso posterior
    window.divisionLoteData = {
        loteData: loteData,
        capacidadInfo: capacidadInfo,
        cuadranteActual: cuadranteActual
    };

    document.body.insertAdjacentHTML('beforeend', html);
}

function cerrarModalDivisionLote() {
    const modal = document.getElementById('modalDivisionLote');
    if (modal) modal.remove();
    window.divisionLoteData = null;
}

// Ejecutar división del lote
async function ejecutarDivisionLote() {
    if (!window.divisionLoteData) return;

    const { loteData, capacidadInfo, cuadranteActual } = window.divisionLoteData;
    const { espacio_disponible, exceso } = capacidadInfo;

    cerrarModalDivisionLote();

    // Mostrar selector de cuadrante destino para el exceso
    mostrarSelectorCuadranteParaExceso(loteData, espacio_disponible, exceso, cuadranteActual);
}

// Selector de cuadrante para la parte que excede
function mostrarSelectorCuadranteParaExceso(loteData, bidonesPrimerCuadrante, bidonesExceso, cuadranteActual) {
    const isFullTransfer = bidonesPrimerCuadrante <= 0;
    let html = `
        <div id="modalSelectorExceso" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 1rem;">
            <div style="background: white; border-radius: 24px; width: 100%; max-width: 500px; max-height: 85vh; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); animation: modalPremiumIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <div style="background: linear-gradient(135deg, #1e293b, #334155); color: white; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700;">${isFullTransfer ? 'Seleccionar Nueva Ubicación' : 'Destino para Exceso'}</h3>
                        <p style="margin: 0; font-size: 0.8rem; opacity: 0.8; font-weight: 500;">${isFullTransfer ? `Seleccione donde ubicar todo el lote (${bidonesExceso} bidones)` : `Seleccione donde ubicar los ${bidonesExceso} sobrantes`}</p>
                    </div>
                </div>
                <div class="modal-scroll" style="padding: 1.5rem; max-height: 60vh; overflow-y: auto;">
                    <p style="color: #64748b; margin-bottom: 1.2rem; font-size: 0.9rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Cuadrantes Disponibles:</p>
    `;

    // Listar cuadrantes disponibles (excepto el actual)
    if (almacenData && almacenData.filas) {
        almacenData.filas.forEach(fila => {
            (fila.cuadrantes || []).forEach(cuad => {
                if (cuad.id == cuadranteActual.id) return; // Saltar el actual

                // Calcular espacio disponible
                let ocupacion = 0;
                (cuad.lotes || []).forEach(l => {
                    (l.calibres || []).forEach(c => {
                        ocupacion += parseInt(c.cantidad_envases) || 0;
                    });
                });
                const capacidad = parseInt(cuad.capacidad_max) || 300;
                const disponible = capacidad - ocupacion;

                if (disponible >= bidonesExceso) {
                    html += `
                        <div onclick="confirmarDivision('${cuad.id}', ${bidonesPrimerCuadrante}, ${bidonesExceso})" 
                             style="padding: 1.2rem; border: 1.5px solid #f1f5f9; background: #fff; border-radius: 16px; margin-bottom: 0.8rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s;"
                             onmouseover="this.style.borderColor='#3d4f31'; this.style.background='#f0fdf4';" onmouseout="this.style.borderColor='#f1f5f9'; this.style.background='#fff';">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div style="width: 40px; height: 40px; border-radius: 10px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">📍</div>
                                <div>
                                    <div style="font-weight: 800; color: #0f172a; font-size: 1.1rem;">${cuad.nombre}</div>
                                    <div style="font-size: 0.75rem; color: #64748b; font-weight: 600;">${fila.nombre}</div>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: 700; color: #3d4f31; font-size: 1rem;">${disponible} bidones</div>
                                <div style="font-size: 0.65rem; color: #64748b; font-weight: 700; text-transform: uppercase;">Espacio Disponible</div>
                            </div>
                        </div>
                    `;
                }
            });
        });
    }

    html += `
                </div>
                <div style="padding: 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0;">
                    <button onclick="cerrarModalSelectorExceso()" style="width: 100%; padding: 1rem; background: #fff; color: #64748b; border: 1.5px solid #e2e8f0; border-radius: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                        Volver y reintentar
                    </button>
                </div>
            </div>
        </div>
    `;

    // Guardar datos
    window.divisionPendiente = { loteData, bidonesPrimerCuadrante, bidonesExceso, cuadranteActual };

    document.body.insertAdjacentHTML('beforeend', html);
}

function cerrarModalSelectorExceso() {
    const modal = document.getElementById('modalSelectorExceso');
    if (modal) modal.remove();
    window.divisionPendiente = null;
}

// Confirmar y ejecutar la división
async function confirmarDivision(cuadranteDestinoId, bidonesPrimerCuadrante, bidonesExceso) {
    if (!window.divisionPendiente) return;

    const { loteData, cuadranteActual } = window.divisionPendiente;
    cerrarModalSelectorExceso();

    try {
        const isSplit = bidonesPrimerCuadrante > 0;

        let bidonesRestantesParaParte1 = bidonesPrimerCuadrante;

        // 1. Calcular Parte 1: Bidones exactos (sin decimales ni puchos)
        const calibresParte1 = loteData.calibres.map(c => {
            const bidonesAsignados = Math.min(c.cantidad_envases, bidonesRestantesParaParte1);
            bidonesRestantesParaParte1 -= bidonesAsignados;

            const kilosPorEnvase = parseFloat(c.kilos_por_envase) || 60;
            const kgCalculado = bidonesAsignados * kilosPorEnvase;

            return {
                ...c,
                cantidad_envases: bidonesAsignados,
                kg: kgCalculado,
                pucho: 0 // La parte 1 nunca se lleva pucho, es una carga "limpia"
            };
        }).filter(c => c.cantidad_envases > 0);

        // 2. Calcular Parte 2: Todo lo que sobre (Saldo exacto + Puchos)
        const calibresParte2 = loteData.calibres.map(c => {
            const p1 = calibresParte1.find(cp => cp.calibre === c.calibre);
            const envases1 = p1 ? p1.cantidad_envases : 0;
            const kg1 = p1 ? p1.kg : 0;

            return {
                ...c,
                cantidad_envases: c.cantidad_envases - envases1,
                kg: c.kg - kg1, // Resta exacta para no perder ni un gramo
                pucho: c.pucho // Todo el pucho se queda en la segunda parte
            };
        }).filter(c => c.kg > 0.1);

        // Ejecutar inserciones
        if (isSplit && calibresParte1.length > 0) {
            await API.almacen.addLote({
                ...loteData,
                forzarAsignacion: true,
                calibres: calibresParte1
            });
        }

        if (calibresParte2.length > 0) {
            await API.almacen.addLote({
                ...loteData,
                cuadranteId: cuadranteDestinoId,
                codigoLote: isSplit ? loteData.codigoLote + '-B' : loteData.codigoLote,
                forzarAsignacion: true,
                calibres: calibresParte2
            });
        }

        // Recargar y actualizar
        await cargarAlmacenDesdeAPI();
        initCuadrantes();

        // Feedback
        if (isSplit) {
            showToast('El lote se dividió correctamente: ' + bidonesPrimerCuadrante + ' aquí y ' + bidonesExceso + ' en el destino.', 'success', 'División Exitosa');
        } else {
            showToast('Lote asignado correctamente al nuevo cuadrante.', 'success', 'Asignación Remota');
        }

    } catch (error) {
        console.error('Error en división:', error);
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">Error al dividir el lote: ' + error.message + '</p>', '❌');
    }
}

var loteParaQuitar = null;

// Quitar lote de un cuadrante
function quitarLoteDeCuadrante(filaIndex, cuadranteIndex, loteIndex) {
    loteParaQuitar = { fi: filaIndex, ci: cuadranteIndex, li: loteIndex };
    var html = `
        <div id="modalConfirmarQuitarLote" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 1rem;">
            <div style="background: white; border-radius: 24px; width: 100%; max-width: 400px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); animation: modalPremiumIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <div style="background: linear-gradient(135deg, #1e293b, #0f172a); color: white; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <span style="font-size: 1.5rem;">🗑️</span>
                        <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700;">Quitar Lote</h3>
                    </div>
                    <button onclick="cerrarModalQuitarLote()" style="background: rgba(255,255,255,0.1); border: none; color: white; width: 36px; height: 36px; border-radius: 10px; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
                </div>
                <div style="padding: 2rem; text-align: center;">
                    <div style="width: 64px; height: 64px; background: #fee2e2; color: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1.5rem;">⚠️</div>
                    <p style="color: #1e293b; margin-bottom: 0.5rem; font-size: 1.1rem; font-weight: 700;">¿Quitar este lote del cuadrante?</p>
                    <p style="color: #64748b; font-size: 0.95rem; font-weight: 500;">Esta acción removerá el lote seleccionado de esta ubicación.</p>
                </div>
                <div style="padding: 1.2rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 1rem;">
                    <button onclick="cerrarModalQuitarLote()" style="background: #fff; border: 1px solid #e2e8f0; padding: 0.8rem 1.5rem; border-radius: 12px; cursor: pointer; color: #64748b; font-weight: 600; transition: all 0.2s;">Cancelar</button>
                    <button onclick="confirmarQuitarLote()" style="background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);">Quitar del Almacén</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function cerrarModalQuitarLote() {
    var modal = document.getElementById('modalConfirmarQuitarLote');
    if (modal) modal.remove();
    loteParaQuitar = null;
}

async function confirmarQuitarLote() {
    if (loteParaQuitar) {
        try {
            var lote = almacenData.filas[loteParaQuitar.fi].cuadrantes[loteParaQuitar.ci].lotes[loteParaQuitar.li];

            if (!lote || !lote.id) {
                mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">El lote no tiene ID válido</p>', '❌');
                cerrarModalQuitarLote();
                return;
            }

            // Eliminar de la BD
            await API.almacen.removeLote(lote.id);

            // Recargar datos del almacén y actualizar mapa
            await cargarAlmacenDesdeAPI();
            initCuadrantes();
        } catch (error) {
            console.error('Error quitando lote:', error);
            mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo quitar: ' + error.message + '</p>', '❌');
        }
    }
    cerrarModalQuitarLote();
}

// Mover calibre a otro cuadrante
function moverCalibre(filaIndex, cuadranteIndex, loteIndex, calibreIndex) {
    const calibre = almacenData.filas[filaIndex].cuadrantes[cuadranteIndex].lotes[loteIndex].calibres[calibreIndex];

    // Crear lista de destinos posibles
    let destinos = [];
    almacenData.filas.forEach((fila, fi) => {
        fila.cuadrantes.forEach((cuad, ci) => {
            if (fi !== filaIndex || ci !== cuadranteIndex) {
                destinos.push({
                    filaIndex: fi,
                    cuadranteIndex: ci,
                    nombre: cuad.nombre,
                    fila: fila.nombre
                });
            }
        });
    });

    if (destinos.length === 0) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">No hay otros cuadrantes disponibles. Crea más cuadrantes primero.</p>', '⚠️');
        return;
    }

    let html = `
        <div id="modalMoverCalibre" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 1rem;">
            <div style="background: white; border-radius: 24px; width: 100%; max-width: 440px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); animation: modalPremiumIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <div style="background: linear-gradient(135deg, #7c3aed, #4c1d95); color: white; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <span style="font-size: 1.5rem;">⚖️</span>
                        <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700;">Destino de Calibre</h3>
                    </div>
                    <button onclick="cerrarModalMoverCalibre()" style="background: rgba(255,255,255,0.1); border: none; color: white; width: 36px; height: 36px; border-radius: 10px; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
                </div>
                <div class="modal-scroll" style="padding: 1.5rem; max-height: 60vh; overflow-y: auto;">
                    <div style="background: #f5f3ff; padding: 1rem; border-radius: 12px; border: 1.5px dashed #ddd6fe; margin-bottom: 1.5rem;">
                        <p style="margin: 0; color: #6d28d9; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem;">Moviendo Calibre:</p>
                        <div style="font-weight: 800; color: #1e293b; font-size: 1.15rem;">⚖️ ${calibre.calibre}</div>
                        <div style="font-size: 1rem; color: #7c3aed; font-weight: 700; margin-top: 0.2rem;">${parseFloat(calibre.kg || 0).toFixed(1)} Kg</div>
                    </div>
                    <p style="color: #64748b; margin-bottom: 1rem; font-size: 0.95rem; font-weight: 500;">Selecciona el cuadrante de destino:</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
                        ${destinos.map(d => `
                            <div onclick="ejecutarMoverCalibre(${filaIndex}, ${cuadranteIndex}, ${loteIndex}, ${calibreIndex}, ${d.filaIndex}, ${d.cuadranteIndex})" 
                                 style="padding: 1.2rem; border: 1.5px solid #f1f5f9; background: #fff; border-radius: 16px; cursor: pointer; transition: all 0.2s; text-align: center;"
                                 onmouseover="this.style.borderColor='#7c3aed'; this.style.background='#f5f3ff';" 
                                 onmouseout="this.style.borderColor='#f1f5f9'; this.style.background='#fff';">
                                <div style="font-size: 0.7rem; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 0.2rem;">${d.fila}</div>
                                <div style="font-weight: 800; color: #0f172a; font-size: 1.15rem;">${d.nombre}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

// Cerrar modal de mover calibre
function cerrarModalMoverCalibre() {
    const modal = document.getElementById('modalMoverCalibre');
    if (modal) modal.remove();
}

// Ejecutar el movimiento del calibre
async function ejecutarMoverCalibre(origenFilaIndex, origenCuadranteIndex, origenLoteIndex, calibreIndex, destinoFilaIndex, destinoCuadranteIndex) {
    cerrarModalMoverCalibre();

    try {
        const calibre = almacenData.filas[origenFilaIndex].cuadrantes[origenCuadranteIndex].lotes[origenLoteIndex].calibres[calibreIndex];
        const cuadranteDestino = almacenData.filas[destinoFilaIndex].cuadrantes[destinoCuadranteIndex];

        if (!calibre || !calibre.id) {
            showToast('El calibre no tiene ID válido', 'error', 'Error');
            return;
        }

        const response = await API.almacen.reubicarCalibre({
            calibreId: calibre.id,
            destinoCuadranteId: cuadranteDestino.id
        });

        if (response.success) {
            showToast('Calibre movido correctamente.', 'success', 'Movimiento Exitoso');
            await cargarAlmacenDesdeAPI();
            initCuadrantes();
        } else {
            showToast((response.error || 'No se pudo mover'), 'error', 'Error');
        }
    } catch (error) {
        console.error('Error moviendo calibre:', error);
        showToast('No se pudo mover: ' + error.message, 'error', 'Error');
    }
}

// Inicializar eventos de búsqueda dinámica
function initSearchEvents() {
    const searchInput = document.getElementById('searchCodigo');
    if (!searchInput) return;

    // Escuchar cambios al escribir
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        updateSearchSuggestions(query);
        buscarEnAlmacen(true); // Búsqueda silenciosa (sin modal si no hay resultados)
    });

    // Escuchar teclas para navegación
    searchInput.addEventListener('keydown', (e) => {
        const suggestions = document.querySelectorAll('.suggestion-item');
        let activeIdx = -1;
        suggestions.forEach((s, i) => { if (s.classList.contains('active')) activeIdx = i; });

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (activeIdx < suggestions.length - 1) {
                if (activeIdx >= 0) suggestions[activeIdx].classList.remove('active');
                suggestions[activeIdx + 1].classList.add('active');
                suggestions[activeIdx + 1].scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (activeIdx > 0) {
                suggestions[activeIdx].classList.remove('active');
                suggestions[activeIdx - 1].classList.add('active');
                suggestions[activeIdx - 1].scrollIntoView({ block: 'nearest' });
            }
        } else if (e.key === 'Enter') {
            if (activeIdx >= 0) {
                suggestions[activeIdx].click();
            } else {
                buscarEnAlmacen();
            }
        } else if (e.key === 'Escape') {
            cerrarSugerencias();
        }
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) cerrarSugerencias();
    });
}

function cerrarSugerencias() {
    const container = document.getElementById('searchSuggestions');
    if (container) {
        container.style.display = 'none';
        container.innerHTML = '';
    }
}

function updateSearchSuggestions(query) {
    const container = document.getElementById('searchSuggestions');
    if (!container) return;

    const term = query.toLowerCase().trim();
    if (term.length < 1) {
        cerrarSugerencias();
        return;
    }

    const suggestions = [];

    // 1. Buscar en lotes y calibres del almacén
    if (almacenData && almacenData.filas) {
        almacenData.filas.forEach(fila => {
            (fila.cuadrantes || []).forEach(cuad => {
                // Coincidencia con Cuadrante
                if (cuad.nombre.toLowerCase().includes(term)) {
                    suggestions.push({
                        type: 'cuadrante',
                        text: cuad.nombre,
                        sub: `Fila ${fila.nombre}`,
                        value: cuad.nombre
                    });
                }

                (cuad.lotes || []).forEach(lote => {
                    const cod = (lote.codigo_lote || lote.codigoLote || '').toLowerCase();
                    if (cod.includes(term)) {
                        suggestions.push({
                            type: 'lote',
                            text: lote.codigo_lote || lote.codigoLote,
                            sub: `📍 ${cuad.nombre}`,
                            value: lote.codigo_lote || lote.codigoLote
                        });
                    }

                    (lote.calibres || []).forEach(cal => {
                        const calName = (cal.calibre || '').toLowerCase();
                        if (calName.includes(term)) {
                            suggestions.push({
                                type: 'calibre',
                                text: cal.calibre,
                                sub: `📦 Lote: ${lote.codigo_lote} en ${cuad.nombre}`,
                                value: cal.calibre
                            });
                        }
                    });
                });
            });
        });
    }

    // Ordenar y limitar resultados (eliminar duplicados de calibres comunes)
    const uniqueSuggestions = [];
    const seen = new Set();

    suggestions.forEach(s => {
        const key = `${s.type}-${s.text.toLowerCase()}`;
        if (!seen.has(key)) {
            uniqueSuggestions.push(s);
            seen.add(key);
        }
    });

    const finalResults = uniqueSuggestions.slice(0, 10); // Máximo 10 sugerencias

    if (finalResults.length === 0) {
        cerrarSugerencias();
        return;
    }

    container.innerHTML = finalResults.map(s => `
        <div class="suggestion-item" onclick="seleccionarSugerencia('${s.value}')">
            <div>
                <div class="main-text">${s.text}</div>
                <div class="sub-text">${s.sub}</div>
            </div>
            <span class="type-badge badge-${s.type}">${s.type}</span>
        </div>
    `).join('');

    container.style.display = 'block';
}

function seleccionarSugerencia(value) {
    const input = document.getElementById('searchCodigo');
    if (input) {
        input.value = value;
        cerrarSugerencias();
        buscarEnAlmacen();
    }
}


// Buscar en el almacén y resaltar en el mapa
function buscarEnAlmacen(silent = false) {
    const searchInput = document.getElementById('searchCodigo');
    if (!searchInput) return;
    const termino = searchInput.value.toLowerCase().trim();

    // Limpiar resaltados previos
    document.querySelectorAll('.cuadrante-cell').forEach(cell => {
        cell.classList.remove('searching-highlight');
    });

    if (!termino) return;

    let encontrados = [];
    let coordinadasResaltar = [];

    if (!almacenData || !almacenData.filas) return;

    almacenData.filas.forEach((fila) => {
        fila.cuadrantes.forEach((cuad) => {
            let matches = false;

            // Buscar por nombre de cuadrante
            if (cuad.nombre.toLowerCase().includes(termino)) {
                matches = true;
                encontrados.push(`Ubicación: <strong>${fila.nombre} > ${cuad.nombre}</strong>`);
            }

            (cuad.lotes || []).forEach((lote) => {
                const codigoLote = (lote.codigo_lote || lote.codigoLote || '').toLowerCase();
                if (codigoLote.includes(termino)) {
                    encontrados.push(`Lote <strong>${lote.codigo_lote || lote.codigoLote}</strong> en ${fila.nombre} > ${cuad.nombre}`);
                    matches = true;
                }
                (lote.calibres || []).forEach(cal => {
                    const calibreNombre = (cal.calibre || '').toLowerCase();
                    if (calibreNombre.includes(termino)) {
                        encontrados.push(`Calibre <strong>${cal.calibre}</strong> en Lote ${lote.codigo_lote || lote.codigoLote} (${cuad.nombre})`);
                        matches = true;
                    }
                });
            });

            if (matches) {
                coordinadasResaltar.push(cuad.nombre.toUpperCase());
            }
        });
    });

    // Resaltar en el mapa
    coordinadasResaltar.forEach(coord => {
        const cells = document.querySelectorAll('.cuadrante-cell');
        cells.forEach(cell => {
            const cellId = cell.querySelector('.cuadrante-id span');
            if (cellId) {
                const cellText = cellId.textContent.replace(/[-\s]/g, '').toUpperCase();
                const searchCoord = coord.replace(/[-\s]/g, '').toUpperCase();
                if (cellText === searchCoord) {
                    cell.classList.add('searching-highlight');
                }
            }
        });
    });

    // Solo mostrar el modal si no es silencioso
    if (!silent && encontrados.length > 0) {
        let contenidoBusqueda = `
            <div style="margin-bottom: 1rem; color: #475569; font-size: 0.9rem;">
                Se han encontrado <strong style="color: #16a34a;">${encontrados.length}</strong> coincidencias resaltadas en el mapa:
            </div>
            <div style="max-height: 350px; overflow-y: auto; padding-right: 5px;">
        `;
        encontrados.forEach(item => {
            contenidoBusqueda += `
                <div style="padding: 0.8rem; background: #f8fafc; border-radius: 8px; margin-bottom: 0.5rem; border-left: 4px solid #3b82f6; font-size: 0.85rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    ${item}
                </div>
            `;
        });
        contenidoBusqueda += '</div>';
        mostrarModalInfo('Resultados de Búsqueda', contenidoBusqueda, '🔍');
    } else if (!silent && encontrados.length === 0) {
        mostrarModalInfo('Sin Resultados', `<p style="text-align: center; color: #64748b; padding: 1rem;">No se encontraron coincidencias para: <strong>${termino}</strong></p>`, '🔍');
    }
}

// ========== AUDITORÍA FUNCTIONS ==========
let auditoriaData = [];

async function renderAuditoria() {
    const tbody = document.getElementById('auditoriaTablaBody');
    const noMessage = document.getElementById('noAuditoriaMessage');

    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">Cargando historial...</td></tr>';

    try {
        const response = await API.historial.getAll();
        auditoriaData = response.data || [];
        filterAuditoria();
    } catch (error) {
        console.error('Error cargando auditoría:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #dc2626;">Error al cargar el historial.</td></tr>';
    }
}

function filterAuditoria() {
    const modulo = document.getElementById('auditoriaModuloSelect').value;
    const tbody = document.getElementById('auditoriaTablaBody');
    const noMessage = document.getElementById('noAuditoriaMessage');

    if (!tbody) return;

    const filtered = auditoriaData.filter(log => {
        if (modulo === 'all') return true;
        return (log.modulo || '').toLowerCase() === modulo.toLowerCase();
    });

    if (filtered.length === 0) {
        tbody.innerHTML = '';
        noMessage.style.display = 'block';
        return;
    }

    noMessage.style.display = 'none';
    let html = '';

    filtered.forEach((log, i) => {
        const fecha = new Date(log.created_at).toLocaleString('es-PE', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        const actionColors = {
            'login': '#3b82f6', 'logout': '#64748b', 'crear': '#16a34a',
            'editar': '#f59e0b', 'eliminar': '#dc2626', 'exportar': '#a855f7', 'ver': '#06b6d4'
        };
        const color = actionColors[log.accion] || '#64748b';
        const bgColor = i % 2 === 0 ? '#ffffff' : '#f8fafc';

        html += `
            <tr style="background: ${bgColor}; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 1rem; color: #64748b; font-family: monospace;">${fecha}</td>
                <td style="padding: 1rem; font-weight: 600; color: #1e293b;">${log.usuario_nombre || log.nombre || log.username || 'System'}</td>
                <td style="padding: 1rem;">
                    <span style="background: ${color}20; color: ${color}; padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 700; text-transform: uppercase; font-size: 0.75rem;">
                        ${log.accion}
                    </span>
                </td>
                <td style="padding: 1rem; color: #475569; font-weight: 500; text-transform: capitalize;">${log.modulo || '-'}</td>
                <td style="padding: 1rem; color: #64748b; font-size: 0.85rem;">${log.descripcion || '-'}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Inicializar almacén cuando se muestra la sección
async function initAlmacenAceitunas() {
    await cargarAlmacenDesdeAPI();
    initCuadrantes();
    initSearchEvents(); // Nueva función para búsqueda dinámica
}

// Buscar cuadrante por nombre en todos los datos (coincidencia flexible)
function buscarCuadrantePorNombre(nombreBuscado) {
    if (!almacenData || !almacenData.filas) return null;

    const nombreLimpio = nombreBuscado.replace(/[-\s]/g, '').toUpperCase();

    for (let f of almacenData.filas) {
        for (let c of (f.cuadrantes || [])) {
            const cNombre = (c.nombre || '').replace(/[-\s]/g, '').toUpperCase();
            if (cNombre === nombreLimpio) {
                return c;
            }
        }
    }
    return null;
}

// Mostrar selector de lotes para asignar a un cuadrante por coordenada
function mostrarSelectorLoteParaCoord(coord) {
    // Primero buscar si existe el cuadrante en BD
    let cuadrante = buscarCuadrantePorNombre(coord);

    if (cuadrante) {
        // Existe, usar la función normal
        let fIdx = -1, cIdx = -1;
        almacenData.filas.forEach((f, fi) => {
            (f.cuadrantes || []).forEach((c, ci) => {
                if (c.id == cuadrante.id) { fIdx = fi; cIdx = ci; }
            });
        });
        if (fIdx !== -1) {
            agregarLoteACuadrante(fIdx, cIdx);
        }
    } else {
        // No existe en BD - mostrar mensaje
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">El cuadrante ' + coord + ' no existe en la base de datos. Ejecuta el SQL en phpMyAdmin para crear los 40 cuadrantes.</p>', '❌');
    }
}

// Funciones auxiliares para el mapa interactivo
function prepararAsignacionLote(cuadranteId) {
    let fIdx = -1, cIdx = -1;
    almacenData.filas.forEach((f, fi) => {
        (f.cuadrantes || []).forEach((c, ci) => {
            if (c.id == cuadranteId) { fIdx = fi; cIdx = ci; }
        });
    });
    if (fIdx !== -1) agregarLoteACuadrante(fIdx, cIdx);
}

// Toggle zona de puchos
async function toggleZonaPuchos(cuadranteId) {
    try {
        const result = await API.almacen.toggleZonaPuchos(cuadranteId);
        if (result.success) {
            const estado = result.es_zona_puchos ? 'activada' : 'desactivada';
            showToast('Zona de puchos ' + estado + ' correctamente.', 'success', 'Zona de Puchos');

            // Recargar datos y actualizar mapa
            await cargarAlmacenDesdeAPI();
            initCuadrantes();
        }
    } catch (error) {
        console.error('Error al cambiar zona de puchos:', error);
        mostrarModalInfo('Error', '<p style="text-align: center; color: #dc2626;">No se pudo cambiar el estado: ' + error.message + '</p>', '❌');
    }
}

function reubicarLoteMap(loteId) {
    let fi = -1, ci = -1, li = -1;
    almacenData.filas.forEach((f, fIdx) => {
        (f.cuadrantes || []).forEach((c, cIdx) => {
            (c.lotes || []).forEach((l, lIdx) => {
                if (l.id == loteId) {
                    fi = fIdx; ci = cIdx; li = lIdx;
                }
            });
        });
    });

    if (fi !== -1) {
        seleccionarLoteParaReubicar(fi, ci, li);
    } else {
        abrirReubicacionLote();
    }
}

// Retirar lote del cuadrante (inteligente: detecta si está dividido)
async function retirarLoteDelCuadrante(loteId) {
    // 1. Buscar el lote en almacenData para saber su entrada_id y ubicación
    let loteEncontrado = null;
    let otrasUbicaciones = [];

    if (almacenData && almacenData.filas) {
        almacenData.filas.forEach(f => {
            (f.cuadrantes || []).forEach(c => {
                (c.lotes || []).forEach(l => {
                    if (l.id == loteId) {
                        loteEncontrado = { ...l, cuadranteNombre: c.nombre };
                    }
                });
            });
        });
    }

    if (!loteEncontrado) return;

    // 2. Buscar si la misma entrada_id existe en otros cuadrantes
    if (loteEncontrado.entrada_id) {
        almacenData.filas.forEach(f => {
            (f.cuadrantes || []).forEach(c => {
                (c.lotes || []).forEach(l => {
                    if (l.entrada_id == loteEncontrado.entrada_id && l.id != loteId) {
                        otrasUbicaciones.push(c.nombre);
                    }
                });
            });
        });
    }

    if (otrasUbicaciones.length > 0) {
        // Alerta de lote dividido
        const html = `
            <div id="modalAvisoRetiroSplit" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 10000; padding: 1rem;">
                <div style="background: white; border-radius: 20px; width: 100%; max-width: 450px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: zoomIn 0.3s ease-out;">
                    <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 1.5rem; display: flex; align-items: center; gap: 1rem;">
                        <span style="font-size: 2rem;">⚠️</span>
                        <div>
                            <h3 style="margin: 0; font-size: 1.2rem;">Lote Dividido Detectado</h3>
                            <p style="margin: 0; font-size: 0.85rem; opacity: 0.9;">Este lote tiene partes en varios lugares</p>
                        </div>
                    </div>
                    <div style="padding: 1.5rem;">
                        <p style="margin: 0; color: #1e293b; font-size: 0.95rem;">
                            El lote <strong>${loteEncontrado.codigo_lote}</strong> también está en:
                        </p>
                        <div style="margin-top: 0.8rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            ${otrasUbicaciones.map(u => `<span style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">📍 ${u}</span>`).join('')}
                        </div>
                        <p style="margin-top: 1.2rem; font-size: 0.85rem; color: #64748b; font-style: italic;">¿Cómo deseas proceder?</p>
                    </div>
                    <div style="padding: 1.2rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 0.8rem;">
                        <button onclick="ejecutarRetiroLote(${loteId})" style="width: 100%; padding: 0.9rem; background: #3d4f31; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s;">
                            <span>🗑️</span> Retirar SOLO de ${loteEncontrado.cuadranteNombre}
                        </button>
                        <button onclick="ejecutarRetiroLoteCompleto(${loteEncontrado.entrada_id})" style="width: 100%; padding: 0.9rem; background: #dc2626; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s;">
                            <span>🔥</span> Retirar de TODO el almacén
                        </button>
                        <button onclick="document.getElementById('modalAvisoRetiroSplit').remove()" style="width: 100%; padding: 0.8rem; background: white; border: 1px solid #cbd5e1; color: #64748b; border-radius: 10px; cursor: pointer; font-weight: 500;">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    } else {
        // Retiro directo (no está dividido, acción reversible)
        ejecutarRetiroLote(loteId);
    }
}

// Ejecutar retiro de una sola parte
async function ejecutarRetiroLote(loteId) {
    try {
        await API.almacen.removeLote(loteId);
        const modalAviso = document.getElementById('modalAvisoRetiroSplit');
        if (modalAviso) modalAviso.remove();

        showToast('Lote retirado correctamente de este cuadrante.', 'success', 'Retiro Exitoso');
        await cargarAlmacenDesdeAPI();
        initCuadrantes();
    } catch (error) {
        console.error('Error retirando lote:', error);
        showToast('Error: ' + error.message, 'error', 'Error de Retiro');
    }
}

// Ejecutar retiro completo
async function ejecutarRetiroLoteCompleto(entradaId) {
    try {
        await API.almacen.removeLoteCompleto(entradaId);
        const modalAviso = document.getElementById('modalAvisoRetiroSplit');
        if (modalAviso) modalAviso.remove();

        showToast('Lote eliminado de todo el almacén correctamente.', 'success', 'Retiro Completo');
        await cargarAlmacenDesdeAPI();
        initCuadrantes();
    } catch (error) {
        console.error('Error retirando lote completo:', error);
        showToast('Error: ' + error.message, 'error', 'Error de Retiro');
    }
}

// Confirmar y ejecutar el retiro del lote (Mantener por compatibilidad si se llama desde otro lado)
async function confirmarRetirarLote(loteId) {
    ejecutarRetiroLote(loteId);
}

// ========== REUBICAR CALIBRE ATÓMICO ==========

/**
 * Abre un modal para seleccionar el cuadrante destino de un calibre específico
 */
function abrirModalReubicarCalibre(calibreId, nombreCalibre, codigoLote, origenCuadranteId) {
    // Construir lista de cuadrantes disponibles (excluyendo origen y zonas especiales)
    let destinos = [];
    if (almacenData && almacenData.filas) {
        almacenData.filas.forEach(fila => {
            (fila.cuadrantes || []).forEach(cuadrante => {
                // Excluir el cuadrante de origen
                if (cuadrante.id == origenCuadranteId) return;

                // Excluir zonas de maquinaria (A-4, A-5)
                const nombreLimpio = (cuadrante.nombre || '').toUpperCase().replace(/[-\s]/g, '');
                if (nombreLimpio === 'A4' || nombreLimpio === 'A5') return;

                destinos.push({
                    id: cuadrante.id,
                    nombre: cuadrante.nombre,
                    filaNombre: fila.nombre,
                    esZonaPuchos: cuadrante.es_zona_puchos == 1
                });
            });
        });
    }

    if (destinos.length === 0) {
        mostrarModalInfo('Aviso', '<p style="text-align: center; color: #64748b;">No hay cuadrantes disponibles para reubicar.</p>', '⚠️');
        return;
    }

    let html = `
        <div id="modalReubicarCalibre" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 10001; padding: 1rem;">
            <div style="background: white; border-radius: 24px; width: 100%; max-width: 480px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); animation: modalPremiumIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <div style="background: linear-gradient(135deg, #7c3aed, #4c1d95); color: white; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <span style="font-size: 1.5rem;">⚖️</span>
                        <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700;">Reubicar Calibre</h3>
                    </div>
                    <button onclick="cerrarModalReubicarCalibre()" style="background: rgba(255,255,255,0.1); border: none; color: white; width: 36px; height: 36px; border-radius: 10px; font-size: 1.2rem; cursor: pointer;">×</button>
                </div>
                <div style="padding: 1.5rem;">
                    <div style="background: #f8fafc; padding: 1rem; border-radius: 12px; border: 1.5px dashed #cbd5e1; margin-bottom: 1.5rem;">
                        <span style="color: #64748b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Moviendo:</span>
                        <div style="font-weight: 700; color: #1e293b; font-size: 1.1rem; margin-top: 0.3rem;">⚖️ Calibre ${nombreCalibre}</div>
                        <div style="font-size: 0.85rem; color: #64748b; margin-top: 0.2rem;">📦 Del lote: ${codigoLote}</div>
                    </div>
                    
                    <p style="color: #64748b; margin-bottom: 1rem; font-size: 0.95rem; font-weight: 500;">Selecciona el cuadrante de destino:</p>
                    <div class="modal-scroll" style="max-height: 40vh; overflow-y: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
                        ${destinos.map(d => `
                            <div onclick="ejecutarReubicarCalibre(${calibreId}, ${d.id})" 
                                 style="padding: 1rem; border: 1.5px solid ${d.esZonaPuchos ? '#eab308' : '#f1f5f9'}; background: ${d.esZonaPuchos ? '#fefce8' : '#fff'}; border-radius: 14px; cursor: pointer; transition: all 0.2s; text-align: center;"
                                 onmouseover="this.style.borderColor='#7c3aed'; this.style.background='#f5f3ff';" 
                                 onmouseout="this.style.borderColor='${d.esZonaPuchos ? '#eab308' : '#f1f5f9'}'; this.style.background='${d.esZonaPuchos ? '#fefce8' : '#fff'}';">
                                <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; margin-bottom: 0.2rem;">${d.filaNombre}</div>
                                <div style="font-weight: 700; color: #1e293b; font-size: 1.1rem;">${d.nombre}</div>
                                ${d.esZonaPuchos ? '<div style="font-size: 0.65rem; color: #eab308; margin-top: 0.2rem;">🫒 Zona Puchos</div>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function cerrarModalReubicarCalibre() {
    const modal = document.getElementById('modalReubicarCalibre');
    if (modal) modal.remove();
}

/**
 * Ejecuta la reubicación del calibre llamando a la API
 */
async function ejecutarReubicarCalibre(calibreId, destinoCuadranteId) {
    cerrarModalReubicarCalibre();

    try {
        const response = await API.almacen.reubicarCalibre({
            calibreId: calibreId,
            destinoCuadranteId: destinoCuadranteId
        });

        if (response.success) {
            showToast('Calibre reubicado correctamente.', 'success', 'Reubicación Exitosa');
            await cargarAlmacenDesdeAPI();
            initCuadrantes();
        } else {
            showToast((response.error || 'Error al reubicar'), 'error', 'Error');
        }
    } catch (error) {
        console.error('Error reubicando calibre:', error);
        showToast(error.message, 'error', 'Error');
    }
}

/**
 * ESCENARIO #12: Muestra todas las ubicaciones de un lote dividido
 */
function mostrarUbicacionesLote(entradaId, codigoLote) {
    cerrarModalInfo();

    // Buscar todas las ubicaciones de este lote
    let ubicaciones = [];
    let totalKgGlobal = 0;

    if (almacenData && almacenData.filas) {
        almacenData.filas.forEach(f => {
            (f.cuadrantes || []).forEach(c => {
                (c.lotes || []).forEach(l => {
                    if (l.entrada_id == entradaId) {
                        const calibresLote = l.calibres || [];
                        const kgUbicacion = calibresLote.reduce((s, cal) => s + (parseFloat(cal.kg) || 0), 0);
                        totalKgGlobal += kgUbicacion;

                        ubicaciones.push({
                            filaNombre: f.nombre,
                            cuadranteNombre: c.nombre,
                            cuadranteId: c.id,
                            calibres: calibresLote,
                            kgTotal: kgUbicacion
                        });
                    }
                });
            });
        });
    }

    if (ubicaciones.length === 0) {
        mostrarModalInfo('Sin Ubicaciones', '<p style="text-align: center; color: #64748b;">No se encontraron ubicaciones para este lote.</p>', '⚠️');
        return;
    }

    let html = `
        <div id="modalUbicacionesLote" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 10001; padding: 1rem;">
            <div style="background: white; border-radius: 24px; width: 100%; max-width: 520px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); animation: modalPremiumIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <span style="font-size: 1.5rem;">📍</span>
                        <div>
                            <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700;">Lote Dividido</h3>
                            <div style="font-size: 0.8rem; opacity: 0.9;">${codigoLote}</div>
                        </div>
                    </div>
                    <button onclick="document.getElementById('modalUbicacionesLote').remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 36px; height: 36px; border-radius: 10px; font-size: 1.2rem; cursor: pointer;">×</button>
                </div>
                <div style="padding: 1.5rem;">
                    <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 0.75rem; color: #92400e; font-weight: 700; text-transform: uppercase;">Total del Lote</div>
                            <div style="font-size: 1.3rem; font-weight: 800; color: #78350f;">${totalKgGlobal.toFixed(1)} Kg</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 0.75rem; color: #92400e; font-weight: 700;">Distribuido en</div>
                            <div style="font-size: 1.3rem; font-weight: 800; color: #78350f;">${ubicaciones.length} ubicaciones</div>
                        </div>
                    </div>
                    
                    <div class="modal-scroll" style="max-height: 45vh; overflow-y: auto; display: flex; flex-direction: column; gap: 0.8rem;">
                        ${ubicaciones.map((ub, idx) => `
                            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <span style="background: #3d4f31; color: white; font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700;">${idx + 1}</span>
                                        <span style="font-weight: 700; color: #1e293b;">${ub.filaNombre} › ${ub.cuadranteNombre}</span>
                                    </div>
                                    <span style="font-weight: 800; color: #16a34a;">${ub.kgTotal.toFixed(1)} Kg</span>
                                </div>
                                <div style="display: flex; flex-wrap: wrap; gap: 0.3rem;">
                                    ${ub.calibres.map(cal => `
                                        <span style="background: #e0e7ff; color: #3730a3; padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.7rem; font-weight: 600;">
                                            ${cal.calibre}: ${parseFloat(cal.kg).toFixed(1)} Kg
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

// Initialize reports when section is shown
const originalShowSection = showSection;
showSection = function (section) {
    // Bloquear acceso a secciones restringidas para no-admin
    if ((section === 'salida' || section === 'record' || section === 'auditoria') && !esAdmin()) {
        mostrarModalInfo('Acceso Restringido', '<p style="text-align: center; color: #dc2626;">No tienes permisos para acceder a esta sección.</p><p style="text-align: center; font-size: 0.85rem; color: #64748b; margin-top: 0.5rem;">Contacta al administrador para más información.</p>', '🔒');
        return; // No permitir cambio de sección
    }

    originalShowSection(section);
    if (section === 'reportes') {
        populateReportFilters();
        filtrarReportes();
    }
    if (section === 'record') {
        initRecordAnos();
        renderRecordHistorico();
    }
    if (section === 'almacen') {
        initAlmacenAceitunas();
    }
    if (section === 'auditoria') {
        renderAuditoria();
    }
};
