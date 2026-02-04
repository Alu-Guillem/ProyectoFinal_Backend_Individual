import { model, Schema } from 'mongoose'

export const RoomSchema = new Schema({
  name:{
    type: String,
    required: true
  },
  type:{
    type: String,
    required: true
  },
  number: {
    type: Number,
    required: true,
  },
  pricePerNight: {
    type: Number,
    required: true,
  },
  occuped: {
    type: Boolean,
    default: false,
  },
  occupancyLimit: {
    type: Number,
    required: true,
  },
},
{
  timestamps: true,
  collection: "rooms"
}
)

export const Room = model('Room', RoomSchema)


