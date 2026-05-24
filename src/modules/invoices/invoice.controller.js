import { Types } from 'mongoose'
import { Booking } from '../bookings/bookings.model.js'
import { Room } from '../rooms/rooms.model.js'
import { User } from '../users/users.model.js'

import PDFDocument from 'pdfkit'


/* NUMERO DE FACTURA */
export const generateInvoiceNumber = async () => {

  const now = new Date()

  //const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear()).slice(-2)

  const lastBooking = await Booking.findOne({
    invoiceNumber: {
      $regex: `^${year}/`
    }
  })
    .sort({ invoiceNumber: -1 })

  let nextNumber = 1

  if (lastBooking?.invoiceNumber) {

    const lastSequence =
      Number(lastBooking.invoiceNumber.split('/')[1])

    nextNumber = lastSequence + 1
  }

  return `${year}/${String(nextNumber).padStart(4, '0')}`
}


// Generar PDF de factura para una reserva
export const getInvoicePdf = async (req, res) => {
  try {
    const { id } = req.params
    const booking = await Booking.findById(id).lean()

    if (!booking) {
      return res.status(404).json({
        message: 'Reserva no encontrada'
      })
    }

    const room = await Room.findById(booking.roomId).lean()
    const customer = await User.findById(booking.userId).lean()

    // Generar número factura
    if (!booking.invoiceNumber) {
      booking.invoiceNumber = await generateInvoiceNumber()
      await Booking.updateOne(
        { _id: booking._id },
        { invoiceNumber: booking.invoiceNumber }
      )
    }

    // Fecha elegante corregida
    const formattedDate = new Date(booking.bookingDate).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const doc = new PDFDocument({ margin: 50 })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `inline; filename=factura-${booking.invoiceNumber}.pdf`
    )

    doc.pipe(res)

    // ======================
    // HEADER HOTEL (Centrado)
    // ======================
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('HOTEL CALPE', { align: 'center' })

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Avenida Example 123, Calpe', { align: 'center' })
      .text('CIF: B12345678', { align: 'center' })
      .text('+34 600 000 000', { align: 'center' })
      .text('reservas@hotelcalpe.com', { align: 'center' })

    doc.moveDown()

    // Línea separadora
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke()

    // ======================
    // CLIENTE Y FACTURA (Columnas con coordenadas fijas)
    // ======================
    const infoY = doc.y + 20

    // Columna Izquierda: Cliente
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('CLIENTE', 50, infoY)

    doc
      .font('Helvetica')
      .text(`Nombre: ${customer.firstName} ${customer.lastName}`, 50)
      .text(`Email: ${customer.email}`, 50)

    // Columna Derecha: Factura
    doc
      .font('Helvetica-Bold')
      .text('FACTURA', 350, infoY)

    doc
      .font('Helvetica')
      .text(`Nº ${booking.invoiceNumber}`, 350)
      .text(`Fecha: ${formattedDate}`, 350)

    doc.moveDown()

    // Línea separadora

    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke()

    // ======================
    // TABLA ELEGANTE (Coordenadas fijas por seguridad)
    // ======================
    const tableTop = infoY + 70

    // Cabecera
    doc
      .font('Helvetica-Bold')
      .fontSize(12)

    doc.text('Habitación', 50, tableTop)
    doc.text('Tipo', 180, tableTop)
    doc.text('Precio', 280, tableTop)
    doc.text('Ocup.', 360, tableTop)
    doc.text('Desc.', 430, tableTop)
    doc.text('Importe', 500, tableTop)

    // Línea divisoria tabla
    doc.moveTo(50, tableTop + 18)
       .lineTo(550, tableTop + 18)
       .stroke()

    // Datos tabla
    const rowY = tableTop + 28

    doc
      .font('Helvetica')
      .fontSize(11)

    doc.text(room.name, 50, rowY)
    doc.text(room.type, 180, rowY)
    doc.text(`${booking.pricePerNight} €`, 280, rowY)
    doc.text(String(booking.occupants), 360, rowY)
    doc.text(`${booking.discount}%`, 430, rowY)
    doc.text(`${booking.totalPrice} €`, 500, rowY)

    // ======================
    // RESUMEN ECONÓMICO ELEGANTE
    // ======================
    const subtotal = booking.totalPrice
    const iva = Number((subtotal * 0.10).toFixed(2)) // IVA 10% corregido y limpio
    const total = Number((subtotal + iva).toFixed(2))

    // Forzamos el cursor de PDFKit debajo de la fila de datos
    doc.y = rowY + 30 
    doc.moveDown(2)

    doc.font('Helvetica')
    doc.text(`Subtotal: ${subtotal.toFixed(2)} €`, { align: 'right' })
    doc.text(`IVA (10%): ${iva.toFixed(2)} €`, { align: 'right' })

    // Línea pre-total
    doc.moveTo(450, doc.y + 5)
       .lineTo(550, doc.y + 5)
       .stroke()

    doc.moveDown()

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(`TOTAL: ${total.toFixed(2)} €`, { align: 'right' })

    // ======================
    // FOOTER
    // ======================
    doc.moveDown(4)

    doc
      .fontSize(12)
      .font('Helvetica-Oblique')
      .text('Gracias por su estancia', { align: 'center' })

    doc.end()

  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Error generando factura'
    })
  }
}


export const getInvoices = async (req, res) => {

  try {

    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({
        message: 'userId requerido'
      })
    }

    const invoices = await Booking.aggregate([

      {
        $match: {
          userId: new Types.ObjectId(userId),
          invoiceNumber: { $ne: null }
        }
      },

      {
        $lookup: {
          from: 'rooms',
          localField: 'roomId',
          foreignField: '_id',
          as: 'room'
        }
      },

      {
        $unwind: '$room'
      },

      {
        $project: {

          _id: 0,

          bookingId: '$_id',

          invoiceNumber: 1,

          bookingDate: 1,

          totalPrice: 1,

          roomName: '$room.name',

          roomType: '$room.type'
        }
      },

      {
        $sort: {
          bookingDate: -1
        }
      }

    ])

    res.status(200).json(invoices)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      message: 'Error obteniendo facturas'
    })
  }
}

