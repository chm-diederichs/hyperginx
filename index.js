const net = require('net')
const hyperswarm = require('hyperswarm')
const pump = require('pump')
const Hash = require('sha256-wasm')

class Forward {
  constructor (domain, opts) {
    this.domain = domain
    this._services = new Map()
    this.reverse = false

    this.swarm = hyperswarm(opts)
    this._ready = false
  }

  register (prefix, port) {
    const swarm = this.swarm
    const topic = toTopic(prefix, this.domain)

    net.createServer(socket => {
      swarm.join(topic, { announce: false, lookup: true })
      swarm.once('connection', conn => {
        conn.write(topic)

        pump(socket, conn, socket, (err) => {
          if (err) throw err
          swarm.leave(topic)
        })
      })
    }).listen(port)

    this._services.set(topic, {
      prefix,
      port
    })

    console.log('listening on port', port)
  }

  get services () {
    return Array.from(this._services)
  }
}

class Reverse {
  constructor (opts) {
    const self = this
    this.swarm = hyperswarm(opts)
    this._services = new Map()
    this.reverse = true

    this.swarm.on('connection', (conn, info) => {
      let topic = null
      let destination

      conn.once('readable', () => {
        topic = conn.read(32).toString('hex')
        destination = self._services.get(topic).connection

        pump(conn, destination, conn, (err) => {
          if (err) throw err

          const info = self._services.get(topic)
          self._services.delete(topic)

          console.log(info.url, 'stopped listening on port', info.port)
        })
      })
    })

    this._ready = false
  }

  register (url, port) {
    console.log('register', url, port)
    const topic = toTopic(url)

    const connection = net.createConnection(port)
    connection.on('error', console.log)

    this._services.set(topic.toString('hex'), {
      connection,
      url,
      port
    })

    this.swarm.join(topic, { announce: true, lookup: true })
  }

  get services () {
    return Array.from(this._services).map(([_, e]) => [e.url, e.port])
  }
}

function toTopic (...args) {
  const ret = Buffer.alloc(32)
  const url = args.join('.')

  const h = new Hash().update(url, 'utf8')
  return h.digest(ret)
}

module.exports = {
  Forward,
  Reverse
}

// helper
function log (prefix = '') {
  return d => {
    console.log(prefix, d.toString())
  }
}
