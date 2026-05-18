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

      booking.invoiceNumber =
        await generateInvoiceNumber()

      await Booking.updateOne(
        { _id: booking._id },
        {
          invoiceNumber: booking.invoiceNumber
        }
      )
    }

    const doc = new PDFDocument({
      margin: 50
    })

    res.setHeader(
      'Content-Type',
      'application/pdf'
    )

    res.setHeader(
      'Content-Disposition',
      `inline; filename=factura-${booking.invoiceNumber}.pdf`
    )

    doc.pipe(res)

    // ======================
    // EMPRESA
    // ======================

    doc
      .fontSize(20)
      .text('HOTEL CALPE')

    doc
      .fontSize(10)
      .text('Calle Example 123')
      .text('03710 Calpe')
      .text('B12345678')

    // ======================
    // CLIENTE
    // ======================

    doc.moveDown(2)

    doc
      .fontSize(14)
      .text('Cliente')

    doc
      .fontSize(10)
      .text(`${customer.firstName} ${customer.lastName}`)
      .text(customer.email)

    // ======================
    // FACTURA
    // ======================

    doc.moveDown(2)

    doc
      .fontSize(14)
      .text(`Factura ${booking.invoiceNumber}`)

    doc
      .fontSize(10)
      .text(`Fecha: ${booking.bookingDate}`)

    // ======================
    // TABLA
    // ======================

    doc.moveDown()

    doc.text(
      'Habitación | Tipo | Precio | Ocupantes | Desc. | Importe'
    )

    doc.moveDown(0.5)

    doc.text(
      `${room.name} | ${room.type} | ${booking.pricePerNight}€ | ${booking.occupants} | ${booking.discount}% | ${booking.totalPrice}€`
    )

    // ======================
    // TOTALES
    // ======================

    const subtotal = booking.totalPrice
    const iva = subtotal * 0.21
    const total = subtotal + iva

    doc.moveDown(2)

    doc.text(`Subtotal: ${subtotal.toFixed(2)} €`)
    doc.text(`IVA (21%): ${iva.toFixed(2)} €`)
    doc.fontSize(14)
    doc.text(`TOTAL: ${total.toFixed(2)} €`)

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

