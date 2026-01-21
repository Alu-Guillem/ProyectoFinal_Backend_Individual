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

import { DB_URI } from '#c'
import mongoose from 'mongoose'

import bookingSchema from '#modules/bookings/bookings.schema.js'

/**
 * URI de conexión a MongoDB Atlas
 * @constant {string}
 * @private
 */
const URI = DB_URI


/**
 * Registro de funciones que aplican validaciones de esquemas a las colecciones de la base de datos.
 * Cada elemento debe ser una función que ejecuta la validación o modificación de un esquema en MongoDB.
 *
 * @constant {Array<Function>}
 * @private
 */
const schemaRegistry = [bookingSchema]

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
    /**
     * Aplica todas las funciones de validación de esquemas registradas en schemaRegistry.
     * Esto asegura que las colecciones tengan las validaciones actualizadas tras la conexión.
     */
    .then(() => schemaRegistry.forEach(schema => schema()))
    .catch(err => console.error('Error MongoDB', err))
