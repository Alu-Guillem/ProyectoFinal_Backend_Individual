/**
 * @fileoverview Recordatorios automáticos de reservas
 * @module modules/bookings/booking-reminders
 *
 * Envía recordatorios de check-in y check-out 24 horas antes
 * en una ventana de tiempo configurable.
 */

import { formatDate } from '#commons/index.js'
import { sendEmail } from '#libs/mailing/index.js'
import { Booking } from './bookings.model.js'
import { Room } from '#modules/rooms/rooms.model.js'
import { User } from '#modules/users/users.model.js'

const HOUR_MS = 60 * 60 * 1000
const REMINDER_WINDOW_MS = 60 * 60 * 1000
const REMINDER_INTERVAL_MS = 60 * 60 * 1000

let isRunning = false

/**
 * Ejecuta una pasada de recordatorios.
 *
 * Busca reservas con check-in/check-out dentro de la ventana
 * de 24 horas y envía el correo correspondiente una sola vez.
 *
 * @async
 * @function processReminders
 * @returns {Promise<void>}
 */
async function processReminders() {
  if (isRunning) return
  isRunning = true

  try {
    const now = new Date()
    const target = now.getTime() + 24 * HOUR_MS
    const windowStart = new Date(target - REMINDER_WINDOW_MS / 2)
    const windowEnd = new Date(target + REMINDER_WINDOW_MS / 2)

    const checkInBookings = await Booking.find({
      status: 'active',
      checkInNotified: { $ne: true },
      startDate: { $gte: windowStart, $lte: windowEnd },
    })

    for (const booking of checkInBookings) {
      await sendReminderEmail(booking, 'check-in-alert')
      booking.checkInNotified = true
      await booking.save()
    }

    const checkOutBookings = await Booking.find({
      status: 'active',
      checkOutNotified: { $ne: true },
      endDate: { $gte: windowStart, $lte: windowEnd },
    })

    for (const booking of checkOutBookings) {
      await sendReminderEmail(booking, 'check-out-alert')
      booking.checkOutNotified = true
      await booking.save()
    }
  } catch (error) {
    console.error('Error en recordatorios de reservas:', error)
  } finally {
    isRunning = false
  }
}

/**
 * Envía un correo de recordatorio para una reserva.
 *
 * @async
 * @function sendReminderEmail
 * @param {import('types').Booking} booking - Reserva a notificar
 * @param {string} template - Nombre de la plantilla de correo
 * @returns {Promise<void>}
 */
async function sendReminderEmail(booking, template) {
  const [customer, room] = await Promise.all([
    User.findById(booking.userId).lean(),
    Room.findById(booking.roomId).lean(),
  ])

  if (!customer?.email) return

  const customerName = `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim()
  const startDate = formatDate(new Date(booking.startDate)) ?? ''
  const endDate = formatDate(new Date(booking.endDate)) ?? ''

  await sendEmail(customer.email, 'Recordatorio de reserva', template, {
    name: customerName || customer.email,
    bookingId: booking._id.toString(),
    roomName: room?.name ?? 'Habitacion asignada',
    checkIn: startDate,
    checkOut: endDate,
  })
}

/**
 * Inicia el programador de recordatorios.
 *
 * @function startBookingReminders
 * @returns {void}
 */
export function startBookingReminders() {
  processReminders()
  setInterval(() => {
    processReminders()
  }, REMINDER_INTERVAL_MS)
}
