/**
 * @fileoverview Conexión a base de datos MongoDB
 * @module libs/database
 *
 * Proporciona la función de conexión a MongoDB Atlas usando Mongoose.
 * Las credenciales se obtienen de las constantes de configuración.
 *
 * @requires mongoose
 * @requires #c (constantes de configuración)
 */

import { DB_USER, DB_PASS, DB_HOST, DB_NAME } from '#c'
import mongoose from 'mongoose'

/**
 * URI de conexión a MongoDB Atlas
 * @constant {string}
 * @private
 */
const URI = `mongodb+srv://${DB_USER}:${DB_PASS}@${DB_HOST}/?appName=${DB_NAME}`

/**
 * Establece la conexión con la base de datos MongoDB
 *
 * @async
 * @function connectDB
 * @returns {Promise<void>} Promesa que se resuelve cuando la conexión es exitosa
 *
 * @example
 * import { connectDB } from '#libs/database'
 *
 * // En el archivo principal de la aplicación
 * await connectDB()
 * console.log('Base de datos conectada')
 *
 * @throws {Error} Si la conexión falla (se muestra en consola)
 */
export const connectDB = () =>
  mongoose
    .connect(URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error MongoDB', err))
