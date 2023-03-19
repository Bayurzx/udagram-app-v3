import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  // env var local to sendUploadNotifications 
  events: [
    {
      sns: {
        arn: {
          'Fn::Join': [
            ':',
            [
              'arn:aws:sns',
              { Ref: 'AWS::Region' },
              { Ref: 'AWS::AccountId' },
              "${self:custom.topicName}",
            ],
          ],
        },
        topicName: "${self:custom.topicName}",
      },
    },
  ],

  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: [
        's3:PutObject',
      ],
      Resource: 'arn:aws:s3:::${self:provider.environment.THUMBNAILS_S3_BUCKET}/*'
    },
    {
      Effect: 'Allow',
      Action: [
        's3:GetObject'
      ],
      Resource: 'arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}/*'
    },

  ]


};
