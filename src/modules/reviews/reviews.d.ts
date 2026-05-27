import { ObjectId } from 'mongoose'

/**
 * Contrato tipado de reseña utilizado por controladores, modelo y validaciones.
 */
export interface Review {
  reviewId?: ObjectId | string
  bookingId: ObjectId | string
  userId: ObjectId | string
  roomId: ObjectId | string
  rate: number
  comment?: string
  createdAt: Date
}
