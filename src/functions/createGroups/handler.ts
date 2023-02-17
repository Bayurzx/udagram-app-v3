// import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
// import schema from './schema';
// import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const docClient = new DynamoDBClient({ region: "us-east-1" });

const TableName = process.env.GROUPS_TABLE || "udagram-dev"


const createGroups: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event:', event)
  //
  const itemId = uuidv4()
  const { name, age, email } = JSON.parse(event.body); // this works for postman only
  // const parsedBody = event // this works for lambda portal test
  const Item = {
    id: { S: itemId },
    name: { S: name },
    age: { N: age },
    email: { S: email },
  }

  const params = {
    TableName: TableName,
    Item: Item
  }
  // console.log("Item", Item);



  try {
    console.log("params", params);
    
    await docClient.send(new PutItemCommand(params));
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
