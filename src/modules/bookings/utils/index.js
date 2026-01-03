/**
 * @fileoverview Utilidades para gestión de reservas
 * @module modules/bookings/utils
 *
 * Proporciona funciones para verificar disponibilidad de habitaciones
 * y detectar solapamientos entre reservas.
 */

/**
 * Rango de fechas para verificación de disponibilidad
 * @typedef {Object} DateRange
 * @property {Date|string} startDate - Fecha de inicio
 * @property {Date|string} endDate - Fecha de fin
 * @property {'active'|'canceled'} [status] - Estado de la reserva (opcional)
 */

/**
 * Verifica si dos rangos de fechas se solapan
 *
 * Dos rangos se solapan si el inicio de uno es anterior al fin del otro
 * y viceversa.
 *
 * @function hasOverlap
 * @param {DateRange} booking - Reserva existente
 * @param {DateRange} newBooking - Nueva reserva a verificar
 * @returns {boolean} true si hay solapamiento, false en caso contrario
 *
 * @example
 * // Reserva existente: 10-15 enero
 * // Nueva reserva: 14-20 enero
 * hasOverlap(
 *   { startDate: '10/01/2024', endDate: '15/01/2024' },
 *   { startDate: '14/01/2024', endDate: '20/01/2024' }
 * ) // true - hay solapamiento
 *
 * @example
 * // Reserva existente: 10-15 enero
 * // Nueva reserva: 16-20 enero
 * hasOverlap(
 *   { startDate: '10/01/2024', endDate: '15/01/2024' },
 *   { startDate: '16/01/2024', endDate: '20/01/2024' }
 * ) // false - no hay solapamiento
 */
export const hasOverlap = (booking, newBooking) => {
  const newStart = new Date(newBooking.startDate)
  const newEnd = new Date(newBooking.endDate)
  const bookingStart = new Date(booking.startDate)
  const bookingEnd = new Date(booking.endDate)

  return bookingStart < newEnd && bookingEnd > newStart
}

/**
 * Verifica si una habitación está disponible para un rango de fechas
 *
 * Comprueba que no existan reservas activas que se solapen con el rango solicitado.
 *
 * @function isAvailable
 * @param {DateRange[]} bookings - Lista de reservas existentes de la habitación
 * @param {DateRange} newBooking - Rango de fechas a verificar
 * @returns {boolean} true si la habitación está disponible, false si hay conflicto
 *
 * @example
 * const existingBookings = [
 *   { startDate: new Date('2024-01-10'), endDate: new Date('2024-01-15'), status: 'active' },
 *   { startDate: new Date('2024-01-20'), endDate: new Date('2024-01-25'), status: 'canceled' }
 * ]
 *
 * // Verificar disponibilidad para 16-19 enero
 * isAvailable(existingBookings, {
 *   startDate: new Date('2024-01-16'),
 *   endDate: new Date('2024-01-19')
 * }) // true - disponible (no hay conflicto con activas)
 */
export const isAvailable = (bookings, newBooking) =>
  !bookings.some(booking => hasOverlap(booking, newBooking) && booking.status === 'active')
