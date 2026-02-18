/**
 * @fileoverview Controlador REST para operaciones de reseñas.
 */

import { isValidObjectId } from 'mongoose'
import { Booking } from '../bookings/bookings.model.js'
import { Review, validateReview, validateReviewUpdate } from './reviews.model.js'

/**
 * Obtiene reseñas según query params con sistema de filtros por capas
 *
 * @async
 * @function getReviews
 * @param {import('types').AuthenticatedRequest} req - Request con sesión autenticada
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Permite filtrar reseñas mediante query params acumulables:
 * - `?roomId=xxx` → Reviews de una habitación (cualquier usuario autenticado)
 * - `?userId=xxx` → Reviews de un usuario (admin/employee o el propio usuario)
 * - Sin params → Todas las reviews (solo admin/employee)
 *
 * @queryParam {string} [roomId] - ID de la habitación para filtrar reseñas
 * @queryParam {string} [userId] - ID del usuario para filtrar reseñas
 *
 * @response 200 - Array de reseñas encontradas
 * @response 400 - ID de habitación o usuario inválido
 * @response 403 - Sin permisos para ver reseñas de otro usuario o todas las reseñas
 * @response 404 - No se encontraron reseñas
 * @response 500 - Error del servidor
 *
 * @example
 * // GET /api/reviews?roomId=507f1f77bcf86cd799439011
 * // GET /api/reviews?userId=507f1f77bcf86cd799439012
 * // GET /api/reviews?roomId=xxx&userId=yyy (filtros combinados)
 */
