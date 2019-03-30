const CronJob = require('cron').CronJob
const command = require('./command')
const client = require('./udp/client')
const {getTransfer} = require('./cmd')

const job = new CronJob({
  cronTime: '*/15 * * * * *',
  onTick: async function () {
    command.getConn(async function (err, res) {
      if (err) {
        let message = `hb:error`
        client.send(message, function (err) {
        })
        return
      }
      let {up, connecting, mem} = res
      let nodeType = process.env.NODE_TYPE
      let message = `{"type":"${nodeType}","up":${up},"conn":${connecting},"mem":${mem}}`
      let {transfer, long_transfer, e} = await getTransfer()
      if (!e) {
        let s = ''
        if (transfer !== null) s = `,"transfer":${transfer}`
        if (long_transfer !== null) s += `,"long_transfer":${long_transfer}`
        message = `{"type":"${nodeType}","up":${up},"conn":${connecting},"mem":${mem}${s}}`
      }

      client.send(message, function (err) {

      })
    })
  },
  start: false,
})
job.start()
module.exports = job
