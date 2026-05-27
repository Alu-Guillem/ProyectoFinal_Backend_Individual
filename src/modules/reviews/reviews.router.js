import { Router } from 'express'
import { requireRole } from '../auth/auth.middleware.js'
import {
  getReviews,
  createNewReview,
  getOneReview,
  updateReview,
  deleteReview,
} from './reviews.controller.js'

const router = Router()

/**
 * GET /api/reviews
 * Query params:
 *   - ?roomId=xxx → Reviews de una habitación (cualquier usuario autenticado)
 *   - ?userId=xxx → Reviews de un usuario (admin/employee o el mismo usuario)
 *   - Sin params  → Todas las reviews (solo admin/employee)
 */
router.get('/', getReviews)

/**
 * POST /api/reviews
 * Crear nueva reseña (solo customers)
 * Body: { bookingId, rate, comment }
 */
router.post('/', requireRole(['customer']), createNewReview)

/**
 * GET /api/reviews/:id
 * Obtener una reseña específica (admin/employee o el usuario propietario)
 */
router.get('/:id', getOneReview)

/**
 * PUT /api/reviews/:id
 * Actualizar reseña (solo el usuario que la creó)
 * Body: { rate?, comment? }
 */
router.put('/:id', requireRole(['customer']), updateReview)

/**
 * DELETE /api/reviews/:id
 * Eliminar reseña (solo el usuario que la creó)
 */
router.delete('/:id', requireRole(['customer']), deleteReview)

export default router
