import express from 'express'
import dotenv from 'dotenv'
import morganBody from 'morgan-body'
import router from './router.js'

const app = express()

app.use(express.json())
app.use('/api', router)

dotenv.config()

const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 8081

if (process.env.NODE_ENV !== 'production') {
  morganBody(app)
}

app.listen(port, () => {
  console.log(`App listening at ${host}:${port}`)
})
