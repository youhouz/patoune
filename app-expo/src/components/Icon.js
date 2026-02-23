// ---------------------------------------------------------------------------
// Patoune v2.0 - Icon Component
// Unified wrapper around Feather and Ionicons from @expo/vector-icons.
// Keeps icon usage consistent and makes swapping libraries trivial.
// ---------------------------------------------------------------------------

import React from 'react';
import { Feather, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';

/**
 * Universal icon component.
 *
 * @param {object} props
 * @param {string}  props.name          - Icon name (e.g. 'heart', 'search', 'chevron-right')
 * @param {number}  [props.size=24]     - Icon size in points
 * @param {string}  [props.color]       - Color override (defaults to COLORS.charcoal)
 * @param {'feather'|'ionicons'} [props.family='feather'] - Icon family to use
 * @param {object}  [props.style]       - Additional style overrides
 */
const Icon = ({
  name,
  size = 24,
  color = COLORS.charcoal,
  family = 'feather',
  style,
}) => {
  // Pick the right icon set based on family prop
  const IconComponent = family === 'ionicons' ? Ionicons : Feather;

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
