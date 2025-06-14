
import { useAppDispatch, useAppSelector } from './redux';
import { addPost, UserPost } from '../store/userSlice';

export const usePostActions = () => {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.user);

  const addNewPost = (postData: Omit<UserPost, 'authorId' | 'authorName' | 'authorPhotoURL'>) => {
    if (!profile) return;

    const newPost: UserPost = {
      ...postData,
      authorId: profile.id,
      authorName: profile.firstName && profile.lastName 
        ? `${profile.firstName} ${profile.lastName}` 
        : 'You',
      authorPhotoURL: profile.thumbnailURL || profile.photoURL || '',
      createdAt: typeof postData.createdAt === 'string' ? postData.createdAt : new Date().toISOString(),
    };

    dispatch(addPost(newPost));
  };

  return {
    addNewPost,
  };
};
