import { Types } from 'mongoose'

/**
 * Contrato tipado de reserva compartido entre capa de datos y lógica de negocio.
 */
export interface Booking {
  bookingId?: Types.ObjectId
  userId?: Types.ObjectId
  roomId?: Types.ObjectId
  startDate: Date | string
  endDate: Date | string
  bookingDate: Date | string
  occupants: number
  pricePerNight: number
  totalPrice: number
  discount?: number
  totalNights: number
  status: 'canceled' | 'active'
  isPaid?: boolean
  checkInNotified?: boolean
  checkOutNotified?: boolean
}
