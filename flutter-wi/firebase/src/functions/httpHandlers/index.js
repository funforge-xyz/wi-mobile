/* eslint-disable  import/prefer-default-export */
import * as functions from 'firebase-functions';
import restApiHandler from './restApiHandler';

const httpApiFunction = functions
  .region('europe-west1')
  .https.onRequest(restApiHandler);

export default {
  httpApiFunction,
};
