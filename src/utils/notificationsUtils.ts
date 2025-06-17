
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getFirestore } from '../services/firebase';

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'nearby_request';
  title: string;
  body: string;
  postId?: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhotoURL: string;
  createdAt: Date;
  read: boolean;
}

export const loadNotifications = async (currentUser: any): Promise<Notification[]> => {
  if (!currentUser) {
    return [];
  }

  const firestore = getFirestore();
  const notificationsQuery = query(
    collection(firestore, 'notifications'),
    where('targetUserId', '==', currentUser.uid)
  );

  const notificationsSnapshot = await getDocs(notificationsQuery);
  const notificationsData: Notification[] = [];

  notificationsSnapshot.forEach((doc) => {
    const data = doc.data();
    notificationsData.push({
      id: doc.id,
      type: data.type,
      title: data.title,
      body: data.body,
      postId: data.postId,
      fromUserId: data.fromUserId,
      fromUserName: data.fromUserName,
      fromUserPhotoURL: data.fromUserPhotoURL || '',
      createdAt: data.createdAt?.toDate() || new Date(),
      read: data.read || false,
    });
  });

  // Sort client-side by createdAt descending
  notificationsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return notificationsData;
};

export const markAsRead = async (notificationId: string): Promise<void> => {
  const firestore = getFirestore();
  const notificationRef = doc(firestore, 'notifications', notificationId);
  await updateDoc(notificationRef, { read: true });
};

export const markAllAsRead = async (notifications: Notification[]): Promise<void> => {
  const firestore = getFirestore();
  const unreadNotifications = notifications.filter(n => !n.read);

  const updatePromises = unreadNotifications.map(notification => {
    const notificationRef = doc(firestore, 'notifications', notification.id);
    return updateDoc(notificationRef, { read: true });
  });

  await Promise.all(updatePromises);
};

export const formatTimeAgo = (date: Date, t: any) => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 0) {
    return t('time.daysAgo', { count: diffInDays });
  } else if (diffInHours > 0) {
    return t('time.hoursAgo', { count: diffInHours });
  } else if (diffInMinutes > 0) {
    return t('time.minutesAgo', { count: diffInMinutes });
  } else {
    return t('time.justNow');
  }
};
