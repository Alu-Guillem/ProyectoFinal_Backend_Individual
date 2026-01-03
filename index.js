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

import express from 'express'
import router from '#r/router.js'
import morgan from 'morgan'
import { HOSTNAME, PORT } from '#c'
import { connectDB } from '#libs/database/index.js'
import { connectEmail, testTemplates } from '#libs/mailing/index.js'

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

// ─────────────────────────────────────────────────────────────
// Middlewares
// ─────────────────────────────────────────────────────────────

/** Parser de JSON para el body de las peticiones */
app.use(express.json())

/** Logger de peticiones HTTP en modo desarrollo */
app.use(morgan('dev'))

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
