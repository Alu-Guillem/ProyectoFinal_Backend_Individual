import { Schema, model } from 'mongoose'
import {
  isPositiveNumber,
  isRequired,
  isInteger,
  validateSchema,
  isValidString,
} from '#libs/validation/index.js'
import { formatDate } from '#commons/index.js'

/**
 * @type {Schema<import('types').Review>}
 */
export const ReviewDatabaseSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    comment: {
      type: String,
      required: false,
    },
    createdAt: {
      type: Date,
      required: true,
    },
  },
  {
    toJSON: {
      transform(_doc, ret) {
        ret.createdAt = formatDate(ret.createdAt)
        return ret
      },
    },
  },
)

/**
 * @type {import('mongoose').Model<import('types').Review>}
 */
export const Review = model('Review', ReviewDatabaseSchema)

/**
 * @type {import('types').ValidationSchema}
 */
export const ReviewInputSchema = {
  bookingId: [isRequired('id de la reserva')],
  rate: [isRequired('calificación'), isPositiveNumber('calificación')],
  comment: [isRequired('comentario'), isValidString('comentario')],
}

/**
 * Valida los datos de una reserva
 * @param {Object} ReviewData - Datos de la reserva a validar
 * @returns {Object} - true si todas las validaciones pasan
 * @throws {Error} - Lanza un error si alguna validación falla
 */
export const validateReview = ReviewData => {
  return validateSchema(ReviewInputSchema, ReviewData)
}

/**
 * @type {import('types').ValidationSchema}
 */
export const ReviewUpdateSchema = {
  rate: [isRequired('calificación'), isInteger('calificación'), isPositiveNumber('calificación')],
  comment: [isRequired('comentario'), isValidString('comentario')],
}

/**
 * Valida los datos de actualización de una reserva
 * @param {Object} ReviewData - Datos a validar
 * @returns {Object} - Datos validados
 * @throws {Error} - ValidationError
 */
export const validateReviewUpdate = ReviewData => {
  return validateSchema(ReviewUpdateSchema, ReviewData)
}
