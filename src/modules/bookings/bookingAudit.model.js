import { Schema, Types, model } from 'mongoose'

export const BookingAuditLogSchema = new Schema({
  bookingId: {
    type: Types.ObjectId,
    ref: 'Booking',
    required: true
  },

  action: {
    type: String,
    enum: ['create','update', 'delete', 'cancel', 'pay', 'extend'],
    required: true
  },

  actorId: {
    type: Types.ObjectId,
    ref: 'users',
    required: true
  },

  actorType: {
    type: String,
    enum: ['customer', 'employee', 'admin'],
    required: true
  },

  previousState: {
    type: Object,
    required: true
  },

  newState: {
    type: Object,
    default: null
  },

  timestamp: {
    type: Date,
    default: Date.now
  }
})

export const BookingAuditLog = model(
  'booking_audit_logs',
  BookingAuditLogSchema
)