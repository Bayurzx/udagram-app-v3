import { middyfy } from '@libs/lambda';
import { APIGatewayAuthorizerHandler, APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import { verify } from 'jsonwebtoken'
import { JwtToken } from '../../auth/JwtToken'

const cert = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIJNA7BZx/uJHJUMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
BAMTGWRldi0yNGYwNGlzaS51cy5hdXRoMC5jb20wHhcNMjExMDE4MTc0MTI4WhcN
MzUwNjI3MTc0MTI4WjAkMSIwIAYDVQQDExlkZXYtMjRmMDRpc2kudXMuYXV0aDAu
Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA9JcoTQyP1sODxJMx
6qDl3c1k/vTEoteypklCRNRh2qQ8PzJWBPGjeWQqJdMf+Hw55g51zu3RWVCGMFJf
tfwlr+Ur/xx8YBq1EER53LXpMBADcWpGGe0a4F2oBGC2sxCs00O0ltQib0HdLhDz
mPB2Wnr61LOG/sRx0rDcWvzQyKBqyWV4xLTbY+BWuJ+w+8sgdIzr0Y8vV2uQW28u
8+il+e5xhSEJ0Nvm06ikfr74KgYd6VBvjWEHMYVvw8s6bgLVFD6vSk3uqImeN7rH
dODgfmcmhUTP72xaKXxVxQD/e1t1ZlrfEfRpmp3LdOxigHgHwd5snddOsqduo35c
xWGxVQIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBS/IUY+iWiQ
5IPKuk/EwZxB8LjptTAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
AH3wAPmNoNaxKDWeyAY3voW4wSQmgK8TEvNz6/CNdTMMH/zUZ6lspN6enh7pjXG2
OLFmhLcAd7ZEGgaXG+7xp8aDnA/zWJFfTepTMnkLSYZlzo4TfRdqMuaWhodvLVuN
xxzgGJDJhGqj3C9vvLOl2hpR1E67rsj0pN+kDuBBgZmPC3L8QiBcm1+XmG6gWwXC
WO11RGyrDHBd5vEOEmmkcQn6hhDtgRDZCbhQ/XUQhmzCb8w9hFOpsP8+FxM7YvKm
QIdHNGiF3OhHOLarydJwXQbYoeRFNZ8Rk0ldAfKjiDjnWzfelWx/5gRcRBrpvKzU
VA8+ktArx8d5cRxaklECgls=
-----END CERTIFICATE-----`

const rs256Auth0Authorizer: APIGatewayAuthorizerHandler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
  console.log("Event has started: ", event);
  
  try {
    const jwtToken = verifyToken(event.authorizationToken)
    console.log('User was authorized, jwtToken: ', jwtToken)

    return {
      principalId: jwtToken.sub,
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
    console.log('User not authorized', e)

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

function verifyToken(authHeader: string): JwtToken {
  if (!authHeader)
    throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return verify(token, cert, { algorithms: ['RS256'] }) as JwtToken
}


export const main = middyfy(rs256Auth0Authorizer)