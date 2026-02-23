import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
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
import { FONTS } from '../../utils/typography';
const { COLORS, SPACING, RADIUS, FONT_SIZE, SHADOWS } = require('../../utils/colors');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_FRAME_SIZE = SCREEN_WIDTH * 0.62;
const CORNER_SIZE = 28;
const CORNER_WIDTH = 3.5;

const DEMO_PRODUCTS = [
  { barcode: '8710255130002', name: 'Orijen Original', brand: 'Orijen', icon: 'heart', score: 95 },
  { barcode: '3017620422003', name: 'Royal Canin Maxi', brand: 'Royal Canin', icon: 'heart', score: 62 },
  { barcode: '3564700266236', name: 'Pedigree Vital', brand: 'Pedigree', icon: 'heart', score: 31 },
  { barcode: '4260215761024', name: 'Applaws Chat', brand: 'Applaws', icon: 'gitlab', score: 93 },
  { barcode: '5410340620007', name: 'Whiskas Poisson', brand: 'Whiskas', icon: 'gitlab', score: 22 },
  { barcode: '4047059414422', name: 'Kong Classic M', brand: 'Kong', icon: 'gift', score: 92 },
];

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
  const slideUp = useRef(new Animated.Value(30)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(cornerPulse, {
          toValue: 1.06,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(cornerPulse, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2800,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2800,
          useNativeDriver: true,
        }),
      ])
    );
    scanLoop.start();

    return () => {
      pulseLoop.stop();
      scanLoop.stop();
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
        Alert.alert(
          'Produit non trouve',
          "Ce produit n'est pas encore dans notre base de donnees. Voulez-vous contribuer en l'ajoutant ?",
          [
            { text: 'Non merci', style: 'cancel' },
            {
              text: 'Contribuer',
              onPress: () => {
                // TODO: navigate to add product screen
              },
            },
          ]
        );
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

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_FRAME_SIZE - 4],
  });

  // Loading permission state
  if (!permission) {
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
        <Feather name="camera" size={36} color={COLORS.primary} />
      </View>
      <Text style={styles.permTitle}>Acces camera requis</Text>
      <Text style={styles.permDescription}>
        Pour scanner les codes-barres des produits, Patoune a besoin d'acceder a votre camera.
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
                colors={['transparent', COLORS.primary + '90', COLORS.primary, COLORS.primary + '90', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scanLineGradient}
              />
            </Animated.View>
          </Animated.View>
        </View>
        <View style={styles.overlaySide} />
      </View>
      <View style={styles.overlayBottom}>
        {scanned ? (
          <View style={styles.scanningIndicator}>
            <ActivityIndicator size="small" color={COLORS.white} />
            <Text style={styles.scanningText}>Analyse en cours...</Text>
          </View>
        ) : (
          <View style={styles.hintContainer}>
            <Text style={styles.scanHint}>Placez le code-barres dans le cadre</Text>
            <Text style={styles.scanSubHint}>La detection est automatique</Text>
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

      {/* Header */}
      <LinearGradient
        colors={COLORS.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + SPACING.md }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Scanner</Text>
            <Text style={styles.headerSubtitle}>Analysez un produit</Text>
          </View>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate('ScanHistory')}
            activeOpacity={0.8}
          >
            <Feather name="clipboard" size={16} color={COLORS.white} />
            <Text style={styles.historyText}>Historique</Text>
          </TouchableOpacity>
        </View>
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
        contentContainerStyle={{ paddingBottom: SPACING['3xl'] }}
      >
        {/* Error toast */}
        {errorMessage !== '' && (
          <Animated.View style={[styles.errorToast, { opacity: errorOpacity }]}>
            <View style={styles.errorToastIconContainer}>
              <Feather name="alert-triangle" size={13} color={COLORS.white} />
            </View>
            <Text style={styles.errorToastText}>{errorMessage}</Text>
          </Animated.View>
        )}

        {/* Camera / Manual zone */}
        <View style={styles.cameraContainer}>
          <View style={styles.cameraArea}>
            {!manualMode && permission.granted ? (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                barcodeScannerSettings={{
                  barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
                }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              >
                {renderScanFrame()}
              </CameraView>
            ) : !manualMode && !permission.granted ? (
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
                <Feather name="search" size={18} color={COLORS.sand} style={{ marginRight: SPACING.sm }} />
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
                <Text style={styles.barcodeLength}>{barcode.length} chiffres</Text>
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
                  colors={scanning ? [COLORS.textLight, COLORS.textLight] : COLORS.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.searchButtonGradient}
                >
                  {scanning ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.searchButtonText}>Rechercher</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* How it works */}
        {!manualMode && (
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Comment ca marche ?</Text>
            <View style={styles.stepsRow}>
              {STEP_ICONS.map((step, index) => (
                <View key={index} style={styles.stepCard}>
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

        {/* Demo products for quick testing */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Produits demo</Text>
          <Text style={styles.demoSubtitle}>Appuyez pour tester le scanner</Text>
          <View style={styles.demoGrid}>
            {DEMO_PRODUCTS.map((item) => (
              <TouchableOpacity
                key={item.barcode}
                style={styles.demoCard}
                onPress={() => handleBarcodeScan(item.barcode)}
                disabled={scanning}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.demoIconCircle,
                  { backgroundColor: item.score >= 70 ? COLORS.successSoft : item.score >= 40 ? COLORS.warningSoft : COLORS.errorSoft }
                ]}>
                  <Feather
                    name={item.icon}
                    size={18}
                    color={item.score >= 70 ? COLORS.success : item.score >= 40 ? COLORS.warning : COLORS.error}
                  />
                </View>
                <Text style={styles.demoName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.demoBrand}>{item.brand}</Text>
                <View style={[
                  styles.demoScoreBadge,
                  { backgroundColor: item.score >= 70 ? COLORS.successSoft : item.score >= 40 ? COLORS.warningSoft : COLORS.errorSoft }
                ]}>
                  <Text style={[
                    styles.demoScoreText,
                    { color: item.score >= 70 ? COLORS.success : item.score >= 40 ? COLORS.warning : COLORS.error }
                  ]}>
                    {item.score}/100
                  </Text>
                </View>
              </TouchableOpacity>
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

  // Header
  header: {
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderBottomLeftRadius: RADIUS['2xl'],
    borderBottomRightRadius: RADIUS['2xl'],
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
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontFamily: FONTS.bodyMedium,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl,
    gap: 6,
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

  // Error toast
  errorToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  errorToastIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  errorToastText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.white,
  },

  // Camera
  cameraContainer: {
    paddingHorizontal: SPACING.xl,
    marginTop: -SPACING.md,
  },
  cameraArea: {
    height: SCREEN_WIDTH * 0.78,
    borderRadius: RADIUS['2xl'],
    overflow: 'hidden',
    backgroundColor: '#0D0F1A',
    ...SHADOWS.lg,
  },

  // Scan overlay
  scanOverlay: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlayMiddleRow: {
    flexDirection: 'row',
    height: SCAN_FRAME_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
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
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.sm,
  },
  hintContainer: {
    alignItems: 'center',
  },
  scanHint: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    textAlign: 'center',
  },
  scanSubHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    textAlign: 'center',
    marginTop: 3,
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(196,112,75,0.3)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
  },
  scanningText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
  },

  // Corner styles
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
    borderTopLeftRadius: RADIUS.md,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: RADIUS.md,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: RADIUS.md,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: RADIUS.md,
  },
  scanLine: {
    position: 'absolute',
    left: CORNER_WIDTH + 2,
    right: CORNER_WIDTH + 2,
    height: 2,
    top: 0,
  },
  scanLineGradient: {
    flex: 1,
    borderRadius: 1,
  },

  // Permission request
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
  },
  permIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(196,112,75,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
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
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  permButtonGradient: {
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.lg,
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

  // Manual mode display
  manualModeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
  },
  manualIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
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
    marginBottom: 4,
  },
  manualSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.55)',
    fontFamily: FONTS.bodyMedium,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    lineHeight: 19,
  },

  // Mode toggle
  toggleSection: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.base,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xs,
    ...SHADOWS.md,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: 6,
  },
  toggleOptionActive: {
    backgroundColor: COLORS.primarySoft,
  },
  toggleText: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.stone,
  },
  toggleTextActive: {
    color: COLORS.primary,
  },

  // Manual input
  manualInputSection: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.base,
  },
  inputWrapper: {
    gap: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: COLORS.charcoal,
    paddingVertical: Platform.OS === 'ios' ? SPACING.base : SPACING.md,
    fontFamily: FONTS.bodyMedium,
    letterSpacing: 1.5,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  clearCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.border,
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
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginTop: SPACING.xs,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonGradient: {
    paddingVertical: SPACING.base,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
  },
  searchButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.heading,
  },

  // Info section
  infoSection: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    paddingBottom: SPACING['2xl'],
  },
  infoTitle: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
    marginBottom: SPACING.base,
  },
  stepsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  stepCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  stepIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  stepLabel: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.stone,
    textAlign: 'center',
    lineHeight: 15,
    fontFamily: FONTS.bodyMedium,
  },

  // Demo products section
  demoSection: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
  },
  demoTitle: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
    marginBottom: SPACING.xs,
  },
  demoSubtitle: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.stone,
    marginBottom: SPACING.base,
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  demoCard: {
    width: (SCREEN_WIDTH - SPACING.xl * 2 - SPACING.md * 2) / 3,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  demoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  demoName: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.charcoal,
    textAlign: 'center',
    marginBottom: 2,
  },
  demoBrand: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.pebble,
    marginBottom: SPACING.sm,
  },
  demoScoreBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  demoScoreText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.heading,
  },
});

export default ScannerScreen;
