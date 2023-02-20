// import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
// import schema from './schema';
// import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import 'source-map-support/register'
const { DynamoDBClient, GetItemCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const docClient = new DynamoDBClient({ region: "us-east-1" });

const groupsTable = process.env.GROUPS_TABLE || "udagram-dev"
const imagesTable = process.env.IMAGES_TABLE || "udagram-dev-image"


const createImage: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Calling event:', event)

  const groupId = event.pathParameters.groupId;
  const validGroupId = await groupExist(groupId)
  console.log("validGroupId", validGroupId);
  

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

  const newItem = await _createImage(groupId, uuidv4(), event)
  console.log('_createImage newItem', newItem);
  

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      newItem: newItem
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
  const { Item } = await docClient.send(command);
  console.log("groupExist Item", Item);
  

  return !!Item;
}


async function _createImage(groupId: string, imageId: string, event: any) {
  const timestamp = new Date().toISOString()
  // const newImage = JSON.parse(event.body)
  const {title} = JSON.parse(event.body)

  const newItem = {
    groupId: { S: groupId },
    timestamp: { S: timestamp },
    imageId: { S: imageId },
    // ...newImage,
    title: { S: title }
  }

  console.log("newItem", newItem)
  try {
    await docClient.send(new PutItemCommand({
      TableName: imagesTable,
      Item: newItem
    }));

    console.log('Stored new item: ', newItem)

  } catch (error) {
    console.error("Create Image Err:", error);


  }

  return newItem
}


export const main = middyfy(createImage);
