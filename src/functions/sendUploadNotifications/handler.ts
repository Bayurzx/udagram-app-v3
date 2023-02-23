import { middyfy } from '@libs/lambda';
import { SNSHandler, SNSEvent, S3Event, S3Handler } from 'aws-lambda'
import 'source-map-support/register'


const sendUploadNotifications: S3Handler = async (s3Event: S3Event) => {
  for (const record of s3Event.Records) {
    const key = record.s3.object.key
    console.log('Processing S3 item with key: ', key)

  //   const connections = await docClient.scan({
  //     TableName: connectionsTable
  //   }).promise()

  //   const payload = {
  //     imageId: key
  //   }

  //   for (const connection of connections.Items) {
  //     const connectionId = connection.id
  //     await sendMessageToClient(connectionId, payload)
  //   }
  }
}

  export const main = middyfy(sendUploadNotifications);
