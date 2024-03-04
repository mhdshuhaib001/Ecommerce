const dotenv = require('dotenv')
dotenv.config()

const mongoose = require('mongoose')
mongoose.connect(process.env.DBCOLLECTION, console.log('DB connected'))
//-----------------------------------------------------

const express = require('express')
const app = express()
const noCache = require('nocache')
// const morgan = require('morgan');

const path = require('path')
const session = require('express-session')
const Config = require('./config/config')
const MemoryStore = require('memorystore')(session)

app.use(
  session({
    secret: Config.sessionSecret,
    saveUninitialized: false,
    resave: false,
    store: new MemoryStore(),
  }),
)

// app.use(morgan('dev'));

app.use(noCache())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))

const adminRout = require('./routes/adminRoute')
app.use('/admin', adminRout)

const userRoute = require('./routes/userRoute')
app.use('/', userRoute)

app.use((req, res) => {
  res.status(404).render(path.join(__dirname, 'views', 'users', '404.ejs'))
})

app.use((req, res) => {
  res.status(404).render(__dirname + '/views/user/404.ejs')
})

const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
  console.log(`server is running in port:http://localhost:${PORT}`)
})
