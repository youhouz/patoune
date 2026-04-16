// ---------------------------------------------------------------------------
// Carnet de sante numerique : vaccins, vermifuges, poids, traitements.
// Partageable avec un veterinaire via QR code / lien.
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Platform, Share, KeyboardAvoidingView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getHealthAPI, addVaccineAPI, addDewormingAPI, addWeightAPI,
  addTreatmentAPI, updateHealthInfoAPI, rotateShareTokenAPI,
} from '../../api/health';
import ScreenHeader from '../../components/ScreenHeader';
import { showAlert } from '../../utils/alert';
import { API_URL } from '../../api/client';
import colors, { SPACING, RADIUS } from '../../utils/colors';

const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '-';

const Section = ({ title, icon, children, onAdd }) => (
  <View style={s.section}>
    <View style={s.sectionHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Feather name={icon} size={16} color={colors.primary} />
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {onAdd ? (
        <TouchableOpacity onPress={onAdd} style={s.addBtn}>
          <Feather name="plus" size={14} color={colors.primary} />
          <Text style={s.addBtnText}>Ajouter</Text>
        </TouchableOpacity>
      ) : null}
    </View>
    {children}
  </View>
);

const HealthRecordScreen = () => {
  const nav = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const petId = route.params?.petId;

  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formType, setFormType] = useState(null); // 'vaccine' | 'deworming' | 'weight' | 'treatment' | 'info' | null
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getHealthAPI(petId);
      setHealth(res.data?.health);
    } catch (err) {
      showAlert('Erreur', 'Impossible de charger le carnet.');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submitForm = async () => {
    setSaving(true);
    try {
      if (formType === 'vaccine') {
        await addVaccineAPI(petId, {
          name: form.name,
          date: form.date || new Date().toISOString(),
          nextDue: form.nextDue || null,
          veterinarian: form.vet || '',
          notes: form.notes || '',
        });
      } else if (formType === 'deworming') {
        await addDewormingAPI(petId, {
          product: form.product,
          date: form.date || new Date().toISOString(),
          nextDue: form.nextDue || null,
          notes: form.notes || '',
        });
      } else if (formType === 'weight') {
        await addWeightAPI(petId, {
          weight: parseFloat(form.weight),
          notes: form.notes || '',
        });
      } else if (formType === 'treatment') {
        await addTreatmentAPI(petId, {
          name: form.name,
          type: form.type || '',
          startDate: form.startDate || new Date().toISOString(),
          endDate: form.endDate || null,
          dosage: form.dosage || '',
          prescribedBy: form.prescribedBy || '',
          notes: form.notes || '',
        });
      } else if (formType === 'info') {
        await updateHealthInfoAPI(petId, {
          microchip: form.microchip,
          allergies: (form.allergies || '').split(',').map(s => s.trim()).filter(Boolean),
          veterinarian: {
            name: form.vetName || '',
            phone: form.vetPhone || '',
            address: form.vetAddress || '',
            email: form.vetEmail || '',
          },
        });
      }
      setFormType(null); setForm({});
      load();
    } catch (err) {
      showAlert('Erreur', err.response?.data?.error || 'Sauvegarde impossible');
    } finally {
      setSaving(false);
    }
  };

  const share = async () => {
    if (!health?.healthShareToken) return;
    const base = API_URL.replace(/\/api$/, '');
    const url = `${base}/carnet/${health.healthShareToken}`;
    const message = `Carnet de sante de ${health.name} — accessible en lecture seule : ${url}`;
    try {
      if (Platform.OS === 'web' && navigator.share) {
        await navigator.share({ title: `Carnet de ${health.name}`, text: message, url });
      } else {
        await Share.share({ message, url });
      }
    } catch (_) {}
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} />;
  if (!health) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.container}>
        <ScreenHeader
          title={`Carnet de ${health.name}`}
          subtitle="Sante complete, partageable avec le veterinaire"
          onBack={() => nav.goBack()}
          variant="light"
        />
        <ScrollView contentContainerStyle={{ padding: SPACING.base, paddingBottom: insets.bottom + 120 }}>
          {/* Share card */}
          <TouchableOpacity style={s.shareCard} onPress={share} activeOpacity={0.85}>
            <View style={s.shareIcon}>
              <Feather name="share-2" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.shareTitle}>Partager avec mon veto</Text>
              <Text style={s.shareSub}>Un lien securise en lecture seule</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.primary} />
          </TouchableOpacity>

          {/* Infos generales */}
          <Section title="Informations" icon="info" onAdd={() => {
            setFormType('info');
            setForm({
              microchip: health.microchip,
              allergies: (health.allergies || []).join(', '),
              vetName: health.veterinarian?.name || '',
              vetPhone: health.veterinarian?.phone || '',
              vetAddress: health.veterinarian?.address || '',
              vetEmail: health.veterinarian?.email || '',
            });
          }}>
            <Row label="Puce" value={health.microchip || 'Non renseigne'} />
            <Row label="Allergies" value={(health.allergies || []).join(', ') || 'Aucune'} />
            {health.veterinarian?.name ? (
              <>
                <Row label="Veto" value={health.veterinarian.name} />
                {health.veterinarian.phone ? <Row label="Tel veto" value={health.veterinarian.phone} /> : null}
              </>
            ) : null}
          </Section>

          {/* Poids */}
          <Section title="Poids" icon="trending-up" onAdd={() => { setFormType('weight'); setForm({}); }}>
            {health.weights?.length ? (
              health.weights.slice(-5).reverse().map(w => (
                <View key={w._id} style={s.entry}>
                  <Text style={s.entryTitle}>{w.weight} kg</Text>
                  <Text style={s.entryMeta}>{fmt(w.date)}</Text>
                </View>
              ))
            ) : <EmptyLine text="Aucun enregistrement" />}
          </Section>

          {/* Vaccins */}
          <Section title="Vaccins" icon="shield" onAdd={() => { setFormType('vaccine'); setForm({}); }}>
            {health.vaccines?.length ? (
              health.vaccines.map(v => (
                <View key={v._id} style={s.entry}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.entryTitle}>{v.name}</Text>
                    <Text style={s.entryMeta}>
                      {fmt(v.date)}{v.nextDue ? ` • rappel ${fmt(v.nextDue)}` : ''}
                    </Text>
                  </View>
                </View>
              ))
            ) : <EmptyLine text="Aucun vaccin enregistre" />}
          </Section>

          {/* Vermifuges */}
          <Section title="Vermifuges / anti-parasitaires" icon="droplet" onAdd={() => { setFormType('deworming'); setForm({}); }}>
            {health.dewormings?.length ? (
              health.dewormings.map(d => (
                <View key={d._id} style={s.entry}>
                  <Text style={s.entryTitle}>{d.product}</Text>
                  <Text style={s.entryMeta}>{fmt(d.date)}{d.nextDue ? ` • rappel ${fmt(d.nextDue)}` : ''}</Text>
                </View>
              ))
            ) : <EmptyLine text="Aucun traitement enregistre" />}
          </Section>

          {/* Traitements */}
          <Section title="Traitements / ordonnances" icon="file-text" onAdd={() => { setFormType('treatment'); setForm({}); }}>
            {health.treatments?.length ? (
              health.treatments.map(t => (
                <View key={t._id} style={s.entry}>
                  <Text style={s.entryTitle}>{t.name}</Text>
                  <Text style={s.entryMeta}>
                    {fmt(t.startDate)}{t.endDate ? ` → ${fmt(t.endDate)}` : ''}
                    {t.dosage ? ` • ${t.dosage}` : ''}
                  </Text>
                </View>
              ))
            ) : <EmptyLine text="Aucun traitement" />}
          </Section>
        </ScrollView>

        {/* Formulaire modal simple */}
        {formType ? (
          <View style={[s.modal, { paddingBottom: insets.bottom + 12 }]}>
            <View style={s.modalHandle} />
            <ScrollView contentContainerStyle={{ padding: SPACING.base }}>
              <Text style={s.modalTitle}>
                {formType === 'vaccine' ? 'Nouveau vaccin' :
                 formType === 'deworming' ? 'Nouveau vermifuge' :
                 formType === 'weight' ? 'Nouveau poids' :
                 formType === 'treatment' ? 'Nouveau traitement' :
                 'Informations de sante'}
              </Text>

              {formType === 'vaccine' ? (
                <>
                  <FormField label="Nom du vaccin *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                  <FormField label="Date (AAAA-MM-JJ)" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
                  <FormField label="Prochain rappel" value={form.nextDue} onChange={(v) => setForm({ ...form, nextDue: v })} />
                  <FormField label="Veterinaire" value={form.vet} onChange={(v) => setForm({ ...form, vet: v })} />
                </>
              ) : formType === 'deworming' ? (
                <>
                  <FormField label="Produit *" value={form.product} onChange={(v) => setForm({ ...form, product: v })} />
                  <FormField label="Date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
                  <FormField label="Prochain rappel" value={form.nextDue} onChange={(v) => setForm({ ...form, nextDue: v })} />
                </>
              ) : formType === 'weight' ? (
                <>
                  <FormField label="Poids (kg) *" value={form.weight} onChange={(v) => setForm({ ...form, weight: v })} keyboardType="numeric" />
                  <FormField label="Note" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
                </>
              ) : formType === 'treatment' ? (
                <>
                  <FormField label="Nom *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                  <FormField label="Date debut" value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} />
                  <FormField label="Date fin" value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} />
                  <FormField label="Posologie" value={form.dosage} onChange={(v) => setForm({ ...form, dosage: v })} />
                  <FormField label="Prescrit par" value={form.prescribedBy} onChange={(v) => setForm({ ...form, prescribedBy: v })} />
                </>
              ) : formType === 'info' ? (
                <>
                  <FormField label="Puce electronique" value={form.microchip} onChange={(v) => setForm({ ...form, microchip: v })} />
                  <FormField label="Allergies (virgule)" value={form.allergies} onChange={(v) => setForm({ ...form, allergies: v })} />
                  <FormField label="Nom veto" value={form.vetName} onChange={(v) => setForm({ ...form, vetName: v })} />
                  <FormField label="Tel veto" value={form.vetPhone} onChange={(v) => setForm({ ...form, vetPhone: v })} />
                  <FormField label="Adresse veto" value={form.vetAddress} onChange={(v) => setForm({ ...form, vetAddress: v })} />
                </>
              ) : null}

              <View style={s.modalBtns}>
                <TouchableOpacity style={s.modalCancel} onPress={() => { setFormType(null); setForm({}); }}>
                  <Text style={s.modalCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.modalSave} onPress={submitForm} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.modalSaveText}>Enregistrer</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
};

