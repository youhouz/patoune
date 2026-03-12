import { useWindowDimensions } from 'react-native';

/**
 * Responsive breakpoints and helpers.
 * Smartphone : width < 600
 * Tablet     : width >= 600
 * Large tab  : width >= 900
 */
const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 600;
  const isLargeTablet = width >= 900;
  const isLandscape = width > height;

  // Content max-width for centered layouts on tablet
  const contentWidth = isLargeTablet ? 720 : isTablet ? Math.min(width - 64, 600) : width;

  // Number of columns for grid layouts
  const numColumns = isLargeTablet ? 3 : isTablet ? 2 : 1;
  const numColumnsGrid = isLargeTablet ? 4 : isTablet ? 3 : 2;

  // Horizontal padding — more breathing room on tablet
  const hPadding = isTablet ? 32 : 16;

  // Font scale — slightly larger on tablet
  const fontScale = isLargeTablet ? 1.1 : isTablet ? 1.05 : 1;

  return {
    width,
    height,
    isTablet,
    isLargeTablet,
    isLandscape,
    contentWidth,
    numColumns,
    numColumnsGrid,
    hPadding,
    fontScale,
  };
};

export default useResponsive;
