import { ObjectId } from 'mongoose'

export interface Booking {
  bookingId?: ObjectId | string
  userId: ObjectId | string
  roomId: ObjectId | string
  startDate: Date
  endDate: Date
  bookingDate: Date
  occupants: number
  pricePerNight: number
  totalPrice: number
  discount?: number
  totalNights: number
}
