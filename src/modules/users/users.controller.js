import { parseDate } from '../commons/index.js'
import { Customer, Employee, validateCustomer } from './users.model.js'

export async function createUser(req, res) {
  try {
    const userData = req.body

    const role = userData.role

    if (!userData) {
      return res.status(400).json({ message: 'Datos de usuarios no proporcionados' })
    }

    if (role === 'customer') {
      try {
        const validatedData = validateCustomer(userData)
        const birthDate = parseDate(userData.birthDate)

        const now = new Date()
        now.setHours(0, 0, 0, 0)

        console.log(now)
        console.log(birthDate)

        const newCustomer = new Customer({
          ...validatedData,
          birthDate,
        })

        const customerSaved = await newCustomer.save()
        res.status(201).send(customerSaved)
      } catch (err) {
        return res.status(400).json(err)
      }
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}
