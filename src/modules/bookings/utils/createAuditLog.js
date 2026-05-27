import { BookingAuditLog } from '../bookingAudit.model.js'

export const createAuditLog = async ({
  bookingId,
  action,
  actorId,
  actorType,
  previousState,
  newState
}) => {

  await BookingAuditLog.create({
    bookingId,
    action,
    actorId,
    actorType,
    previousState,
    newState,
    timestamp: new Date()
  })
}