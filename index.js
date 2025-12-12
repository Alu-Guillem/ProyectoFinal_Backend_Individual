import express from 'express'
import router from '#r/router.js'
import morgan from 'morgan'
import { HOSTNAME, PORT } from '#c'
import { connectDB } from '#libs/database/index.js'

const app = express()
connectDB()

app.use(express.json())
app.use(morgan('dev'))

app.use('/api', router)

app.use((req, res) => {
  res.status(404).json({ message: `Endpoint ${req.originalUrl} not found` })
})

app.listen(PORT, HOSTNAME, () => {
  console.log(`Servidor en http://${HOSTNAME}:${PORT}`)
})
