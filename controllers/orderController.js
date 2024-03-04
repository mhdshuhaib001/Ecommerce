const Order = require('../models/orderModel')
const User = require('../models/userModel')
const Address = require('../models/addressModel')
const Cart = require('../models/cartModel')
const Product = require('../models/productsModel')
const Razorpay = require('razorpay')
const crypto = require('crypto')
const puppeteer = require('puppeteer')
const ejs = require('ejs')
const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')
dotenv.config()

var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
})

//-----------orderPlaced-----------------
const placeOrder = async (req, res) => {
  try {
    const user_id = req.session.user_id
    const cartData = await Cart.findOne({ userId: user_id }).populate(
      'couponDiscount',
    )
    const paymentMethod = req.body.formData.payment
    const status = paymentMethod === 'COD' ? 'Placed' : 'Pending'
    const userData = await User.findById(user_id)
    const walletBalance = userData.wallet
    const address = req.body.formData.address
    const subtotalAmount = cartData.product.reduce(
      (acc, val) => acc + (val.totalPrice || 0),
      0,
    )
    const uniqId = crypto
      .randomBytes(4)
      .toString('hex')
      .toUpperCase()
      .slice(0, 8)

    let totalAmount = subtotalAmount

    // Check if there is a coupon discount
    if (cartData.couponDiscount) {
      const couponDiscountPercentage = cartData.couponDiscount.discountAmount
      const discountAmount = Math.round(
        (couponDiscountPercentage / 100) * subtotalAmount,
      )
      totalAmount -= discountAmount
    }

    const productIds = cartData.product.map((product) => product.productId)
    const products = await Product.find({ _id: { $in: productIds } })

    const productData = cartData.product.map((cartProduct) => {
      const productDetails = products.find(
        (p) => p._id.toString() === cartProduct.productId.toString(),
      )
      return {
        productId: cartProduct.productId,
        count: cartProduct.count,
        productPrice: productDetails ? productDetails.price : 0,
        image: productDetails ? productDetails.images.image1 : '',
        totalPrice: cartProduct.totalPrice,
        status: status,
        productName: productDetails ? productDetails.name : '',
      }
    })

    console.log(totalAmount, 'totalAmount')
    const purchaseDate = new Date()
    let shippingAmount = 0
    const shipingTotalAmount = 1300

    // checking the shipingTotalAmount
    if (paymentMethod === 'COD' && totalAmount > shipingTotalAmount) {
      res.json({ maxAmount: true })
      return
    } else if (totalAmount < shipingTotalAmount) {
      shippingAmount = 90
      totalAmount += shippingAmount
    }

    const order = new Order({
      userId: user_id,
      orderId: uniqId,
      deliveryDetails: address,
      orderProducts: productData,
      purchaseDate: purchaseDate,
      totalAmount: totalAmount,
      paymentMethod: paymentMethod,
      shippingMethod: cartData.shippingMethod,
      shippingAmount: shippingAmount,
    })

    const orderData = await order.save()
    const orderId = orderData._id

    if (orderData.paymentMethod === 'COD') {
      for (let i = 0; i < cartData.product.length; i++) {
        let product = cartData.product[i].productId
        let count = cartData.product[i].count
        await Product.updateOne(
          { _id: product },
          { $inc: { quantity: -count } },
        )
      }

      await Cart.deleteOne({ userId: user_id })
      return res.json({ codsuccess: true, orderId })
    } else if (orderData.paymentMethod == 'onlinePayment') {
      var options = {
        amount: orderData.totalAmount * 100,
        currency: 'INR',
        receipt: '' + orderId,
      }
      instance.orders.create(options, async function (err, order) {
        // Update the order status to 'placed'
        const update = await Order.findByIdAndUpdate(
          { _id: orderId },
          { $set: { status: 'placed' } },
        )

        return res.json({ razorpay: true, order })
      })
    } else if (orderData.paymentMethod === 'wallet') {
      const totalAmount = orderData.totalAmount
      const TransactuonDate = new Date()

      if (walletBalance >= totalAmount) {
        const wallet = await User.findOneAndUpdate(
          { _id: user_id },
          {
            $inc: { wallet: -totalAmount },
            $push: {
              walletHistory: {
                transactionDate: TransactuonDate,
                amount: totalAmount,
                direction: 'Debited',
              },
            },
          },
          { new: true },
        )

        if (wallet) {
          for (let i = 0; i < cartData.product.length; i++) {
            let product = cartData.product[i].productId
            await Order.updateOne(
              { _id: orderId, 'orderProducts.productId': product },
              { $set: { 'orderProducts.$.status': 'placed' } },
            )
          }

          const orderUpdate = await Order.findByIdAndUpdate(
            { _id: orderId },
            { $set: { status: 'placed' } },
          )
          await Cart.deleteOne({ userId: user_id })
          return res.json({ placed: true, orderId })
        } else {
          return res.json({ walletFailed: true })
        }
      } else {
        return res.json({ walletFailed: true })
      }
    }
  } catch (error) {
    console.error(error.message)
    res.status(500).render('500')
  }
}

