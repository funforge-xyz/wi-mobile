import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../config/constants';

export default function DeleteAccountScreen() {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              // Add delete account logic here
              Alert.alert('Success', 'Account deleted successfully');
              navigation.navigate('Login' as never);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Delete Account</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.warningSection}>
          <Ionicons name="warning" size={48} color={COLORS.error} />
          <Text style={styles.warningTitle}>This action is permanent</Text>
          <Text style={styles.warningText}>
            Deleting your account will permanently remove all your data, including:
          </Text>

          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Your profile information</Text>
            <Text style={styles.listItem}>• All your posts and comments</Text>
            <Text style={styles.listItem}>• Your chat history</Text>
            <Text style={styles.listItem}>• Your connections and followers</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.deleteButtonText}>Delete My Account</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
  },
  warningSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  warningTitle: {
    fontSize: 20,
    fontFamily: FONTS.medium,
    color: COLORS.error,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  warningText: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  listContainer: {
    alignSelf: 'stretch',
  },
  listItem: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: SPACING.xl,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
});