const FormField = ({ label, value, onChange, keyboardType }) => (
  <View style={{ marginBottom: 10 }}>
    <Text style={s.formLabel}>{label}</Text>
    <TextInput
      style={s.formInput}
      value={value}
      onChangeText={onChange}
      keyboardType={keyboardType}
    />
  </View>
);

const Row = ({ label, value }) => (
  <View style={s.row}>
    <Text style={s.rowLabel}>{label}</Text>
    <Text style={s.rowValue} numberOfLines={1}>{value}</Text>
  </View>
);

const EmptyLine = ({ text }) => (
  <Text style={{ fontSize: 13, color: colors.pebble, fontStyle: 'italic', paddingVertical: 6 }}>{text}</Text>
);

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },

  shareCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: RADIUS.md, padding: SPACING.base,
    marginBottom: SPACING.base,
    borderWidth: 1, borderColor: colors.primaryMuted,
  },
  shareIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  shareTitle: { fontWeight: '700', color: colors.primaryDark, fontSize: 14 },
  shareSub: { fontSize: 12, color: colors.stone, marginTop: 2 },

  section: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.md, padding: SPACING.base,
    marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: { fontWeight: '700', color: colors.charcoal, fontSize: 14 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: colors.primarySoft, borderRadius: 999,
  },
  addBtnText: { color: colors.primaryDark, fontSize: 12, fontWeight: '600' },

  entry: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.borderLight,
  },
  entryTitle: { color: colors.charcoal, fontSize: 13, fontWeight: '600' },
  entryMeta: { color: colors.stone, fontSize: 12 },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { color: colors.stone, fontSize: 13 },
  rowValue: { color: colors.charcoal, fontSize: 13, fontWeight: '600', flexShrink: 1, marginLeft: 8 },

  // Modal
  modal: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 10, elevation: 16,
  },
  modalHandle: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.borderLight, marginTop: 8,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.charcoal, marginBottom: SPACING.base },
  formLabel: { fontSize: 12, color: colors.stone, marginBottom: 4 },
  formInput: {
    backgroundColor: colors.linen,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: colors.charcoal,
  },
  modalBtns: { flexDirection: 'row', gap: 8, marginTop: SPACING.base },
  modalCancel: {
    flex: 1, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.linen,
  },
  modalCancelText: { color: colors.stone, fontWeight: '700' },
  modalSave: {
    flex: 2, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  modalSaveText: { color: '#fff', fontWeight: '700' },
});

export default HealthRecordScreen;
