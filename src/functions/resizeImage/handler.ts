import { middyfy } from '@libs/lambda';
import { S3EventRecord, SNSHandler, SNSEvent } from 'aws-lambda'
import 'source-map-support/register'
import Jimp from 'jimp/es';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';


const s3 = new S3Client({ region: 'us-east-1' });
const imagesBucketName = process.env.IMAGES_S3_BUCKET;
const thumbnailBucketName = process.env.THUMBNAILS_S3_BUCKET;


const resizeImage: SNSHandler = async (event: SNSEvent) => {
  console.log('Processing SNS event ', JSON.stringify(event))
  for (const snsRecord of event.Records) {
    const s3EventStr = snsRecord.Sns.Message
    console.log('Processing S3 event', s3EventStr)
    const s3Event = JSON.parse(s3EventStr)

    for (const record of s3Event.Records) {
      await processImage(record)
    }
  }
}


async function processImage(record: S3EventRecord) {
  const key = record.s3.object.key;
  console.log('Processing S3 item with key: ', key);
  console.log('Processing S3 : ', record.s3.object);

  
  const image = await Jimp.read(`https://${imagesBucketName}.s3.us-east-1.amazonaws.com/${key}`);

  console.log('Resizing image');
  image.resize(150, Jimp.AUTO);
  const convertedBuffer = await image.getBufferAsync(Jimp.AUTO);

  console.log(`Writing image back to S3 bucket: ${thumbnailBucketName}`);
  await s3.send(new PutObjectCommand({
    Bucket: thumbnailBucketName,
    Key: `${key}.jpeg`,
    Body: convertedBuffer
  }));
}


export const main = middyfy(resizeImage);
