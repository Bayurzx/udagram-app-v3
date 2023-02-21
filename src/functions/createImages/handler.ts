// import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
// import schema from './schema';
// import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import 'source-map-support/register'
const { DynamoDBClient, GetItemCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const docClient = new DynamoDBClient({ region: "us-east-1" });
const s3Client = new S3Client({ region: 'us-east-1' });


const groupsTable = process.env.GROUPS_TABLE || "udagram-dev"
const imagesTable = process.env.IMAGES_TABLE || "udagram-dev-image"
const bucketName = process.env.IMAGES_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXP


const createImage: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Calling event:', event)

  const groupId = event.pathParameters.groupId;
  const validGroupId = await groupExist(groupId)
  console.log("validGroupId", validGroupId);

  // quickly fail if no groupId
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

  const imageId = uuidv4()
  const newItem = await _createImage(groupId, imageId, event)
  console.log('_createImage newItem', newItem);

  const url = await getUploadUrl(imageId)
  console.log("url", url);
  

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      newItem: newItem,
      uploadUrl: url
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
  console.log("event.body", JSON.parse(event.body))
  const { title } = JSON.parse(event.body)

  const newItem = {
    groupId: { S: groupId },
    timestamp: { S: timestamp },
    imageId: { S: imageId },
    // ...newImage,
    title: { S: title },
    imageUrl: { S: `https://${bucketName}.s3.amazonaws.com/${imageId}` }
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

// const getUploadUrl = async (imageId) => { 

//   // Set up the command to get the S3 object
//   const getObjectCommand = new GetObjectCommand({ Bucket: bucketName, Key: imageId });

//   // Get the signed URL with expiration
//   const signedUrl = await getSignedUrl(s3Client, getObjectCommand, { expiresIn: urlExpiration });

//   return signedUrl;

//  }

// const getUploadUrl = async (imageId: string): Promise<string> => {
//   const signedUrl = await s3Client.getSignedUrlPromise(
//     new PutObjectCommand({
//       Bucket: bucketName, // replace with your bucket name
//       Key: imageId,
//       ContentType: 'image/*',
//       Expires: urlExpiration,
//     })
//   );

//   return signedUrl;
// }

async function getUploadUrl(imageId: string) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: imageId,
    ContentType: "image/*",
  });

  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: urlExpiration, // URL expires after 5 minutes
  });

  return signedUrl;
}


export const main = middyfy(createImage);
