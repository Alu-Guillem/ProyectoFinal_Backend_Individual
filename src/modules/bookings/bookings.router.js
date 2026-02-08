/**
 * @fileoverview Router de reservas (Bookings)
 * @module modules/bookings/router
 *
 * Define las rutas REST para la gestión de reservas.
 * Todas las rutas requieren autenticación previa.
 *
 * @requires express
 * @requires ./bookings.controller
 */

import { Router } from 'express'
import {
  getOneBooking,
  getBookings,
  createNewBooking,
  updateBooking,
  deleteBooking,
  cancelBooking,
  extendBooking,
} from '#modules/bookings/bookings.controller.js'
import { validateBooking } from './bookings.model.js'

const router = Router()

router.get('/fail-request', (req, res) => {
  try {
    validateBooking({})
    res.status(200).json({ message: 'Validación exitosa' })
  } catch (err) {
    console.log(JSON.stringify(err))
    res.status(400).json(err)
  }
})

/**
 * @route GET /api/bookings
 * @description Obtiene todas las reservas (filtradas por rol)
 * @access Admin/Employee: todas | Customer: solo propias
 */
router.get('/', getBookings)

/**
 * @route POST /api/bookings
 * @description Crea una nueva reserva
 * @access Todos los usuarios autenticados
 * @body {string} roomId - ID de la habitación
 * @body {string} startDate - Fecha de inicio (DD/MM/YYYY)
 * @body {string} endDate - Fecha de fin (DD/MM/YYYY)
 * @body {number} occupants - Número de ocupantes
 * @body {string} [userId] - ID del usuario (solo admin/employee)
 */
router.post('/', createNewBooking)

/**
 * @route GET /api/bookings/:id
 * @description Obtiene una reserva específica por ID
 * @access Admin/Employee: cualquiera | Customer: solo propias
 * @param {string} id - ID de la reserva
 */
router.get('/:id', getOneBooking)

/**
 * @route PUT /api/bookings/:id
 * @description Actualiza fechas u ocupantes de una reserva
 * @access Admin/Employee: cualquiera | Customer: solo propias
 * @param {string} id - ID de la reserva
 * @body {string} [startDate] - Nueva fecha de inicio
 * @body {string} [endDate] - Nueva fecha de fin
 * @body {number} [occupants] - Nuevo número de ocupantes
 */
router.put('/:id', updateBooking)

/**
 * @route PUT /api/bookings/:id/cancel
 * @description Cancela una reserva (cambia estado a 'canceled')
 * @access Admin/Employee: cualquiera | Customer: solo propias
 * @param {string} id - ID de la reserva
 */
router.put('/:id/cancel', cancelBooking)

/**
 * @route PUT /api/bookings/:id/extend
 * @description Extiende la fecha de fin de una reserva
 * @access Admin/Employee: cualquiera | Customer: solo propias
 * @param {string} id - ID de la reserva
 * @body {string} endDate - Nueva fecha de fin
 */
router.put('/:id/extend', extendBooking)

/**
 * @route DELETE /api/bookings/:id
 * @description Elimina permanentemente una reserva
 * @access Admin/Employee: cualquiera | Customer: solo propias
 * @param {string} id - ID de la reserva
 */
router.delete('/:id', deleteBooking)

export default router
