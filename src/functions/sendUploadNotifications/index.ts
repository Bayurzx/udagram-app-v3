import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  // env var local to sendUploadNotifications 
  environment: {
    STAGE: "${self:provider.stage}",
    API_ID: {
      Ref: "WebsocketsApi"
    }
  },
  // events: [
  //   {
  //     sns: {
  //       arn: {
  //         'Fn::Join': [
  //           ":",
  //           [
  //             "arn:aws:sns",
  //             {
  //               "Ref": "AWS::Region"
  //             },
  //             {
  //               "Ref": "AWS::AccountId"
  //             },
  //             "${self:custom.topicName}"
  //           ]
  //         ]
  //       },
  //       "topicName": "${self:custom.topicName}"
  //     }
  //   }
  // ]

};
