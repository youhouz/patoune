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
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { scanProductAPI } from '../../api/products';
const { COLORS, SPACING, RADIUS, FONT_SIZE, SHADOWS } = require('../../utils/colors');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_FRAME_SIZE = SCREEN_WIDTH * 0.62;
const CORNER_SIZE = 28;
const CORNER_WIDTH = 3.5;
const TOP_PADDING = Platform.OS === 'ios' ? 58 : 48;

const ScannerScreen = ({ navigation }) => {
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
        <Text style={styles.permIcon}>📸</Text>
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
        style={styles.header}
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
            <Text style={styles.historyIcon}>📋</Text>
            <Text style={styles.historyText}>Historique</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Animated.View
        style={[
          styles.body,
          {
            opacity: fadeIn,
            transform: [{ translateY: slideUp }],
          },
        ]}
      >
        {/* Error toast */}
        {errorMessage !== '' && (
          <Animated.View style={[styles.errorToast, { opacity: errorOpacity }]}>
            <Text style={styles.errorToastIcon}>!</Text>
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
              <Text style={styles.toggleEmoji}>📷</Text>
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
              <Text style={styles.toggleEmoji}>⌨️</Text>
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
                <Text style={styles.inputIcon}>🔍</Text>
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
                      <Text style={styles.clearText}>✕</Text>
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
              {[
                { icon: '📱', label: 'Scannez', desc: 'le code-barres' },
                { icon: '✨', label: 'Decouvrez', desc: 'le score' },
                { icon: '🔬', label: 'Verifiez', desc: 'les ingredients' },
              ].map((step, index) => (
                <View key={index} style={styles.stepCard}>
                  <View
                    style={[
                      styles.stepIconCircle,
                      {
                        backgroundColor:
                          index === 0 ? COLORS.primarySoft
                            : index === 1 ? COLORS.secondarySoft
                              : COLORS.accentSoft,
                      },
                    ]}
                  >
                    <Text style={styles.stepIcon}>{step.icon}</Text>
                  </View>
                  <Text style={styles.stepLabel}>{step.label}</Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },

  // Header
  header: {
    paddingTop: TOP_PADDING,
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
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontWeight: '500',
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
  historyIcon: {
    fontSize: 16,
  },
  historyText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
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
  errorToastIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: COLORS.white,
    overflow: 'hidden',
  },
  errorToastText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
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
    fontWeight: '600',
    textAlign: 'center',
  },
  scanSubHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 3,
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,107,53,0.3)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
  },
  scanningText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
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
    backgroundColor: 'rgba(255,107,53,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  permIcon: {
    fontSize: 36,
  },
  permTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
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
    fontWeight: '700',
  },
  permManualLink: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  permManualText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
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
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
  },
  manualTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  manualSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
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
  toggleEmoji: {
    fontSize: 16,
  },
  toggleText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textTertiary,
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
  inputIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    color: COLORS.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? SPACING.base : SPACING.md,
    fontWeight: '500',
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
  clearText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  barcodeLength: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    fontWeight: '500',
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
    fontWeight: '700',
  },

  // Info section
  infoSection: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    paddingBottom: SPACING['2xl'],
  },
  infoTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
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
  stepIcon: {
    fontSize: 20,
  },
  stepLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
    fontWeight: '500',
  },
});

export default ScannerScreen;
