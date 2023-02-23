import { middyfy } from '@libs/lambda';
import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
const docClient = new DynamoDBClient({ region: "us-east-1" });



const connectionsTable = process.env.CONNECTIONS_TABLE

const wss_connect: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Websocket connect', event)
  const connectionId = event.requestContext.connectionId
  // const timestamp = new Date().toISOString()
  const timestamp = new Date((new Date()).getTime() - ((new Date()).getTimezoneOffset() * 60000)).toISOString(); // correct isoString in your timezone



  const item = {
    id: {S: connectionId},
    timestamp: {S: timestamp}
  }

  
  // await docClient.put({
  //   TableName: connectionsTable,
  //   Item: item
  // }).promise()

  try {
    console.log('Storing item: ', item)
    await docClient.send(new PutItemCommand({
      TableName: connectionsTable,
      Item: item
    }));


  } catch (error) {
    console.error("Create Image Err:", error);


  }

  return {
    statusCode: 200,
    body: ''
  }


}

export const main = middyfy(wss_connect);
