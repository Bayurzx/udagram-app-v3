// import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
// import schema from './schema';
// import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
const { DynamoDBClient, GetItemCommand, QueryCommand } = require("@aws-sdk/client-dynamodb");
const docClient = new DynamoDBClient({ region: "us-east-1" });

const groupsTable = process.env.GROUPS_TABLE || "udagram-dev"
const imagesTable = process.env.IMAGES_TABLE || "udagram-dev-image"


const getImages: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event:', event)

  const groupId = event.pathParameters.groupId;
  console.log("groupId from getImages:", groupId);

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
  const command = new GetItemCommand({
    TableName: groupsTable,
    Key: {
      id: { S: groupId },
    }
  })

  const result = await docClient.send(command);
  console.log("if groupExistResult result", result);


  return !!result.Item;
}


async function getImagesPerGroup(groupId: string) {
  const command = new QueryCommand({
    TableName: imagesTable,
    KeyConditionExpression: 'groupId = :groupId',
    ExpressionAttributeValues: {
      ':groupId': { S: groupId },
    },
    ScanIndexForward: false
  })

  try {
    const result = await docClient.send(command);
    console.log("getImagesPerGroup function returned:", result)
    return result.Items

  } catch (error) {
    console.error(error);
  }

}

export const main = middyfy(getImages);
