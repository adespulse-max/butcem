import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  Alert, Animated, Platform, Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../services/AuthContext';
import { useBudget } from '../../services/BudgetContext';
import { Colors, FontSize, BorderRadius, Spacing, Shadow, CategoryIcons } from '../../constants/theme';
import { formatCurrency, getFrequencyLabel } from '../../services/AIEngine';
import { Expense } from '../../constants/types';
import SwipeModal, { NumericDoneBar } from '../../components/SwipeModal';
import CustomSwitch from '../../components/CustomSwitch';

const FREQUENCIES = ['once', 'daily', 'weekly', 'monthly', 'yearly'] as const;
const FREQ_LABELS: Record<string, string> = {
  once: 'Tek Sefer',
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

const CATEGORIES = Object.keys(CategoryIcons);

export default function ExpensesScreen() {
  const { user } = useAuth();
  const { expenses, addExpense, deleteExpense, updateExpense, summary } = useBudget();
  
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(user?.currency || '₺');
  const [category, setCategory] = useState('market');
  const [frequency, setFrequency] = useState<typeof FREQUENCIES[number]>('monthly');
  const [dueDay, setDueDay] = useState('');
  const [reminder, setReminder] = useState(false);
  const [reminderDays, setReminderDays] = useState('3');

  // Edit states
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCurrency, setEditCurrency] = useState('₺');
  const [editCategory, setEditCategory] = useState('market');
  const [editFrequency, setEditFrequency] = useState<typeof FREQUENCIES[number]>('monthly');
  const [editDueDay, setEditDueDay] = useState('');
  const [editReminder, setEditReminder] = useState(false);
  const [editReminderDays, setEditReminderDays] = useState('3');

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

    let dueDate: string | undefined;
    if (dueDay.trim()) {
      const day = parseInt(dueDay);
      if (day >= 1 && day <= 31) {
        const now = new Date();
        const due = new Date(now.getFullYear(), now.getMonth(), day);
        if (due < now) due.setMonth(due.getMonth() + 1);
        dueDate = due.toISOString();
      }
    }

    await addExpense({
      title: title.trim(),
      amount: numAmount,
      currency,
      category,
      frequency,
      date: new Date().toISOString(),
      dueDate,
      isPaid: false,
      reminderEnabled: reminder,
      reminderDaysBefore: parseInt(reminderDays) || 3,
    });
    resetForm();
    setShowModal(false);
  };

  const resetForm = () => {
    setTitle(''); setAmount(''); setCurrency(user?.currency || '₺');
    setCategory('market'); setFrequency('monthly'); setDueDay('');
    setReminder(false); setReminderDays('3');
  };

  const openEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setEditTitle(exp.title);
    setEditAmount(exp.amount.toString());
    setEditCurrency(exp.currency || user?.currency || '₺');
    setEditCategory(exp.category);
    setEditFrequency(exp.frequency as any);
    setEditDueDay(exp.dueDate ? new Date(exp.dueDate).getDate().toString() : '');
    setEditReminder(exp.reminderEnabled || false);
    setEditReminderDays(exp.reminderDaysBefore?.toString() || '3');
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    Keyboard.dismiss();
    if (!editingExpense) return;
    if (!editTitle.trim() || !editAmount.trim()) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    const numAmount = parseFloat(editAmount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Hata', 'Geçerli bir tutar girin.');
      return;
    }

    let dueDate: string | undefined;
    if (editDueDay.trim()) {
      const day = parseInt(editDueDay);
      if (day >= 1 && day <= 31) {
        const now = new Date();
        const due = new Date(now.getFullYear(), now.getMonth(), day);
        if (due < now) due.setMonth(due.getMonth() + 1);
        dueDate = due.toISOString();
      }
    }

    await updateExpense(editingExpense.id, {
      title: editTitle.trim(),
      amount: numAmount,
      currency: editCurrency,
      category: editCategory,
      frequency: editFrequency,
      dueDate,
      reminderEnabled: editReminder,
      reminderDaysBefore: parseInt(editReminderDays) || 3,
    });
    setShowEditModal(false);
    setEditingExpense(null);
  };

  const renderForm = (
    isEdit: boolean,
    fTitle: string, fAmount: string, fCurrency: string, fCategory: string,
    fFreq: any, fDueDay: string,
    setFTitle: any, setFAmount: any, setFCurrency: any,
    setFCategory: any, setFFreq: any, setFDueDay: any,
    fRem: boolean, setFRem: any, fRemDays: string, setFRemDays: any,
    onSave: any,
  ) => (
    <View style={{ gap: Spacing.lg }}>
      <Text style={styles.modalTitle}>{isEdit ? 'Gider Düzenle' : 'Gider Ekle'}</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Gider Adı</Text>
        <TextInput style={styles.input} placeholder="Örn: Ev kirası..." placeholderTextColor={Colors.textMuted} value={fTitle} onChangeText={setFTitle} />
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
        <Text style={styles.inputLabel}>Kategori</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map(cat => {
            const info = CategoryIcons[cat];
            const isSelected = fCategory === cat;
            return (
              <TouchableOpacity key={cat} style={[styles.categoryBtn, isSelected && { borderColor: info.color, backgroundColor: info.color + '15' }]} onPress={() => setFCategory(cat)}>
                <Ionicons name={info.icon as any} size={18} color={isSelected ? info.color : Colors.textMuted} />
                <Text style={[styles.categoryBtnText, isSelected && { color: info.color }]}>{info.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Ödeme Günü (opsiyonel)</Text>
        <TextInput style={styles.input} placeholder="Ayın günü (1-31)" placeholderTextColor={Colors.textMuted} value={fDueDay} onChangeText={setFDueDay} keyboardType="number-pad" maxLength={2} />
      </View>

      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLabel}>Hatırlatıcı</Text>
          <Text style={styles.switchHint}>Ödeme yaklaştığında bildirim gönder</Text>
        </View>
        <CustomSwitch enabled={fRem} onToggle={() => setFRem(!fRem)} activeColor={Colors.neonCyan} />
      </View>

      {fRem && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Kaç gün önceden?</Text>
          <View style={styles.freqRow}>
            {['1', '2', '3', '5', '7'].map(d => (
              <TouchableOpacity key={d} style={[styles.freqBtn, fRemDays === d && styles.freqBtnActive]} onPress={() => setFRemDays(d)}>
                <Text style={[styles.freqBtnText, fRemDays === d && styles.freqBtnTextActive]}>{d} Gün</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

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
            <Text style={styles.title}>Giderler</Text>
            <Text style={styles.subtitle}>Harcamalarınızı takip edin</Text>
          </View>

          <LinearGradient colors={['rgba(255,61,110,0.12)', 'rgba(255,61,110,0.03)']} style={styles.totalCard}>
            <View style={styles.totalIconBg}><Ionicons name="trending-down" size={24} color={Colors.danger} /></View>
            <View>
              <Text style={styles.totalLabel}>Toplam Aylık Gider</Text>
              <Text style={styles.totalAmount}>{formatCurrency(summary.totalExpenses, user?.currency)}</Text>
            </View>
          </LinearGradient>

          {expenses.length > 0 ? (
            <View style={styles.list}>
              {expenses.map((exp) => (
                <TouchableOpacity key={exp.id} style={styles.expenseCard} onPress={() => openEdit(exp)} activeOpacity={0.7}>
                  <View style={[styles.catIconBg, { backgroundColor: (CategoryIcons[exp.category]?.color || Colors.neonPurple) + '20' }]}>
                    <Ionicons name={(CategoryIcons[exp.category]?.icon || 'receipt') as any} size={20} color={CategoryIcons[exp.category]?.color || Colors.neonPurple} />
                  </View>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseName}>{exp.title}</Text>
                    <Text style={styles.expenseMeta}>{CategoryIcons[exp.category]?.label} • {getFrequencyLabel(exp.frequency)}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>-{formatCurrency(exp.amount, exp.currency || '₺')}</Text>
                  <TouchableOpacity onPress={() => Alert.alert('Sil', 'Emin misiniz?', [{ text: 'İptal' }, { text: 'Sil', onPress: () => deleteExpense(exp.id) }])} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Henüz gider eklenmedi</Text>
            </View>
          )}
          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      <TouchableOpacity onPress={() => { resetForm(); setShowModal(true); }} style={styles.fab} activeOpacity={0.8}>
        <LinearGradient colors={[Colors.gradientPurpleStart, Colors.neonPurple]} style={styles.fabGradient}><Ionicons name="add" size={30} color="#fff" /></LinearGradient>
      </TouchableOpacity>

      <SwipeModal visible={showModal} onClose={() => setShowModal(false)}>
        {renderForm(false, title, amount, currency, category, frequency, dueDay, setTitle, setAmount, setCurrency, setCategory, setFrequency, setDueDay, reminder, setReminder, reminderDays, setReminderDays, handleAdd)}
      </SwipeModal>

      <SwipeModal visible={showEditModal} onClose={() => setShowEditModal(false)}>
        {renderForm(true, editTitle, editAmount, editCurrency, editCategory, editFrequency, editDueDay, setEditTitle, setEditAmount, setEditCurrency, setEditCategory, setEditFrequency, setEditDueDay, editReminder, setEditReminder, editReminderDays, setEditReminderDays, handleEdit)}
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
  totalCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.xl, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.danger + '30', marginBottom: Spacing.xxl, gap: Spacing.lg },
  totalIconBg: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.danger + '20', justifyContent: 'center', alignItems: 'center' },
  totalLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  totalAmount: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.danger },
  list: { gap: Spacing.md },
  expenseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.cardBg, borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  catIconBg: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  expenseInfo: { flex: 1 },
  expenseName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  expenseMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  expenseAmount: { fontSize: FontSize.md, fontWeight: '700', color: Colors.danger },
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
  categoryScroll: { gap: Spacing.sm, paddingRight: 20 },
  categoryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.md, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  categoryBtnText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '500' },
  freqRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  freqBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.md, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  freqBtnActive: { borderColor: Colors.neonPurple, backgroundColor: Colors.neonPurple + '20' },
  freqBtnText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '500' },
  freqBtnTextActive: { color: Colors.neonPurple },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  switchHint: { fontSize: FontSize.xs, color: Colors.textSecondary },
  saveBtnContainer: { marginTop: Spacing.lg },
  saveBtn: { height: 50, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
});
