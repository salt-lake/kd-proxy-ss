/**
 * Created by frank on 2017/4/26.
 */
const Redis = require('ioredis')

function retryStrategy (times) {
  return Math.min(times * 50, 2000)
}

let config = {
  host: 'localhost',
  retryStrategy
}
const redis = new Redis(config)
redis.on('connect', function () {
  console.log('redis 连接成功')
})

redis.on('error', function (err) {
  console.error(err)
})

module.exports = redis


