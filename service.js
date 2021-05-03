const url = require('url')
const http = require('http')

module.exports = function (proxy) {
  return http.createServer(async (req, res) => {
    if (req.method === 'GET') {
      const u = new url.URL(req.url, 'http://dummyurl:0000')
      const params = u.searchParams

      switch (u.pathname) {
        case '/register' :
          for (const key of params.keys()) {
            await proxy.register(key, params.get(key))
          }
          res.end('ok')
          return

        case '/list' :
          for (const [url, port] of proxy.services) {
            if (proxy.reverse) {
              res.write(url + ' running on port ' + port)
            } else {
              res.write(url + ' listening on port ' + port)
            }
          }
          res.end()
          return

        default :
          res.end()
      }
    }
  })
}
