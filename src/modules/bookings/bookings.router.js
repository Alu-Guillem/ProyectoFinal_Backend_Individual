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

const router = Router()
// GET /api/bookings
router.get('/', getBookings)
// POST /api/bookings
router.post('/', createNewBooking)

// GET /api/bookings/:id
router.get('/:id', getOneBooking)

// PUT /api/bookings/:id
router.put('/:id', updateBooking)
// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', cancelBooking)
// PUT /api/bookings/:id/extend
router.put('/:id/extend', extendBooking)

// DELETE /api/bookings/:id
router.delete('/:id', deleteBooking)

export default router
