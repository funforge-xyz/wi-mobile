import { View, TextInput, TouchableOpacity, Text, TextInputProps, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../config/constants';
import { styles } from '../styles/LoginStyles';

interface LoginInputProps extends TextInputProps {
  icon: string;
  placeholder: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export default function LoginInput({
  icon,
  placeholder,
  containerStyle,
  inputStyle,
  secureTextEntry,
  ...props
}: LoginInputProps) {
  return (
    <View style={[styles.inputContainer, containerStyle]}>
      <Ionicons name={icon as any} size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
      <TextInput
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        secureTextEntry={secureTextEntry}
        {...props}
      />
    </View>
  );
}