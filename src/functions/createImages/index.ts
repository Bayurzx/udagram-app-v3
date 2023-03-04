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
};
