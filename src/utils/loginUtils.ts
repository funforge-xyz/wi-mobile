
export const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return 'auth.passwordTooShort';
  }
  if (!/[a-z]/.test(password)) {
    return 'auth.passwordMissingLowercase';
  }
  if (!/[A-Z]/.test(password)) {
    return 'auth.passwordMissingUppercase';
  }
  if (!/[0-9]/.test(password)) {
    return 'auth.passwordMissingNumber';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'auth.passwordMissingSpecialChar';
  }
  return null;
};

export const getErrorMessage = (error: any): string => {
  const errorCode = error.code;
  const errorMessage = error.message;

  // Handle custom email verification error
  if (errorMessage === 'email-not-verified') {
    return 'auth.emailNotVerified';
  }

  switch (errorCode) {
    case 'auth/user-not-found':
      return 'auth.userNotFound';
    case 'auth/wrong-password':
      return 'auth.wrongPassword';
    case 'auth/invalid-email':
      return 'auth.invalidEmail';
    case 'auth/user-disabled':
      return 'auth.userDisabled';
    case 'auth/too-many-requests':
      return 'auth.tooManyRequests';
    case 'auth/email-already-in-use':
      return 'auth.emailAlreadyInUse';
    case 'auth/weak-password':
      return 'auth.weakPassword';
    case 'auth/invalid-credential':
      return 'auth.invalidCredentials';
    default:
      return 'auth.unknownError';
  }
};