export async function getReviews(req, res) {
  try {
    const { role, userId } = req.session
    const { roomId, userId: queryUserId } = req.query

    // Construir filtro por capas
    const filter = {}

    // Filtro por habitación - cualquier usuario puede acceder
    if (roomId) {
      if (!isValidObjectId(roomId)) {
        return res.status(400).json({ message: 'ID de habitación inválido' })
      }
      filter.roomId = roomId
    }

    // Filtro por usuario - verificar permisos
    if (queryUserId) {
      if (!isValidObjectId(queryUserId)) {
        return res.status(400).json({ message: 'ID de usuario inválido' })
      }

      // Customer solo puede ver sus propias reseñas
      if (role === 'customer' && String(queryUserId) !== String(userId)) {
        return res
          .status(403)
          .json({ message: 'No tienes permisos para ver las reseñas de otro usuario' })
      }

      filter.userId = queryUserId
    }

    // Sin filtros - solo admin/employee pueden ver todas
    if (Object.keys(filter).length === 0 && role === 'customer') {
      return res.status(403).json({ message: 'No tienes permisos para ver todas las reseñas' })
    }

    // Ejecutar consulta con filtros acumulados
    const reviews = await Review.find(filter)

    if (reviews.length === 0) {
      return res.status(404).json({ message: 'No se encontraron reseñas' })
    }

    res.status(200).json(reviews)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * Crea una nueva reseña para una reserva finalizada
 *
 * @async
 * @function createNewReview
 * @param {import('types').AuthenticatedRequest} req - Request con sesión autenticada
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Solo usuarios con rol 'customer' pueden crear reseñas.
 * La reserva debe existir, pertenecer al usuario y haber finalizado.
 * Solo se permite una reseña por reserva.
 *
 * @bodyParam {string} bookingId - ID de la reserva a reseñar (requerido)
 * @bodyParam {number} rate - Calificación numérica positiva (requerido)
 * @bodyParam {string} comment - Comentario de la reseña (requerido)
 *
 * @response 201 - Reseña creada exitosamente
 * @response 400 - Datos no proporcionados, validación fallida, reserva no finalizada o reseña duplicada
 * @response 403 - No tienes permisos para crear reseña de esta reserva
 * @response 404 - Reserva no encontrada
 * @response 500 - Error del servidor
 *
 * @requires role=['customer']
 */
export async function createNewReview(req, res) {
  try {
    const { userId } = req.session
    const reviewData = req.body

    // Validar que se proporcionaron datos
    if (!reviewData || Object.keys(reviewData).length === 0) {
      return res.status(400).json({ message: 'Datos de la reseña no proporcionados' })
    }

    // Validar estructura de datos
    let validatedReview
    try {
      validatedReview = validateReview(reviewData)
    } catch (err) {
      return res.status(400).json(err)
    }

    // Validar que el bookingId sea un ObjectId válido
    if (!isValidObjectId(validatedReview.bookingId)) {
      return res.status(400).json({ message: 'ID de reserva inválido' })
    }

    // Verificar que la reserva existe y pertenece al usuario
    const booking = await Booking.findById(validatedReview.bookingId)
    if (!booking) {
      return res.status(404).json({ message: 'No se encontró la reserva para crear la reseña' })
    }

    if (String(booking.userId) !== String(userId)) {
      return res
        .status(403)
        .json({ message: 'No tienes permisos para crear una reseña de esta reserva' })
    }

    if (booking.status === 'canceled') {
      return res.status(400).json({ message: 'No se pueden crear reseñas de reservas canceladas' })
    }

    // Verificar que la reserva ya haya finalizado
    const now = new Date()
    if (booking.endDate > now) {
      return res.status(400).json({
        message: 'No se puede crear una reseña para una reserva que no ha finalizado',
      })
    }

    // Verificar que no exista ya una reseña para esta reserva
    const existingReview = await Review.findOne({ bookingId: validatedReview.bookingId })
    if (existingReview) {
      return res.status(400).json({ message: 'Ya existe una reseña para esta reserva' })
    }

    // Crear la reseña con userId y roomId denormalizados
    const newReview = new Review({
      ...validatedReview,
      userId: booking.userId,
      roomId: booking.roomId,
      createdAt: new Date(),
    })

    const savedReview = await newReview.save()
    res.status(201).json(savedReview)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * Obtiene una reseña específica por ID
 *
 * @async
 * @function getOneReview
 * @param {import('types').AuthenticatedRequest} req - Request con sesión autenticada
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Admin/employee pueden ver cualquier reseña.
 * Customers solo pueden ver sus propias reseñas.
 *
 * @routeParam {string} id - ID de la reseña a obtener
 *
 * @response 200 - Reseña encontrada
 * @response 400 - ID de reseña inválido
 * @response 403 - No tienes permisos para ver esta reseña
 * @response 404 - Reseña no encontrada
 * @response 500 - Error del servidor
 */
export async function getOneReview(req, res) {
  try {
    const { role, userId } = req.session
    const { id } = req.params

    // Validar formato del ID
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID de reseña inválido' })
    }

    // Buscar la reseña
    const review = await Review.findById(id)
    if (!review) {
      return res.status(404).json({ message: 'Reseña no encontrada' })
    }

    // Si es customer, verificar que la reseña le pertenece
    if (role === 'customer' && String(review.userId) !== String(userId)) {
      return res.status(403).json({ message: 'No tienes permisos para ver esta reseña' })
    }

    res.status(200).json(review)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * Actualiza una reseña existente
 *
 * @async
 * @function updateReview
 * @param {import('types').AuthenticatedRequest} req - Request con sesión autenticada
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Solo el usuario que creó la reseña puede editarla.
 * Esto garantiza la autenticidad de las reseñas.
 * Solo se permiten modificar los campos `rate` y `comment`.
 *
 * @routeParam {string} id - ID de la reseña a actualizar
 *
 * @bodyParam {number} [rate] - Nueva calificación (entero positivo)
 * @bodyParam {string} [comment] - Nuevo comentario
 *
 * @response 200 - Reseña actualizada exitosamente
 * @response 400 - ID inválido, datos no proporcionados, campos no permitidos o validación fallida
 * @response 403 - Solo puedes editar tus propias reseñas
 * @response 404 - Reseña no encontrada
 * @response 500 - Error del servidor
 *
 * @requires role=['customer']
 */
export async function updateReview(req, res) {
  try {
    const { userId } = req.session
    const { id } = req.params
    const updateData = req.body

    // Validar formato del ID
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID de reseña inválido' })
    }

    // Validar que se proporcionaron datos
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Datos de la reseña no proporcionados' })
    }

    // Verificar campos no permitidos
    const allowedFields = ['rate', 'comment']
    const providedFields = Object.keys(updateData)
    const invalidFields = providedFields.filter(field => !allowedFields.includes(field))
    if (invalidFields.length > 0) {
      return res.status(400).json({
        message: `Campos no permitidos: ${invalidFields.join(', ')}`,
      })
    }

    // Validar estructura de datos
    let validatedData
    try {
      validatedData = validateReviewUpdate(updateData)
    } catch (err) {
      return res.status(400).json(err)
    }

    // Buscar la reseña
    const review = await Review.findById(id)
    if (!review) {
      return res.status(404).json({ message: 'Reseña no encontrada' })
    }

    // Verificar que el usuario es el propietario de la reseña
    if (String(review.userId) !== String(userId)) {
      return res.status(403).json({ message: 'Solo puedes editar tus propias reseñas' })
    }

    // Aplicar cambios
    if (validatedData.rate !== undefined) {
      review.rate = validatedData.rate
    }
    if (validatedData.comment !== undefined) {
      review.comment = validatedData.comment
    }

    const updatedReview = await review.save()
    res.status(200).json(updatedReview)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * Elimina una reseña existente
 *
 * @async
 * @function deleteReview
 * @param {import('types').AuthenticatedRequest} req - Request con sesión autenticada
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Solo el usuario que creó la reseña puede eliminarla.
 * Esto garantiza la autenticidad de las reseñas.
 *
 * @routeParam {string} id - ID de la reseña a eliminar
 *
 * @response 200 - Reseña eliminada correctamente
 * @response 400 - ID de reseña inválido
 * @response 403 - Solo puedes eliminar tus propias reseñas
 * @response 404 - Reseña no encontrada
 * @response 500 - Error del servidor
 *
 * @requires role=['customer']
 */
export async function deleteReview(req, res) {
  try {
    const { userId } = req.session
    const { id } = req.params

    // Validar formato del ID
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'ID de reseña inválido' })
    }

    // Buscar la reseña
    const review = await Review.findById(id)
    if (!review) {
      return res.status(404).json({ message: 'Reseña no encontrada' })
    }

    // Verificar que el usuario es el propietario de la reseña
    if (String(review.userId) !== String(userId)) {
      return res.status(403).json({ message: 'Solo puedes eliminar tus propias reseñas' })
    }

    // Eliminar la reseña
    await Review.deleteOne({ _id: id })

    res.status(200).json({ message: 'Reseña eliminada correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}
