/**
 * @fileoverview Servicio de envío de correos electrónicos
 * @module libs/mailing
 *
 * Proporciona funcionalidades para enviar correos electrónicos
 * usando plantillas HTML con variables dinámicas.
 *
 * Características:
 * - Caché de plantillas para optimizar rendimiento
 * - Soporte para variables dinámicas {{variable}}
 * - Pool de conexiones SMTP para envíos masivos
 *
 * @requires nodemailer
 * @requires fs/promises
 * @requires #r/constants.js
 */

import { MAIL_HOST, MAIL_PASS, MAIL_PORT, MAIL_USER } from '#r/constants.js'
import nodemailer from 'nodemailer'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * Caché de plantillas: nombre -> contenido HTML
 * @type {Map<string, string>}
 * @private
 */
const templateCache = new Map()

/**
 * Lista de nombres de plantillas disponibles
 * @type {string[]}
 * @private
 */
let emailTemplates = []

/**
 * Transportador de Nodemailer configurado con pool de conexiones
 * @type {import('nodemailer').Transporter}
 * @private
 */
const transporter = nodemailer.createTransport({
  // @ts-ignore
  host: MAIL_HOST,
  port: Number(MAIL_PORT),
  secure: false,
  pool: true,
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
})

/**
 * Obtiene la ruta al directorio de plantillas
 * @function getTemplatesDir
 * @returns {string} Ruta absoluta al directorio de plantillas
 * @private
 */
function getTemplatesDir() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  return path.join(__dirname, 'templates')
}

/**
 * Inicializa el servicio de correo electrónico
 *
 * Verifica la conexión SMTP y carga la lista de plantillas disponibles.
 * Debe llamarse una vez al iniciar la aplicación.
 *
 * @async
 * @function connectEmail
 *
 * @example
 * import { connectEmail } from '#libs/mailing'
 *
 * // Al iniciar la aplicación
 * await connectEmail()
 */
export async function connectEmail() {
  try {
    await transporter.verify()
    console.log('Conectado al servicio de correo')
  } catch (err) {
    console.error('Error al conectar con el servicio de correo:', err)
  }

  // Cargar nombres de plantillas y rellenar caché perezoso
  try {
    const dir = getTemplatesDir()
    const files = await fs.readdir(dir)
    emailTemplates = files.filter(f => f.endsWith('.html')).map(f => f.replace(/\.html$/i, ''))
    console.log(`Plantillas de correo cargadas: ${emailTemplates.join(', ')}`)
  } catch (err) {
    console.error('Error al cargar las plantillas de correo:', err)
  }

  // testTemplates('test@example.com')
}

/**
 * Envía un correo electrónico usando una plantilla HTML
 *
 * @async
 * @function sendEmail
 * @param {string} to - Dirección de correo del destinatario
 * @param {string} subject - Asunto del correo
 * @param {string} template - Nombre de la plantilla (sin extensión .html)
 * @param {Object<string, string>} variables - Variables a reemplazar en la plantilla
 * @returns {Promise<import('nodemailer').SentMessageInfo>} Información del envío
 * @throws {Error} Si la plantilla no existe
 *
 * @example
 * import { sendEmail } from '#libs/mailing'
 *
 * await sendEmail(
 *   'usuario@example.com',
 *   'Bienvenido a TryCatchers',
 *   'welcome',
 *   { name: 'Juan', email: 'juan@example.com' }
 * )
 */
export async function sendEmail(to, subject, template, variables) {
  if (!emailTemplates.includes(template)) {
    throw new Error(`La plantilla de correo "${template}" no existe`)
  }

  const html = await renderTemplate(template, variables)
  const mailOptions = {
    from: `"TryCatchers" <${MAIL_USER}>`,
    to,
    subject,
    text: 'Por favor, utiliza un cliente de correo que soporte HTML para ver este mensaje.',
    html,
  }

  return transporter.sendMail(mailOptions)
}

/**
 * Obtiene el contenido de una plantilla (con caché)
 *
 * @async
 * @function getTemplateContent
 * @param {string} templateName - Nombre de la plantilla
 * @returns {Promise<string>} Contenido HTML de la plantilla
 * @private
 */
async function getTemplateContent(templateName) {
  // Usar caché para evitar IO repetido
  if (templateCache.has(templateName)) return templateCache.get(templateName)
  const filePath = path.join(getTemplatesDir(), `${templateName}.html`)
  const content = await fs.readFile(filePath, 'utf-8')
  templateCache.set(templateName, content)
  return content
}

/**
 * Renderiza una plantilla reemplazando las variables
 *
 * Busca patrones {{variable}} en la plantilla y los reemplaza
 * con los valores proporcionados.
 *
 * @async
 * @function renderTemplate
 * @param {string} templateName - Nombre de la plantilla
 * @param {Object<string, string>} variables - Variables a reemplazar
 * @returns {Promise<string>} HTML con variables reemplazadas
 * @private
 */
async function renderTemplate(templateName, variables) {
  let templateContent = await getTemplateContent(templateName)
  for (const [key, value] of Object.entries(variables || {})) {
    const placeholder = `{{${key}}}`
    // Reemplazo global simple y seguro
    templateContent = templateContent.split(placeholder).join(String(value))
  }
  return templateContent
}

/**
 * Lista las plantillas de correo disponibles
 *
 * @function listEmailTemplates
 * @returns {string[]} Array con los nombres de las plantillas disponibles
 *
 * @example
 * const templates = listEmailTemplates()
 * console.log(templates) // ['welcome', 'password-recovery', 'booking-confirmation', ...]
 */
export function listEmailTemplates() {
  return [...emailTemplates]
}

/**
 * Verifica si una plantilla existe
 *
 * @function hasEmailTemplate
 * @param {string} name - Nombre de la plantilla a verificar
 * @returns {boolean} true si la plantilla existe
 *
 * @example
 * if (hasEmailTemplate('welcome')) {
 *   await sendEmail(to, 'Bienvenido', 'welcome', { name: 'Usuario' })
 * }
 */
export function hasEmailTemplate(name) {
  return emailTemplates.includes(name)
}

/**
 * Envía correos de prueba con todas las plantillas disponibles
 *
 * Útil para verificar que todas las plantillas funcionan correctamente.
 *
 * @function testTemplates
 * @param {string} to - Dirección de correo para las pruebas
 *
 * @example
 * testTemplates('admin@example.com')
 */
export function testTemplates(to) {
  emailTemplates.forEach(async template => {
    sendEmail(to, `Prueba de plantilla: ${template}`, template, {
      name: 'Usuario de Prueba',
    })
      .then(() => console.log(`Correo de prueba enviado con la plantilla "${template}"`))
      .catch(err =>
        console.error(`Error al enviar correo de prueba con la plantilla "${template}":`, err),
      )
  })
}
