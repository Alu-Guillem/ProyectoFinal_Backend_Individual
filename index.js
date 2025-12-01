import express from 'express'
import router from '#i/router.js'
import { HOSTNAME, PORT } from '#c'

const app = express()

app.use(express.json())

app.use('/api', router)

app.listen(PORT, HOSTNAME, () => {
  console.log(`Servidor en http://${HOSTNAME}:${PORT}`)
})
