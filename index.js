const net = require('net')
const hyperswarm = require('hyperswarm')
const pump = require('pump')
const hash = require('sha256-wasm')

class Forward {
  constructor (domain, opts) {
    this.domain = domain
    this.services = new Map()

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

    this.services.set(topic, {
      prefix,
      port
    })

    console.log('listening on port', port)
  }

  getServices () {
    for (let {service, port} of this.services) {
      console.log(service, 'listening on port', port)
    }
  }
}

class Reverse {
  constructor (opts) {
    const self = this
    this.swarm = hyperswarm(opts)
    this.services = new Map()

    this.swarm.on('connection', (conn, info) => {
      let topic = null
      let destination

      conn.once('readable', () => {
        topic = conn.read(32).toString('hex')
        destination = self.services.get(topic)

        pump(conn, destination, conn, (err) => {
          if (err) throw err
          console.log('pump ended')
        })
      })
    })

    this._ready = false
  }

  register (url, port) {
    const topic = toTopic(url)

    const connection = new net.createConnection(port)
    connection.on('error', console.log)

    this.services.set(topic.toString('hex'), connection)
    this.swarm.join(topic, { announce: true, lookup: true })
  }

  getServices () {
    for (let [service, port] of this.services) {
      console.log(service, 'forwards to port', port)
    }
  }
}

function toTopic (...args) {
  const ret = Buffer.alloc(32)
  const url = args.join('.')

  const h = new hash().update(url, 'utf8')
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
