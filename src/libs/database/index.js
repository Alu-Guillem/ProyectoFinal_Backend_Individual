import { DB_USER, DB_PASS, DB_HOST, DB_NAME } from '#c'
import mongoose from 'mongoose'

const URI = `mongodb+srv://${DB_USER}:${DB_PASS}@${DB_HOST}/?appName=${DB_NAME}`

export const connectDB = () =>
  mongoose
    .connect(URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error MongoDB', err))
