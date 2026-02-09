import { Types } from 'mongoose'

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
