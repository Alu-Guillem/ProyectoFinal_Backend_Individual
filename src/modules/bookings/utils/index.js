/**
 * @typedef {{ startDate: Date | string, endDate: Date | string }} DateRange
 */

/**
 * @param {DateRange} booking
 * @param {DateRange} newBooking
 */
export const hasOverlap = (booking, newBooking) => {
  const newStart = new Date(newBooking.startDate)
  const newEnd = new Date(newBooking.endDate)
  const bookingStart = new Date(booking.startDate)
  const bookingEnd = new Date(booking.endDate)

  return bookingStart < newEnd && bookingEnd > newStart
}

/**
 * @param {import("types").Booking[]} bookings
 * @param {DateRange} newBooking
 */
export const isAvailable = (bookings, newBooking) =>
  !bookings.some(booking => hasOverlap(booking, newBooking) && booking.status === 'active')