// onnlince payment
const verifyPayment = async (req, res) => {
  try {
    const user_id = req.session.user_id
    const paymentData = req.body
    const cartData = await Cart.findOne({ userId: user_id })

    const hmac = crypto.createHmac('sha256', process.env.KEY_SECRET)
    hmac.update(
      paymentData.payment.razorpay_order_id +
        '|' +
        paymentData.payment.razorpay_payment_id,
    )
    const hmacValue = hmac.digest('hex')

    if (hmacValue === paymentData.payment.razorpay_signature) {
      // Update the product quantities
      for (const productData of cartData.product) {
        const { productId, count } = productData
        await Product.updateOne(
          { _id: productId },
          { $inc: { quantity: -count } },
        )
      }
      // Update the order status to 'placed'
      const orderData = await Order.findByIdAndUpdate(
        { _id: paymentData.order.receipt },
        {
          $set: {
            status: 'placed',
            paymentId: paymentData.payment.razorpay_payment_id,
          },
        },
      )

      const productData = cartData.product.map((product) => ({
        productId: product.productId,
        count: product.count,
        productPrice: product.productPrice,
        image: product.image,
        totalPrice: product.totalPrice,
        status: 'placed',
        productName: product.productName,
        category: product.category,
      }))

      const razoOrder = await Order.findOneAndUpdate(
        { _id: orderData._id },
        { $set: { orderProducts: productData } },
        { new: true },
      )
      await Cart.deleteOne({ userId: user_id })
      return res.json({ placed: true })
    }

    res.status(400).json({ error: 'Invalid payment verification' })
  } catch (error) {
    console.error(error.message)
    res.status(500).render('500')
  }
}

const success = async (req, res) => {
  try {
    const userId = req.session.user_id
    const orderData = await Order.find({ _id: userId })
    res.render('orderSuccess', { orderData })
  } catch (error) {
    console.log(error.message)
    res.render('shop')
    res.status(500).render('500')
  }
}

const OrderDetailsLoad = async (req, res) => {
  try {
    const userId = req.session.user_id
    const orderId = req.query._id

    const orderData = await Order.findOne({ _id: orderId })
      .populate('orderProducts.productId')
      .exec()
    console.log(orderData.orderProducts[0].productId.price)

    const order = await Order.findOne({ _id: orderId })
    const deliveryDetails =
      order && order.deliveryDetails ? order.deliveryDetails : null
    const orderPrice = orderData.totalAmount
    console.log(orderPrice)
    let shippingCharge = 0
    if (orderPrice < 1390) {
      shippingCharge = 90
    }
    if (orderData) {
      res.render('orderDetails', {
        orderData,
        userId,
        address: deliveryDetails,
        shippingCharge,
      })
    } else {
      res.render('orderDetails', { userId })
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}
const orderCancel = async (req, res) => {
  try {
    const userId = req.session.user_id
    const productId = req.body.productId
    const orderId = req.body.orderId
    const cancelReason = req.body.cancelReason
    const orderData = await Order.findOne({ _id: orderId })
    const orderProduct = orderData.orderProducts.find((val) => {
      return val._id.toString() === productId
    })

    const prodcutTotalPrice = orderProduct.totalPrice
    if (orderData.paymentMethod !== 'COD') {
      const walletUpdate = await User.findOneAndUpdate(
        { _id: userId },
        {
          $inc: { wallet: prodcutTotalPrice },
          $push: {
            walletHistory: {
              date: new Date(),
              amount: prodcutTotalPrice,
              direction: 'Credited',
            },
          },
        },
        { new: true },
      )

      if (walletUpdate) {
        const updateResult = await Order.findOneAndUpdate(
          { _id: orderId, 'orderProducts._id': productId },
          {
            $set: {
              'orderProducts.$.status': 'Cancelled',
              'orderProducts.$.cancelReason': cancelReason,
            },
          },
        )
        console.log(`Added ${prodcutTotalPrice} to the wallet.`)
        return res.json({
          success: true,
          message: 'Order cancelled successfully.',
        })
      }
    } else if (orderData.paymentMethod === 'COD') {
      const updateResult = await Order.findOneAndUpdate(
        { _id: orderId, 'orderProducts._id': productId },
        {
          $set: {
            'orderProducts.$.status': 'Cancelled',
            'orderProducts.$.cancelReason': cancelReason,
          },
        },
      )

      console.log(updateResult, 'updateResult')
      if (updateResult) {
        return res.json({
          success: true,
          message: 'Order cancelled successfully.',
        })
      } else {
        return res.json({
          success: false,
          message: 'Order cancellation failed.',
        })
      }
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).json({ success: false, message: 'Internal server error.' })
  }
}

const returnRequest = async (req, res) => {
  try {
    const orderId = req.body.order
    const productId = req.body.id
    const returnReason = req.body.returnReason
    const updateReturn = await Order.updateOne(
      { _id: orderId, 'orderProducts._id': productId },
      {
        $set: {
          'orderProducts.$.status': 'request',
          'orderProducts.$.returnReason': returnReason,
        },
      },
    )
    if (updateReturn) {
      res.json({ success: true })
    } else {
      res.json({ success: false })
    }
  } catch (error) {
    res.status(500).render('500')
  }
}

const returnOrder = async (req, res) => {
  try {
    const productId = req.body.productId
    const count = req.body.count
    const orderId = req.body.orderId

    const order = await Order.findById(orderId)
    const returnedProduct = order.orderProducts.find(
      (val) => val._id.toString() === productId,
    )
    const productTotalPrice = returnedProduct.totalPrice

    const totalRefundedAmount = productTotalPrice

    const updatedOrder = await Order.updateOne(
      { _id: orderId, 'orderProducts._id': productId },
      {
        $set: { 'orderProducts.$.status': 'Accepted' },
      },
    )

    const updatedProduct = await Product.findByIdAndUpdate(
      { _id: productId },
      { $inc: { quantity: count } },
    )

    const userId = order.userId
    const user = await User.findById(userId)
    const transactionDate = new Date()
    const newTotalAmount = order.totalAmount - totalRefundedAmount
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { wallet: totalRefundedAmount },
        $push: {
          walletHistory: {
            transactionDate: transactionDate,
            amount: totalRefundedAmount,
            direction: 'Credited',
          },
        },
      },
      { new: true },
    )

    console.log(updatedUser, 'hey the data inserted')

    const updatedOrderTotal = await Order.findByIdAndUpdate(
      orderId,
      { $set: { totalAmount: newTotalAmount } },
      { new: true },
    )
    res.json({ success: true })
  } catch (error) {
    console.log(error.message)
    res.status(500).render('500')
  }
}

