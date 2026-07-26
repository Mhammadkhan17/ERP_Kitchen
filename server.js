import jsonServer from 'json-server'
import { createServer } from 'http'
import { Server } from 'socket.io'

const app = jsonServer.create()
const router = jsonServer.router('db.json')
const middlewares = jsonServer.defaults()

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: true, credentials: true },
  pingInterval: 25000,
  pingTimeout: 20000,
})

io.on('connection', (socket) => {
  console.log(`[WS] client connected: ${socket.id}`)
  socket.emit('connected', { message: 'Connected to order feed' })

  socket.on('disconnect', (reason) => {
    console.log(`[WS] client disconnected: ${socket.id} (${reason})`)
  })
})

app.use(middlewares)
app.use(jsonServer.bodyParser)

app.use((req, res, next) => {
  if (req.method === 'PATCH' || req.method === 'POST') {
    req.body.updatedAt = new Date().toISOString()
  }
  next()
})

// Intercept writes to broadcast via WebSocket
router.render = (req, res) => {
  const isOrder = req.url.startsWith('/orders')
  if (isOrder && (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT')) {
    const order = res.locals.data
    io.emit('order:update', {
      id: order.id,
      status: order.status,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
    })
  }
  res.json(res.locals.data)
}

app.use(router)

httpServer.listen(3001, () => {
  console.log('JSON Server running on http://localhost:3001')
  console.log('WebSocket available via Socket.IO')
})
