
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
}

export default function LoginInput({
  icon,
  placeholder,
  containerStyle,
  inputStyle,
  secureTextEntry,
  ...props
}: LoginInputProps) {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);
  const styles = createLoginStyles(isDarkMode);

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      <View style={styles.input}>
        <Ionicons name={icon as any} size={20} style={styles.icon} />
        <TextInput
          style={[styles.textInput, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={styles.icon.color}
          secureTextEntry={secureTextEntry}
          {...props}
        />
      </View>
    </View>
  );
}
