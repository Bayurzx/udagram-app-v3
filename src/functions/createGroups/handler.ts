import { middyfy } from '@libs/lambda';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { getUserId } from 'src/auth/utils';
import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { captureAWSv3Client } from "aws-xray-sdk";

const TableName = process.env.GROUPS_TABLE || "udagram-dev";

const xrayDynamoDBClient = captureAWSv3Client(new DynamoDBClient({ region: "us-east-1" }));

const createGroups: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event:', event)

  const itemId = uuidv4()
  const { name, description } = JSON.parse(event.body);
  const authorization = event.headers.Authorization
  const jwtToken = authorization.split(' ')[1]

  const Item = {
    id: { S: itemId },
    name: { S: name },
    description: { S: description },
    userId: { S: getUserId(jwtToken) },
    timestamp: { S: new Date().toISOString() }
  }

  const params = {
    TableName: TableName,
    Item: Item
  }

  try {
    console.log("params", params);

    await xrayDynamoDBClient.send(new PutItemCommand(params));
    console.log('Item inserted successfully', params.Item);

    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(params.Item)
    }
  } catch (error) {
    console.log("Error with insert:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Unable to insert Item: ${error}` }),
    };
  }
}

export const main = middyfy(createGroups);
