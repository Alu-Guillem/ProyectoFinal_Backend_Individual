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
    // HEADER HOTEL 
    // ======================
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .fillColor('#200877')
      .text('HOTEL PERE MARIA', { align: 'center' })
      

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#000000')
      .text('Avenida Example 123, Calpe', { align: 'center' })
      .text('CIF: B12345678', { align: 'center' })
      .text('+34 600 000 000', { align: 'center' })
      .text('reservas@peremaria.com', { align: 'center' })

    doc.moveDown(3)

    // Línea separadora
    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke()

    // ======================
    // CLIENTE Y FACTURA 
    // ======================
    var infoY = doc.y + 20

    // Columna Izquierda: Cliente
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('CLIENTE', 50, infoY)

    doc
      .font('Helvetica')
      .text(`Nombre: ${customer.firstName} ${customer.lastName}`, 50)
      .text(`DNI: ${customer.dni}`, 50)
      .text(`Email: ${customer.email}`, 50)


    // Columna Derecha: Factura
    infoY += 5
    doc
      .font('Helvetica-Bold')
      .text('FACTURA', 350, infoY)

    doc
      .font('Helvetica')
      .text(`Nº ${booking.invoiceNumber}`, 350)
      .text(`Fecha: ${formattedDate}`, 350)

    doc.moveDown(2)

    // Línea separadora

    doc.moveTo(50, doc.y)
       .lineTo(550, doc.y)
       .stroke()

    // ======================
    // TABLA  
    // ======================
      const tableTop = infoY + 90
      const rowHeight = 25
      const startX = 50

      // Columnas compactas reales
      const cols = {
        room: 50,
        type: 145,
        occ: 235,
        nights: 290,
        price: 350,
        disc: 425,
        amount: 485,
        end: 560
      }

      // ======================
      // CABECERA
      // ======================

      doc
        .rect(startX, tableTop, cols.end - startX, rowHeight)
        .fill('#c1b1f8')
        

      doc
        .fillColor('black')
        .rect(startX, tableTop, cols.end - startX, rowHeight)
        .stroke()

      // Líneas verticales
      for (const x of [
        cols.type,
        cols.occ,
        cols.nights,
        cols.price,
        cols.disc,
        cols.amount
      ]) {
        doc.moveTo(x, tableTop)
          .lineTo(x, tableTop + rowHeight)
          .stroke()
      }

      doc
        .font('Helvetica-Bold')
        .fontSize(9)

      // Cabecera centrada
      doc.text('Habitación', cols.room, tableTop + 7, {
        width: cols.type - cols.room,
        align: 'center'
      })

      doc.text('Tipo', cols.type, tableTop + 7, {
        width: cols.occ - cols.type,
        align: 'center'
      })

      doc.text('Ocup.', cols.occ, tableTop + 7, {
        width: cols.nights - cols.occ,
        align: 'center'
      })

      doc.text('Noches', cols.nights, tableTop + 7, {
        width: cols.price - cols.nights,
        align: 'center'
      })

      doc.text('Precio', cols.price, tableTop + 7, {
        width: cols.disc - cols.price,
        align: 'center'
      })

      doc.text('Desc.', cols.disc, tableTop + 7, {
        width: cols.amount - cols.disc,
        align: 'center'
      })

      doc.text('Importe', cols.amount, tableTop + 7, {
        width: cols.end - cols.amount,
        align: 'center'
      })


      // ======================
      // FILA DATOS
      // ======================

      const rowY = tableTop + rowHeight

      doc
        .rect(startX, rowY, cols.end - startX, rowHeight)
        .stroke()

      for (const x of [
        cols.type,
        cols.occ,
        cols.nights,
        cols.price,
        cols.disc,
        cols.amount
      ]) {
        doc.moveTo(x, rowY)
          .lineTo(x, rowY + rowHeight)
          .stroke()
      }

      doc
        .font('Helvetica')
        .fontSize(9)

      // Nombre
      doc.text(room.name, cols.room + 4, rowY + 7, {
        width: cols.type - cols.room - 8
      })

      // Tipo
      doc.text(room.type, cols.type + 4, rowY + 7, {
        width: cols.occ - cols.type - 8
      })

      // Ocupantes
      doc.text(String(booking.occupants), cols.occ, rowY + 7, {
        width: cols.nights - cols.occ,
        align: 'center'
      })

      // Noches
      doc.text(String(booking.totalNights), cols.nights, rowY + 7, {
        width: cols.price - cols.nights,
        align: 'center'
      })

      // --- CÁLCULO INVERSO DEL PRECIO REAL ---
      // Si el descuento es 100%, el precio original no se puede calcular matemáticamente (asumimos 0 para evitar error)
      const discountFactor = 1 - (booking.discount / 100);
      const originalPricePerNight = discountFactor > 0 
        ? booking.pricePerNight / discountFactor 
        : 0;

      // Precio (Ahora muestra el precio REAL original antes del descuento)
      doc.text(`${originalPricePerNight.toFixed(2)} €`, cols.price, rowY + 7, {
        width: cols.disc - cols.price - 6,
        align: 'right'
      })

      // Descuento
      doc.text(`${booking.discount}%`, cols.disc, rowY + 7, {
        width: cols.amount - cols.disc,
        align: 'center'
      })

      // Importe (Mantiene el total final que ya viene correcto de la API)
      doc.text(`${booking.totalPrice.toFixed(2)} €`, cols.amount, rowY + 7, {
        width: cols.end - cols.amount - 6,
        align: 'right'
      })

    // ======================
    // RESUMEN ECONÓMICO
    // ======================
    const subtotal = booking.totalPrice
    const iva = Number((subtotal * 0.25).toFixed(2))
    const total = Number((subtotal + iva).toFixed(2))

    const totalsY = rowY + 100

    doc
      .font('Helvetica')
      .fontSize(11)

    // Empezamos en 380 con ancho de 180 para llegar a 560 (borde derecho)
    doc.text(`Subtotal: ${subtotal.toFixed(2)} €`, 380, totalsY, {
      width: 180,
      align: 'right'
    })

    doc.text(`IVA (25%): ${iva.toFixed(2)} €`, 380, totalsY + 20, {
      width: 180,
      align: 'right'
    })

    // Línea total: ahora va desde 460 hasta 560 para ajustarse al diseño derecho
    doc.moveTo(460, totalsY + 45)
       .lineTo(560, totalsY + 45)
       .stroke()

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(`TOTAL: ${total.toFixed(2)} €`, 380, totalsY + 55, {
        width: 180,
        align: 'right'
      })

    // ======================
    // FOOTER
    // ======================
    doc.moveDown(2)
    const footerY = doc.page.height - 70

    doc
      .fontSize(15)
      .font('Helvetica-Oblique')
      .text('- Gracias por su estancia -', 50, footerY, {
        width: 500,
        align: 'center'
      })

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

