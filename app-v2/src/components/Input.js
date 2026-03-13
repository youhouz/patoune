import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../utils/colors';
import { FONTS } from '../utils/typography';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  editable = true,
  maxLength,
  autoCapitalize = 'none',
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  style,
  inputStyle,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isFocused, focusAnim]);

  const borderColor = error
    ? COLORS.error
    : focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.border, COLORS.primary],
      });

  const backgroundColor = error
    ? COLORS.errorSoft
    : focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.background, COLORS.white],
      });

  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    onFocusProp?.(e);
  }, [onFocusProp]);

  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    onBlurProp?.(e);
  }, [onBlurProp]);

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((prev) => !prev);
  }, []);

  const effectiveSecure = secureTextEntry && !isPasswordVisible;

  const iconColor = error
    ? COLORS.error
    : isFocused
      ? COLORS.primary
      : COLORS.placeholder;

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text
          style={[
            styles.label,
            isFocused && styles.labelFocused,
            error && styles.labelError,
          ]}
        >
          {label}
        </Text>
      ) : null}

      <Animated.View
        style={[
          styles.inputWrapper,
          {
            borderColor,
            backgroundColor,
            shadowColor: isFocused ? COLORS.primary : 'transparent',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isFocused ? 0.15 : 0,
            shadowRadius: 10,
            elevation: isFocused ? 4 : 0,
          },
          multiline && styles.inputWrapperMultiline,
        ]}
      >
        {icon ? (
          <Feather
            name={icon}
            size={18}
            color={iconColor}
            style={styles.iconLeft}
          />
        ) : null}

        <TextInput
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            secureTextEntry && styles.inputWithToggle,
            multiline && styles.inputMultiline,
            !editable && styles.inputDisabled,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          secureTextEntry={effectiveSecure}
          keyboardType={keyboardType}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          editable={editable}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={COLORS.primary}
          {...rest}
        />

        {secureTextEntry ? (
          <Feather
            name={isPasswordVisible ? 'eye-off' : 'eye'}
            size={18}
            color={COLORS.placeholder}
            style={styles.iconRight}
            onPress={togglePasswordVisibility}
            suppressHighlighting
          />
        ) : null}
      </Animated.View>

      {error ? (
        <View style={styles.errorRow}>
          <Feather name="alert-circle" size={13} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  labelFocused: {
    color: COLORS.primary,
  },
  labelError: {
    color: COLORS.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    minHeight: 56,
  },
  inputWrapperMultiline: {
    alignItems: 'flex-start',
    minHeight: 120,
    paddingVertical: SPACING.md,
  },
  iconLeft: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
    padding: 6,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: Platform.OS === 'web' ? 14 : 0,
  },
  inputWithIcon: {},
  inputWithToggle: {},
  inputMultiline: {
    paddingTop: Platform.OS === 'web' ? 0 : 6,
    minHeight: 100,
  },
  inputDisabled: {
    color: COLORS.pebble,
    opacity: 0.6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.error,
  },
});

export default Input;
