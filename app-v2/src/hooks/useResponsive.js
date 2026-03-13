import { useWindowDimensions } from 'react-native';

const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 600;
  const isLargeTablet = width >= 900;
  const isLandscape = width > height;

  const contentWidth = isLargeTablet ? 720 : isTablet ? Math.min(width - 64, 600) : width;
  const numColumns = isLargeTablet ? 3 : isTablet ? 2 : 1;
  const numColumnsGrid = isLargeTablet ? 4 : isTablet ? 3 : 2;
  const hPadding = isTablet ? 32 : 16;
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
