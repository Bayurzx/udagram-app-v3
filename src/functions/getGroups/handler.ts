// import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
// import schema from './schema';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const docClient = new DynamoDB({ region: "us-east-1" });

const groupsTable = process.env.GROUPS_TABLE || "Groups-dev"


const getGroups: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event:', event)

  const result = await docClient.scan({
    TableName: groupsTable
  })

  const items = result.Items
  return formatJSONResponse({
    items,
    // event, // should not be there for info purpose only
  }, 200);
};

export const main = middyfy(getGroups);
