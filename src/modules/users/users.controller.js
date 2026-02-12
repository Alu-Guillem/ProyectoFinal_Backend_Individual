import { getAge, parseDate } from '#commons/index.js'
import {
  Admin,
  Customer,
  Employee,
  User,
  validateCustomer,
  validateEmployee,
  validateUserUpdate,
} from './users.model.js'

import { isValidObjectId } from 'mongoose'
import { hashPassword } from './utils/index.js'
import { sendEmail } from '#libs/mailing/index.js'

export async function getUsers(req, res) {
  try {
    const users = await User.find()

    if (users.length === 0) return res.status(404).json({ message: 'No se encontraron usuarios' })

    res.status(200).json(users)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

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
 * @bodyParam {string} password   - Contraseña (requerida, mínimo 8 caracteres), será cifrada antes de guardar
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

    const employeeRole = userData.role

    let validatedEmployee
    try {
      validatedEmployee = validateEmployee(userData)
    } catch (err) {
      return res.status(400).json(err)
    }

    const password = await hashPassword(validatedEmployee.password)

    let Model
    if (employeeRole === 'admin') Model = Admin
    if (employeeRole === 'employee') Model = Employee

    const newEmployee = new Model({
      ...validatedEmployee,
      password,
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
 * @bodyParam {string} password  - Contraseña (requerida, mínimo 8 caracteres), será cifrada antes de guardar
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
    const password = await hashPassword(validatedCustomer.password)

    const age = getAge(birthDate)
    if (age < 18) {
      return res.status(400).json({ message: 'Has de ser mayor de edad para poder registrarte' })
    }

    const newCustomer = new Customer({
      ...validatedCustomer,
      birthDate,
      password,
    })

    const customerSaved = await newCustomer.save()
    try {
      if (customerSaved?.email) {
        const customerName =
          `${customerSaved.firstName ?? ''} ${customerSaved.lastName ?? ''}`.trim()
        await sendEmail(customerSaved.email, 'Bienvenido a Pere Maria Hotel', 'welcome', {
          name: customerName || customerSaved.email,
        })
      }
    } catch (mailError) {
      console.error('Error al enviar correo de bienvenida:', mailError)
    }
    res.status(201).send(customerSaved)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' })
    }
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * Obtiene un usuario por su ID
 *
 * @async
 * @function getOneUser
 * @param {import('types').AuthenticatedRequest} req - Request de Express
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Obtiene la información de un usuario específico por su ID.
 *
 * @response 200 - Usuario encontrado
 * @response 400 - ID de usuario inválido
 * @response 404 - Usuario no encontrado
 * @response 500 - Error interno del servidor
 *
 * Validaciones:
 * - ID de usuario válido
 */
export async function getOneUser(req, res) {
  try {
    const { id } = req.params

    if (!isValidObjectId(id)) return res.status(400).json({ message: 'ID de usuario inválido' })

    const filter = { _id: id }

    const user = await User.findOne(filter)
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

    res.status(200).json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * Elimina un usuario por su ID
 *
 * @async
 * @function deleteUser
 * @param {import('types').AuthenticatedRequest} req - Request de Express
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Elimina un usuario específico por su ID.
 *
 *
 * @response 200 - Usuario eliminado correctamente
 * @response 400 - ID del usuario inválido
 * @response 404 - Usuario no encontrado
 * @response 500 - Error interno del servidor
 *
 * Validaciones:
 * - ID de usuario válido
 */
export async function deleteUser(req, res) {
  try {
    const { id } = req.params

    if (!isValidObjectId(id)) return res.status(400).json({ message: 'ID del usuario inválido' })

    const filter = { _id: id }

    const users = await User.findOne(filter)
    if (!users) return res.status(404).json({ message: 'Usuario no encontrado' })

    await User.deleteOne({ _id: id })

    res.status(200).json({ message: 'Ussuario eliminado correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

/**
 * Actualiza la información de un usuario
 *
 * @async
 * @function updateUser
 * @param {import('types').AuthenticatedRequest} req - Request de Express
 * @param {import('express').Response} res - Response de Express
 *
 * @description
 * Actualiza la contraseña del usuario. Solo el propio usuario puede actualizar su información.
 *
 * @bodyParam {string} password - Nueva contraseña (requerida, mínimo 8 caracteres)
 *
 * @response 200 - Usuario actualizado correctamente
 * @response 400 - Datos inválidos o ID inválido
 * @response 403 - No tienes permiso para actualizar este usuario
 * @response 404 - Usuario no encontrado
 * @response 500 - Error interno del servidor
 *
 * Validaciones:
 * - Password mínimo 8 caracteres, sera de nuevo hasheada
 * - Fecha de nacimiento, mayor de 18 años
 * - Nombre
 * - Apellidos
 * - ID de usuario válido
 */
export async function updateUser(req, res) {
  try {
    const { id } = req.params

    if (!isValidObjectId(id)) return res.status(400).json({ message: 'ID de usuario inválido' })

    let validatedData
    try {
      validatedData = validateUserUpdate(req.body)
    } catch (err) {
      return res.status(400).json(err)
    }

    const { password, firstName, lastName, birthDate, vip } = validatedData

    const user = await User.findById(id)
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

    if (password !== undefined) {
      user.password = await hashPassword(password)
    }
    if (firstName !== undefined) user.firstName = firstName
    if (lastName !== undefined) user.lastName = lastName
    if (birthDate !== undefined && user.role === 'customer') {
      const parsedBirthDate = parseDate(birthDate)
      const age = getAge(parsedBirthDate)
      if (age < 18) {
        return res.status(400).json({ message: 'Tu fecha no es valida, has de ser mayor de edad' })
      }

      user.set('birthDate', parsedBirthDate)
    }

    if (vip !== undefined && user.role === 'customer') {
      user.set('vip', vip)
    }
    const updatedUser = await user.save()
    res.status(200).json(updatedUser)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

export async function getMe(req, res) {
  try {
    const { userId } = req.session

    if (!isValidObjectId(userId)) return res.status(400).json({ message: 'ID de usuario inválido' })

    const filter = { _id: userId }

    const user = await User.findOne(filter)
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' })

    res.status(200).json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

export async function getAllEmployees(req, res) {
  try {
    const employees = await User.find({ role: { $in: ['admin', 'employee'] } })

    if (employees.length === 0)
      return res.status(404).json({ message: 'No se encontraron empleados' })

    res.status(200).json(employees)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}

export async function getAllCustomers(req, res) {
  try {
    const customers = await User.find({ role: 'customer' })

    if (customers.length === 0)
      return res.status(404).json({ message: 'No se encontraron clientes' })

    res.status(200).json(customers)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}
