import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius, Spacing } from '../../../../shared/utils/theme';
import { ModerationItem } from '../../api/admin.api';

interface ActionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionType: 'approve' | 'reject' | 'revision';
  selectedItem: ModerationItem | null;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  revisionNotes?: string;
  setRevisionNotes?: (notes: string) => void;
}

const ACTION_CONFIG = {
  approve: {
    title: 'Confirmer la validation',
    icon:  'check-circle' as const,
    color: '#22C55E',
    btnLabel: 'Approuver & Notifier',
  },
  reject: {
    title: 'Motif de refus',
    icon:  'x-circle' as const,
    color: '#EF4444',
    btnLabel: 'Envoyer le refus',
  },
  revision: {
    title: 'Demande de révision',
    icon:  'edit-2' as const,
    color: '#8B5CF6',
    btnLabel: 'Demander des modifications',
  },
};

export function ActionModal({
  visible, onClose, onConfirm, actionType, selectedItem,
  rejectReason, setRejectReason, revisionNotes, setRevisionNotes,
}: ActionModalProps) {
  const { theme: T, isDark } = useTheme();
  const cardBg  = isDark ? '#1C1C1E' : '#FFFFFF';
  const inputBg = isDark ? '#2C2C2E' : 'rgba(46,46,46,0.05)';
  const borderC = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  const cfg = ACTION_CONFIG[actionType];

  const description =
    actionType === 'approve'
      ? `"${selectedItem?.title || 'cet élément'}" sera rendu visible. L'auteur recevra une notification.`
      : actionType === 'reject'
      ? `Expliquez pourquoi "${selectedItem?.title || 'cet élément'}" est refusé. L'auteur sera notifié.`
      : `Précisez les modifications attendues pour "${selectedItem?.title || 'cet élément'}".`;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        {/* Bottom-sheet stops propagation */}
        <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: cardBg }]}>
          {/* Drag handle */}
          <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]} />

          {/* Icon + Title */}
          <View style={styles.titleRow}>
            <View style={[styles.titleIcon, { backgroundColor: cfg.color + '18' }]}>
              <Feather name={cfg.icon} size={20} color={cfg.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: T.text }]}>{cfg.title}</Text>
              <Text style={[styles.desc, { color: T.textMuted }]}>{description}</Text>
            </View>
          </View>

          {/* Text input */}
          {(actionType === 'reject' || actionType === 'revision') && (
            <TextInput
              style={[styles.input, { color: T.text, backgroundColor: inputBg, borderColor: borderC }]}
              placeholder={
                actionType === 'reject'
                  ? 'Ex: Images manquantes, contenu inapproprié...'
                  : 'Ex: Veuillez corriger la liste des ingrédients...'
              }
              placeholderTextColor={T.textMuted}
              multiline
              numberOfLines={4}
              value={actionType === 'reject' ? rejectReason : revisionNotes}
              onChangeText={actionType === 'reject' ? setRejectReason : setRevisionNotes}
              autoFocus
            />
          )}

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancel, { backgroundColor: inputBg }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnText, { color: T.text }]}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnConfirm, { backgroundColor: cfg.color }]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={[styles.btnText, { color: '#FFF' }]}>{cfg.btnLabel}</Text>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 18,
  },
  titleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: { fontFamily: Font.bold, fontSize: 17, marginBottom: 4 },
  desc:  { fontFamily: Font.regular, fontSize: 13, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    fontFamily: Font.regular,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  btnCancel:  {},
  btnConfirm: {},
  btnText: { fontFamily: Font.semibold, fontSize: 14 },
});
