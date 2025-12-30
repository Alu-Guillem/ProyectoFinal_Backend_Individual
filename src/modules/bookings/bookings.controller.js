import { parseDate } from '#commons/index.js'
import { Booking, validateBooking, validateBookingUpdate } from './bookings.model.js'
import { Room } from '#modules/rooms/rooms.model.js'
import { isAvailable } from './utils/index.js'
import { isValidObjectId } from 'mongoose'

/**
 * @param {import('types').AuthenticatedRequest} req
 * @param {import('express').Response} res
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
 * @param {import('types').AuthenticatedRequest} req
 * @param {import('express').Response} res
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
    const existingBookings = await Booking.find({ roomId: validatedBooking.roomId })

    // Objeto temporal con fechas parseadas para la verificación
    const tempBookingToCheck = { ...validatedBooking, startDate, endDate }

    if (!isAvailable(existingBookings, tempBookingToCheck)) {
      return res
        .status(400)
        .json({ message: 'La habitación no está disponible en las fechas seleccionadas' })
    }

    // Cálculos de precios
    const totalNights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const pricePerNight = room.pricePerNight * (1 - room.offer / 100)
    const totalPrice = totalNights * pricePerNight

    // Creación de la reserva
    const newBooking = new Booking({
      ...validatedBooking,
      startDate,
      endDate,
      bookingDate: new Date(),
      totalNights,
      pricePerNight,
      totalPrice,
      discount: room.offer,
    })

    const savedBooking = await newBooking.save()

    res.status(201).json(savedBooking)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * @param {import('types').AuthenticatedRequest} req
 * @param {import('express').Response} res
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
 * @param {import('types').AuthenticatedRequest} req
 * @param {import('express').Response} res
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

    const { startDate, endDate, occupants } = validatedData

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

    const room = await Room.findById(booking.roomId)
    if (!room) return res.status(404).json({ message: 'Habitación no encontrada' })

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
      })

      if (!isAvailable(otherBookings, { startDate: newStart, endDate: newEnd })) {
        return res
          .status(400)
          .json({ message: 'La habitación no está disponible en las nuevas fechas' })
      }

      booking.startDate = newStart
      booking.endDate = newEnd

      const totalNights = Math.ceil((newEnd.getTime() - newStart.getTime()) / ONE_DAY)
      booking.totalNights = totalNights
      booking.totalPrice = totalNights * booking.pricePerNight
    }

    await booking.save()
    res.status(200).json(booking)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * @param {import('types').AuthenticatedRequest} req
 * @param {import('express').Response} res
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

    booking.status = 'canceled'
    await booking.save()

    res.status(200).json({ message: 'Reserva cancelada correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * @param {import('types').AuthenticatedRequest} req
 * @param {import('express').Response} res
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
 * @param {import('types').AuthenticatedRequest} req
 * @param {import('express').Response} res
 */
export async function deleteBooking(req, res) {
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

    await Booking.deleteOne({ _id: id })

    res.status(200).json({ message: 'Reserva eliminada correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}
