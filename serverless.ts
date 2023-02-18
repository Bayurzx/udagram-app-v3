import type { AWS } from '@serverless/typescript';

import getGroups from '@functions/getGroups';
import createGroups from '@functions/createGroups';
import getImages from '@functions/getImages';

const serverlessConfiguration: AWS = {
  service: 'udagram-app',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', "serverless-reqvalidator-plugin", "serverless-aws-documentation"],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      GROUPS_TABLE: "udagram-${self:provider.stage}",
      IMAGES_TABLE: "udagram-${self:provider.stage}-image",
    },
    stage: "${opt:stage, 'dev'}",
    region: 'us-east-1',

    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: [
          "dynamodb:Scan",
          "dynamodb:PutItem",
          "dynamodb:DescribeTable",
          "dynamodb:Query",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
        ],
        Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GROUPS_TABLE}"
      }
    ]
  },
  // import the function via paths
  functions: { getGroups, createGroups, getImages },
  resources: {
    Resources: {
      RequestBodyValidator: {
        Type: 'AWS::ApiGateway::RequestValidator',
        Properties: {
          Name: 'request-body-validator',
          RestApiId: { Ref: 'ApiGatewayRestApi' },
          ValidateRequestBody: true,
          ValidateRequestParameters: false
        }
      },

      ImagesDynamoDBTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "groupId",
              AttributeType: "S"
            },
            {
              AttributeName: "timestamp",
              AttributeType: "S"
            }
          ],
          KeySchema: [
            {
              AttributeName: "groupId",
              KeyType: "HASH"
            },
            {
              AttributeName: "timestamp",
              KeyType: "RANGE"
            }
          ],
          BillingMode: "PAY_PER_REQUEST",
          TableName: "${self:provider.environment.IMAGES_TABLE}"
        }
      },


      GroupsDynamoDBTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S"
            }
          ],
          KeySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH"
            }
          ],
          BillingMode: "PAY_PER_REQUEST",
          TableName: "${self:provider.environment.GROUPS_TABLE}"
        }
      }

    }
  },
  package: { individually: true },
  
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
    
    documentation: {
      api: {
        info: {
          version: "v1.0.0",
          title: "Udagram API",
          description: "Serverless application for images sharing"
        }
      },
      models: [
        {
          name: "GroupRequest",
          contentType: "application/json",
          schema: "${file(models/create-group-request.json)}"
        }
      ]
    }

  },
};

module.exports = serverlessConfiguration;
