'use strict'

const debug = require('debug')('ipfs:registry-mirror:handlers:manifest')
const loadManifest = require('ipfs-registry-mirror-common/utils/load-manifest')
const sanitiseName = require('ipfs-registry-mirror-common/utils/sanitise-name')
const lol = require('ipfs-registry-mirror-common/utils/error-message')
const log = require('ipfs-registry-mirror-common/utils/log')

module.exports = (config, ipfs, app) => {
  return async (request, response, next) => {
    debug(`Requested ${request.path}`)

    let moduleName = sanitiseName(request.path)

    debug(`Loading manifest for ${moduleName}`)

    try {
      const manifest = await loadManifest(config, ipfs, moduleName)

      response.statusCode = 200
      response.setHeader('Content-type', 'application/json; charset=utf-8')
      response.send(JSON.stringify(manifest, null, request.query.format === undefined ? 0 : 2))
    } catch (error) {
      log(`💥 Could not load manifest for ${moduleName}`, error)

      if (error.message.includes('Not found')) {
        response.statusCode = 404
        response.send(lol(`💥 Could not load ${moduleName}, has it been published?`))

        return
      }

      // a 500 will cause the npm client to retry
      response.statusCode = 500
      response.send(lol(`💥 ${error.message}`))
    }
  }
}
