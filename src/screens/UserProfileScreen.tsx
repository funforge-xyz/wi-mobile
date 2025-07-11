import { useState, useEffect } from 'react';
import { ScrollView, ActivityIndicator, View, Text, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../config/constants';
import { useAppSelector } from '../hooks/redux';
import BlockUserConfirmationModal from '../components/BlockUserConfirmationModal';
import BlockUserSuccessModal from '../components/BlockUserSuccessModal';
import DeleteConnectionConfirmModal from '../components/DeleteConnectionConfirmModal';
import DeleteConnectionSuccessModal from '../components/DeleteConnectionSuccessModal';
import UserProfileHeader from '../components/UserProfileHeader';
import UserProfileDisplay from '../components/UserProfileDisplay';
import UserProfileActions from '../components/UserProfileActions';
import ProfileSkeleton from '../components/ProfileSkeleton';
import { useTranslation } from 'react-i18next';
import { styles } from '../styles/UserProfileStyles';
import { getTheme } from '../theme';
import { 
  loadUserProfileData, 
  handleBlockUserAction, 
  checkIfUserIsBlocked,
  UserProfile
} from '../utils/userProfileUtils';



interface UserProfileProps {
  route: {
    params: {
      userId: string;
      firstName?: string;
      lastName?: string;
      photoURL?: string;
      bio?: string;
    };
  };
  navigation: any;
}

export default function UserProfileScreen({ route, navigation }: UserProfileProps) {
  const { userId, firstName = '', lastName = '', photoURL = '', bio = '' } = route.params;
  const [profile, setProfile] = useState<UserProfile>({
    id: userId,
    firstName,
    lastName,
    email: '',
    photoURL,
    bio,
    postsCount: 0,
    connectionsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteConnectionModal, setShowDeleteConnectionModal] = useState(false);
  const [showDeleteConnectionSuccessModal, setShowDeleteConnectionSuccessModal] = useState(false);
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const { t } = useTranslation();
  const currentTheme = getTheme(isDarkMode);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const { getAuth, getFirestore } = await import('../services/firebase');
      const { collection, query, where, getDocs } = await import('firebase/firestore');

      const auth = getAuth();
      const firestore = getFirestore();
      const currentUser = auth.currentUser;

      if (!currentUser) return false;

      const connectionsRef = collection(firestore, 'connections');
      const connectionQuery = query(
        connectionsRef,
        where('participants', 'array-contains', currentUser.uid)
      );

      const snapshot = await getDocs(connectionQuery);
      const connections = snapshot.docs.map(doc => doc.data());

      // Check if there's any connection with the target user (not just active ones)
      return connections.some(connection => 
        connection.participants.includes(userId)
      );
    } catch (error) {
      console.error('Error checking connection status:', error);
      return false;
    }
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      // Check if user is blocked first
      const blocked = await checkIfUserIsBlocked(userId);
      setIsUserBlocked(blocked);

      if (!blocked) {
        // Check connection status
        const connected = await checkConnectionStatus();
        setIsConnected(connected);

        const profileData = await loadUserProfileData(
          userId, 
          { firstName, lastName, photoURL, bio },
          t
        );

        if (profileData) {
          setProfile(profileData);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Temporarily commented out block user functionality
  // const handleBlockUser = () => {
  //   console.log('handleBlockUser called - opening modal');
  //   setShowBlockModal(true);
  // };

  // const confirmBlockConnection = async () => {
  //   console.log('confirmBlockConnection called!');
  //   try {
  //     const { getAuth, getFirestore } = await import('../services/firebase');
  //     const { addDoc, collection, serverTimestamp, query, where, getDocs, updateDoc, doc, deleteDoc } = await import('firebase/firestore');

  //     const auth = getAuth();
  //     const firestore = getFirestore();
  //     const currentUser = auth.currentUser;

  //     if (!currentUser) {
  //       console.error('No authenticated user');
  //       setShowBlockModal(false);
  //       return;
  //     }

  //     console.log('Blocking user:', profile.id);

  //     // Add to blocked users collection
  //     const blockDoc = await addDoc(collection(firestore, 'blockedUsers'), {
  //       blockedBy: currentUser.uid,
  //       blockedUser: profile.id,
  //       blockedAt: serverTimestamp(),
  //       reason: 'blocked_by_user'
  //     });

  //     console.log('Block document created:', blockDoc.id);

  //     // Find and update any existing connection to blocked status
  //     const connectionsRef = collection(firestore, 'connections');
  //     const connectionQuery = query(
  //       connectionsRef,
  //       where('participants', 'array-contains', currentUser.uid)
  //     );

  //     const snapshot = await getDocs(connectionQuery);
  //     const connectionToUpdate = snapshot.docs.find(doc => {
  //       const data = doc.data();
  //       return data.participants.includes(profile.id);
  //     });

  //     if (connectionToUpdate) {
  //       console.log('Updating connection to blocked status:', connectionToUpdate.id);
  //       await updateDoc(doc(firestore, 'connections', connectionToUpdate.id), {
  //         status: 'blocked',
  //         blockedBy: currentUser.uid,
  //         blockedAt: serverTimestamp()
  //       });
  //     }

  //     // Remove any pending connection requests
  //     const requestsRef = collection(firestore, 'connectionRequests');

  //     // Outgoing requests
  //     const outgoingQuery = query(
  //       requestsRef,
  //       where('fromUserId', '==', currentUser.uid),
  //       where('toUserId', '==', profile.id)
  //     );

  //     // Incoming requests
  //     const incomingQuery = query(
  //       requestsRef,
  //       where('fromUserId', '==', profile.id),
  //       where('toUserId', '==', currentUser.uid)
  //     );

  //     const [outgoingSnapshot, incomingSnapshot] = await Promise.all([
  //       getDocs(outgoingQuery),
  //       getDocs(incomingQuery)
  //     ]);

  //     // Delete all found requests
  //     const deletePromises = [
  //       ...outgoingSnapshot.docs.map(doc => deleteDoc(doc.ref)),
  //       ...incomingSnapshot.docs.map(doc => deleteDoc(doc.ref))
  //     ];

  //     await Promise.all(deletePromises);

  //     // Remove nearby_request notifications sent by current user to others
  //     const nearbyNotificationsQuery = query(
  //       collection(firestore, 'notifications'),
  //       where('fromUserId', '==', currentUser.uid),
  //       where('type', '==', 'nearby_request')
  //     );
  //     const nearbyNotificationsSnapshot = await getDocs(nearbyNotificationsQuery);

  //     const notificationDeletePromises = nearbyNotificationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
  //     await Promise.all(notificationDeletePromises);

  //     console.log('User blocked successfully');
  //     setShowBlockModal(false);
  //     setShowSuccessModal(true);
  //   } catch (error) {
  //     console.error('Error blocking user:', error);
  //     setShowBlockModal(false);
  //   }
  // };

  // const handleBlockSuccessClose = () => {
  //   setShowSuccessModal(false);
  //   // Navigate to NearbyScreen (People tab)
  //   navigation.navigate('Root', { 
  //     screen: 'People'
  //   });
  // };

  // const handleCancelBlock = () => {
  //   console.log('handleCancelBlock called - closing modal');
  //   setShowBlockModal(false);
  // };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  if (isUserBlocked) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <UserProfileHeader
          onBackPress={() => navigation.goBack()}
          currentTheme={currentTheme}
          styles={styles}
        />

        <View style={[styles.content, { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <Text style={[styles.blockedTitle, { color: currentTheme.text, fontSize: 24, fontWeight: 'bold', marginBottom: 10 }]}>
            {t('userProfile.userIsBlocked')}
          </Text>
          <Text style={[styles.blockedMessage, { color: currentTheme.textSecondary, textAlign: 'center', lineHeight: 20 }]}>
            {t('userProfile.cannotViewBlockedProfile')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Temporarily commented out delete connection functionality
  // const handleDeleteConnection = () => {
  //   setShowDeleteConnectionModal(true);
  // };

  // const confirmDeleteConnection = async () => {
  //   console.log('=== DELETE CONNECTION STARTED ===');
  //   console.log('Current user:', profile.id);
  //   console.log('Profile ID:', profile.id);
    
  //   try {
  //     const { getAuth, getFirestore } = await import('../services/firebase');
  //     const { collection, query, where, getDocs, deleteDoc, doc } = await import('firebase/firestore');
      
  //     const auth = getAuth();
  //     const firestore = getFirestore();
  //     const currentUser = auth.currentUser;

  //     if (!currentUser) {
  //       console.log('❌ No current user found');
  //       return;
  //     }

  //     console.log('✅ Current user:', currentUser.uid);
  //     console.log('✅ Target user:', profile.id);

  //     // Delete the connection
  //     const connectionsRef = collection(firestore, 'connections');
  //     const connectionsQuery = query(
  //       connectionsRef,
  //       where('participants', 'array-contains', currentUser.uid),
  //       where('status', '==', 'active')
  //     );

  //     console.log('🔍 Searching for connections...');
  //     const snapshot = await getDocs(connectionsQuery);
  //     console.log('📊 Found connections:', snapshot.size);

  //     const connectionToDelete = snapshot.docs.find(doc => {
  //       const data = doc.data();
  //       console.log('🔍 Checking connection:', doc.id, 'participants:', data.participants);
  //       const hasTargetUser = data.participants.includes(profile.id);
  //       console.log('✅ Has target user:', hasTargetUser);
  //       return hasTargetUser;
  //     });

  //     if (connectionToDelete) {
  //       console.log('🗑️ Deleting connection:', connectionToDelete.id);
  //       await deleteDoc(doc(firestore, 'connections', connectionToDelete.id));
  //       console.log('✅ Connection deleted successfully');
  //     } else {
  //       console.log('❌ No connection found to delete');
  //     }

  //     // Delete any connection requests between these users
  //     const requestsRef = collection(firestore, 'connectionRequests');
      
  //     // Check for requests from current user to other user
  //     const outgoingQuery = query(
  //       requestsRef,
  //       where('fromUserId', '==', currentUser.uid),
  //       where('toUserId', '==', profile.id)
  //     );
      
  //     // Check for requests from other user to current user
  //     const incomingQuery = query(
  //       requestsRef,
  //       where('fromUserId', '==', profile.id),
  //       where('toUserId', '==', currentUser.uid)
  //     );

  //     console.log('🔍 Searching for connection requests...');
  //     const [outgoingSnapshot, incomingSnapshot] = await Promise.all([
  //       getDocs(outgoingQuery),
  //       getDocs(incomingQuery)
  //     ]);

  //     console.log('📊 Outgoing requests:', outgoingSnapshot.size);
  //     console.log('📊 Incoming requests:', incomingSnapshot.size);

  //     // Delete all found requests
  //     const deletePromises = [
  //       ...outgoingSnapshot.docs.map(doc => {
  //         console.log('🗑️ Deleting outgoing request:', doc.id);
  //         return deleteDoc(doc.ref);
  //       }),
  //       ...incomingSnapshot.docs.map(doc => {
  //         console.log('🗑️ Deleting incoming request:', doc.id);
  //         return deleteDoc(doc.ref);
  //       })
  //     ];

  //     if (deletePromises.length > 0) {
  //       await Promise.all(deletePromises);
  //       console.log('✅ All connection requests deleted');
  //     } else {
  //       console.log('ℹ️ No connection requests to delete');
  //     }

  //     // Update local state
  //     console.log('🔄 Updating local state...');
  //     setIsConnected(false);
      
  //     setShowDeleteConnectionModal(false);
  //     setShowDeleteConnectionSuccessModal(true);
      
  //     console.log('✅ DELETE CONNECTION COMPLETED SUCCESSFULLY');
  //   } catch (error) {
  //     console.error('❌ Error deleting connection:', error);
  //     console.error('Error details:', {
  //       message: error.message,
  //       stack: error.stack,
  //       code: error.code
  //     });
  //     Alert.alert('Error', 'Failed to delete connection. Please try again.');
  //     setShowDeleteConnectionModal(false);
  //   }
  // };

  // const handleDeleteConnectionSuccessClose = () => {
  //   console.log('🔄 Handling delete connection success close');
  //   setShowDeleteConnectionSuccessModal(false);
    
  //   // Check if we can go back multiple steps
  //   if (navigation.canGoBack()) {
  //     console.log('✅ Navigating back to previous screen');
  //     navigation.goBack();
  //   } else {
  //     console.log('✅ Navigating to Chats screen');
  //     navigation.navigate('Root', { 
  //       screen: 'Chats'
  //     });
  //   }
  // };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <UserProfileHeader
        onBackPress={() => navigation.goBack()}
        currentTheme={currentTheme}
        styles={styles}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <UserProfileDisplay
          profile={profile}
          currentTheme={currentTheme}
          styles={styles}
        />

        <UserProfileActions
          key={`profile-actions-${isConnected}`}
          onConnect={() => {}}
          onMessage={() => {
            // Navigate to chat with this user
            navigation.navigate('Chat', {
              userId: profile.id,
              userName: `${profile.firstName} ${profile.lastName}`,
              userPhotoURL: profile.photoURL || ''
            });
          }}
          onBlock={() => {}} // Temporarily disabled
          onDeleteConnection={() => {}} // Temporarily disabled
          currentTheme={currentTheme}
          isConnected={isConnected}
          hasConnectionRequest={false}
          isBlocked={false}
          styles={styles}
          userName={`${profile.firstName} ${profile.lastName}`}
          navigation={navigation}
          disableInternalModals={true}
        />
      </ScrollView>

      {/* Temporarily commented out modals */}
      {/* <BlockUserConfirmationModal
        visible={showBlockModal}
        onConfirm={confirmBlockConnection}
        onCancel={() => {
          setShowBlockModal(false);
        }}
        userName={`${profile.firstName} ${profile.lastName}`}
        currentTheme={currentTheme}
      />

      <BlockUserSuccessModal
        visible={showSuccessModal}
        onClose={handleBlockSuccessClose}
        currentTheme={currentTheme}
      />

      <DeleteConnectionConfirmModal
        visible={showDeleteConnectionModal}
        onConfirm={confirmDeleteConnection}
        onCancel={() => setShowDeleteConnectionModal(false)}
        userName={`${profile.firstName} ${profile.lastName}`}
        currentTheme={currentTheme}
      />

      <DeleteConnectionSuccessModal
        visible={showDeleteConnectionSuccessModal}
        onClose={handleDeleteConnectionSuccessClose}
        currentTheme={currentTheme}
      /> */}
    </SafeAreaView>
  );
}