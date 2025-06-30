
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, TextInputProps, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import { createLoginStyles } from '../styles/LoginStyles';
import { useAppSelector } from '../hooks/redux';

interface LoginInputProps extends TextInputProps {
  icon: string;
  placeholder: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  isPassword?: boolean;
}

export default function LoginInput({
  icon,
  placeholder,
  containerStyle,
  inputStyle,
  secureTextEntry,
  isPassword = false,
  ...props
}: LoginInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const styles = createLoginStyles(isDarkMode);

  const isSecure = isPassword ? !showPassword : secureTextEntry;

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      <View style={styles.input}>
        <Ionicons name={icon as any} size={20} style={styles.icon} />
        <TextInput
          style={[styles.textInput, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={styles.icon.color}
          secureTextEntry={isSecure}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.passwordToggle}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              style={styles.icon}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
