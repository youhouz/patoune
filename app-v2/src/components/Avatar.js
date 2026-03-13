import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../utils/colors';
import { FONTS } from '../utils/typography';

const SIZE_MAP = {
  sm: { diameter: 36, fontSize: 14, badgeSize: 14, badgeIcon: 8, onlineSize: 10, borderWidth: 2 },
  md: { diameter: 48, fontSize: 17, badgeSize: 18, badgeIcon: 10, onlineSize: 12, borderWidth: 2 },
  lg: { diameter: 72, fontSize: 24, badgeSize: 22, badgeIcon: 12, onlineSize: 14, borderWidth: 3 },
  xl: { diameter: 96, fontSize: 32, badgeSize: 26, badgeIcon: 14, onlineSize: 16, borderWidth: 3 },
};

const GRADIENT_PALETTE = [
  ['#C4704B', '#D4896A'],
  ['#6B8F71', '#8BAF8F'],
  ['#C4A35A', '#D4B97A'],
  ['#5A7EA0', '#7A9EBF'],
  ['#A85A38', '#C4704B'],
  ['#4A7050', '#6B8F71'],
  ['#8C6B4A', '#A88B6A'],
  ['#7A5A6A', '#9A7A8A'],
];

const getGradientForChar = (char) => {
  const code = (char || 'A').toUpperCase().charCodeAt(0);
  return GRADIENT_PALETTE[code % GRADIENT_PALETTE.length];
};

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const Avatar = ({ name = '', size = 'md', imageUri, verified = false, online = false, style }) => {
  const config = SIZE_MAP[size] || SIZE_MAP.md;
  const initials = useMemo(() => getInitials(name), [name]);
  const gradient = useMemo(() => getGradientForChar(name.charAt(0)), [name]);

  const containerSize = {
    width: config.diameter,
    height: config.diameter,
    borderRadius: config.diameter / 2,
  };

  return (
    <View style={[styles.wrapper, containerSize, style]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={[styles.image, containerSize]} accessibilityLabel={name || 'Avatar'} />
      ) : (
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.gradient, containerSize]}>
          <Text style={[styles.initials, { fontSize: config.fontSize }]} accessibilityLabel={name || 'Avatar'}>
            {initials}
          </Text>
        </LinearGradient>
      )}

      {online ? (
        <View style={[styles.onlineDot, {
          width: config.onlineSize, height: config.onlineSize,
          borderRadius: config.onlineSize / 2, borderWidth: config.borderWidth,
          bottom: 0, right: 0,
        }]} />
      ) : null}

      {verified && !online ? (
        <View style={[styles.verifiedBadge, {
          width: config.badgeSize, height: config.badgeSize,
          borderRadius: config.badgeSize / 2, borderWidth: config.borderWidth,
          bottom: -1, right: -1,
        }]}>
          <Feather name="check" size={config.badgeIcon} color={COLORS.white} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { position: 'relative', overflow: 'visible' },
  image: { resizeMode: 'cover' },
  gradient: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: FONTS.bodySemiBold, color: COLORS.white, letterSpacing: 0.5 },
  onlineDot: { position: 'absolute', backgroundColor: COLORS.success, borderColor: COLORS.white },
  verifiedBadge: { position: 'absolute', backgroundColor: COLORS.success, borderColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
});

export default Avatar;
