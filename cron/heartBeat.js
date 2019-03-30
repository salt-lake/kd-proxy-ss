const CronJob = require('cron').CronJob;
const client = require('../udp/client')
const {readCollected} = require('../service/readCollected')

exports.heartBeat = new CronJob('*/15 * * * * *', async function() {
  try {
    let data = await readCollected()
    let message = JSON.stringify(Object.assign({up:-1}, data, {action: 'snode_udp'}))
    client.send(message, err => {if (err) console.error('send udp error: ', err)})
  } catch (e) {
    console.error('readCollected error: ', e)
  }
})