import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
const colors = require('../utils/colors');
const { RADIUS, SHADOWS } = require('../utils/colors');

const SearchBar = ({ value, onChangeText, placeholder = 'Rechercher...', onClear, style }) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[
      styles.container,
      focused && styles.focused,
      style,
    ]}>
      <Feather name="search" size={16} color={focused ? colors.primary : colors.textTertiary} style={{ marginRight: 10 }} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType="search"
      />
      {value ? (
        <TouchableOpacity
          onPress={() => {
            if (onClear) onClear();
            else if (onChangeText) onChangeText('');
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="x" size={14} color={colors.textTertiary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...SHADOWS.sm,
  },
  focused: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    ...SHADOWS.md,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
});

export default SearchBar;
