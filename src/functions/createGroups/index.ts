import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'createGroups',
        cors: true,
        reqValidatorName: 'RequestBodyValidator', // validates only the event.body part recieved. Doesn't validate from lambda to db
        authorizer: 'rs256Auth0Authorizer'
        
      },
    },
  ],

  iamRoleStatements: [
    {
      Effect: "Allow",
      Action: [
        "dynamodb:PutItem",
      ],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GROUPS_TABLE}'
    }
  ],

  // deploymentSettings: {
  //   type: 'Linear10PercentEvery1Minute',
  //   alias: 'Live'
  // },



};
