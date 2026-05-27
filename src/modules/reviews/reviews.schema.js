/**
 * @fileoverview Esquema de validación para la colección 'reviews' en MongoDB.
 * @module modules/reviews/reviews.schema
 *
 * Define el esquema de validación JSON Schema para la colección de reseñas.
 * Utiliza el comando `collMod` de MongoDB para aplicar la validación estricta.
 *
 * @requires mongoose
 */
import mongoose from 'mongoose'

/**
 * Esquema de validación para la colección 'reviews'.
 * @constant {object}
 * @private
 */
const ReviewCollectionSchema = {
  collMod: 'reviews',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'roomId', 'bookingId', 'rate', 'createdAt'],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'El ID del usuario que realiza la reseña',
        },
        roomId: {
          bsonType: 'objectId',
          description: 'El ID de la habitación reseñada',
        },
        bookingId: {
          bsonType: 'objectId',
          description: 'El ID de la reserva asociada',
        },
        rate: {
          bsonType: ['double', 'int'],
          minimum: 0.5,
          maximum: 5,
          description: 'Calificación otorgada (0.5 a 5)',
        },
        comment: {
          bsonType: 'string',
          description: 'Comentario de la reseña',
          maxLength: 250,
        },
        createdAt: {
          bsonType: 'date',
          description: 'Fecha de creación de la reseña',
        },
      },
    },
  },
  validationLevel: 'strict',
  validationAction: 'error',
}

/**
 * Aplica el esquema de validación a la colección 'reviews' en la base de datos.
 *
 * @function
 * @returns {Promise<object>} Resultado del comando MongoDB
 * @example
 * import applyReviewSchema from './reviews.schema.js'
 * await applyReviewSchema()
 */
export default () => mongoose.connection.db.command(ReviewCollectionSchema)
