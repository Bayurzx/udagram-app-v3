import type { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from "aws-lambda"
import type { FromSchema } from "json-schema-to-ts";

type ValidatedAPIGatewayProxyEvent<S> = Omit<APIGatewayProxyEvent, 'body'> & { body: FromSchema<S> }
export type ValidatedEventAPIGatewayProxyEvent<S> = Handler<ValidatedAPIGatewayProxyEvent<S>, APIGatewayProxyResult>

export const formatJSONResponse = (response: Record<string, unknown>, statusCode: StatusCodeAllowed) => {
  return {
    statusCode,
    body: JSON.stringify(response)
  }
}

export type StatusCodeAllowed =
  | 100 //Continue
  | 101 //Switching Protocols
  | 200 //OK
  | 201 //Created
  | 204 //No Content
  | 301 //Moved Permanently
  | 302 //Found
  | 304 //Not Modified
  | 400 //Bad Request
  | 401 //Unauthorized
  | 403 //Forbidden
  | 404 //Not Found
  | 405 //Method Not Allowed
  | 409 //Conflict
  | 500 //Internal Server Error
  | 501 //Not Implemented
  | 503 //Service Unavailable

