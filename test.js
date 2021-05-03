const { Forward, Reverse } = require('./')
const net = require('net')
const http = require('http')
const dht = require('dht-rpc')

const keepAliveAgent = new http.Agent({ keepAlive: true })

const bootstrap = dht({ ephemeral: true })
bootstrap.listen(10001)

bootstrap.on('ready', () => {
  const server = http.createServer((req, res) => {
    let body = ''

    req.on('data', data => {
      body += data
    })

    req.on('error', err => console.log('server error', err))
    req.on('end', () => {
      console.log('client says:', body)
      res.end('hello')
    })
  })

  server.listen(1234)

  const fwd = new Forward('test.test', { bootstrap: ['localhost:10001'] })
  const rev = new Reverse({ bootstrap: ['localhost:10001'] })

  fwd.register('test', 4444)
  rev.register('test.test.test', 4445)

  const responseString = 'hello server'
  const options = {
    port: 4444,
    host: '127.0.0.1',
    agent: keepAliveAgent,
    method: 'GET',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': responseString.length
    }
  }

  const req = http.request(options, (res) => {
    res.on('data', (chunk) => {
      console.log(`server says: ${chunk}`)
    })
    res.on('end', () => {
      console.log('all done.')
    })
  }).on('error', err => console.log('error_', err))

  req.write('hello server')
  req.end()
})
