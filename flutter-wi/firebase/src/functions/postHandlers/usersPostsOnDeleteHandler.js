import { logger } from 'firebase-functions';
import ServiceFactory from '../../web/services/serviceFactory';
import firestore from '../../firestore';

const postsOnDeleteHandler = async (snap, context) => {
  logger.info(`Deleting posts with id: ${context.params.postId}`);

  const postId = context.params.postId;

  try {
    // Delete all comments and their replies
    const commentsRef = firestore.db
      .collection('posts')
      .doc(postId)
      .collection('comments');
    
    const commentsSnapshot = await commentsRef.get();
    
    for (const commentDoc of commentsSnapshot.docs) {
      // Delete all replies for this comment
      const repliesRef = commentDoc.ref.collection('replies');
      const repliesSnapshot = await repliesRef.get();
      
      for (const replyDoc of repliesSnapshot.docs) {
        await replyDoc.ref.delete();
        logger.info(`Deleted reply ${replyDoc.id} from comment ${commentDoc.id}`);
      }
      
      // Delete the comment itself
      await commentDoc.ref.delete();
      logger.info(`Deleted comment ${commentDoc.id}`);
    }

    // Delete all likes
    const likesRef = firestore.db
      .collection('posts')
      .doc(postId)
      .collection('likes');
    
    const likesSnapshot = await likesRef.get();
    
    for (const likeDoc of likesSnapshot.docs) {
      await likeDoc.ref.delete();
      logger.info(`Deleted like ${likeDoc.id}`);
    }

    // Delete all notifications related to this post
    const notificationsRef = firestore.db.collection('notifications');
    
    // Query for notifications with postId in data field
    const postNotificationsQuery = notificationsRef.where('data.postId', '==', postId);
    const postNotificationsSnapshot = await postNotificationsQuery.get();
    
    for (const notificationDoc of postNotificationsSnapshot.docs) {
      await notificationDoc.ref.delete();
      logger.info(`Deleted notification ${notificationDoc.id} for post ${postId}`);
    }
    
    // Query for notifications with direct postId field
    const directPostNotificationsQuery = notificationsRef.where('postId', '==', postId);
    const directPostNotificationsSnapshot = await directPostNotificationsQuery.get();
    
    for (const notificationDoc of directPostNotificationsSnapshot.docs) {
      await notificationDoc.ref.delete();
      logger.info(`Deleted notification ${notificationDoc.id} for post ${postId}`);
    }

    logger.info(`Cleaned up all subcollections and ${postNotificationsSnapshot.size + directPostNotificationsSnapshot.size} notifications for post ${postId}`);

    // Sync with external database
    const factory = new ServiceFactory('rdb', context);
    await factory.getPostsService()
      .deletePostsByExternalId(context.params.postId);

  } catch (error) {
    logger.error(`Error cleaning up subcollections for post ${postId}:`, error);
    throw error;
  }
};

export default postsOnDeleteHandler;
