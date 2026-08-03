import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../../shared/context/theme.context';
import { Colors, Font, Radius } from '../../../../shared/utils/theme';

interface CheckItem {
  id: string;
  label: string;
  critical?: boolean;
}

const DEFAULT_ITEMS: CheckItem[] = [
  { id: 'info_complete',   label: 'Informations complètes',         critical: true },
  { id: 'images_ok',       label: 'Images fournies et lisibles',    critical: true },
  { id: 'gf_info',         label: 'Information sans gluten vérifiée', critical: true },
  { id: 'certification',   label: 'Document de certification vérifié' },
  { id: 'seller_identity', label: 'Identité du vendeur validée' },
  { id: 'no_prohibited',   label: 'Aucun contenu interdit détecté', critical: true },
  { id: 'category_ok',     label: 'Catégorie correcte' },
];

interface Props {
  items?: CheckItem[];
  contentType?: 'product' | 'recipe' | 'shop' | 'seller';
}

export function VerificationChecklist({ items, contentType = 'product' }: Props) {
  const { theme: T, isDark } = useTheme();
  const primaryGreen = Colors.green || '#8BC34A';
  const borderC = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  // Customize checklist per content type
  let checkItems = items ?? DEFAULT_ITEMS;
  if (contentType === 'shop') {
    checkItems = [
      { id: 'shop_name',       label: 'Nom du magasin renseigné',   critical: true },
      { id: 'address_ok',      label: 'Adresse et localisation valides', critical: true },
      { id: 'contact_ok',      label: 'Coordonnées vérifiées' },
      { id: 'logo_ok',         label: 'Logo ou photo fournie' },
      { id: 'hours_ok',        label: 'Horaires d\'ouverture indiqués' },
      { id: 'certification',   label: 'Certification sans gluten vérifiée' },
      { id: 'no_prohibited',   label: 'Aucun contenu interdit',    critical: true },
    ];
  } else if (contentType === 'seller') {
    checkItems = [
      { id: 'siret_ok',        label: 'SIRET / Registre commerce vérifié', critical: true },
      { id: 'id_doc',          label: 'Pièce d\'identité validée',        critical: true },
      { id: 'cert_doc',        label: 'Certifications sans gluten',       critical: true },
      { id: 'address_match',   label: 'Adresse correspond au registre' },
      { id: 'no_duplicate',    label: 'Compte non dupliqué' },
    ];
  } else if (contentType === 'recipe') {
    checkItems = [
      { id: 'title_ok',        label: 'Titre explicite',             critical: true },
      { id: 'ingredients',     label: 'Liste des ingrédients complète', critical: true },
      { id: 'steps',           label: 'Étapes de préparation rédigées' },
      { id: 'gf_claim',        label: 'Déclaration sans gluten vérifiée', critical: true },
      { id: 'images_ok',       label: 'Photos de la recette présentes' },
      { id: 'no_prohibited',   label: 'Aucun contenu interdit',     critical: true },
    ];
  }

  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const criticalCount = checkItems.filter(i => i.critical).length;
  const criticalChecked = checkItems.filter(i => i.critical && checked.has(i.id)).length;
  const allCriticalOk = criticalChecked === criticalCount;

  return (
    <View>
      {/* Progress */}
      <View style={[styles.progressRow, { backgroundColor: allCriticalOk ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)', borderColor: allCriticalOk ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)' }]}>
        <Feather
          name={allCriticalOk ? 'check-circle' : 'alert-circle'}
          size={14}
          color={allCriticalOk ? '#22C55E' : '#F59E0B'}
        />
        <Text style={[styles.progressText, { color: allCriticalOk ? '#22C55E' : '#F59E0B' }]}>
          {criticalChecked}/{criticalCount} points critiques validés
        </Text>
      </View>

      {/* Check items */}
      {checkItems.map(item => {
        const isChecked = checked.has(item.id);
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.item, { borderBottomColor: borderC }]}
            onPress={() => toggle(item.id)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.checkbox,
              {
                backgroundColor: isChecked ? primaryGreen + '18' : (isDark ? '#2C2C2E' : 'rgba(0,0,0,0.04)'),
                borderColor: isChecked ? primaryGreen : borderC,
              },
            ]}>
              {isChecked && <Feather name="check" size={11} color={primaryGreen} />}
            </View>
            <Text style={[styles.label, { color: isChecked ? T.text : T.textMuted }]}>
              {item.label}
              {item.critical && <Text style={styles.critical}> *</Text>}
            </Text>
          </TouchableOpacity>
        );
      })}

      <Text style={[styles.hint, { color: T.textMuted }]}>* Points critiques requis avant approbation</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  progressText: { fontFamily: Font.semibold, fontSize: 12 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label:    { fontFamily: Font.regular, fontSize: 13, flex: 1 },
  critical: { color: '#EF4444', fontFamily: Font.bold },
  hint:     { fontFamily: Font.regular, fontSize: 11, marginTop: 8 },
});
