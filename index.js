/**
 * @fileoverview Punto de entrada principal de la aplicación
 * @module index
 *
 * Inicializa el servidor Express y configura:
 * - Conexión a base de datos MongoDB
 * - Servicio de correo electrónico
 * - Middlewares (JSON parser, Morgan logger)
 * - Rutas de la API
 * - Manejador de rutas no encontradas
 *
 * @requires express
 * @requires morgan
 * @requires #r/router.js
 * @requires #libs/database
 * @requires #libs/mailing
 */

import path from 'path'
import express from 'express'
import router from '#r/router.js'
import morgan from 'morgan'
import { HOSTNAME, PORT } from '#c'
import { connectDB } from '#libs/database/index.js'
import { connectEmail } from '#libs/mailing/index.js'
import { startBookingReminders } from '#modules/bookings/booking-reminders.js'

import multer from 'multer'

/**
 * Instancia principal de la aplicación Express
 * @type {import('express').Application}
 */
const app = express()

// ─────────────────────────────────────────────────────────────
// Conexiones a servicios externos
// ─────────────────────────────────────────────────────────────

/** Establece conexión con MongoDB */
connectDB()

/** Inicializa el servicio de correo y carga plantillas */
connectEmail()

/** Programa recordatorios 24 horas antes de check-in y check-out */
startBookingReminders()

// ─────────────────────────────────────────────────────────────
// Middlewares
// ─────────────────────────────────────────────────────────────

/** Parser de JSON para el body de las peticiones */
app.use(express.json())

//Subida de fotos
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'))) 
  
/** Logger de peticiones HTTP en modo desarrollo */
app.use(morgan('dev'))

/** Multer middleware para la subida de archivos */
app.use(
  '/uploads',
  express.static(
    path.resolve('src/rooms/uploads')
  )
)


// ─────────────────────────────────────────────────────────────
// Rutas
// ─────────────────────────────────────────────────────────────

/**
 * Router principal de la API
 * Todas las rutas están prefijadas con /api
 * @see module:router
 */
app.use('/api', router)

// ─────────────────────────────────────────────────────────────
// Manejador de errores 404
// ─────────────────────────────────────────────────────────────

/**
 * Middleware para manejar rutas no encontradas
 * Responde con 404 para cualquier ruta no definida
 */
app.use((req, res) => {
  res.status(404).json({ message: `Endpoint ${req.originalUrl} no encontrado` })
})

// ─────────────────────────────────────────────────────────────
// Inicio del servidor
// ─────────────────────────────────────────────────────────────

/**
 * Inicia el servidor HTTP en el puerto y host configurados
 */
app.listen(PORT, HOSTNAME, () => {
  console.log(`Servidor en http://${HOSTNAME}:${PORT}`)
})
