import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      websocket: {
        route: '$disconnect'
      }
    }
  ],

  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: [
        'dynamodb:DeleteItem',
      ],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.CONNECTIONS_TABLE}'
    },
  ]


};
