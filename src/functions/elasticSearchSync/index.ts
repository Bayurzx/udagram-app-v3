import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  // environment: {
  //   ES_ENDPOINT: '${self:custom.esEndpoint}',
  // },
  events: [
    {
      stream: {
        type: 'dynamodb',
        arn: { 'Fn::GetAtt': ['ImagesDynamoDBTable', 'StreamArn'] },
      },
    },
  ],

};