const invoice = async (req, res) => {
  try {
    const orderId = req.query._id

    const orderData = await Order.findById({ _id: orderId }).populate(
      'orderProducts._id',
    )

    const deliveredOrder = orderData.orderProducts.filter(
      (product) => product.status === 'delivered',
    )
    if (deliveredOrder.length === 0) {
      return res
        .status(404)
        .send('No delivered products found for the specified order.')
    }

    const templatePath = path.join(__dirname, '../views/users/invoice.ejs')
    const templateContent = await ejs.renderFile(templatePath, {
      order: orderData,
      orderProducts: deliveredOrder,
    })

    // Generate PDF using puppeteer
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.setContent(templateContent)
    const pdfBuffer = await page.pdf()
    await browser.close()

    // Sending the PDF as a response
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf')
    res.send(pdfBuffer)
  } catch (error) {
    console.error(error)
    res.status(500)
  }
}

const loadOrderManagement = async (req, res) => {
  try {
    const itemPage = 10
    const page = +req.query.page || 1
    const totalOrders = await Order.countDocuments()
    const totalPages = Math.ceil(totalOrders / itemPage)

    const orderData = await Order.find({
      'orderProducts.status': { $nin: ['pending'] },
    })
      .sort({ purchaseTime: -1 })
      .skip((page - 1) * itemPage)
      .limit(itemPage)

    res.render('ordermanagement', { orderData, totalPages, currentPage: page })
  } catch (error) {
    console.log('Error:', error.message)
    res.status(500).render('500')
  }
}

const updateOrder = async (req, res) => {
  try {
    const orderId = req.body.orderId
    const orderStatus = req.body.status

    const orderData = await Order.findOne({ 'orderProducts._id': orderId })
    console.log('orderData', orderData)
    const orderProductIndex = orderData.orderProducts.findIndex(
      (product) => product._id.toString() === orderId,
    )
    const status = (orderData.orderProducts[orderProductIndex].status = orderStatus)
    const date = (orderData.orderProducts[orderProductIndex].statusChangeTime = new Date())
    await orderData.save()
    res.json({ success: true, orderData })
  } catch (error) {
    console.error(error.message)
    res.status(500).render('500')
  }
}

const orderDetails = async (req, res) => {
  try {
    const orderId = req.query._id
    const orderData = await Order.findOne({ _id: orderId }).populate({
      path: 'orderProducts.productId',
      populate: { path: 'category' },
    })
    if (orderData) {
      res.render('orderDetails', { orderData })
    } else {
      res.render('orderDetails', { userId: req.session.user_id })
    }
  } catch (error) {
    console.error(error.message)
    res.status(500).render('500')
  }
}

module.exports = {
  placeOrder,
  success,
  OrderDetailsLoad,
  loadOrderManagement,
  orderDetails,
  updateOrder,
  orderCancel,
  verifyPayment,
  invoice,
  returnRequest,
  returnOrder,
}
