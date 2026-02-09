import { Router } from 'express'
import usersRouter from '#modules/users/users.router.js'
import roomsRouter from '#modules/rooms/rooms.router.js'
import bookingsRouter from '#modules/bookings/bookings.router.js'
import { payBooking } from '#modules/bookings/bookings.controller.js'
import authRouter from '#modules/auth/auth.router.js'
import { authMiddleware, sessionMiddleware } from '#modules/auth/auth.middleware.js'

const router = Router()

router.use(sessionMiddleware)
router.use('/auth', authRouter)
router.use(authMiddleware)
router.use('/users', usersRouter)
router.use('/rooms', roomsRouter)
router.use('/bookings', bookingsRouter)
router.put('/booking/:id/pay', payBooking)

export default router
