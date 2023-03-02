import type { AWS } from '@serverless/typescript';

import getGroups from '@functions/getGroups';
import createGroups from '@functions/createGroups';
import getImages from '@functions/getImages';
import getAnImage from '@functions/getAnImage';
import createImages from '@functions/createImages';
import SendUploadNotifications from '@functions/sendUploadNotifications';
import wss_connect from '@functions/wss_connect';
import wss_disconnect from '@functions/wss_disconnect';
import elasticSearchSync from '@functions/elasticSearchSync';
import resizeImage from '@functions/resizeImage';
import auth0Authorizer from '@functions/auth0Authorizer';


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
      IMAGE_ID_INDEX: "ImageIdIndex",
      IMAGES_S3_BUCKET: "serverless-udagram-s3",
      SIGNED_URL_EXP: '300',
      CONNECTIONS_TABLE: 'Connections-${self:provider.stage}',
      THUMBNAILS_S3_BUCKET: 'serverless-udagram-${self:provider.stage}-thumbnail',

    },
    stage: "${opt:stage, 'dev'}",
    region: 'us-east-1',

    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: [
          "dynamodb:Scan",
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          // "dynamodb:DescribeTable",
          // "dynamodb:Query",
          // "dynamodb:UpdateItem",
          // "dynamodb:DeleteItem",
        ],
        Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GROUPS_TABLE}"
      },

      {
        Effect: "Allow",
        Action: [
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:GetItem",
        ],
        Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}"
      },

      {
        Effect: "Allow",
        Action: [
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:GetItem",
        ],
        Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}/index/${self:provider.environment.IMAGE_ID_INDEX}"
      },
      {
        Effect: 'Allow',
        Action: [
          'dynamodb:Scan',
          'dynamodb:PutItem',
          'dynamodb:DeleteItem'
        ],
        Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.CONNECTIONS_TABLE}'
      },

      {
        Effect: 'Allow',
        Action: [
          's3:PutObject',
          's3:GetObject'
        ],
        Resource: 'arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}/*'
      },

      {
        Effect: 'Allow',
        Action: [
          's3:PutObject',
          's3:GetObject'
        ],
        Resource: 'arn:aws:s3:::${self:provider.environment.THUMBNAILS_S3_BUCKET}/*'
      },

    ]
  },
  // import the function via paths
  functions: { getGroups, createGroups, getImages, getAnImage, createImages, SendUploadNotifications, wss_connect, wss_disconnect, elasticSearchSync, resizeImage, auth0Authorizer },
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
            },
            {
              AttributeName: "imageId",
              AttributeType: "S"
            },
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

          StreamSpecification: {
            StreamViewType: "NEW_IMAGE"
          },

          TableName: "${self:provider.environment.IMAGES_TABLE}",

          GlobalSecondaryIndexes: [
            {
              IndexName: { "Fn::Sub": "${self:provider.environment.IMAGE_ID_INDEX}" },
              KeySchema: [
                {
                  AttributeName: "imageId",
                  KeyType: "HASH"
                }
              ],
              Projection: {
                ProjectionType: "ALL"
              }
            }
          ],

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
      },

      WebSocketConnectionsDynamoDBTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: 'id',
              AttributeType: 'S'
            }
          ],
          KeySchema: [
            {
              AttributeName: 'id',
              KeyType: 'HASH'
            }
          ],
          BillingMode: 'PAY_PER_REQUEST',
          TableName: '${self:provider.environment.CONNECTIONS_TABLE}'
        }
      },

      AttachmentsBucket: {
        Type: 'AWS::S3::Bucket',
        DependsOn: ['SNSTopicPolicy'],
        Properties: {
          BucketName: '${self:provider.environment.IMAGES_S3_BUCKET}',
          NotificationConfiguration: {
            TopicConfigurations: [
              {
                Event: 's3:ObjectCreated:Put',
                Topic: { Ref: 'ImagesTopic' }
              }
            ]
          },
          // NotificationConfiguration: {
          //   LambdaConfigurations: [{
          //     Event: 's3:ObjectCreated:*',
          //     Function: { 'Fn::GetAtt': ['SendUploadNotificationsLambdaFunction', 'Arn'] } // to get ARN string from cloudformation
          //   }]
          // },

          CorsConfiguration: {
            CorsRules: [
              {
                AllowedOrigins: ['*'],
                AllowedHeaders: ['*'],
                AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                MaxAge: 3000
              }
            ]
          }
        }
      },

      SendUploadNotificationsPermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
          FunctionName: { 'Ref': 'SendUploadNotificationsLambdaFunction' },
          Principal: 's3.amazonaws.com',
          Action: 'lambda:InvokeFunction',
          SourceAccount: { 'Ref': 'AWS::AccountId' },
          SourceArn: 'arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}'
        }
      },


      BucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
          PolicyDocument: {
            Id: 'MyPolicy',
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'PublicReadForGetBucketObjects',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: 'arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}/*'
              }
            ]
          },
          Bucket: { 'Ref': 'AttachmentsBucket' }
        }
      },

      ImagesSearch: {
        Type: 'AWS::Elasticsearch::Domain',
        Properties: {
          ElasticsearchVersion: '6.3',
          DomainName: 'images-search-${self:provider.stage}',
          ElasticsearchClusterConfig: {
            DedicatedMasterEnabled: false,
            InstanceCount: '1',
            ZoneAwarenessEnabled: false,
            InstanceType: 't2.small.elasticsearch'
          },
          EBSOptions: {
            EBSEnabled: true,
            Iops: 0,
            VolumeSize: 10,
            VolumeType: 'gp2'
          },
          AccessPolicies: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  AWS: '*'
                },
                Action: 'es:*',
                Resource: 'arn:aws:es:us-east-1:144249951028:domain/images-search-dev',
                Condition: {
                  IpAddress: {
                    "aws:SourceIp": ["102.89.0.0/16"] // my ip fluctuates so I am trying out a range instead
                  }
                }

              }
            ]
          }
        }
      },

      ThumbnailsBucket: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: "${self:provider.environment.THUMBNAILS_S3_BUCKET}"
        }
      },


      ImagesTopic: {
        Type: "AWS::SNS::Topic",
        Properties: {
          DisplayName: "Image bucket topic",
          // TopicName: { "Fn::GetAtt": ["CustomSettings", "topicName"] },
          TopicName: "${self:custom.topicName}"
        }
      },

      SNSTopicPolicy: {
        Type: "AWS::SNS::TopicPolicy",
        Properties: {
          PolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: {
                  AWS: "*"
                },
                Action: "sns:Publish",
                Resource: { Ref: "ImagesTopic" },
                Condition: {
                  ArnLike: {
                    "AWS:SourceArn": "arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}"
                  }
                }
              }
            ]
          },
          Topics: [{ Ref: "ImagesTopic" }]
        }
      },
      
      GatewayResponseDefault4XX: {
        Type: "AWS::ApiGateway::GatewayResponse",
        Properties: {
          ResponseParameters: {
            "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
            "gatewayresponse.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            "gatewayresponse.header.Access-Control-Allow-Methods": "'GET,OPTIONS,POST'"
          },
          ResponseType: "DEFAULT_4XX",
          RestApiId: {
            Ref: "ApiGatewayRestApi"
          }
        }
      }







    }
  },
  package: { individually: true },

  custom: {
    topicName: "imagesTopic-${self:provider.stage}",

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
        },
        {
          name: "ImageRequest",
          contentType: "application/json",
          schema: "${file(models/create-image-request.json)}"
        },
      ]
    }

  },
};

module.exports = serverlessConfiguration;
