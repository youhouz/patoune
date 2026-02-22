import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
const colors = require('../utils/colors');

const SearchBar = ({ value, onChangeText, placeholder = 'Rechercher...' }) => (
  <View style={styles.container}>
    <Text style={styles.icon}>&#128269;</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.placeholder}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    marginRight: 8,
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
});

export default SearchBar;
