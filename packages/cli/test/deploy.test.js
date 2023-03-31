import { test } from 'tap'
import { join } from 'desm'
import { Agent, MockAgent, setGlobalDispatcher } from 'undici'

import { deploy, DEPLOY_SERVICE_HOST } from '../lib/deploy.js'

const agent = new Agent({ keepAliveTimeout: 10, keepAliveMaxTimeout: 10 })
const mockAgent = new MockAgent({ agent })
setGlobalDispatcher(mockAgent)
mockAgent.disableNetConnect()

mockAgent.get(DEPLOY_SERVICE_HOST)
  .intercept({
    path: '/bundles',
    method: 'POST'
  })
  .reply(200, {
    id: 'default-bundle-id',
    token: 'default-upload-token',
    isBundleUploaded: false
  })

mockAgent.get(DEPLOY_SERVICE_HOST)
  .intercept({
    path: '/upload',
    method: 'PUT'
  })
  .reply(200)

mockAgent.get(DEPLOY_SERVICE_HOST)
  .intercept({
    path: '/deployments',
    method: 'POST'
  })
  .reply(200, {
    entryPointUrl: 'https://foo.deploy.space'
  })

mockAgent.get('https://foo.deploy.space')
  .intercept({
    path: '/',
    method: 'GET'
  })
  .reply(200, 'Hello World!')

test('should deploy static workspace to the cloud', async (t) => {
  try {
    const workspaceType = 'static'
    const workspaceId = 'b3d7f7e0-8c03-11e8-9eb6-529269fb1459'
    const workspaceKey = 'b3d7f7e08c0311e89eb6529269fb1459'
    const pathToConfig = join(import.meta.url, './fixtures/app-to-deploy/platformatic.db.json')

    await deploy([
      '--type', workspaceType,
      '--config', pathToConfig,
      '--workspace-id', workspaceId,
      '--workspace-key', workspaceKey
    ])
  } catch (err) {
    t.fail(err)
  }
})
