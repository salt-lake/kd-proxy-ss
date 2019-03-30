const http = require('https')
const url  = require('url')

module.exports = function({uri, data, headers, method = 'GET'}) {
  const rawData = typeof data === 'object' ? JSON.stringify(data) : data
  let {hostname, pathname, port, protocol} = url.parse(uri)
  port = protocol === 'https:' ? 443 : port ? port : 80
  headers  = Object.assign({
    'Content-Type': 'application/x-www-form-urlencoded',
  }, headers)

  const opt = {
    hostname,
    port,
    method,
    headers,
    path: pathname,
  }

  return new Promise ((resolve, reject) => {
    const req = http.request(opt, res => {
      const chunks = []

      if (res.statusCode !== 200)
        return reject(new Error(`Request Failed. Status Code: ${res.statusCode}, uri: ${uri}.`))

      res.on('data', chunk => chunks.push(chunk))

      res.on('end', () => {
        let resData = Buffer.concat(chunks).toString()
        try {
          res = JSON.parse(resData)
          resolve(res)
        } catch (e) {
          console.log('not json res')
          resolve(resData)
        }
      })

    })

    req.on('error', e => reject(e))
    rawData && req.write(rawData)
    req.end()
  })

}