import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Animated,
  Platform,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scanProductAPI } from '../../api/products';
import { showAlert } from '../../utils/alert';
import { FONTS } from '../../utils/typography';
const { COLORS, SPACING, RADIUS, FONT_SIZE, SHADOWS } = require('../../utils/colors');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCAN_FRAME_SIZE = SCREEN_WIDTH * 0.58;
const CORNER_SIZE = 32;
const CORNER_WIDTH = 3;

const DEMO_PRODUCTS = [
  { barcode: '5425039484051', name: 'Poulet & Dinde', brand: 'Edgard Cooper', icon: 'heart', score: 85 },
  { barcode: '7613033831287', name: 'Friskies Light Chien', brand: 'Purina', icon: 'heart', score: 55 },
  { barcode: '5010394133852', name: 'Biscotti Multi Mix', brand: 'Pedigree', icon: 'heart', score: 40 },
  { barcode: '3222270550673', name: 'Mousselines Chat', brand: 'Gourmet', icon: 'gitlab', score: 60 },
  { barcode: '5998749108536', name: 'Friandises Saumon', brand: 'Whiskas', icon: 'gitlab', score: 35 },
  { barcode: '5998749117750', name: 'Catisfactions', brand: 'Catisfactions', icon: 'gitlab', score: 45 },
];

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ScannerScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Animations
  const cornerPulse = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const headerScale = useRef(new Animated.Value(0.95)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Demo card press scales
  const demoScales = useRef(DEMO_PRODUCTS.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    Animated.stagger(80, [
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.spring(slideUp, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cornerPulse, {
          toValue: 1.04,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(cornerPulse, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2400,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2400,
          useNativeDriver: true,
        }),
      ])
    );
    scanLoop.start();

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    shimmerLoop.start();

    return () => {
      pulseLoop.stop();
      scanLoop.stop();
      glowLoop.stop();
      shimmerLoop.stop();
    };
  }, []);

  const showError = (msg) => {
    setErrorMessage(msg);
    Animated.sequence([
      Animated.timing(errorOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(errorOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => setErrorMessage(''));
  };

  const triggerScanFlash = () => {
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleBarcodeScan = async (code) => {
    if (scanning) return;
    setScanning(true);
    setScanned(true);
    triggerScanFlash();

    try {
      Vibration.vibrate(50);
    } catch (_) {
      // Vibration not available
    }

    try {
      const response = await scanProductAPI(code);
      if (response.data && response.data.product) {
        navigation.navigate('ProductResult', { product: response.data.product });
      } else {
        showError('Reponse inattendue du serveur');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        if (Platform.OS === 'web') {
          showError('Produit non trouve dans notre base de donnees');
        } else {
          showAlert(
            'Produit non trouve',
            "Ce produit n'est pas encore dans notre base de donnees.",
            [{ text: 'OK' }]
          );
        }
      } else if (error.message === 'Network Error') {
        showError('Pas de connexion internet');
      } else {
        showError('Impossible de scanner ce produit');
      }
    } finally {
      setScanning(false);
      setTimeout(() => setScanned(false), 2500);
    }
  };

  const handleBarcodeScanned = ({ data }) => {
    if (!scanned) {
      handleBarcodeScan(data);
    }
  };

  const handleManualSearch = () => {
    const trimmed = barcode.trim();
    if (!trimmed) {
      showError('Veuillez entrer un code-barres');
      return;
    }
    if (!/^\d{8,14}$/.test(trimmed)) {
      showError('Le code-barres doit contenir entre 8 et 14 chiffres');
      return;
    }
    handleBarcodeScan(trimmed);
  };

  const onDemoPressIn = (index) => {
    Animated.spring(demoScales[index], {
      toValue: 0.93,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const onDemoPressOut = (index) => {
    Animated.spring(demoScales[index], {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_FRAME_SIZE - 4],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  // Loading permission state (skip on web — no camera permissions needed)
  if (!permission && Platform.OS !== 'web') {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Initialisation...</Text>
      </View>
    );
  }

  const renderPermissionRequest = () => (
    <View style={styles.permissionContainer}>
      <View style={styles.permIconCircle}>
        <LinearGradient
          colors={COLORS.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.permIconGradient}
        >
          <Feather name="camera" size={32} color={COLORS.white} />
        </LinearGradient>
      </View>
      <Text style={styles.permTitle}>Acces camera requis</Text>
      <Text style={styles.permDescription}>
        Pour scanner les codes-barres des produits, Pépète a besoin d'acceder a votre camera.
      </Text>
      <TouchableOpacity
        style={styles.permButton}
        onPress={requestPermission}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={COLORS.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.permButtonGradient}
        >
          <Feather name="unlock" size={16} color={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={styles.permButtonText}>Autoriser la camera</Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.permManualLink}
        onPress={() => setManualMode(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.permManualText}>Ou saisir un code manuellement</Text>
      </TouchableOpacity>
    </View>
  );

  const renderScanFrame = () => (
    <View style={styles.scanOverlay}>
      <View style={styles.overlayTop} />
      <View style={styles.overlayMiddleRow}>
        <View style={styles.overlaySide} />
        <View style={styles.scanFrameWrapper}>
          <Animated.View
            style={[
              styles.scanFrame,
              { transform: [{ scale: cornerPulse }] },
            ]}
          >
            {/* Glow behind corners */}
            <Animated.View
              style={[
                styles.cornerGlow,
                { opacity: glowOpacity },
              ]}
            />

            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanLineTranslate }] },
              ]}
            >
              <LinearGradient
                colors={['transparent', COLORS.primary + '60', COLORS.primary, COLORS.primary + '60', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scanLineGradient}
              />
              {/* Scan line glow */}
              <View style={styles.scanLineGlowWrap}>
                <LinearGradient
                  colors={['transparent', COLORS.primary + '20', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.scanLineGlowEffect}
                />
              </View>
            </Animated.View>
          </Animated.View>
        </View>
        <View style={styles.overlaySide} />
      </View>
      <View style={styles.overlayBottom}>
        {scanned ? (
          <View style={styles.scanningIndicator}>
            <View style={styles.scanningGlass}>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.scanningText}>Analyse en cours...</Text>
            </View>
          </View>
        ) : (
          <View style={styles.hintContainer}>
            <View style={styles.hintGlass}>
              <Feather name="maximize" size={14} color="rgba(255,255,255,0.8)" style={{ marginRight: 8 }} />
              <Text style={styles.scanHint}>Placez le code-barres dans le cadre</Text>
            </View>
            <Text style={styles.scanSubHint}>Detection automatique</Text>
          </View>
        )}
      </View>

      {/* Scan flash overlay */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: COLORS.white,
            opacity: flashAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.35],
            }),
          },
        ]}
      />
    </View>
  );

  const renderManualMode = () => (
    <View style={styles.manualModeContainer}>
      <LinearGradient
        colors={COLORS.gradientAccent}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.manualIconGradient}
      >
        <Text style={styles.manualIconText}>123</Text>
      </LinearGradient>
      <Text style={styles.manualTitle}>Saisie manuelle</Text>
      <Text style={styles.manualSubtitle}>
        Entrez le code-barres imprime sur l'emballage
      </Text>
    </View>
  );

  const STEP_ICONS = [
    { icon: 'smartphone', label: 'Scannez', desc: 'le code-barres', bg: COLORS.primarySoft, color: COLORS.primary },
    { icon: 'star', label: 'Decouvrez', desc: 'le score', bg: COLORS.secondarySoft, color: COLORS.secondary },
    { icon: 'search', label: 'Verifiez', desc: 'les ingredients', bg: COLORS.accentSoft, color: COLORS.accent },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Premium Header */}
      <LinearGradient
        colors={['#7B8B6F', '#8A9A7E', '#96A88A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + SPACING.md }]}
      >
        {/* Decorative shimmer overlay */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.headerShimmer,
            {
              opacity: 0.06,
              transform: [{
                translateX: shimmerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
                }),
              }],
            },
          ]}
        />
        <Animated.View style={[styles.headerContent, { transform: [{ scale: headerScale }] }]}>
          <View>
            <Text style={styles.headerTitle}>Scanner</Text>
            <Text style={styles.headerSubtitle}>Analysez un produit</Text>
          </View>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate('ScanHistory')}
            activeOpacity={0.8}
          >
            <View style={styles.historyButtonInner}>
              <Feather name="clock" size={15} color={COLORS.white} />
              <Text style={styles.historyText}>Historique</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>

      <Animated.ScrollView
        style={[
          styles.body,
          {
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentContainerStyle={{ paddingBottom: SPACING['3xl'] + 20 }}
      >
        {/* Error toast */}
        {errorMessage !== '' && (
          <Animated.View style={[styles.errorToast, { opacity: errorOpacity }]}>
            <LinearGradient
              colors={['#DC2626', '#EF4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.errorToastGradient}
            >
              <View style={styles.errorToastIconContainer}>
                <Feather name="alert-triangle" size={13} color={COLORS.white} />
              </View>
              <Text style={styles.errorToastText}>{errorMessage}</Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Camera / Manual zone */}
        <View style={styles.cameraContainer}>
          <View style={styles.cameraArea}>
            {/* Subtle border glow */}
            <View style={styles.cameraBorderGlow} />
            {!manualMode && permission?.granted ? (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                barcodeScannerSettings={{
                  barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              >
                {renderScanFrame()}
              </CameraView>
            ) : !manualMode && !permission?.granted ? (
              renderPermissionRequest()
            ) : (
              renderManualMode()
            )}
          </View>
        </View>

        {/* Mode toggle */}
        <View style={styles.toggleSection}>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                !manualMode && styles.toggleOptionActive,
              ]}
              onPress={() => setManualMode(false)}
              activeOpacity={0.7}
            >
              {!manualMode && (
                <LinearGradient
                  colors={[COLORS.primarySoft, '#FFF0E8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <Feather name="camera" size={16} color={!manualMode ? COLORS.primary : COLORS.stone} />
              <Text
                style={[
                  styles.toggleText,
                  !manualMode && styles.toggleTextActive,
                ]}
              >
                Camera
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                manualMode && styles.toggleOptionActive,
              ]}
              onPress={() => setManualMode(true)}
              activeOpacity={0.7}
            >
              {manualMode && (
                <LinearGradient
                  colors={[COLORS.primarySoft, '#FFF0E8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <Feather name="edit-3" size={16} color={manualMode ? COLORS.primary : COLORS.stone} />
              <Text
                style={[
                  styles.toggleText,
                  manualMode && styles.toggleTextActive,
                ]}
              >
                Manuel
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Manual input section */}
        {manualMode && (
          <View style={styles.manualInputSection}>
            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconWrap}>
                  <Feather name="hash" size={16} color={COLORS.primary} />
                </View>
                <TextInput
                  style={styles.input}
                  value={barcode}
                  onChangeText={(text) => setBarcode(text.replace(/[^0-9]/g, ''))}
                  placeholder="Ex: 3017620422003"
                  placeholderTextColor={COLORS.placeholder}
                  keyboardType="numeric"
                  returnKeyType="search"
                  onSubmitEditing={handleManualSearch}
                  maxLength={14}
                />
                {barcode.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setBarcode('')}
                    style={styles.clearButton}
                    activeOpacity={0.7}
                  >
                    <View style={styles.clearCircle}>
                      <Feather name="x" size={11} color={COLORS.stone} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
              {barcode.length > 0 && (
                <Text style={styles.barcodeLength}>{barcode.length}/14 chiffres</Text>
              )}
              <TouchableOpacity
                style={[
                  styles.searchButton,
                  scanning && styles.searchButtonDisabled,
                ]}
                onPress={handleManualSearch}
                disabled={scanning}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={scanning ? [COLORS.textLight, COLORS.textLight] : ['#7B8B6F', '#96A88A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.searchButtonGradient}
                >
                  {scanning ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <Feather name="search" size={18} color={COLORS.white} style={{ marginRight: 8 }} />
                      <Text style={styles.searchButtonText}>Rechercher</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* How it works - Premium step cards */}
        {!manualMode && (
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Comment ca marche ?</Text>
            <View style={styles.stepsRow}>
              {STEP_ICONS.map((step, index) => (
                <View key={index} style={styles.stepCard}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  </View>
                  <View
                    style={[
                      styles.stepIconCircle,
                      { backgroundColor: step.bg },
                    ]}
                  >
                    <Feather name={step.icon} size={20} color={step.color} />
                  </View>
                  <Text style={styles.stepLabel}>{step.label}</Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Demo products for quick testing - Premium cards */}
        <View style={styles.demoSection}>
          <View style={styles.demoHeader}>
            <View>
              <Text style={styles.demoTitle}>Produits demo</Text>
              <Text style={styles.demoSubtitle}>Appuyez pour tester le scanner</Text>
            </View>
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>{DEMO_PRODUCTS.length}</Text>
            </View>
          </View>
          <View style={styles.demoGrid}>
            {DEMO_PRODUCTS.map((item, index) => (
              <AnimatedTouchable
                key={item.barcode}
                style={[
                  styles.demoCard,
                  { transform: [{ scale: demoScales[index] }] },
                ]}
                onPress={() => handleBarcodeScan(item.barcode)}
                onPressIn={() => onDemoPressIn(index)}
                onPressOut={() => onDemoPressOut(index)}
                disabled={scanning}
                activeOpacity={1}
              >
                <View style={[
                  styles.demoScoreRing,
                  {
                    borderColor: item.score >= 70 ? COLORS.scoreExcellent + '40'
                      : item.score >= 40 ? COLORS.scoreMediocre + '40'
                      : COLORS.scoreVeryBad + '40',
                  }
                ]}>
                  <View style={[
                    styles.demoIconCircle,
                    {
                      backgroundColor: item.score >= 70 ? COLORS.successSoft
                        : item.score >= 40 ? COLORS.warningSoft
                        : COLORS.errorSoft,
                    }
                  ]}>
                    <Feather
                      name={item.icon}
                      size={16}
                      color={item.score >= 70 ? COLORS.success : item.score >= 40 ? COLORS.warning : COLORS.error}
                    />
                  </View>
                </View>
                <Text style={styles.demoName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.demoBrand} numberOfLines={1}>{item.brand}</Text>
                <View style={[
                  styles.demoScoreBadge,
                  {
                    backgroundColor: item.score >= 70 ? COLORS.successSoft
                      : item.score >= 40 ? COLORS.warningSoft
                      : COLORS.errorSoft,
                  }
                ]}>
                  <Text style={[
                    styles.demoScoreText,
                    {
                      color: item.score >= 70 ? COLORS.success
                        : item.score >= 40 ? COLORS.warning
                        : COLORS.error,
                    }
                  ]}>
                    {item.score}/100
                  </Text>
                </View>
              </AnimatedTouchable>
            ))}
          </View>
        </View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.pebble,
    fontFamily: FONTS.bodyMedium,
  },

  // Header — Premium
  header: {
    paddingBottom: SPACING.lg + 4,
    paddingHorizontal: SPACING.xl,
    borderBottomLeftRadius: RADIUS['3xl'],
    borderBottomRightRadius: RADIUS['3xl'],
    overflow: 'hidden',
  },
  headerShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH * 0.6,
    height: '100%',
    backgroundColor: COLORS.white,
    transform: [{ skewX: '-20deg' }],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE['3xl'],
    fontFamily: FONTS.heading,
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 3,
    fontFamily: FONTS.bodyMedium,
    letterSpacing: 0.2,
  },
  historyButton: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  historyButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: SPACING.md + 2,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.xl,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  historyText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
  },

  // Body
  body: {
    flex: 1,
  },

  // Error toast — Premium glass
  errorToast: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.sm,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  errorToastGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md + 2,
    gap: SPACING.sm,
  },
  errorToastIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorToastText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.white,
  },

  // Camera — Premium container
  cameraContainer: {
    paddingHorizontal: SPACING.xl,
    marginTop: -SPACING.md,
  },
  cameraArea: {
    height: SCREEN_WIDTH * 0.82,
    borderRadius: RADIUS['3xl'],
    overflow: 'hidden',
    backgroundColor: '#080A14',
    ...SHADOWS.xl,
  },
  cameraBorderGlow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: RADIUS['3xl'] + 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.15)',
    zIndex: -1,
  },

  // Scan overlay — Premium
  scanOverlay: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayMiddleRow: {
    flexDirection: 'row',
    height: SCAN_FRAME_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanFrameWrapper: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
  },
  cornerGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '25',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.sm,
  },
  hintContainer: {
    alignItems: 'center',
    gap: 6,
  },
  hintGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm + 1,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  scanHint: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    textAlign: 'center',
  },
  scanSubHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scanningIndicator: {
    alignItems: 'center',
  },
  scanningGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 107, 53, 0.25)',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  scanningText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
  },

  // Corner styles — Premium refined
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: COLORS.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: RADIUS.lg,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: RADIUS.lg,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: RADIUS.lg,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: RADIUS.lg,
  },
  scanLine: {
    position: 'absolute',
    left: CORNER_WIDTH + 4,
    right: CORNER_WIDTH + 4,
    height: 2,
    top: 0,
  },
  scanLineGradient: {
    flex: 1,
    borderRadius: 1,
  },
  scanLineGlowWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -12,
    height: 26,
  },
  scanLineGlowEffect: {
    flex: 1,
  },

  // Permission request — Premium
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
  },
  permIconCircle: {
    marginBottom: SPACING.lg,
    borderRadius: 44,
    ...SHADOWS.glow(COLORS.primary),
  },
  permIconGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permTitle: {
    fontSize: FONT_SIZE.xl,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  permDescription: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    fontFamily: FONTS.body,
  },
  permButton: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.glow(COLORS.primary),
  },
  permButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.xl,
  },
  permButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.heading,
  },
  permManualLink: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  permManualText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodyMedium,
    textDecorationLine: 'underline',
  },

  // Manual mode display — Premium
  manualModeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
  },
  manualIconGradient: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.glow(COLORS.accent),
  },
  manualIconText: {
    fontSize: FONT_SIZE.xl,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    letterSpacing: 1,
  },
  manualTitle: {
    fontSize: FONT_SIZE.xl,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginBottom: 6,
  },
  manualSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.55)',
    fontFamily: FONTS.bodyMedium,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    lineHeight: 20,
  },

  // Mode toggle — Premium pill
  toggleSection: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xs + 1,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.xl,
    gap: 7,
    overflow: 'hidden',
  },
  toggleOptionActive: {
    ...SHADOWS.sm,
  },
  toggleOptionDisabled: {
    opacity: 0.5,
  },
  toggleText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.stone,
  },
  toggleTextActive: {
    color: COLORS.primary,
    fontFamily: FONTS.heading,
  },

  // Manual input — Premium
  manualInputSection: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
  },
  inputWrapper: {
    gap: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.base,
    paddingVertical: Platform.OS === 'ios' ? 2 : 0,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  inputIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: COLORS.charcoal,
    paddingVertical: Platform.OS === 'ios' ? SPACING.base : SPACING.md,
    fontFamily: FONTS.bodyMedium,
    letterSpacing: 2,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  clearCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeLength: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.pebble,
    fontFamily: FONTS.bodyMedium,
    textAlign: 'right',
    paddingRight: SPACING.xs,
  },
  searchButton: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginTop: SPACING.xs,
    ...SHADOWS.glow(COLORS.primary),
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonGradient: {
    flexDirection: 'row',
    paddingVertical: SPACING.base + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.xl,
  },
  searchButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.heading,
    letterSpacing: 0.3,
  },

  // Info section — Premium
  infoSection: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING['2xl'],
    paddingBottom: SPACING.lg,
  },
  infoTitle: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
    marginBottom: SPACING.base,
    letterSpacing: -0.2,
  },
  stepsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  stepCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    alignItems: 'center',
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  stepNumberBadge: {
    position: 'absolute',
    top: -8,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
    zIndex: 1,
  },
  stepNumber: {
    fontSize: 10,
    fontFamily: FONTS.heading,
    color: COLORS.white,
  },
  stepIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm + 2,
  },
  stepLabel: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
    marginBottom: 3,
  },
  stepDesc: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.stone,
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: FONTS.bodyMedium,
  },

  // Demo products section — Premium
  demoSection: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
  },
  demoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  demoTitle: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
    letterSpacing: -0.2,
  },
  demoSubtitle: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.stone,
    marginTop: 2,
  },
  demoBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.heading,
    color: COLORS.primary,
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  demoCard: {
    width: (SCREEN_WIDTH - SPACING.xl * 2 - SPACING.md * 2) / 3,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  demoScoreRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  demoIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoName: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.charcoal,
    textAlign: 'center',
    marginBottom: 3,
  },
  demoBrand: {
    fontSize: 10,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.pebble,
    marginBottom: SPACING.sm,
  },
  demoScoreBadge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.full,
  },
  demoScoreText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.heading,
    letterSpacing: 0.3,
  },
});

export default ScannerScreen;
