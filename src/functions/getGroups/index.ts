import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'get',
        path: 'getGroups',
      },
    },
  ],

  iamRoleStatements: [
    {
      Effect: "Allow",
      Action: [
        'dynamodb:Scan',
      ],
      Resource: 'arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GROUPS_TABLE}'
    }
  ]

};
