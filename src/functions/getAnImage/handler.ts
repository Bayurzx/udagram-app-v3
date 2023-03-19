// import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
// import schema from './schema';
// import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb");
const docClient = new DynamoDBClient({ region: "us-east-1" });

const imagesTable = process.env.IMAGES_TABLE || "udagram-dev-image"
const imageIdIndex = process.env.IMAGE_ID_INDEX



const getAnImage: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event:', event)

  const imageId = event.pathParameters.groupId // change this to event.pathParameters.imageId and in `index.ts`
  console.log("pathParameters imageId", imageId);
  console.log("process.env.IMAGE_ID_INDEX", imageIdIndex);


  const command = new QueryCommand({
    TableName: imagesTable,
    IndexName: imageIdIndex,
    KeyConditionExpression: "imageId = :imageId",
    ExpressionAttributeValues: {
      ":imageId": { S: imageId },
    },
  })

  try {
    
    const result = await docClient.send(command);
    console.log("QueryCommand result", result);

    if (result.Count !== 0) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(result.Items[0])
      }
    }

  } catch (error) {
    console.error(error);
  }

  return {
    statusCode: 404,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: 'Result was not returned or there was no result in DB'
  }
}


export const main = middyfy(getAnImage);
