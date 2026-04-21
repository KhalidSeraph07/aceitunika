 /**
 * UTILIDADES GENERALES
 */

/**
 * Convierte las llaves de un objeto de snake_case a camelCase recursivamente
 */
function toCamelCase(obj) {
    if (obj == null) return obj;
    if (Array.isArray(obj)) {
        return obj.map(v => toCamelCase(v));
    } else if (typeof obj === 'object' && obj.constructor === Object) {
        return Object.keys(obj).reduce(
            (result, key) => ({
                ...result,
                [key.replace(/(_\w)/g, m => m[1].toUpperCase())]: toCamelCase(obj[key]),
            }),
            {}
        );
    }
    return obj;
}

/**
 * Parsea un valor monetario (string con S/ o comas) a float
 */
function parseMoneda(valor) {
    if (typeof valor === 'number') return valor;
    if (!valor) return 0;
    return parseFloat(valor.toString().replace(/[S/,\s]/g, '')) || 0;
}

module.exports = {
    toCamelCase,
    parseMoneda
};
