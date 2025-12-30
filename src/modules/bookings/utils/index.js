/**
 * @param {import("types").Booking} booking
 * @param {import("types").Booking} newBooking
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
 * @param {import("types").Booking} newBooking
 */
export const isAvailable = (bookings, newBooking) =>
  !bookings.some(booking => hasOverlap(booking, newBooking))
