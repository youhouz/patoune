import React, { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../utils/colors';

const SearchBar = ({
  value,
  onChangeText,
  placeholder = 'Rechercher...',
  onClear,
  style,
}) => {
  const [focused, setFocused] = useState(false);

  const handleFocus = useCallback(() => setFocused(true), []);
  const handleBlur = useCallback(() => setFocused(false), []);

  const handleClear = useCallback(() => {
    if (onClear) {
      onClear();
    } else if (onChangeText) {
      onChangeText('');
    }
  }, [onClear, onChangeText]);

  return (
    <View style={[styles.container, focused && styles.focused, style]}>
      <Feather
        name="search"
        size={16}
        color={focused ? COLORS.primary : COLORS.textTertiary}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        onFocus={handleFocus}
        onBlur={handleBlur}
        returnKeyType="search"
      />
      {value ? (
        <TouchableOpacity
          onPress={handleClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={14} color={COLORS.textTertiary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  focused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
    ...SHADOWS.md,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
  },
});

export default SearchBar;
