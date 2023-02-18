// import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
// import schema from './schema';
// import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const docClient = new DynamoDB({ region: "us-east-1" });

const groupsTable = process.env.GROUPS_TABLE || "udagram-dev"
const imagesTable = process.env.IMAGES_TABLE || "udagram-dev-image"


const getImages: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event:', event)

  const groupId = event.pathParameters.groupId;
  const validGroupId = await groupExist(groupId)
  
  if (!validGroupId) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: "Group does not exist"
      })
    }
  }

  const images = await getImagesPerGroup(groupId)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      items: images
    })
  }
};

async function groupExist(groupId: string) {
  const result = await docClient.get({
    TableName: groupsTable,
    Key: {
      id: groupId
    }
  })

  console.log("groupExist function returned:", result)
  return !!result.Item
}

async function getImagesPerGroup(groupId: string) {
  const result = await docClient.query({
    TableName: imagesTable,
    KeyConditionExpression: 'groupId = :groupId',
    ExpressionAttributeValues: {
      ':groupId': groupId
    },
    ScanIndexForward: false
  })

  console.log("getImagesPerGroup function returned:", result)
  return result.Items
}

export const main = middyfy(getImages);
