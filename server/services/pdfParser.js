const pdfParse = require('pdf-parse');
const fs = require('fs');

/**
 * Extrae datos de un PDF de solicitud municipal
 * @param {string} rutaPDF - Ruta completa al archivo PDF
 * @returns {Promise<object>} Objeto con los datos extraídos
 */
async function extraerDatosPDF(rutaPDF) {
    try {
        // Leer el archivo PDF
        const dataBuffer = fs.readFileSync(rutaPDF);

        // Parsear el PDF
        const data = await pdfParse(dataBuffer);

        // Texto extraído del PDF
        const texto = data.text;

        console.log('Texto extraído del PDF:');
        console.log('='.repeat(60));
        console.log(texto);
        console.log('='.repeat(60));

        // Extraer cada campo usando expresiones regulares
        const datosPDF = {
            solicitud_nro: extraerCampo(texto, /Solicitud\s+Nro[:\s]+([^\n]+)/i),
            tipo: extraerCampo(texto, /Tipo[:\s]+([^\n]+)/i),
            subtipo: extraerCampo(texto, /Subtipo[:\s]+([^\n]+)/i),
            ubicacion: extraerCampo(texto, /Ubicaci[oó]n[:\s]+([^\n]+)/i),
            distrito: extraerCampo(texto, /Distrito[:\s]+([^\n]+)/i),
            vecinal: extraerCampo(texto, /Vecinal[:\s]+([^\n]+)/i),
            descripcion: extraerDescripcion(texto),
            fecha_reclamo: extraerCampo(texto, /Fecha[:\s]+([^\n]+)/i),
            prioridad: extraerCampo(texto, /Prioridad[:\s]+([^\n]+)/i),
            solicitante: extraerSolicitante(texto),
            telefono: extraerTelefono(texto),
            email: extraerEmail(texto),
            area_destino: extraerAreaDestino(texto)
        };

        // Limpiar datos (quitar espacios extras, etc.)
        Object.keys(datosPDF).forEach(key => {
            if (typeof datosPDF[key] === 'string') {
                datosPDF[key] = datosPDF[key].trim();
            }
        });

        console.log('\nDatos extraídos:');
        console.log(JSON.stringify(datosPDF, null, 2));

        return datosPDF;

    } catch (error) {
        console.error('Error al parsear PDF:', error);
        throw new Error(`Error al extraer datos del PDF: ${error.message}`);
    }
}

/**
 * Extrae un campo simple usando regex
 * @param {string} texto - Texto del PDF
 * @param {RegExp} patron - Expresión regular para buscar
 * @returns {string|null}
 */
function extraerCampo(texto, patron) {
    const match = texto.match(patron);
    return match ? match[1].trim() : null;
}

/**
 * Extrae la descripción del reclamo
 * La descripción puede ser multilinea y termina cuando encuentra otro campo conocido
 * @param {string} texto
 * @returns {string|null}
 */
function extraerDescripcion(texto) {
    // Buscar desde "Descripción:" hasta el próximo campo (Fecha, Prioridad, Estado, etc.)
    const patronDescripcion = /Descripci[oó]n[:\s]+(.+?)(?=\n\s*(?:Fecha|Prioridad|Estado|Area destino|Solicitantes|Observaciones)[\s:]+)/is;
    const match = texto.match(patronDescripcion);

    if (match) {
        // Limpiar saltos de línea extras pero mantener la estructura
        let descripcion = match[1].trim();
        // Reemplazar múltiples espacios/saltos por uno solo
        descripcion = descripcion.replace(/\s+/g, ' ');
        return descripcion;
    }

    // Si no encuentra con el patrón anterior, buscar de forma más simple
    const patronSimple = /Descripci[oó]n[:\s]+([^\n]+(?:\n(?!\s*[A-Z][a-z]+:).+)*)/i;
    const matchSimple = texto.match(patronSimple);

    if (matchSimple) {
        return matchSimple[1].trim().replace(/\s+/g, ' ');
    }

    return null;
}

