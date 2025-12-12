import { Schema, Types } from 'mongoose'
import {
  isPositiveNumber,
  isValidNumber,
  isRequired,
  isInteger,
  validateSchema,
} from '#libs/validation/index.js'

export const Booking = new Schema({
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
})

/**
 * @type {import('types').ValidationSchema}
 */
export const BookingFields = {
  userId: [isRequired('id de usuario')],
  roomId: [isRequired('id de habitación')],
  startDate: [isRequired('fecha de inicio')],
  endDate: [isRequired('fecha de fin')],
  occupants: [isRequired('ocupantes'), isInteger('ocupantes'), isPositiveNumber('ocupantes')],
  pricePerNight: [
    isRequired('precio por noche'),
    isValidNumber('precio por noche'),
    isPositiveNumber('precio por noche'),
  ],
  totalPrice: [
    isRequired('precio total'),
    isValidNumber('precio total'),
    isPositiveNumber('precio total'),
  ],
  discount: [isValidNumber('descuento'), isPositiveNumber('descuento')],
}

/**
 * Valida los datos de una reserva
 * @param {Object} bookingData - Datos de la reserva a validar
 * @returns {boolean} - true si todas las validaciones pasan
 * @throws {Error} - Lanza un error si alguna validación falla
 */
export const validateBooking = bookingData => {
  return validateSchema(BookingFields, bookingData)
}
