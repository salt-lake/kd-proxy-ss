const os = require('os')
let address = ''

module.exports = {
  getIp () {
    if (address !== '') return address
    let ifaces = os.networkInterfaces()
    for (let dev in ifaces) {
      ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false ? address = details.address : undefined
      )
    }
    return address
  }
}
