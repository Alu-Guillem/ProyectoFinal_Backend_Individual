import dotenv from 'dotenv'

dotenv.config()

export const {
  HOSTNAME = 'localhost',
  PORT = 3000,
  DB_HOST = 'localhost',
  DB_USER = 'user',
  DB_PASS = 'password',
  DB_NAME = 'mydatabase',
  JWT_SECRET = 'your_jwt_secret',
  MAIL_HOST = 'smtp.default.com',
  MAIL_PORT = 587,
  MAIL_USER = 'default_user',
  MAIL_PASS = 'default_password',
} = process.env
