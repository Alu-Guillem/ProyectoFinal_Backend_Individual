import express from 'express'
import router from '#i/router.js'
import { HOSTNAME, PORT } from '#c'
import { connectDB } from './src/libs/database/index.js'

const app = express()
connectDB()

app.use(express.json())

app.use('/api', router)

app.listen(PORT, HOSTNAME, () => {
  console.log(`Servidor en http://${HOSTNAME}:${PORT}`)
})
