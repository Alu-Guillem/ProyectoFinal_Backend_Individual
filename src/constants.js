import dotenv from 'dotenv'

dotenv.config()

export const {
  HOSTNAME = 'localhost',
  PORT = 3000,
  DB_URI = 'mongodb://localhost:27017/mydatabase',
  JWT_SECRET = 'your_jwt_secret',
  MAIL_HOST = 'smtp.default.com',
  MAIL_PORT = 587,
  MAIL_USER = 'default_user',
  MAIL_PASS = 'default_password',
  SALT_ROUNDS = 10,
} = process.env
