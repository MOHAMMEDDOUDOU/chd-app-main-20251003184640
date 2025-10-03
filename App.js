import { I18nManager, Text, TextInput, View, Platform } from 'react-native';

// Enforce RTL before the app renders anything
try {
  if (!I18nManager.isRTL) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
  }
} catch (e) {
  // no-op
}

// Global defaults to stabilize text rendering and prevent input jitter
try {
  // Enforce RTL at the container level too
  View.defaultProps = View.defaultProps || {};
  const baseContainerStyle = { direction: 'rtl' };
  View.defaultProps.style = [baseContainerStyle, View.defaultProps.style].filter(Boolean);

  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.allowFontScaling = false;
  Text.defaultProps.maxFontSizeMultiplier = 1;
  const baseTextStyle = { writingDirection: 'rtl', textAlign: 'right' };
  Text.defaultProps.style = [baseTextStyle, Text.defaultProps.style].filter(Boolean);

  TextInput.defaultProps = TextInput.defaultProps || {};
  TextInput.defaultProps.allowFontScaling = false;
  TextInput.defaultProps.maxFontSizeMultiplier = 1;
  const baseInputStyle = { writingDirection: 'rtl', textAlign: 'right' };
  const androidFixes = Platform.OS === 'android' ? { includeFontPadding: false } : {};
  TextInput.defaultProps.style = [baseInputStyle, androidFixes, TextInput.defaultProps.style].filter(Boolean);
} catch (_) {
  // no-op
}

import 'expo-router/entry';