import { model, Schema } from 'mongoose'

export const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ['admin', 'employee', 'customer'],
    default: 'customer',
  },
})

export const User = model('User', UserSchema)
