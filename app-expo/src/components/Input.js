// ---------------------------------------------------------------------------
// Patoune v2.0 - Input Component
// Reusable text input with floating label, icon, focus animation,
// and error state. Terracotta focus ring, DM Sans typography.
// ---------------------------------------------------------------------------

import React, { useState, useRef, useEffect } from 'react';
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


/**
 * Reusable text input with label, icon, focus animation, and error state.
 *
 * @param {object}  props
 * @param {string}  [props.label]             - Label text above the input
 * @param {string}  [props.placeholder]       - Placeholder text
 * @param {string}  [props.value]             - Controlled value
 * @param {function} [props.onChangeText]     - Change handler
 * @param {string}  [props.icon]              - Feather icon name (left side)
 * @param {string}  [props.error]             - Error message (shows red border + message)
 * @param {boolean} [props.secureTextEntry]   - Password mode
 * @param {string}  [props.keyboardType]      - Keyboard type
 * @param {boolean} [props.multiline=false]   - Multiline / textarea mode
 * @param {boolean} [props.editable=true]     - Whether input is editable
 * @param {number}  [props.maxLength]         - Max character length
 * @param {string}  [props.autoCapitalize]    - Auto-capitalize setting
 * @param {function} [props.onFocus]          - Focus callback
 * @param {function} [props.onBlur]           - Blur callback
 * @param {object}  [props.style]             - Container style override
 * @param {object}  [props.inputStyle]        - TextInput style override
 */
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

  // Animated border color transition
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, focusAnim]);

  // Interpolate border color: rest -> focused (terracotta) or error (red)
  const borderColor = error
    ? COLORS.error
    : focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [COLORS.border, COLORS.primary],
      });

  // Interpolate subtle background shift on focus
  const backgroundColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.white, COLORS.primarySoft],
  });

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocusProp?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlurProp?.(e);
  };

  // Determine if we should show a password toggle
  const isPassword = secureTextEntry;
  const effectiveSecure = isPassword && !isPasswordVisible;

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
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

      {/* Input row */}
      <Animated.View
        style={[
          styles.inputWrapper,
          {
            borderColor,
            backgroundColor: error ? COLORS.errorSoft : backgroundColor,
          },
          multiline && styles.inputWrapperMultiline,
        ]}
      >
        {/* Left icon */}
        {icon ? (
          <Feather
            name={icon}
            size={18}
            color={
              error
                ? COLORS.error
                : isFocused
                ? COLORS.primary
                : COLORS.pebble
            }
            style={styles.iconLeft}
          />
        ) : null}

        {/* Text input */}
        <TextInput
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            isPassword && styles.inputWithToggle,
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

        {/* Password visibility toggle */}
        {isPassword ? (
          <Feather
            name={isPasswordVisible ? 'eye-off' : 'eye'}
            size={18}
            color={COLORS.pebble}
            style={styles.iconRight}
            onPress={() => setIsPasswordVisible((prev) => !prev)}
            suppressHighlighting
          />
        ) : null}
      </Animated.View>

      {/* Error message */}
      {error ? (
        <View style={styles.errorRow}>
          <Feather name="alert-circle" size={13} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};


// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.base,
  },

  // Label
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.stone,
    marginBottom: 6,
  },
  labelFocused: {
    color: COLORS.primary,
  },
  labelError: {
    color: COLORS.error,
  },

  // Input wrapper (the visible "box")
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.base,
    minHeight: 52,
  },
  inputWrapperMultiline: {
    alignItems: 'flex-start',
    minHeight: 100,
    paddingVertical: SPACING.md,
  },

  // Icons
  iconLeft: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
    padding: 4,
  },

  // TextInput itself
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: Platform.OS === 'web' ? 14 : 0,
  },
  inputWithIcon: {
    // Icon takes care of left spacing via its marginRight
  },
  inputWithToggle: {
    // Toggle icon takes care of right spacing via its marginLeft
  },
  inputMultiline: {
    paddingTop: Platform.OS === 'web' ? 0 : 4,
    minHeight: 80,
  },
  inputDisabled: {
    color: COLORS.pebble,
    opacity: 0.7,
  },

  // Error state
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.error,
  },
});

export default Input;
