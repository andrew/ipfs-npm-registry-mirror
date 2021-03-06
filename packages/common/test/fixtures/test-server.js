'use strict'

const http = require('http')
const IPFSFactory = require('ipfsd-ctl').create()

let testServers = []

module.exports = {
  createTestServer: (resources) => {
    return new Promise((resolve, reject) => {
      const server = http.createServer((request, response) => {
        let url = request.url

        if (url.includes('?')) {
          url = url.split('?')[0]
        }

        if (resources[url]) {
          if (typeof resources[url] === 'function') {
            return resources[url](request, response)
          }

          response.statusCode = 200
          return response.end(resources[url])
        }

        response.statusCode = 404
        response.end('404')
      })

      server.listen((error) => {
        if (error) {
          return reject(error)
        }

        testServers.push(server)

        IPFSFactory.spawn({
          args: ['--enable-pubsub-experiment']
        }, async (err, ipfsd) => {
          if (err) {
            return reject(error)
          }

          server.ipfs = ipfsd.api

          if (typeof resources === 'function') {
            resources = await resources(server)
          }

          resolve(server)
        })
      })
    })
  },

  destroyTestServers: () => {
    const servers = testServers
    testServers = []

    return Promise.all(
      servers.map((server) => {
        return new Promise((resolve) => {
          server.ipfs.stop()
          server.close(resolve)
        })
      })
    )
  }
}
