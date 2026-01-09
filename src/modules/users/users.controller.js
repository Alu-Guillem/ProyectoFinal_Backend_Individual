export async function createUser(req, res) {
  try {
    const userData = req.body
    if (!userData) {
      return res.status(400).json({ message: 'Datos de usuarios no proporcionados' })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error del servidor' })
  }
}
