import dotenv from 'dotenv'

dotenv.config()

export const {
  HOSTNAME = 'localhost',
  PORT = 3000,
  DB_HOST = 'localhost',
  DB_USER = 'user',
  DB_PASS = 'password',
  DB_NAME = 'mydatabase',
} = process.env
