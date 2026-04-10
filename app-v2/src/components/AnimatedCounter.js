import React, { useEffect, useRef, useState } from 'react';
import { Text, Animated, Easing } from 'react-native';

/**
 * Smoothly counts from old value to new value whenever `value` changes.
 * Useful for live stats that update in real-time.
 */
const AnimatedCounter = ({ value, style, duration = 900, format }) => {
  const anim = useRef(new Animated.Value(value || 0)).current;
  const [displayValue, setDisplayValue] = useState(value || 0);
  const prevValue = useRef(value || 0);

  useEffect(() => {
    if (value === undefined || value === null) return;
    if (value === prevValue.current) return;

    const listenerId = anim.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    Animated.timing(anim, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      prevValue.current = value;
    });

    return () => {
      anim.removeListener(listenerId);
    };
  }, [value, duration]);

  const formatted = format ? format(displayValue) : displayValue.toLocaleString('fr-FR');
  return <Text style={style}>{formatted}</Text>;
};

export default AnimatedCounter;
