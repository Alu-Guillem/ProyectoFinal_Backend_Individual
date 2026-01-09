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
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  dni: {
    type: String,
    unique: true,
  },
})

export const User = model('User', UserSchema)
