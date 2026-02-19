/**
 * @fileoverview Controlador REST de reservas con validaciones de negocio.
 */

import { formatDate, parseDate } from '#commons/index.js'
import { Booking, validateBooking, validateBookingUpdate } from './bookings.model.js'
import { Room } from '#modules/rooms/rooms.model.js'
import { isAvailable } from './utils/index.js'
import { isValidObjectId, Types } from 'mongoose'
import { User } from '#modules/users/users.model.js'
import { sendEmail } from '#libs/mailing/index.js'

/**
 * Obtiene todas las reservas según el rol del usuario
 *
 * @async
 * @function getBookings
 * @param {import('types').AuthenticatedRequest} req - Request con sesión autenticada
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Admin/employee pueden ver todas las reservas.
 * Customers solo pueden ver sus propias reservas.
 *
 * @response 200 - Array de reservas encontradas
 * @response 404 - No se encontraron reservas
 * @response 500 - Error del servidor
 */
export async function getBookings(req, res) {
  try {
    const { role, userId } = req.session

    const filter = {}
    if (role === 'customer') {
      filter.userId = userId
    }

    const bookings = await Booking.find(filter)

    if (bookings.length === 0)
      return res.status(404).json({ message: 'No se encontraron reservas' })

    res.status(200).json(bookings)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * Crea una nueva reserva
 *
 * @async
 * @function createNewBooking
 * @param {import('types').AuthenticatedRequest} req - Request con sesión autenticada
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Customers crean reservas para sí mismos (userId se asigna automáticamente).
 * Admin/employee pueden crear reservas para cualquier usuario.
 * Empleados no pueden crear reservas para sí mismos.
 *
 * Validaciones:
 * - Fechas válidas (inicio < fin, no en el pasado)
 * - Habitación existente y disponible
 * - Ocupantes dentro del límite de la habitación
 *
 * @bodyParam {string} roomId - ID de la habitación (requerido)
 * @bodyParam {string} startDate - Fecha de inicio (requerido, formato YYYY-MM-DD)
 * @bodyParam {string} endDate - Fecha de fin (requerido, formato YYYY-MM-DD)
 * @bodyParam {number} occupants - Número de ocupantes (requerido)
 * @bodyParam {string} [userId] - ID del usuario (solo admin/employee)
 *
 * @response 201 - Reserva creada exitosamente con cálculos de precio
 * @response 400 - Datos inválidos, fechas incorrectas, ocupantes excedidos o habitación no disponible
 * @response 404 - Habitación no encontrada
 * @response 500 - Error del servidor
 */
export async function createNewBooking(req, res) {
  try {
    const { userId, role } = req.session
    const bookingData = req.body

    if (!bookingData) {
      return res.status(400).json({ message: 'Datos de la reserva no proporcionados' })
    }

    // Asigna el ID del usuario si el rol es cliente
    if (role === 'customer') {
      bookingData.userId = userId
    }

    let validatedBooking
    try {
      validatedBooking = validateBooking(bookingData)
    } catch (err) {
      return res.status(400).json(err)
    }

    // Validar que los empleados no creen reservas para sí mismos (regla de negocio)
    if (role === 'employee' && validatedBooking.userId === userId) {
      return res
        .status(400)
        .json({ message: 'Los empleados no pueden crear reservas para sí mismos' })
    }

    // Parseo y validación lógica de fechas
    const startDate = parseDate(validatedBooking.startDate)
    const endDate = parseDate(validatedBooking.endDate)
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    if (startDate >= endDate) {
      return res
        .status(400)
        .json({ message: 'La fecha de inicio debe ser anterior a la fecha de fin' })
    }
    if (startDate < now) {
      return res.status(400).json({ message: 'No se pueden crear reservas en el pasado' })
    }

    // Verificar existencia de la habitación
    const room = await Room.findById(validatedBooking.roomId)
    if (!room) {
      return res.status(404).json({ message: 'Habitación no encontrada' })
    }

    // Validar capacidad de la habitación
    if (validatedBooking.occupants > room.occupancyLimit) {
      return res.status(400).json({
        message: `El límite de ocupación para esta habitación es de ${room.occupancyLimit} personas`,
      })
    }

    // Verificar disponibilidad
    // Se obtienen todas las reservas de la habitación para comprobar conflicto
    const existingBookings = await Booking.find({ roomId: validatedBooking.roomId }).lean()

    // Objeto temporal con fechas parseadas para la verificación
    const tempBookingToCheck = { ...validatedBooking, startDate, endDate }

    if (!isAvailable(existingBookings, tempBookingToCheck)) {
      return res
        .status(400)
        .json({ message: 'La habitación no está disponible en las fechas seleccionadas' })
    }

    const discount =
      validatedBooking.discount !== undefined && (role === 'employee' || role === 'admin')
        ? validatedBooking.discount
        : Number(room.offer ?? 0)
    // Cálculos de precios
    const totalNights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const pricePerNight = parseFloat((room.pricePerNight * (1 - discount / 100)).toFixed(2))
    const totalPrice = parseFloat((totalNights * pricePerNight).toFixed(2))
    const userObjectId = new Types.ObjectId(validatedBooking.userId)
    const roomObjectId = new Types.ObjectId(validatedBooking.roomId)

    // Creación de la reserva
    const newBooking = new Booking({
      ...validatedBooking,
      startDate,
      endDate,
      bookingDate: new Date(),
      totalNights,
      pricePerNight,
      totalPrice,
      discount,
      isPaid: false,
      checkInNotified: false,
      checkOutNotified: false,
      userId: userObjectId,
      roomId: roomObjectId,
    })

    const savedBooking = await newBooking.save()

    try {
      const customer = await User.findById(validatedBooking.userId).lean()
      if (customer?.email) {
        const customerName = `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim()
        await sendEmail(customer.email, 'Reserva creada', 'new-booking', {
          name: customerName || customer.email,
          bookingId: savedBooking._id.toString(),
          roomName: room?.name ?? 'Habitacion asignada',
          checkIn: formatDate(startDate) ?? '',
          checkOut: formatDate(endDate) ?? '',
          totalPrice: `${totalPrice.toFixed(2)} EUR`,
        })
      }
    } catch (mailError) {
      console.error('Error al enviar correo de reserva:', mailError)
    }

    res.status(201).json(savedBooking)
  } catch (error) {
    console.dir(error, { depth: null })
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * Obtiene una reserva específica por ID
 *
 * @async
 * @function getOneBooking
 * @param {import('types').AuthenticatedRequest} req - Request con sesión autenticada
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Admin/employee pueden ver cualquier reserva.
 * Customers solo pueden ver sus propias reservas.
 *
 * @routeParam {string} id - ID de la reserva a obtener
 *
 * @response 200 - Reserva encontrada
 * @response 400 - ID de reserva inválido
 * @response 404 - Reserva no encontrada
 * @response 500 - Error del servidor
 */
export async function getOneBooking(req, res) {
  try {
    const { role, userId } = req.session
    const { id } = req.params

    if (!isValidObjectId(id)) return res.status(400).json({ message: 'ID de reserva inválido' })

    const filter = { _id: id }
    if (role === 'customer') {
      filter.userId = userId
    }

    const booking = await Booking.findOne(filter)
    if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' })

    res.status(200).json(booking)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * Actualiza una reserva existente
 *
 * @async
 * @function updateBooking
 * @param {import('types').AuthenticatedRequest} req - Request con sesión autenticada
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Permite modificar fechas y ocupantes de una reserva activa.
 * Admin/employee pueden modificar cualquier reserva.
 * Customers solo pueden modificar sus propias reservas.
 *
 * Restricciones:
 * - No se pueden modificar reservas canceladas
 * - Las fechas solo pueden modificarse en un rango de ±15 días
 * - No se puede mover a fechas pasadas
 * - Se verifica disponibilidad de la habitación
 *
 * @routeParam {string} id - ID de la reserva a actualizar
 *
 * @bodyParam {string} [startDate] - Nueva fecha de inicio (formato YYYY-MM-DD)
 * @bodyParam {string} [endDate] - Nueva fecha de fin (formato YYYY-MM-DD)
 * @bodyParam {number} [occupants] - Nuevo número de ocupantes
 *
 * @response 200 - Reserva actualizada con precios recalculados
 * @response 400 - ID inválido, datos no proporcionados, reserva cancelada, fechas inválidas o habitación no disponible
 * @response 404 - Reserva o habitación no encontrada
 * @response 500 - Error del servidor
 */
export async function updateBooking(req, res) {
  try {
    const { role, userId } = req.session
    const { id } = req.params

    let validatedData
    try {
      validatedData = validateBookingUpdate(req.body)
    } catch (err) {
      return res.status(400).json(err)
    }

    const { startDate, endDate, occupants, discount } = validatedData

    if (!isValidObjectId(id)) return res.status(400).json({ message: 'ID de reserva inválido' })

    const filter = { _id: id }
    if (role === 'customer') {
      filter.userId = userId
    }

    const booking = await Booking.findOne(filter)
    if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' })

    if (booking.status === 'canceled') {
      return res.status(400).json({ message: 'No se puede modificar una reserva cancelada' })
    }

    if (startDate === undefined && endDate === undefined && occupants === undefined) {
      return res.status(400).json({ message: 'Datos de la reserva no proporcionados' })
    }

    const room = await Room.findById(booking.roomId).lean()
    if (!room) return res.status(404).json({ message: 'Habitación no encontrada' })

    if (discount !== undefined && (role === 'employee' || role === 'admin')) {
      booking.discount = discount
      booking.pricePerNight = parseFloat(
        (room.pricePerNight * (1 - booking.discount / 100)).toFixed(2),
      )
      booking.totalPrice = parseFloat((booking.totalNights * booking.pricePerNight).toFixed(2))
    }

    // Validar ocupantes
    if (occupants !== undefined) {
      const numOccupants = Number(occupants)
      if (numOccupants > room.occupancyLimit) {
        return res.status(400).json({
          message: `El límite de ocupación para esta habitación es de ${room.occupancyLimit} personas`,
        })
      }
      booking.occupants = numOccupants
    }

    // Validar fechas
    if (startDate !== undefined || endDate !== undefined) {
      const currentStart = new Date(booking.startDate)
      const currentEnd = new Date(booking.endDate)

      const newStart = startDate !== undefined ? parseDate(startDate) : currentStart
      const newEnd = endDate !== undefined ? parseDate(endDate) : currentEnd

      if (newStart >= newEnd) {
        return res
          .status(400)
          .json({ message: 'La fecha de inicio debe ser anterior a la fecha de fin' })
      }

      const now = new Date()
      now.setHours(0, 0, 0, 0)
      if (newStart < now && newStart < currentStart) {
        return res.status(400).json({ message: 'No se puede mover la reserva a una fecha pasada' })
      }

      const ONE_DAY = 1000 * 60 * 60 * 24

      if (startDate !== undefined) {
        const diff = Math.abs((newStart.getTime() - currentStart.getTime()) / ONE_DAY)
        if (diff > 15) {
          return res.status(400).json({
            message: 'La fecha de inicio solo puede modificarse en un rango de 15 días',
          })
        }
      }

      if (endDate !== undefined) {
        const diff = Math.abs((newEnd.getTime() - currentEnd.getTime()) / ONE_DAY)
        if (diff > 15) {
          return res
            .status(400)
            .json({ message: 'La fecha de fin solo puede modificarse en un rango de 15 días' })
        }
      }

      const otherBookings = await Booking.find({
        roomId: booking.roomId,
        _id: { $ne: booking._id },
      }).lean()

      if (!isAvailable(otherBookings, { startDate: newStart, endDate: newEnd })) {
        return res
          .status(400)
          .json({ message: 'La habitación no está disponible en las nuevas fechas' })
      }

      booking.startDate = newStart
      booking.endDate = newEnd

      const totalNights = Math.ceil((newEnd.getTime() - newStart.getTime()) / ONE_DAY)
      booking.totalNights = totalNights
      booking.totalPrice = parseFloat((totalNights * booking.pricePerNight).toFixed(2))
    }

    await booking.save()
    res.status(200).json(booking)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * Cancela una reserva existente
 *
 * @async
 * @function cancelBooking
 * @param {import('types').AuthenticatedRequest} req - Request con sesión autenticada
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Cambia el estado de la reserva a 'canceled'.
 * Admin/employee pueden cancelar cualquier reserva.
 * Customers solo pueden cancelar sus propias reservas.
 * La reserva no se elimina, solo se marca como cancelada.
 *
 * @routeParam {string} id - ID de la reserva a cancelar
 *
 * @response 200 - Reserva cancelada correctamente
 * @response 400 - ID de reserva inválido
 * @response 404 - Reserva no encontrada
 * @response 500 - Error del servidor
 */
export async function cancelBooking(req, res) {
  try {
    const { role, userId } = req.session
    const { id } = req.params

    if (!isValidObjectId(id)) return res.status(400).json({ message: 'ID de reserva inválido' })

    const filter = { _id: id }
    if (role === 'customer') {
      filter.userId = userId
    }

    const booking = await Booking.findOne(filter)
    if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' })

    if (booking.status === 'canceled') {
      return res.status(409).json({ message: 'La reserva ya esta cancelada' })
    }

    booking.status = 'canceled'
    await booking.save()

    try {
      const [customer, room] = await Promise.all([
        User.findById(booking.userId).lean(),
        Room.findById(booking.roomId).lean(),
      ])

      if (customer?.email) {
        const customerName = `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim()
        const refundAmount = booking.isPaid
          ? `${Number(booking.totalPrice).toFixed(2)} EUR`
          : '0.00 EUR'

        await sendEmail(customer.email, 'Reserva cancelada', 'booking-cancel-alert', {
          name: customerName || customer.email,
          bookingId: booking._id.toString(),
          roomName: room?.name ?? 'Habitacion asignada',
          refundAmount,
        })
      }
    } catch (mailError) {
      console.error('Error al enviar correo de cancelacion:', mailError)
    }

    res.status(200).json({ message: 'Reserva cancelada correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * Marca una reserva como pagada
 *
 * @async
 * @function payBooking
 * @param {import('types').AuthenticatedRequest} req - Request con sesión autenticada
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Admin/employee pueden pagar cualquier reserva.
 * Customers solo pueden pagar sus propias reservas.
 * Si ya estaba pagada, se informa al usuario.
 *
 * @routeParam {string} id - ID de la reserva a pagar
 *
 * @response 200 - Reserva pagada o ya pagada
 * @response 400 - ID inválido
 * @response 404 - Reserva no encontrada
 * @response 500 - Error del servidor
 */
export async function payBooking(req, res) {
  try {
    const { role, userId } = req.session
    const { id } = req.params

    if (!isValidObjectId(id)) return res.status(400).json({ message: 'ID de reserva inválido' })

    const filter = { _id: id }
    if (role === 'customer') {
      filter.userId = userId
    }

    const booking = await Booking.findOne(filter)
    if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' })

    if (booking.isPaid) {
      return res.status(409).json({ message: 'Ya has pagado esta reserva' })
    }

    booking.isPaid = true
    await booking.save()

    try {
      const customer = await User.findById(booking.userId).lean()
      if (customer?.email) {
        const customerName = `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim()
        await sendEmail(customer.email, 'Pago registrado', 'payment-success', {
          name: customerName || customer.email,
          bookingId: booking._id.toString(),
          amount: `${Number(booking.totalPrice).toFixed(2)} EUR`,
          paymentMethod: 'Pago simulado',
          date: formatDate(new Date()) ?? '',
        })
      }
    } catch (mailError) {
      console.error('Error al enviar correo de pago:', mailError)
    }

    return res.status(200).json(booking)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * Extiende la fecha de fin de una reserva
 *
 * @async
 * @function extendBooking
 * @param {import('types').AuthenticatedRequest} req - Request con sesión autenticada
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Permite extender una reserva activa a una fecha posterior.
 * Admin/employee pueden extender cualquier reserva.
 * Customers solo pueden extender sus propias reservas.
 *
 * Validaciones:
 * - La reserva no debe estar cancelada
 * - La nueva fecha debe ser posterior a la actual
 * - Se verifica disponibilidad para el periodo extendido
 * - Se recalculan noches y precio total
 *
 * @routeParam {string} id - ID de la reserva a extender
 *
 * @bodyParam {string} endDate - Nueva fecha de fin (requerido, formato YYYY-MM-DD)
 *
 * @response 200 - Reserva extendida con precios actualizados
 * @response 400 - ID inválido, fecha no proporcionada, reserva cancelada, fecha inválida o habitación no disponible
 * @response 404 - Reserva no encontrada
 * @response 500 - Error del servidor
 */
export async function extendBooking(req, res) {
  try {
    const { role, userId } = req.session
    const { id } = req.params
    const { endDate } = req.body

    if (!isValidObjectId(id)) return res.status(400).json({ message: 'ID de reserva inválido' })
    if (!endDate) return res.status(400).json({ message: 'Fecha de fin no proporcionada' })

    const filter = { _id: id }
    if (role === 'customer') {
      filter.userId = userId
    }

    const booking = await Booking.findOne(filter)
    if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' })
    if (booking.status === 'canceled')
      return res.status(400).json({ message: 'No se puede extender una reserva cancelada' })

    const newEndDate = parseDate(endDate)
    if (!newEndDate) {
      return res
        .status(400)
        .json({ message: 'La fecha de fin debe tener el formato DD/MM/YYYY y ser válida' })
    }
    const currentEndDate = new Date(booking.endDate)

    if (newEndDate <= currentEndDate) {
      return res
        .status(400)
        .json({ message: 'La nueva fecha de fin debe ser posterior a la fecha actual' })
    }

    // Verificar disponibilidad para el periodo extendido
    // Buscamos conflictos SOLO para el rango nuevo [currentEndDate, newEndDate]
    const otherBookings = await Booking.find({
      roomId: booking.roomId,
      _id: { $ne: booking._id },
    })

    const extensionSegment = {
      startDate: currentEndDate,
      endDate: newEndDate,
    }

    if (!isAvailable(otherBookings, extensionSegment)) {
      return res.status(400).json({
        message: 'La habitación no está disponible para las nuevas fechas solicitadas',
      })
    }

    const additionalNights = Math.ceil(
      (newEndDate.getTime() - currentEndDate.getTime()) / (1000 * 60 * 60 * 24),
    )
    const additionalPrice = additionalNights * booking.pricePerNight

    booking.endDate = newEndDate
    booking.totalNights += additionalNights
    booking.totalPrice += additionalPrice

    await booking.save()

    res.status(200).json(booking)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * Elimina una reserva de forma permanente
 *
 * @async
 * @function deleteBooking
 * @param {import('types').AuthenticatedRequest} req - Request con sesión autenticada
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Elimina permanentemente una reserva de la base de datos.
 * Admin/employee pueden eliminar cualquier reserva.
 * Customers solo pueden eliminar sus propias reservas.
 *
 * @routeParam {string} id - ID de la reserva a eliminar
 *
 * @response 200 - Reserva eliminada correctamente
 * @response 400 - ID de reserva inválido
 * @response 404 - Reserva no encontrada
 * @response 500 - Error del servidor
 */
export async function deleteBooking(req, res) {
  try {
    const { role, userId } = req.session
    const { id } = req.params

    if (!isValidObjectId(id)) return res.status(400).json({ message: 'ID de reserva inválido' })

    if (role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para eliminar reservas' })
    }

    const filter = { _id: id }
    if (role === 'customer') {
      filter.userId = userId
    }

    const booking = await Booking.findOne(filter)
    if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' })

    if (booking.status !== 'canceled') {
      return res.status(400).json({ message: 'Solo se pueden eliminar reservas canceladas' })
    }

    await Booking.deleteOne({ _id: id })

    res.status(200).json({ message: 'Reserva eliminada correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}
