import { Router } from 'express'
/**
 * @fileoverview Enrutador principal de la API
 *
 * Define los prefijos de ruta y el orden de los middlewares compartidos
 * (sesion y autenticacion) antes de delegar en los modulos de dominio.
 */

import usersRouter from '#modules/users/users.router.js'
import roomsRouter from '#modules/rooms/rooms.router.js'
import bookingsRouter from '#modules/bookings/bookings.router.js'
import reviewsRouter from '#modules/reviews/reviews.router.js'
import authRouter from '#modules/auth/auth.router.js'
import { authMiddleware, sessionMiddleware } from '#modules/auth/auth.middleware.js'

import invoiceRouter from '#modules/invoices/invoice.router.js'

const router = Router()

router.use(sessionMiddleware)
router.use('/auth', authRouter)
router.use(authMiddleware)
router.use('/users', usersRouter)
router.use('/rooms', roomsRouter)
router.use('/bookings', bookingsRouter)
router.use('/reviews', reviewsRouter)

router.use('/invoices', invoiceRouter)
export default router
