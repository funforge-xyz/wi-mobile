import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NearbyUser } from '../utils/nearbyUtils';
import AvatarImage from './AvatarImage';
import { styles } from '../styles/NearbyStyles';

interface NearbyUserItemProps {
  user: NearbyUser;
  currentTheme: any;
  onPress: (user: NearbyUser) => void;
  isLastItem?: boolean;
  navigation?: any;
}

// Assuming COLORS is defined somewhere, e.g., in styles/colors.ts
const COLORS = {
  primary: '#FA4169', // Updated color
  success: 'green', // Example color
};

export default function NearbyUserItem({
  user,
  currentTheme,
  onPress,
  isLastItem = false,
  navigation,
}: NearbyUserItemProps) {

  const handleProfilePress = () => {
    if (navigation && user.id) {
      navigation.navigate('UserProfile', {
        userId: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        photoURL: user.photoURL || '',
        bio: user.bio || '',
      });
    }
  };
  return (
    <View
      style={[
        isLastItem ? styles.userItemLast : styles.userItem,
        { borderBottomColor: currentTheme.border }
      ]}
    >
      <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.7} style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          {user.photoURL ? (
            <AvatarImage 
              source={{ 
                uri: user.photoURL,
                cache: 'reload'
              }} 
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: currentTheme.border }]}>
              <Ionicons name="person" size={24} color={currentTheme.textSecondary} />
            </View>
          )}
          {/* {user.isOnline === true && <View style={[styles.onlineIndicator, { borderColor: currentTheme.surface }]} />} */}
        </View>
        
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: currentTheme.text }]}>
            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Anonymous User'}
            {user.isSameNetwork && (
              <Text style={{ color: COLORS.primary }}>
                {' 📶'}
              </Text>
            )}
          </Text>
          {user.isSameNetwork && (
            <Text style={[styles.userBio, { color: currentTheme.textSecondary }]}>
              Same Network
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => onPress(user)} activeOpacity={0.7} style={styles.chatSection}>
        <Ionicons name="chevron-forward" size={20} color={currentTheme.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}