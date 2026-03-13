import React from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';

const ICON_FAMILIES = {
  feather: Feather,
  ionicons: Ionicons,
};

const Icon = ({
  name,
  size = 24,
  color = COLORS.charcoal,
  family = 'feather',
  style,
}) => {
  const IconComponent = ICON_FAMILIES[family] ?? Feather;

  return (
    <IconComponent
      name={name}
      size={size}
      color={color}
      style={style}
    />
  );
};

export default Icon;
