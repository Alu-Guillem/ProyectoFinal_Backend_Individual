import fs from 'fs'
import path from 'path'

import { JWT_SECRET } from '#r/constants.js'
import { getAge, parseDate } from '#commons/index.js'
import { Customer, User, validateCustomer } from '#modules/users/users.model.js'
import { hashPassword } from '#modules/users/utils/index.js'
import { validateLogin } from './auth.model.js'
import { sendEmail } from '#libs/mailing/index.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

/**
 * Registra un nuevo Customer
 *
 * @async
 * @function register
 * @param {import('express').Request} req - Request de Express
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Crea un nuevo cliente. El email debe ser único.
 * El usuario debe ser mayor de 18 años.
 * La contraseña será cifrada antes de guardar.
 *
 * @bodyParam {string} email      - Email del usuario (requerido, único)
 * @bodyParam {string} firstName  - Nombre del usuario (requerido)
 * @bodyParam {string} lastName   - Apellidos del usuario (requerido)
 * @bodyParam {string} password   - Contraseña (requerida, mínimo 8 caracteres)
 * @bodyParam {string} birthDate  - Fecha de nacimiento (YYYY-MM-DD, requerida)
 * @bodyParam {string} gender     - 'masculino' | 'femenino' | 'prefiero no decirlo' (requerido)
 * @bodyParam {string} dni        - DNI del usuario (requerido)
 * @bodyParam {string} [city]     - Ciudad del usuario (opcional)
 * @bodyParam {string} [photo]    - URL de la foto del usuario (opcional)
 *
 * @response 200 - Cliente creado correctamente, devuelve el token de acceso
 * @response 400 - Datos inválidos, usuario menor de edad o email duplicado
 * @response 500 - Error interno del servidor
 *
 * Validaciones:
 * - Email válido y único
 * - Password mínimo 8 caracteres
 * - Fecha de nacimiento válida
 * - Mayor de 18 años
 * - DNI válido
 * - Género válido
 */
export async function register(req, res) {
  let uploadedFilePath = null

  try {
    const userData = req.body

    if (!userData) {
      return res.status(400).json({ message: 'Datos de usuario no proporcionados' })
    }

    // Guardamos la ruta de la foto si se sube
    if (req.file) {
      uploadedFilePath = path.join(UPLOAD_DIR, req.file.filename)
    }

    // Validar datos del cliente
    let validatedCustomer
    try {
      validatedCustomer = validateCustomer(userData)
    } catch (err) {
      // Si hay foto, borrarla porque no vamos a registrar
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath)
      return res.status(400).json(err)
    }

    const birthDate = parseDate(validatedCustomer.birthDate)
    if (!birthDate) {
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath)
      return res.status(400).json({ message: 'Fecha de nacimiento inválida' })
    }

    const age = getAge(birthDate)
    if (age < 18) {
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath)
      return res.status(400).json({ message: 'Debes ser mayor de edad' })
    }

    const password = await hashPassword(validatedCustomer.password)

    // Crear el Customer en la DB
    const newCustomer = new Customer({
      ...validatedCustomer,
      birthDate,
      password,
      ...(uploadedFilePath && { photo: `/uploads/${req.file.filename}` }),
    })

    const savedCustomer = await newCustomer.save()

    const token = jwt.sign({ userId: savedCustomer._id, role: savedCustomer.role }, JWT_SECRET, {
      expiresIn: '15d',
    })

    res.status(200).json({ token, photo: savedCustomer.photo })
  } catch (error) {
    console.error(error)

    // Borrar foto si algo falla
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath)

    if (error.code === 11000) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' })
    }

    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * Login de usuario
 *
 * @async
 * @function login
 * @param {import('express').Request} req - Request de Express
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Permite iniciar sesión con email y contraseña.
 * Si los datos son correctos, devuelve un token de acceso JWT válido por 15 días.
 *
 * @bodyParam {string} email      - Email del usuario (requerido)
 * @bodyParam {string} password   - Contraseña del usuario (requerida)
 *
 * @response 200 - Login exitoso, devuelve token de acceso
 * @response 400 - Datos inválidos
 * @response 404 - Usuario no encontrado o contraseña inválida
 * @response 500 - Error interno del servidor
 */
export async function login(req, res) {
  try {
    const userData = req.body

    if (!userData) {
      return res.status(400).json({ message: 'Datos de usuarios no proporcionados' })
    }

    let validatedLogin
    try {
      validatedLogin = validateLogin(userData)
    } catch (err) {
      return res.status(400).json(err)
    }

    const { email, password } = validatedLogin

    const user = await User.findOne({ email }).select('+password')
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) return res.status(404).json({ message: 'La contraseña es invalida' })

    const accesToken = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: '15d',
    })

    res.status(200).json({ token: accesToken })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * Logout de usuario
 *
 * @function logut
 * @param {import('express').Request} req - Request de Express
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Cierra la sesión del usuario y devuelve un mensaje de confirmación.
 *
 * @response 200 - Logout realizado correctamente
 */
export async function logout(req, res) {
  res.status(200).json({
    message: 'Logout realizado correctamente',
  })
}
