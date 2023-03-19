import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'get',
        path: 'getAnImage/{groupId}',
        cors: true
      },
    },
  ],

  iamRoleStatements: [
    {
      Effect: "Allow",
      Action: [
        "dynamodb:Query"
      ],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}'
    },
    {
      Effect: "Allow",
      Action: [
        "dynamodb:Query",
      ],
      Resource: "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}/index/${self:provider.environment.IMAGE_ID_INDEX}"
    },
  ]

};
