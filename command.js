const {exec} = require('child_process')
const fs = require('fs')
const fse = require('fs-extra')
const randomString = require('random-string')
const redis = require('./redis')

const EXP = /(\d+)\sup,\s(\d+)\sconnecting/
const SECRET_PATH = '/usr/local/etc/ipsec.secrets'
const DEFAULT_SECRET_PATH = '/usr/local/etc/ipsec.secrets.default'

module.exports = {

  register (username, ex, callback) {
    redis.get(username).then(res => {
      if (res) return callback(null, res)
      let password = randomString({length: 8})
      let secret = `${username} %any : EAP "${password}"\n`
      fs.appendFile(SECRET_PATH, secret, (err) => {
        if (err) return callback(err)
        exec('ipsec rereadsecrets', function (err) {
          if (err) {
            console.error(err)
          }
        })
        redis.set(username, password).then(function (res) {
          if (res === 'OK') {
            callback(null)
          } else {
            callback(new Error('save key failed'))
          }
        }).error(callback)
      })
    })
  },

  clean (callback) {
    try {
      fse.copySync(DEFAULT_SECRET_PATH, SECRET_PATH)
      redis.flushdb()
      exec('ipsec rereadsecrets', (err) => {
        if (err) {
          console.error(err)
        }
      })
      callback(null)
    } catch (err) {
      console.error(err)
      callback(err)
    }
  },

  restart (callback) {
    exec('ipsec restart', callback)
  },

  executeScript (file, callback) {
    let cmdFile = `/home/kd-scripts/${file}.sh`
    exec(`sh ${cmdFile}`, callback)
  },

  getConn (callback) {
    exec('ipsec status | grep up', function (error, stdout, stderr) {
      if (error) {
        callback(error)
      } else {
        let res = EXP.exec(stdout)
        if (res === null) {
          callback(new Error('invalid stdout'))
        } else {
          let up = res[1]
          let connecting = res[2]
          getMem().then(mem => {
            callback(null, {up, connecting, mem})
          }).catch(e => {
            callback(e)
          })
          // callback(null, {up, connecting})
        }
      }
    })
  }

}

function getMem () {
  return new Promise((resolve, reject) => {
    exec('free -m| sed -n \'2p\'| awk \'{print $3}\'| tr -d \'\n\'', (error, stdout, stderr) => {
      if (error) reject(error)
      let res = /^\d+$/.exec(stdout)
      if (res === null) reject(new Error('invalid stdout'))
      resolve(res[0])
    })
  })
}
