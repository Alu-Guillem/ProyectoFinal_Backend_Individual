import { model, Schema } from 'mongoose'

export const RoomSchema = new Schema({
  pricePerNight: {
    type: Number,
    required: true,
  },
  offer: {
    type: Number,
    default: 0,
  },
  occupancyLimit: {
    type: Number,
    required: true,
  },
})

export const Room = model('Room', RoomSchema)
