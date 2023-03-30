'use strict'

import pino from 'pino'
import pretty from 'pino-pretty'
import parseArgs from 'minimist'
import deployClient from '@platformatic/deploy-client'

const DEPLOY_SERVICE_HOST = 'https://plt-development-deploy-service.fly.dev'

const PLATFORMATIC_VARIABLES = ['PORT', 'DATABASE_URL']
const PLATFORMATIC_SECRETS = []

const logger = pino(pretty({
  translateTime: 'SYS:HH:MM:ss',
  ignore: 'hostname,pid'
}))

function getEnvVariables (variablesNames) {
  const upperCasedVariablesNames = []
  for (const variableName of variablesNames) {
    upperCasedVariablesNames.push(variableName.toUpperCase().trim())
  }

  const userEnvVars = {}
  for (const key in process.env) {
    const upperCaseKey = key.toUpperCase().trim()
    if (
      PLATFORMATIC_VARIABLES.includes(upperCaseKey) ||
      upperCasedVariablesNames.includes(upperCaseKey) ||
      upperCaseKey.startsWith('PLT_')
    ) {
      userEnvVars[upperCaseKey] = process.env[key]
    }
  }
  return userEnvVars
}

function getSecrets (secretsNames) {
  const upperCasedSecretsNames = []
  for (const secretName of secretsNames) {
    upperCasedSecretsNames.push(secretName.toUpperCase().trim())
  }

  const secrets = {}
  for (const key in process.env) {
    const upperCaseKey = key.toUpperCase().trim()
    if (
      PLATFORMATIC_SECRETS.includes(upperCaseKey) ||
      upperCasedSecretsNames.includes(upperCaseKey)
    ) {
      secrets[upperCaseKey] = process.env[key]
    }
  }
  return secrets
}

export async function deploy (argv) {
  const args = parseArgs(argv, {
    alias: {
      config: 'c'
    },
    string: ['workspace-id', 'workspace-key']
  })

  const workspaceId = args['workspace-id'] || process.env.PLATFORMATIC_WORKSPACE_ID
  const workspaceKey = args['workspace-key'] || process.env.PLATFORMATIC_WORKSPACE_KEY

  const pathToConfig = args.config
  const pathToEnvFile = args.env || './.env'
  const pathToProject = process.cwd()

  logger.info('Getting environment secrets')
  const secretsParam = args.secrets || ''
  const secretsNames = secretsParam.split(',')
  const secrets = getSecrets(secretsNames)

  logger.info('Getting environment variables')
  const envVariablesParam = args.variables || ''
  const envVariablesNames = envVariablesParam.split(',')
  const envVariables = getEnvVariables(envVariablesNames)

  const label = args.label || 'cli:123'
  const deployServiceHost = DEPLOY_SERVICE_HOST

  const entryPointUrl = await deployClient.deploy({
    deployServiceHost,
    workspaceId,
    workspaceKey,
    pathToProject,
    pathToConfig,
    pathToEnvFile,
    secrets,
    variables: envVariables,
    label,
    logger
  })

  logger.info('Your application was successfully deployed! 🚀')
  logger.info(`Application url: ${entryPointUrl}`)
}
