import { boot } from 'quasar/wrappers';
import { Amplify, Auth } from 'aws-amplify';
import awsconfig from '../config/amplify/config';

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot((/* { app, router, ... } */) => {
  // something to do
  Amplify.configure(awsconfig);
  Auth.configure(awsconfig);
});
