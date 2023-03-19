import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'createImage/{groupId}',
        cors: true,
        reqValidatorName: 'RequestBodyValidator', // validates only the event.body part recieved. Doesn't validate from lambda to db
        authorizer: 'rs256Auth0Authorizer'
        // documentation: {
        //   summary: 'Create a new image',
        //   description: 'Create a new image',
        //   requestModels: {
        //     'application/json': 'ImageRequest'
        //   }
        // },


      },
    },
  ],

  iamRoleStatements: [
    {
      Effect: "Allow",
      Action: [
        "dynamodb:PutItem"
      ],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}'
    },
    {
      Effect: "Allow",
      Action: [
        "dynamodb:GetItem"
      ],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GROUPS_TABLE}'
    }
  ]
};
