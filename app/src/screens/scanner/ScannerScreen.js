import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { scanProductAPI } from '../../api/products';
const colors = require('../../utils/colors');

const ScannerScreen = ({ navigation }) => {
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  // Note: CameraKit sera utilisé quand le projet sera buildé
  // Pour le moment, on utilise la saisie manuelle comme fallback
  const handleBarcodeScan = async (code) => {
    if (scanning) return;
    setScanning(true);

    try {
      const response = await scanProductAPI(code);
      navigation.navigate('ProductResult', { product: response.data.product });
    } catch (error) {
      if (error.response?.status === 404) {
        Alert.alert(
          'Produit non trouve',
          'Ce produit n\'est pas encore dans notre base. Voulez-vous le contribuer ?',
          [
            { text: 'Non', style: 'cancel' },
            { text: 'Oui', onPress: () => {/* TODO: navigate to add product */} }
          ]
        );
      } else {
        Alert.alert('Erreur', 'Impossible de scanner ce produit');
      }
    } finally {
      setScanning(false);
    }
  };

  const handleManualSearch = () => {
    if (!barcode.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un code-barres');
      return;
    }
    handleBarcodeScan(barcode.trim());
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Scanner un produit</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ScanHistory')}>
          <Text style={styles.historyLink}>Historique</Text>
        </TouchableOpacity>
      </View>

      {/* Zone Camera / Scanner */}
      <View style={styles.cameraArea}>
        {!manualMode ? (
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraIcon}>📷</Text>
            <Text style={styles.cameraText}>
              Pointez la camera vers le code-barres du produit
            </Text>
            <Text style={styles.cameraSubtext}>
              (La camera sera activee apres le build natif)
            </Text>

            {/* Cadre de scan visuel */}
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
          </View>
        ) : null}
      </View>

      {/* Saisie manuelle */}
      <View style={styles.manualSection}>
        <TouchableOpacity
          style={styles.modeToggle}
          onPress={() => setManualMode(!manualMode)}
        >
          <Text style={styles.modeToggleText}>
            {manualMode ? 'Utiliser la camera' : 'Saisie manuelle'}
          </Text>
        </TouchableOpacity>

        {manualMode && (
          <View style={styles.manualInput}>
            <TextInput
              style={styles.input}
              value={barcode}
              onChangeText={setBarcode}
              placeholder="Entrez le code-barres..."
              placeholderTextColor={colors.placeholder}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleManualSearch}
              disabled={scanning}
            >
              <Text style={styles.searchButtonText}>
                {scanning ? '...' : 'Chercher'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Comment ca marche ?</Text>
        <View style={styles.infoStep}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepText}>Scannez le code-barres du produit</Text>
        </View>
        <View style={styles.infoStep}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepText}>Decouvrez le score Yaka (0-100)</Text>
        </View>
        <View style={styles.infoStep}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepText}>Verifiez les ingredients et additifs</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  historyLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  cameraArea: {
    height: 220,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  cameraText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  cameraSubtext: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
  },
  scanFrame: {
    position: 'absolute',
    width: 200,
    height: 120,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.primary,
  },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth: 3, borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth: 3, borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: 3, borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: 3, borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  manualSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  modeToggle: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  modeToggleText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  manualInput: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
    fontWeight: '700',
    marginRight: 12,
  },
  stepText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default ScannerScreen;
