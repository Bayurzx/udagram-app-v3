import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { DynamoDBClient, ScanCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { XRay } from '@aws-sdk/client-xray';
import { Group } from '../models/Group';


export class GroupAccess {

  constructor(
    private readonly docClient = new DynamoDBClient({ region: "us-east-1" }),
    private readonly groupsTable: string = process.env.GROUPS_TABLE
  ) { }

  async getAllGroups() {
    console.log('Getting all groups');
    const result = await this.docClient.send(new ScanCommand({ TableName: this.groupsTable }))

    const items = result.Items || [];
    return items;
  }

  async createGroup(group): Promise<Group> {
    console.log(`Creating a group with id ${group.id}`);
    await this.docClient.send(new PutItemCommand({
      TableName: this.groupsTable,
      Item: group,
    }));

    return group;
  }
}
