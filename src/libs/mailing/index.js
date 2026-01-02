import { MAIL_HOST, MAIL_PASS, MAIL_PORT, MAIL_USER } from '#r/constants.js'
import nodemailer from 'nodemailer'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

// Cache de plantillas: nombre -> contenido HTML
const templateCache = new Map()
// Lista de nombres disponibles (derivada de la carpeta)
let emailTemplates = []

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

function getTemplatesDir() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  return path.join(__dirname, 'templates')
}

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

  testTemplates('test@example.com')
}

/**
 * @param {string} to
 * @param {string} subject
 * @param {string} template
 * @param {{[key: string]: string}} variables
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
 * @param {string} templateName
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
 * @param {string} templateName
 * @param {{[key: string]: string}} variables
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

/** Lista las plantillas disponibles */
export function listEmailTemplates() {
  return [...emailTemplates]
}

/**
 * Verifica si una plantilla existe
 * @param {string} name
 */
export function hasEmailTemplate(name) {
  return emailTemplates.includes(name)
}

/**
 * @param {string} to
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
