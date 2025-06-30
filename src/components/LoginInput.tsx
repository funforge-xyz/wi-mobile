import { useState } from 'react';
import { View, TextInput, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createLoginStyles } from '../styles/LoginStyles';
import { useAppSelector } from '../hooks/redux';
import { getTheme } from '../theme';

interface LoginInputProps {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  isPassword?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
  textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export default function LoginInput({
  icon,
  placeholder,
  value,
  onChangeText,
  isPassword = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
  textAlignVertical = 'center',
  containerStyle,
  inputStyle,
}: LoginInputProps) {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const currentTheme = getTheme(isDarkMode);
  const styles = createLoginStyles(isDarkMode);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      <View style={styles.inputWrapper}>
        <Ionicons 
          name={icon as any} 
          size={20} 
          color={currentTheme.textSecondary} 
          style={styles.inputIcon}
        />

        <TextInput
          style={[styles.textInput, inputStyle, { color: currentTheme.text }]}
          placeholder={placeholder}
          placeholderTextColor={currentTheme.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={textAlignVertical}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.passwordToggle}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={currentTheme.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}