import { middyfy } from '@libs/lambda';
import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import secretsManager from '@middy/secrets-manager'

import { verify } from 'jsonwebtoken'
import { JwtToken } from '../../auth/JwtToken'


const secretId = process.env.AUTH_0_SECRET_ID
const secretField = process.env.AUTH_0_SECRET_FIELD

const auth0Authorizer = async (event: APIGatewayTokenAuthorizerEvent, context): Promise<APIGatewayAuthorizerResult> => {
  try {
    const decodedToken = verifyToken(
      event.authorizationToken,
      context.AUTH0_SECRET[secretField]
    )
    console.log('User was authorized', decodedToken)

    return {
      principalId: decodedToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    console.log('User was not authorized', e.message)

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

const verifyToken = (authHeader: string, secret: string): JwtToken => {
  if (!authHeader)
    throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return verify(token, secret) as JwtToken
}


export const main = middyfy(auth0Authorizer).use(
  secretsManager({
    fetchData: {
      apiToken: secretId
    },
    awsClientOptions: {
      region: 'us-east-1'
    },
    setToContext: true
  })
);
