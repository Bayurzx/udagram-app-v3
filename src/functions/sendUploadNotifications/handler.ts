import { middyfy } from '@libs/lambda';
import { S3Event, SNSHandler, SNSEvent } from 'aws-lambda'
import 'source-map-support/register'
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { DynamoDBClient, DeleteItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const docClient = new DynamoDBClient({ region: "us-east-1" });

const connectionsTable = process.env.CONNECTIONS_TABLE
const stage = process.env.STAGE
const apiId = process.env.API_ID

const sendUploadNotifications: SNSHandler = async (event: SNSEvent) => {
  console.log('Processing SNS event ', JSON.stringify(event))
  for (const snsRecord of event.Records) {
    const s3EventStr = snsRecord.Sns.Message
    console.log('Processing S3 event', s3EventStr)
    const s3Event = JSON.parse(s3EventStr)

    await processS3Event(s3Event)
  }
}


const processS3Event = async (s3Event: S3Event) => {
  for (const record of s3Event.Records) {
    const key = record.s3.object.key
    console.log('Processing S3 item with key: ', key)

    try {
      const connections = await docClient.send(new ScanCommand({
        TableName: connectionsTable
      }));
      console.log("scanCommand data", connections);
      

      const payload = {
        imageId: key
      }

      for (const connection of connections.Items) {
        const connectionId = connection.id.S
        console.log("connectionId", connectionId, "payload", payload);
        
        await sendMessageToClient(connectionId, payload)
      }


    } catch (err) {
      console.error(err);
    }

  }
}

async function sendMessageToClient(connectionId: string, payload) {
  try {
    console.log('Sending message to a connection', connectionId)

    const apiGatewayManagementApi = new ApiGatewayManagementApiClient({
      apiVersion: "2018-11-29",
      endpoint: `https://${apiId}.execute-api.us-east-1.amazonaws.com/${stage}`
    });

    console.log("apiId", apiId, "stage", stage, "payload", payload);
    

    const postToConnectionCommand = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: JSON.stringify(payload)
    });
    console.log("postToconnection command", postToConnectionCommand);
    

    const response = (await apiGatewayManagementApi.send(postToConnectionCommand));
    
    console.log("response", response);
    

  } catch (err) {
    console.log('Failed to send message', JSON.stringify(err))
    console.log('Failed !!!!', err)
    if (err.statusCode === 410) {
      console.log('Stale connection')

      await deleteItem(connectionsTable, connectionId)
    }
  }

}

async function deleteItem(connectionsTable: string, connectionId: string): Promise<void> {
  const client = new DynamoDBClient({ region: "us-east-1" });
  const command = new DeleteItemCommand({
    TableName: connectionsTable,
    Key: marshall({ connectionId }),

  });
  await client.send(command);
}

export const main = middyfy(sendUploadNotifications);
