import { getAge, parseDate } from '../commons/index.js'
import {
  Admin,
  Customer,
  Employee,
  User,
  validateCustomer,
  validateEmployee,
} from './users.model.js'

/**
 * Crea un nuevo Employee
 *
 * @async
 * @function createEmployee
 * @param {import('types').AuthenticatedRequest} req - Request de Express
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Crea un nuevo empleado. El email debe ser único.
 * El rol debe ser 'admin' o 'employee'.
 *
 * @bodyParam {string} email      - Email del usuario (requerido, único)
 * @bodyParam {string} firstName  - Nombre del usuario (requerido)
 * @bodyParam {string} lastName   - Apellidos del usuario (requerido)
 * @bodyParam {string} password   - Contraseña (requerida, mínimo 8 caracteres)
 * @bodyParam {string} role       - Rol del empleado ('admin' | 'employee', requerido)
 *
 * @response 201 - Empleado creado correctamente
 * @response 400 - Datos inválidos o email duplicado
 * @response 500 - Error interno del servidor
 *
 * Validaciones:
 * - Email válido y único
 * - Password mínimo 8 caracteres
 * - Rol válido ('admin' o 'employee')
 */
export async function createEmployee(req, res) {
  try {
    const userData = req.body

    if (!userData) {
      return res.status(400).json({ message: 'Datos de usuarios no proporcionados' })
    }

    const role = userData.role

    let validatedEmployee
    try {
      validatedEmployee = validateEmployee(userData)
    } catch (err) {
      return res.status(400).json(err)
    }

    let Model
    if (role === 'admin') Model = Admin
    if (role === 'employee') Model = Employee

    const newEmployee = new Model({
      ...validatedEmployee,
    })

    const employeeSaved = await newEmployee.save()
    res.status(201).json(employeeSaved)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' })
    }
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * Crea un nuevo Customer
 *
 * @async
 * @function createCustomer
 * @param {import('types').AuthenticatedRequest} req - Request de Express
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Crea un nuevo cliente. El email debe ser único.
 * El usuario debe ser mayor de 18 años.
 *
 *
 * @bodyParam {string} email      - Email del usuario (requerido, único)
 * @bodyParam {string} firstName  - Nombre del usuario (requerido)
 * @bodyParam {string} lastName   - Apellidos del usuario (requerido)
 * @bodyParam {string} password  - Contraseña (requerida, mínimo 8 caracteres)
 * @bodyParam {string} birthDate - Fecha de nacimiento (YYYY-MM-DD, requerido)
 * @bodyParam {string} gender    - 'masculino' | 'femenino' | 'prefiero no decirlo' (requerido)
 * @bodyParam {string} dni       - DNI del usuario (requerido)
 * @bodyParam {string} [city]    - Ciudad del usuario (opcional)
 * @bodyParam {string} [photo]   - URL de la foto del usuario (opcional)
 *
 *
 * @response 201 - Cliente creado correctamente
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
export async function createCustomer(req, res) {
  try {
    const userData = req.body

    if (!userData) {
      return res.status(400).json({ message: 'Datos de usuarios no proporcionados' })
    }

    let validatedCustomer
    try {
      validatedCustomer = validateCustomer(userData)
    } catch (err) {
      return res.status(400).json(err)
    }
    const birthDate = parseDate(validatedCustomer.birthDate)

    const age = getAge(birthDate)
    if (age < 18) {
      return res.status(400).json({ message: 'Has de ser mayor de edad para poder registrarte' })
    }

    const newCustomer = new Customer({
      ...validatedCustomer,
      birthDate,
    })

    const customerSaved = await newCustomer.save()
    res.status(201).send(customerSaved)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' })
    }
    res.status(500).json({ message: 'Error del servidor' })
  }
}
