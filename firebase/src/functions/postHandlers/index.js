import * as functions from 'firebase-functions';
import usersPostsCreationHandler from './usersPostsCreationHandler';
import usersPostsOnDeleteHandler from './usersPostsOnDeleteHandler';

const syncOnPostCreateFunction = functions
  .region('europe-west1')
  .firestore.document('/posts/{postId}')
  .onCreate(usersPostsCreationHandler);

const syncOnPostDeleteFunction = functions
  .region('europe-west1')
  .firestore.document('/posts/{postId}')
  .onDelete(usersPostsOnDeleteHandler);


export default {
  syncOnPostCreateFunction,
  syncOnPostDeleteFunction,
};
