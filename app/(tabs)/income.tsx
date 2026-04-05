import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  Alert, Animated, Platform, Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../services/AuthContext';
import { useBudget } from '../../services/BudgetContext';
import { Colors, FontSize, BorderRadius, Spacing, Shadow } from '../../constants/theme';
import { formatCurrency, getFrequencyLabel } from '../../services/AIEngine';
import { Income } from '../../constants/types';
import SwipeModal, { NumericDoneBar } from '../../components/SwipeModal';

const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'] as const;
const FREQ_LABELS: Record<string, string> = {
  daily: 'Günlük',
  weekly: 'Haftalık',
  monthly: 'Aylık',
  yearly: 'Yıllık',
};

const CURRENCIES = [
  { symbol: '₺', label: 'TL' },
  { symbol: '$', label: 'USD' },
  { symbol: '€', label: 'EUR' },
  { symbol: '£', label: 'GBP' },
];

export default function IncomeScreen() {
  const { user } = useAuth();
  const { incomes, addIncome, deleteIncome, updateIncome, summary } = useBudget();
  
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(user?.currency || '₺');
  const [frequency, setFrequency] = useState<typeof FREQUENCIES[number]>('monthly');

  // Edit states
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCurrency, setEditCurrency] = useState('₺');
  const [editFrequency, setEditFrequency] = useState<typeof FREQUENCIES[number]>('monthly');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const handleAdd = async () => {
    Keyboard.dismiss();
    if (!title.trim() || !amount.trim()) {
      Alert.alert('Hata', 'Lütfen başlık ve tutar girin.');
      return;
    }
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Hata', 'Geçerli bir tutar girin.');
      return;
    }
    
    await addIncome({
      title: title.trim(),
      amount: numAmount,
      currency,
      frequency,
      date: new Date().toISOString(),
      isActive: true,
    });
    resetForm();
    setShowModal(false);
  };

  const resetForm = () => {
    setTitle(''); setAmount(''); setCurrency(user?.currency || '₺'); setFrequency('monthly');
  };

  const openEdit = (income: Income) => {
    setEditingIncome(income);
    setEditTitle(income.title);
    setEditAmount(income.amount.toString());
    setEditCurrency(income.currency || user?.currency || '₺');
    setEditFrequency(income.frequency as any);
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    Keyboard.dismiss();
    if (!editingIncome) return;
    if (!editTitle.trim() || !editAmount.trim()) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    const numAmount = parseFloat(editAmount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Hata', 'Geçerli bir tutar girin.');
      return;
    }
    
    await updateIncome(editingIncome.id, {
      title: editTitle.trim(),
      amount: numAmount,
      currency: editCurrency,
      frequency: editFrequency,
    });
    setShowEditModal(false);
    setEditingIncome(null);
  };

  const renderForm = (
    isEdit: boolean,
    fTitle: string, fAmount: string, fCurrency: string, fFreq: any,
    setFTitle: any, setFAmount: any, setFCurrency: any, setFFreq: any,
    onSave: any,
  ) => (
    <View style={{ gap: Spacing.lg }}>
      <Text style={styles.modalTitle}>{isEdit ? 'Gelir Düzenle' : 'Gelir Ekle'}</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Gelir Adı</Text>
        <TextInput style={styles.input} placeholder="Örn: Maaş, Freelance..." placeholderTextColor={Colors.textMuted} value={fTitle} onChangeText={setFTitle} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Tutar ve Para Birimi</Text>
        <View style={styles.amountCurrencyRow}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="0" placeholderTextColor={Colors.textMuted} value={fAmount} onChangeText={setFAmount} keyboardType="decimal-pad" />
          <View style={styles.currencyToggleGroup}>
            {CURRENCIES.map(c => (
              <TouchableOpacity key={c.symbol} style={[styles.currencyBtn, fCurrency === c.symbol && styles.currencyBtnActive]} onPress={() => setFCurrency(c.symbol)}>
                <Text style={[styles.currencyBtnText, fCurrency === c.symbol && styles.currencyBtnTextActive]}>{c.symbol}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Sıklık</Text>
        <View style={styles.freqRow}>
          {FREQUENCIES.map(f => (
            <TouchableOpacity key={f} style={[styles.freqBtn, fFreq === f && styles.freqBtnActive]} onPress={() => setFFreq(f)}>
              <Text style={[styles.freqBtnText, fFreq === f && styles.freqBtnTextActive]}>{FREQ_LABELS[f]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity onPress={onSave} activeOpacity={0.8} style={styles.saveBtnContainer}>
        <LinearGradient colors={isEdit ? [Colors.neonGreen + 'DD', Colors.neonGreen] : [Colors.gradientPurpleStart, Colors.neonPurple]} style={styles.saveBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={[styles.saveBtnText, isEdit && { color: '#000' }]}>{isEdit ? 'Güncelle' : 'Kaydet'}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.header}>
            <Text style={styles.title}>Gelirler</Text>
            <Text style={styles.subtitle}>Gelir kaynaklarınızı yönetin</Text>
          </View>

          <LinearGradient colors={['rgba(0,255,136,0.12)', 'rgba(0,255,136,0.03)']} style={styles.totalCard}>
            <View style={styles.totalIconBg}><Ionicons name="trending-up" size={24} color={Colors.neonGreen} /></View>
            <View>
              <Text style={styles.totalLabel}>Toplam Aylık Gelir</Text>
              <Text style={styles.totalAmount}>{formatCurrency(summary.totalIncome, user?.currency)}</Text>
            </View>
          </LinearGradient>

          {incomes.length > 0 ? (
            <View style={styles.list}>
              {incomes.map((inc) => (
                <View key={inc.id} style={[styles.incomeCard, !inc.isActive && styles.inactiveCard]}>
                  <TouchableOpacity style={styles.toggleBtn} onPress={() => updateIncome(inc.id, { isActive: !inc.isActive })}>
                    <Ionicons name={inc.isActive ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={inc.isActive ? Colors.neonGreen : Colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.incomeInfo} onPress={() => openEdit(inc)} activeOpacity={0.7}>
                    <Text style={[styles.incomeName, !inc.isActive && styles.inactiveText]}>{inc.title}</Text>
                    <Text style={styles.incomeFreq}>{getFrequencyLabel(inc.frequency)}</Text>
                  </TouchableOpacity>
                  <Text style={[styles.incomeAmount, !inc.isActive && styles.inactiveText]}>+{formatCurrency(inc.amount, inc.currency || '₺')}</Text>
                  <TouchableOpacity onPress={() => Alert.alert('Sil', 'Emin misiniz?', [{ text: 'İptal' }, { text: 'Sil', onPress: () => deleteIncome(inc.id) }])} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Henüz gelir eklenmedi</Text>
            </View>
          )}
          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      <TouchableOpacity onPress={() => { resetForm(); setShowModal(true); }} style={styles.fab} activeOpacity={0.8}>
        <LinearGradient colors={[Colors.gradientPurpleStart, Colors.neonPurple]} style={styles.fabGradient}><Ionicons name="add" size={30} color="#fff" /></LinearGradient>
      </TouchableOpacity>

      <SwipeModal visible={showModal} onClose={() => setShowModal(false)}>
        {renderForm(false, title, amount, currency, frequency, setTitle, setAmount, setCurrency, setFrequency, handleAdd)}
      </SwipeModal>

      <SwipeModal visible={showEditModal} onClose={() => setShowEditModal(false)}>
        {renderForm(true, editTitle, editAmount, editCurrency, editFrequency, setEditTitle, setEditAmount, setEditCurrency, setEditFrequency, handleEdit)}
      </SwipeModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: 60 },
  header: { marginBottom: Spacing.xxl },
  title: { fontSize: FontSize.xxxl, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs },
  totalCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.neonGreen + '30', marginBottom: Spacing.xxl, gap: Spacing.lg },
  totalIconBg: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.neonGreen + '20', justifyContent: 'center', alignItems: 'center' },
  totalLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  totalAmount: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.neonGreen },
  list: { gap: Spacing.md },
  incomeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  inactiveCard: { opacity: 0.5 },
  toggleBtn: { padding: 2 },
  incomeInfo: { flex: 1 },
  incomeName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  incomeFreq: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  incomeAmount: { fontSize: FontSize.md, fontWeight: '700', color: Colors.neonGreen },
  inactiveText: { color: Colors.textMuted },
  deleteBtn: { padding: Spacing.sm },
  fab: { position: 'absolute', bottom: 100, right: 20, width: 56, height: 56, ...Shadow.neonPurple },
  fabGradient: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textSecondary },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
  inputGroup: { marginBottom: Spacing.md },
  inputLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },
  input: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md, borderWidth: 1, borderColor: Colors.border },
  amountCurrencyRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  currencyToggleGroup: { flexDirection: 'row', backgroundColor: Colors.background, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, padding: 2 },
  currencyBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6 },
  currencyBtnActive: { backgroundColor: Colors.neonCyan },
  currencyBtnText: { color: Colors.textMuted, fontWeight: '700', fontSize: FontSize.sm },
  currencyBtnTextActive: { color: '#000' },
  freqRow: { flexDirection: 'row', gap: Spacing.sm },
  freqBtn: { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.md, backgroundColor: Colors.background, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  freqBtnActive: { borderColor: Colors.neonPurple, backgroundColor: Colors.neonPurple + '20' },
  freqBtnText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '500' },
  freqBtnTextActive: { color: Colors.neonPurple },
  saveBtnContainer: { marginTop: Spacing.lg },
  saveBtn: { height: 50, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
});
