const redis = require('../redis')
const {fetch} = require('../lib')

exports.register = async function ({uuid, region, platform}) {
  try {
    // let cached = await redis.exists('meta')
    // if (cached) return
    await redis.hset('meta', 'uuid', uuid)
    await redis.hset('meta', 'region', region)
    await redis.hset('meta', 'platform', platform)
  }catch (e) {
    return e
  }
}

exports.fetchTransfer = async function ({token, uuid}) {
  const opt = {
    uri: `https://api.linode.com/v4/linode/instances/${uuid}/stats`,
    headers: {'Authorization': `Bearer ${token}`},
  }

  try {
    const res = await fetch(opt)
    if (!res.data || !res.data.netv4 || !res.data.netv4.out)
      return {e: new Error('node service err: invalidate fetched res from platform')}
    // const latestHour = res.data.netv4.out.slice(275)
    return {e: null, out: (res.data.netv4.out.reduce((t, c)=> {return t + c[1] * 300}, 0) / 8000000000).toFixed(2)}
  } catch (e) {
    return {e}
  }
}

exports.fetchTransfer30Days = async function ({token, uuid}) {
  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1

  const opt = {
    uri: `https://api.linode.com/v4/linode/instances/${uuid}/stats/${year}/${month}`,
    headers: {'Authorization': `Bearer ${token}`},
  }
  try {
    const res = await fetch(opt)
    if (!res.data || !res.data.netv4 || !res.data.netv4.out)
      return {e: new Error('fetch transfer 30days err: invalidate fetched res from platform')}

    // return {e: null, out: (res.data.netv4.out.reduce((t, c)=> {return t + c[1] * 7200}, 0) / 8000000000).toFixed(2)}
    return {e: null, out: (res.data.netv4.out.reduce((t, c)=> {return t + c[1] * 7200}, 0) / 8589934592).toFixed(2)}
  } catch (e) {
    return {e}
  }
}

exports.getTransfer = async function () {
  try {
    let platform = await redis.hget('meta', 'platform')
    if (platform === 'linode') {
      let transfer = await redis.get('transfer')
      let long_transfer = await redis.get('long_transfer')
      return {transfer, long_transfer, e: null}
    }else {
      console.log('not linode or no platform')
      return {e: 'not linode or no platform'}
    }
  }catch (e) {
    console.error(e)
    return {e}
  }
}

exports.getLocalTransfer = async function () {
  try {
    let {date, hour} = getTransferKey()
    let transfer = await redis.get(date)
    let long_transfer = await redis.get(date + hour)
    return {transfer, long_transfer, e: null}
  }catch (e) {
    console.error(e)
    return {e}
  }
}

function getTransferKey () {
  let [dateString, hourString] = new Date().toJSON().split('T')
  date = dateString.replace(/[-]/g, '')
  hour = hourString.split(':')[0]
  return {date, hour}
}