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
        authorizer: 'auth0Authorizer'
        
      },
    },
  ],
};
