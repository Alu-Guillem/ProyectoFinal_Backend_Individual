/**
 * @fileoverview Esquema de validación para la colección 'bookings' en MongoDB.
 * @module modules/bookings/bookings.schema
 *
 * Define el esquema de validación JSON Schema para la colección de reservas.
 * Utiliza el comando `collMod` de MongoDB para aplicar la validación estricta.
 *
 * @requires mongoose
 */
import mongoose from 'mongoose'

/**
 * Esquema de validación para la colección 'bookings'.
 * @constant {object}
 * @private
 */
const BookingCollectionSchema = {
  collMod: 'bookings',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: [
        'userId',
        'roomId',
        'startDate',
        'endDate',
        'occupants',
        'pricePerNight',
        'totalPrice',
        'totalNights',
        'status',
      ],
      properties: {
        userId: {
          bsonType: 'objectId',
          description: 'El ID del usuario que realiza la reserva',
        },
        roomId: {
          bsonType: 'objectId',
          description: 'El ID de la habitación reservada',
        },
        startDate: {
          bsonType: 'date',
          description: 'Fecha de inicio de la estancia',
        },
        endDate: {
          bsonType: 'date',
          description: 'Fecha de fin de la estancia',
        },
        bookingDate: {
          bsonType: 'date',
          description: 'Fecha en que se realizó la reserva',
        },
        occupants: {
          bsonType: 'int',
          description: 'Cantidad de huéspedes durante la estancia',
          minimum: 1,
        },
        pricePerNight: {
          bsonType: ['double', 'int'],
          description: 'Precio por noche (con descuento aplicado)',
        },
        totalPrice: {
          bsonType: ['double', 'int'],
          description: 'Precio total pagado de la estancia',
        },
        discount: {
          bsonType: 'int',
          description: 'Porcentaje de descuento aplicado',
          minimum: 0,
          maximum: 100,
        },
        totalNights: {
          bsonType: 'int',
          description: 'Número total de noches',
          minimum: 1,
        },
        status: {
          enum: ['active', 'canceled'],
          description: 'Estado de la reserva',
        },
        isPaid: {
          bsonType: 'bool',
          description: 'Indica si la reserva ya fue pagada',
        },
        checkInNotified: {
          bsonType: 'bool',
          description: 'Indica si se envio el recordatorio de check-in',
        },
        checkOutNotified: {
          bsonType: 'bool',
          description: 'Indica si se envio el recordatorio de check-out',
        },
      },
    },
  },
  validationLevel: 'strict',
  validationAction: 'error',
}

/**
 * Aplica el esquema de validación a la colección 'bookings' en la base de datos.
 *
 * @function
 * @returns {Promise<object>} Resultado del comando MongoDB
 * @example
 * import applyBookingSchema from './bookings.schema.js'
 * await applyBookingSchema()
 */
export default () => mongoose.connection.db.command(BookingCollectionSchema)
