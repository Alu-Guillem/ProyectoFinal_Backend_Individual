import { model, Schema } from 'mongoose'
import { type } from 'node:os'

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
  reserved: {
    type: Boolean,
    default: false
  },
  maintenance: {
    type: Boolean,
    default: false
  },
  maintenanceTime: {
    type: Date
  },
  maintenanceReason: {
    type: String
  },
  cleaningTime: {
    type: Number,
    default: 2
  },
  closed: {
    type: Boolean,
    default: false
  },
  occupancyLimit: {
    type: Number,
    required: true,
  },
  description: {
    type: String
  },
  offer: {
    type: Number
  },
  image: {
  type: String,
  default: null
  }
},
{
  timestamps: true,
  collection: "rooms"
}
)

//Comprueba que no exista habitaciones con el mismo nombre y tipo repetidos
RoomSchema.index({ name: 1, type: 1 }, { unique: true })

export const Room = model('Room', RoomSchema)


