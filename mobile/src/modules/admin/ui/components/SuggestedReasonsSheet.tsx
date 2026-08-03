import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius } from '../../../../shared/utils/theme';

const REJECT_REASONS = [
  'Images manquantes ou floues',
  'Contenu inapproprié ou trompeur',
  'Informations incomplètes',
  'Allégation sans gluten non vérifiable',
  'Document de certification invalide',
  'Catégorie incorrecte',
  'Prix non conforme',
  'Contenu dupliqué',
];

const REVISION_REASONS = [
  'Veuillez corriger la liste des ingrédients',
  'Photos de meilleure qualité requises',
  'Description trop courte ou ambiguë',
  'Précisez le type de certification',
  'Horaires d\'ouverture incomplets',
  'Coordonnées de contact manquantes',
  'Étapes de préparation incomplètes',
];

interface Props {
  visible: boolean;
  mode: 'reject' | 'revision';
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  itemTitle?: string;
}

export function SuggestedReasonsSheet({ visible, mode, value, onChange, onClose, onConfirm, itemTitle }: Props) {
  const { theme: T, isDark } = useTheme();
  const primaryGreen = Colors.green || '#8BC34A';
  const cardBg  = isDark ? '#1C1C1E' : '#FFFFFF';
  const inputBg = isDark ? '#2C2C2E' : 'rgba(46,46,46,0.05)';
  const borderC = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const isReject   = mode === 'reject';
  const accentColor = isReject ? Colors.error : '#8B5CF6';
  const presets    = isReject ? REJECT_REASONS : REVISION_REASONS;
  const title      = isReject ? 'Motif de refus' : 'Demande de révision';
  const btnLabel   = isReject ? 'Envoyer le refus' : 'Demander des modifications';
  const placeholder = isReject
    ? 'Ou saisissez un motif personnalisé…'
    : 'Ou précisez les modifications attendues…';

  const togglePreset = (reason: string) => {
    if (value === reason) {
      onChange('');
    } else {
      onChange(reason);
    }
  };

  const canConfirm = value.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: cardBg }]}>
          {/* Drag handle */}
          <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: accentColor + '18' }]}>
              <Feather name={isReject ? 'x-circle' : 'edit-2'} size={18} color={accentColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: T.text }]}>{title}</Text>
              {itemTitle ? (
                <Text style={[styles.subtitle, { color: T.textMuted }]} numberOfLines={1}>
                  « {itemTitle} »
                </Text>
              ) : null}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Feather name="x" size={18} color={T.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Preset chips */}
          <Text style={[styles.sectionLabel, { color: T.textMuted }]}>Suggestions rapides</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {presets.map((reason) => {
              const isActive = value === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isActive ? accentColor + '18' : inputBg,
                      borderColor: isActive ? accentColor : borderC,
                    },
                  ]}
                  onPress={() => togglePreset(reason)}
                  activeOpacity={0.7}
                >
                  {isActive && (
                    <Feather name="check" size={11} color={accentColor} style={{ marginRight: 4 }} />
                  )}
                  <Text style={[styles.chipText, { color: isActive ? accentColor : T.text }]}>
                    {reason}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Free text */}
          <TextInput
            style={[styles.input, { color: T.text, backgroundColor: inputBg, borderColor: value ? accentColor + '60' : borderC }]}
            placeholder={placeholder}
            placeholderTextColor={T.textMuted}
            multiline
            numberOfLines={3}
            value={value}
            onChangeText={onChange}
            textAlignVertical="top"
          />

          {/* Actions */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: inputBg }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnText, { color: T.text }]}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: canConfirm ? accentColor : accentColor + '50' }]}
              onPress={canConfirm ? onConfirm : undefined}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, { color: '#FFF' }]}>{btnLabel}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 36,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 18,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  headerIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:      { fontFamily: Font.bold, fontSize: 16 },
  subtitle:   { fontFamily: Font.regular, fontSize: 12, marginTop: 2 },
  closeBtn:   { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

  sectionLabel: { fontFamily: Font.semibold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },

  chipsRow: { flexDirection: 'row', gap: 8, paddingBottom: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipText: { fontFamily: Font.medium, fontSize: 12 },

  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    fontFamily: Font.regular,
    fontSize: 13,
    minHeight: 80,
    marginBottom: 16,
  },

  btnRow: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  btnText: { fontFamily: Font.semibold, fontSize: 14 },
});
