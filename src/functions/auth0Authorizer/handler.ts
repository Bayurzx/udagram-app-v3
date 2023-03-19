import { middyfy } from '@libs/lambda';
import { APIGatewayAuthorizerHandler, APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
// import secretsManager from '@middy/secrets-manager'
import { secretsManager } from 'middy/middlewares'
// import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { verify } from 'jsonwebtoken'
import { JwtToken } from '../../auth/JwtToken'

const secretId = process.env.AUTH_0_SECRET_ID
const secretField = process.env.AUTH_0_SECRET_FIELD

// Cache secret if a Lambda instance is reused
// let cachedSecret: string;

// const client = new SecretsManagerClient({ region: 'us-east-1' });

const auth0Authorizer: APIGatewayAuthorizerHandler = async (event: APIGatewayTokenAuthorizerEvent, context:any): Promise<APIGatewayAuthorizerResult> => {
  console.log("context", context);
  
  console.log("event.authorizationToken", event.authorizationToken);
  
  try {
    const decodedToken = verifyToken(event.authorizationToken, context.AUTH0_SECRET[secretField]);
    console.log('User was authorized', decodedToken);
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

function verifyToken(authHeader: string, secret: string): JwtToken {
  if (!authHeader) {
    throw new Error('No authentication header');
  }

  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    throw new Error('Invalid authentication header');
  }

  const token = authHeader.split(' ')[1];
  console.log('token', token);
  

  if (token === undefined) {
    throw new Error('No token provided');
  }

  // const secret = await getSecret();
  // const secrets = JSON.parse(secret)[secretField] 
  // console.log("secrets", secrets);
  

  return verify(token, secret) as JwtToken;
}


// async function getSecret(): Promise<string> {
//   if (cachedSecret) {
//     return cachedSecret;
//   }

//   const response = await client.send(new GetSecretValueCommand({
//     SecretId: secretId
//   }));

//   if ('SecretString' in response && response.SecretString) {
//     cachedSecret = response.SecretString;
//     console.log("cachedSecret is", typeof cachedSecret, cachedSecret);
    
//     return cachedSecret;
//   } else {
//     throw new Error('Failed to retrieve secret');
//   }
// }

export const main = middyfy(auth0Authorizer).use(
  secretsManager({
    awsSdkOptions: { region: 'us-east-1' },
    cache: true,
    cacheExpiryInMillis: 60000,
    // Throw an error if can't read the secret
    throwOnFailedCall: true,
    secrets: {
      AUTH0_SECRET: secretId
    }
  })
)

