import { Schema, Types, model } from 'mongoose'
import {
  isPositiveNumber,
  isRequired,
  isInteger,
  validateSchema,
  isValidDate,
} from '#libs/validation/index.js'
import { formatDate } from '#commons/index.js'

/**
 * @type {Schema<import('types').Booking>}
 */
export const BookingDatabaseSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      required: true,
    },
    roomId: {
      type: Types.ObjectId,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    occupants: {
      type: Number,
      required: true,
    },
    pricePerNight: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalNights: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['canceled', 'active'],
      default: 'active',
    },
  },
  {
    toJSON: {
      transform(_doc, ret) {
        ret.startDate = formatDate(ret.startDate)
        ret.endDate = formatDate(ret.endDate)
        ret.bookingDate = formatDate(ret.bookingDate)
        return ret
      },
    },
  },
)

/**
 * @type {import('mongoose').Model<import('types').Booking>}
 */
export const Booking = model('Booking', BookingDatabaseSchema)

/**
 * @type {import('types').ValidationSchema}
 */
export const BookingInputSchema = {
  userId: [isRequired('id de usuario')],
  roomId: [isRequired('id de habitación')],
  startDate: [isRequired('fecha de inicio'), isValidDate('fecha de inicio')],
  endDate: [isRequired('fecha de fin'), isValidDate('fecha de fin')],
  occupants: [isRequired('ocupantes'), isInteger('ocupantes'), isPositiveNumber('ocupantes')],
}

/**
 * Valida los datos de una reserva
 * @param {Object} bookingData - Datos de la reserva a validar
 * @returns {Object} - true si todas las validaciones pasan
 * @throws {Error} - Lanza un error si alguna validación falla
 */
export const validateBooking = bookingData => {
  return validateSchema(BookingInputSchema, bookingData)
}

/**
 * @type {import('types').ValidationSchema}
 */
export const BookingUpdateSchema = {
  startDate: [isValidDate('fecha de inicio')],
  endDate: [isValidDate('fecha de fin')],
  occupants: [isInteger('ocupantes'), isPositiveNumber('ocupantes')],
}

/**
 * Valida los datos de actualización de una reserva
 * @param {Object} bookingData - Datos a validar
 * @returns {Object} - Datos validados
 * @throws {Error} - ValidationError
 */
export const validateBookingUpdate = bookingData => {
  return validateSchema(BookingUpdateSchema, bookingData)
}
