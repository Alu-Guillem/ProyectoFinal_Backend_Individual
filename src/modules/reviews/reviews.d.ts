import { ObjectId } from 'mongoose'

export interface Review {
  reviewId?: ObjectId | string
  bookingId: ObjectId | string
  userId: ObjectId | string
  roomId: ObjectId | string
  rate: number
  comment?: string
  createdAt: Date
}
