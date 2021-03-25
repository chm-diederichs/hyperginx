# HyperGinX

Proxy service powered by Hyperswarm.

## Installation
```
npm i -s hyperginx
```

## Usage
```js
const { Forward, Reverse } = require('hyperginx')

// on the server
const fwd = new Forward('some.domain')
fwd.register('app', 80)

// on the client
const rev = new Reverse()
myApp.listen(8888)
rev.register('app.some.domain', 8888)
```

## API

### Forward

#### `const fwd = new Forward(domain, opts)`

Instantiate a new proxy service `domain`. should be a utf-8 string specifying the domain this listener is associated with. `opts` are passed to the hyperswarm constructor.

#### `fwd.register(subdomain, port)`

Register a new subdomain and specify on which port to listen for connections.

#### `fwd.getServices()`

Log currently active services

### Reverse

#### `const rev = new Reverse(opts)`

Instantiate a new reverse proxy. `opts` may be used to pass options to the hyperswarm constructor.

#### `fwd.register(domain, port)`

Register a new domain and specify on which local port connections should be forwarded to.

#### `fwd.getServices()`

Log currently active services
