import { middyfy } from '@libs/lambda';
import { DynamoDBStreamEvent, DynamoDBStreamHandler } from 'aws-lambda'
import 'source-map-support/register'
import { Client } from '@elastic/elasticsearch'
// import * as httpAwsEs from 'http-aws-es'


const esHost = process.env.ES_ENDPOINT
console.log("esHost", esHost);


const es = new Client({
  node: `https://${esHost}`,
  // connectionClass: httpAwsEs
})

const elasticSearchSync: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
  console.log('Processing events batch from DynamoDB', JSON.stringify(event))

  for (const record of event.Records) {
    console.log('Processing record', JSON.stringify(record))
    if (record.eventName !== 'INSERT') {
      console.log(`Skipped event ${record.eventName}`);
      continue
    }

    const newItem = record.dynamodb?.NewImage
    if (!newItem) {
      console.log('No NewImage found in record');
      continue;
    }


    const imageId = newItem.imageId.S

    const body = {
      imageId: newItem.imageId.S,
      groupId: newItem.groupId.S,
      imageUrl: newItem.imageUrl.S,
      title: newItem.title.S,
      timestamp: newItem.timestamp.S
    }

    try {
      const result = await es.index({
        index: 'images-index',
        // type: 'images',
        id: imageId,
        body
      })
      console.log(`Indexed document with ID ${imageId}:`, result);

    } catch (error) {
      console.error(`Failed to index document with ID ${imageId}:`, error);
    }
  }
}

export const main = middyfy(elasticSearchSync);
