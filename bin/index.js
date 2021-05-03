#!/usr/bin/env node

const { Forward, Reverse } = require('../')
const minimist = require('minimist')
const http = require('http')
const httpServer = require('../service')

const argv = minimist(process.argv.slice(2), {
  string: ['rpcserver', 'service', 'port', 'forward', 'bootstrap'],
  boolean: ['reverse', 'list', 'help'],
  alias: {
    service: 's',
    port: 'p',
    forward: 'f',
    reverse: 'r',
    list: 'l',
    bootstrap: 'b',
    help: 'h'
  },
  defualt: {

  }
})

const version = `hyperginx/${require('../package.json').version}`
const defaultOpts = { rpchost: 'localhost', rpcport: 9009 }

const help = `Hyperginx proxy service.
${version}

Usage: hyperginx [options]
  --forward <domain>           -f  Instantiate new forward proxy
  --reverse                    -b  Instantiate new reverse proxy
  --service <subdomain>        -s  Subdomain on which to listen
  --port <number>              -p  Port eg. 665 (tcp default); tcp/665; udp/665
  --list                       -l  List currently active services
  --rpcport <port>                 Port of rpcserver (default 9009)
  --rpchost <host>                 Host of rpcserver (default localhost)
  --help                       -h  Display this message
  --bootstrap                  -b  Bootstrap nodes to use (CSV format)
`

if (argv.help) {
  console.log(help)
  process.exit(0)
}

main().catch(onerror)

async function main () {
  const opts = {
    bootstrap: argv.bootstrap ? argv.bootstrap.split(',') : [],
    rpcport: argv.rpcport || defaultOpts.rpcport,
    rpchost: argv.rpchost || defaultOpts.rpchost
  }

  let service
  if (argv.forward || argv.reverse) {
    if (argv.reverse) {
      if (argv.forward) {
        console.log('Specify either forward or reverse.')
        process.exit(1)
      }
      service = new Reverse(opts)
    } else {
      service = new Forward(argv.forward, opts)
    }

    console.log('http service listening on', opts.rpcport)
    httpServer(service).listen(opts.rpcport)
  } else {
    if (argv.service) {
      if (!argv.port) {
        console.log('Port must be specified')
        process.exit(1)
      }

      request(`/register?${argv.service}=${argv.port}`, res => {
        res.on('data', console.log)
        process.exit(0)
      })
    }

    if (argv.list) {
      request('/list', res => {
        res.on('data', d => console.log(d.toString()))
      })
    }
  }

  function request (path, cb) {
    const reqOpts = {
      path: path,
      hostname: 'localhost',
      port: argv.rpcport || defaultOpts.rpcport,
      method: 'GET'
    }

    const req = http.request(reqOpts, res => {
      cb(res)
    })

    req.end()
  }
}

function onerror (err) {
  console.log(err)
  process.exit(1)
}