/**
 * Extrae el área destino (donde se deriva el reclamo)
 * @param {string} texto
 * @returns {string|null}
 */
function extraerAreaDestino(texto) {
    // Buscar en la tabla de derivaciones
    const patronAreaDestino = /Area destino[:\s]+([^\n]+)/i;
    const match = texto.match(patronAreaDestino);

    if (match) {
        return match[1].trim();
    }

    // Alternativa: buscar en la sección de derivaciones
    const patronDerivaciones = /Derivaciones[\s\S]*?([A-ZÁÉÍÓÚÑ\s]+?)\s+\d{2}\/\d{2}\/\d{4}/i;
    const matchDeriv = texto.match(patronDerivaciones);

    return matchDeriv ? matchDeriv[1].trim() : null;
}

/**
 * Extrae el nombre del solicitante
 * @param {string} texto
 * @returns {string|null}
 */
function extraerSolicitante(texto) {
    // Buscar en la tabla de solicitantes
    const patronSolicitante = /Apellido y Nombres[:\s]+([^\n]+?)(?:\s+Doc\.|DNI|$)/i;
    const match = texto.match(patronSolicitante);

    if (match) {
        // Limpiar (quitar "reit", paréntesis, etc.)
        let nombre = match[1].trim();
        nombre = nombre.replace(/\(.*?\)/g, '').trim();
        return nombre;
    }

    // Alternativa: buscar por patrón de nombre + DNI
    const patronNombreDNI = /([A-ZÁÉÍÓÚÑ\s]+?)\s+(?:\(\d+\s+reit\)\s+)?DNI\s+\d+/i;
    const matchNombre = texto.match(patronNombreDNI);

    return matchNombre ? matchNombre[1].trim() : null;
}

/**
 * Extrae el teléfono del solicitante
 * @param {string} texto
 * @returns {string|null}
 */
function extraerTelefono(texto) {
    // Buscar número de teléfono (varios formatos posibles)
    const patronTelefono = /Tel[eé]fono[:\s]+([0-9\-\(\)\s]+)/i;
    const match = texto.match(patronTelefono);

    if (match) {
        return match[1].trim();
    }

    // Buscar celular
    const patronCel = /Cel[:\s]+([0-9\-\(\)\s]+)/i;
    const matchCel = texto.match(patronCel);

    return matchCel ? matchCel[1].trim() : null;
}

/**
 * Extrae el email del solicitante
 * @param {string} texto
 * @returns {string|null}
 */
function extraerEmail(texto) {
    const patronEmail = /Email[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    const match = texto.match(patronEmail);
    return match ? match[1].trim() : null;
}

/**
 * Valida que los datos mínimos estén presentes
 * @param {object} datos - Datos extraídos
 * @returns {object} { valido: boolean, errores: string[] }
 */
function validarDatos(datos) {
    const errores = [];

    if (!datos.solicitud_nro) {
        errores.push('Número de solicitud no encontrado');
    }

    if (!datos.subtipo) {
        errores.push('Subtipo de reclamo no encontrado');
    }

    if (!datos.area_destino) {
        errores.push('Área destino no encontrada');
    }

    if (!datos.descripcion) {
        errores.push('Descripción no encontrada');
    }

    return {
        valido: errores.length === 0,
        errores
    };
}

/**
 * Procesa un PDF y retorna los datos validados
 * @param {string} rutaPDF
 * @returns {Promise<object>} { exito: boolean, datos?: object, errores?: string[] }
 */
async function procesarPDF(rutaPDF) {
    try {
        // Extraer datos
        const datos = await extraerDatosPDF(rutaPDF);

        // Validar datos
        const validacion = validarDatos(datos);

        if (!validacion.valido) {
            return {
                exito: false,
                datos,
                errores: validacion.errores
            };
        }

        return {
            exito: true,
            datos
        };

    } catch (error) {
        return {
            exito: false,
            errores: [error.message]
        };
    }
}

module.exports = {
    extraerDatosPDF,
    validarDatos,
    procesarPDF
};
