import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/theme.context';
import { Colors, Font, Radius } from '@/shared/utils/theme';

interface Props {
  visible: boolean;
  contentType: 'product' | 'recipe' | 'event' | 'shop';
  contentName: string;
  isEdit?: boolean;
  onClose: () => void;
  onGoToList?: () => void;
}

const CONTENT_META: Record<string, { icon: string; color: string; label: string }> = {
  product: { icon: 'food-apple',  color: Colors.green || '#8BC34A', label: 'produit' },
  recipe:  { icon: 'chef-hat',    color: '#F59E0B',                 label: 'recette' },
  event:   { icon: 'calendar',    color: '#3B82F6',                 label: 'événement' },
  shop:    { icon: 'store-check', color: '#8B5CF6',                 label: 'boutique' },
};

export function SubmissionConfirmationModal({
  visible,
  contentType,
  contentName,
  isEdit = false,
  onClose,
  onGoToList,
}: Props) {
  const { theme: T, isDark } = useTheme();
  const primaryGreen = Colors.green || '#8BC34A';
  const cardBg  = isDark ? '#1C1C1E' : '#FFFFFF';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  const meta = CONTENT_META[contentType] ?? CONTENT_META.product;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: borderC }]}>
          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: meta.color + '18' }]}>
            <MaterialCommunityIcons name={meta.icon as any} size={36} color={meta.color} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: T.text }]}>
            {isEdit ? 'Modification soumise !' : 'Soumission envoyée !'}
          </Text>
          <Text style={[styles.name, { color: T.text }]} numberOfLines={2}>
            « {contentName} »
          </Text>

          {/* Info box */}
          <View style={[styles.infoBox, { backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)' }]}>
            <MaterialCommunityIcons name="clock-outline" size={16} color="#F59E0B" />
            <Text style={[styles.infoText, { color: T.text }]}>
              Votre {meta.label} est en attente de validation par l'équipe OFC. Vous serez notifié(e) dès qu'une décision sera prise.
            </Text>
          </View>

          {/* What's next */}
          <View style={[styles.stepsBox, { backgroundColor: isDark ? '#2C2C2E' : 'rgba(0,0,0,0.03)', borderColor: borderC }]}>
            <Text style={[styles.stepsTitle, { color: T.textMuted }]}>Et maintenant ?</Text>
            {[
              { icon: 'eye-outline',           text: 'Votre contenu est invisible du public pour l\'instant' },
              { icon: 'bell-ring-outline',      text: 'Vous recevrez une notification à la décision' },
              { icon: 'pencil-outline',         text: 'Vous pouvez modifier et renvoyer si révision requise' },
            ].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={[styles.stepNumText, { color: primaryGreen }]}>{i + 1}</Text>
                </View>
                <MaterialCommunityIcons name={step.icon as any} size={15} color={T.textMuted} />
                <Text style={[styles.stepText, { color: T.textMuted }]}>{step.text}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {onGoToList && (
              <TouchableOpacity
                style={[styles.btn, { borderColor: borderC }]}
                onPress={onGoToList}
                activeOpacity={0.7}
              >
                <Feather name="list" size={15} color={T.textMuted} />
                <Text style={[styles.btnText, { color: T.text }]}>Voir mes {meta.label}s</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, { backgroundColor: primaryGreen }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Feather name="check" size={15} color="#FFF" />
              <Text style={[styles.btnText, { color: '#FFF' }]}>Compris !</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontFamily: Font.bold, fontSize: 20, marginBottom: 4, textAlign: 'center' },
  name:  { fontFamily: Font.semibold, fontSize: 14, textAlign: 'center', marginBottom: 18, opacity: 0.7 },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 16,
    width: '100%',
  },
  infoText: { fontFamily: Font.regular, fontSize: 13, flex: 1, lineHeight: 19 },

  stepsBox: {
    width: '100%',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  stepsTitle: { fontFamily: Font.semibold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  stepRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  stepNum:    { width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(139,195,74,0.15)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText:{ fontFamily: Font.bold, fontSize: 10, color: Colors.green },
  stepText:   { fontFamily: Font.regular, fontSize: 12, flex: 1, lineHeight: 17 },

  actions: { flexDirection: 'row', gap: 10, width: '100%' },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: Radius.md,
    gap: 6,
    borderWidth: 1,
  },
  btnPrimary: { borderWidth: 0 },
  btnText: { fontFamily: Font.semibold, fontSize: 14 },
});
