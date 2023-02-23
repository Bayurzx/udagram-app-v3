import { middyfy } from '@libs/lambda';
import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
const docClient = new DynamoDBClient({ region: "us-east-1" });



const connectionsTable = process.env.CONNECTIONS_TABLE

const wss_disconnect: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Websocket connect', event)
  const connectionId = event.requestContext.connectionId

  const key = {
    id: { S: connectionId },
  }


  // await docClient.put({
  //   TableName: connectionsTable,
  //   Item: item
  // }).promise()

  try {
    await docClient.send(new DeleteItemCommand({
      TableName: connectionsTable,
      Key: key
    }));


  } catch (error) {
    console.error("Create Image Err:", error);


  }

  return {
    statusCode: 200,
    body: ''
  }


}

export const main = middyfy(wss_disconnect);
