const redis = require('../redis')
const HOUR_MS = 1000 * 60 * 60
const EIGHT_HOUR_MS = HOUR_MS * 8
const DAY_MS = HOUR_MS * 24


function collectValue () {

  const timeStampCN = new Date().getTime() + EIGHT_HOUR_MS
  const {date, hour} = getKeyByTime(timeStampCN)
  const yesterday = getKeyByTime(timeStampCN - DAY_MS, false)
  const reducedDay = new Date(timeStampCN).getUTCDate()

  const map = new Map([
    ['up', 'ipsec:up'],
    ['mem', 'mem'],
    ['hourTransfer', `tr:${date}${hour}`],
    ['dayTransfer', `tr:${date}`],
    ['yesterdayTransfer', `tr:${yesterday}`],
    ['reduced', `transferReduced:${reducedDay}`],
    ['version', `version`]
  ])

  const readCollection = `
    local up=redis.call("get",ARGV[1])
    local mem=redis.call("get",ARGV[2])
    local hourTransfer=redis.call("get",ARGV[3])
    local dayTransfer=redis.call("get",ARGV[4])
    local sentFlag=redis.call("get",ARGV[6])
    local version=redis.call("hget","meta",ARGV[7])
    if sentFlag then
      return {up,mem,hourTransfer,dayTransfer,version}
    else
      local yesterdayTransfer = redis.call("get",ARGV[5])
      return {up,mem,hourTransfer,dayTransfer,version,yesterdayTransfer}
    end
  `

  redis.defineCommand('readCollection', {
    numberOfKeys: 0,
    lua: readCollection
  });

  return new Promise((resolve, reject) => {
    redis.readCollection(...map.values(), (err, result) => {
      err ? reject(err) : resolve({result, reducedDay})
    });
  })
}

function getKeyByTime (ts, needHour = true) {
  const d = new Date(ts)
  const year = d.getUTCFullYear()
  const month = toTimeString(d.getUTCMonth() + 1)
  const day = toTimeString(d.getUTCDate())
  const date = `${year}${month}${day}`
  return needHour ? {date, hour: toTimeString(d.getUTCHours())} : date
}

function toTimeString (n) {
  return n <= 9 ? '0' + n : String(n)
}

function toKb (bytes) {
  return Math.round(Number(bytes)/1024)
}

exports.readCollected = async function () {
  let {result: [up, mem, hour_transfer_bytes, transfer_bytes, version, yesterday_transfer_bytes], reducedDay} = await collectValue()
  let [hour_transfer, transfer, yesterday_transfer] = [hour_transfer_bytes, transfer_bytes, yesterday_transfer_bytes].map(t => {return t ? toKb(t): null})
  const data = {up, mem, hour_transfer, transfer, version, yesterday_transfer}
  for (k in data) {
    if(!data[k] && data[k] !== 0) delete data[k]
  }
  if (data.hasOwnProperty('yesterday_transfer')) Object.assign(data, {reducedDay})
  return data
}