import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import type {
  ExpenseCategory,
  DailyExpense,
  DailyExpenseCreate,
  DailyExpenseUpdate,
  ExpenseCategoryUpdate,
} from '../../../models/healthcare';
import {
  getExpenseCategories,
  getDailyExpenses,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  createDailyExpense,
  updateDailyExpense,
  deleteDailyExpense,
} from '../../../services/healthcare/healthcareMobileApi';
import { extractErrorMessage } from '../../../utils/errorUtils';
import {
  HealthcareChrome,
  HealthcareCard,
  HealthcareFieldLabel,
  HealthcarePrimaryButton,
} from '../components/HealthcareChrome';
import { WorkshopDatePickerField } from '../../workshop/components/WorkshopChrome';
import { PickerModal } from '../components/PickerModal';
import { AppModal } from '../../../components/layout/AppModal';
import { KeyboardBottomSheetShell } from '../../../components/layout/KeyboardBottomSheetShell';

type Tab = 'categories' | 'expenses';

export function MobileHealthcareDailyExpenseScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [tab, setTab] = useState<Tab>('expenses');
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [expLoading, setExpLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('__all__');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterCatPick, setFilterCatPick] = useState(false);
  const [formCatPick, setFormCatPick] = useState(false);

  const [catFormOpen, setCatFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ExpenseCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catBusy, setCatBusy] = useState(false);

  const [expFormOpen, setExpFormOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<DailyExpense | null>(null);
  const [expCategoryId, setExpCategoryId] = useState('');
  const [expDate, setExpDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expBusy, setExpBusy] = useState(false);

  useEffect(() => {
    setSidebarActivePath('/healthcare/daily-expense');
  }, [setSidebarActivePath]);

  const loadCategories = useCallback(async () => {
    const res = await getExpenseCategories({ limit: 500 });
    setCategories(res.categories);
  }, []);

  const loadExpenses = useCallback(async () => {
    const res = await getDailyExpenses({
      category_id:
        categoryFilter !== '__all__' ? categoryFilter : undefined,
      date_from: dateFrom.trim() || undefined,
      date_to: dateTo.trim() || undefined,
      limit: 500,
    });
    setExpenses(res.expenses);
  }, [categoryFilter, dateFrom, dateTo]);

  const refreshAll = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([loadCategories(), loadExpenses()]);
    } catch (e) {
      Alert.alert('Daily expense', extractErrorMessage(e, 'Failed'));
    } finally {
      setRefreshing(false);
    }
  }, [loadCategories, loadExpenses]);

  useEffect(() => {
    void (async () => {
      try {
        setCatLoading(true);
        await loadCategories();
      } catch (e) {
        Alert.alert('Categories', extractErrorMessage(e, 'Failed'));
      } finally {
        setCatLoading(false);
      }
    })();
  }, [loadCategories]);

  useEffect(() => {
    void (async () => {
      try {
        setExpLoading(true);
        await loadExpenses();
      } catch (e) {
        Alert.alert('Expenses', extractErrorMessage(e, 'Failed'));
      } finally {
        setExpLoading(false);
      }
    })();
  }, [loadExpenses]);

  const openCatAdd = () => {
    setEditingCat(null);
    setCatName('');
    setCatDesc('');
    setCatFormOpen(true);
  };

  const openCatEdit = (c: ExpenseCategory) => {
    setEditingCat(c);
    setCatName(c.name);
    setCatDesc(c.description ?? '');
    setCatFormOpen(true);
  };

  const saveCat = async () => {
    if (!catName.trim()) {
      Alert.alert('Category', 'Name is required');
      return;
    }
    try {
      setCatBusy(true);
      if (editingCat) {
        const payload: ExpenseCategoryUpdate = {
          name: catName.trim(),
          description: catDesc.trim() || undefined,
        };
        await updateExpenseCategory(editingCat.id, payload);
      } else {
        await createExpenseCategory({
          name: catName.trim(),
          description: catDesc.trim() || undefined,
        });
      }
      setCatFormOpen(false);
      await loadCategories();
      await loadExpenses();
    } catch (e) {
      Alert.alert('Category', extractErrorMessage(e, 'Save failed'));
    } finally {
      setCatBusy(false);
    }
  };

  const delCat = (c: ExpenseCategory) => {
    Alert.alert('Delete category', c.name, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpenseCategory(c.id);
            await loadCategories();
            await loadExpenses();
          } catch (e) {
            Alert.alert(
              'Category',
              extractErrorMessage(e, 'Delete failed'),
            );
          }
        },
      },
    ]);
  };

  const openExpAdd = () => {
    setEditingExp(null);
    setExpCategoryId(categories[0]?.id ?? '');
    setExpDate(new Date().toISOString().slice(0, 10));
    setExpAmount('');
    setExpDesc('');
    setExpFormOpen(true);
  };

  const openExpEdit = (e: DailyExpense) => {
    setEditingExp(e);
    setExpCategoryId(e.category_id);
    setExpDate(e.expense_date);
    setExpAmount(String(e.amount));
    setExpDesc(e.description ?? '');
    setExpFormOpen(true);
  };

  const saveExp = async () => {
    if (!expCategoryId) {
      Alert.alert('Expense', 'Category required');
      return;
    }
    const amt = parseFloat(expAmount);
    if (isNaN(amt) || amt < 0) {
      Alert.alert('Expense', 'Valid amount required');
      return;
    }
    try {
      setExpBusy(true);
      if (editingExp) {
        const payload: DailyExpenseUpdate = {
          category_id: expCategoryId,
          expense_date: expDate,
          amount: amt,
          description: expDesc.trim() || undefined,
        };
        await updateDailyExpense(editingExp.id, payload);
      } else {
        const payload: DailyExpenseCreate = {
          category_id: expCategoryId,
          expense_date: expDate,
          amount: amt,
          description: expDesc.trim() || undefined,
        };
        await createDailyExpense(payload);
      }
      setExpFormOpen(false);
      await loadExpenses();
    } catch (e) {
      Alert.alert('Expense', extractErrorMessage(e, 'Save failed'));
    } finally {
      setExpBusy(false);
    }
  };

  const delExp = (e: DailyExpense) => {
    Alert.alert('Delete expense', 'Remove this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDailyExpense(e.id);
            await loadExpenses();
          } catch (err) {
            Alert.alert(
              'Expense',
              extractErrorMessage(err, 'Delete failed'),
            );
          }
        },
      },
    ]);
  };

  const catItems = categories.map((c) => ({ id: c.id, label: c.name }));

  return (
    <HealthcareChrome
      title="Daily expense"
      subtitle="Categories and entries"
      right={
        tab === 'categories' ? (
          <Pressable onPress={openCatAdd} className="p-2">
            <Ionicons name="add-circle" size={26} color="#0d9488" />
          </Pressable>
        ) : (
          <Pressable onPress={openExpAdd} className="p-2">
            <Ionicons name="add-circle" size={26} color="#0d9488" />
          </Pressable>
        )
      }
      scroll={false}
    >
      <View className="mb-3 flex-row rounded-xl bg-slate-200 p-1">
        {(['expenses', 'categories'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 ${tab === t ? 'bg-white shadow-sm' : ''}`}
          >
            <Text
              className={`text-center text-sm font-medium ${tab === t ? 'text-teal-800' : 'text-slate-600'}`}
            >
              {t === 'expenses' ? 'Expenses' : 'Categories'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'expenses' ? (
        <>
          <View className="mb-2 flex-row gap-2">
            <View style={{ flex: 1 }}>
              <WorkshopDatePickerField label="From" value={dateFrom} onChange={setDateFrom} />
            </View>
            <View style={{ flex: 1 }}>
              <WorkshopDatePickerField label="To" value={dateTo} onChange={setDateTo} />
            </View>
          </View>
          <Pressable
            onPress={() => setFilterCatPick(true)}
            className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
          >
            <Text className="text-sm text-slate-800">
              Category:{' '}
              {categoryFilter === '__all__'
                ? 'All'
                : categories.find((c) => c.id === categoryFilter)?.name}
            </Text>
          </Pressable>
          {expLoading && !refreshing ? (
            <View className="py-12 items-center">
              <ActivityIndicator color="#0d9488" />
            </View>
          ) : (
            <FlatList
              className="flex-1"
              data={expenses}
              keyExtractor={(x) => x.id}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => void refreshAll()}
                  tintColor="#0d9488"
                />
              }
              renderItem={({ item: e }) => (
                <HealthcareCard>
                  <View className="flex-row justify-between">
                    <View className="flex-1">
                      <Text className="font-semibold text-slate-900">
                        {e.category_name ?? 'Expense'}
                      </Text>
                      <Text className="text-sm text-slate-600">
                        {e.expense_date} · {e.amount}
                      </Text>
                      {e.description ? (
                        <Text className="text-xs text-slate-500">
                          {e.description}
                        </Text>
                      ) : null}
                    </View>
                    <View className="flex-row gap-2">
                      <Pressable onPress={() => openExpEdit(e)}>
                        <Ionicons name="pencil" size={20} color="#475569" />
                      </Pressable>
                      <Pressable onPress={() => delExp(e)}>
                        <Ionicons name="trash-outline" size={20} color="#b91c1c" />
                      </Pressable>
                    </View>
                  </View>
                </HealthcareCard>
              )}
            />
          )}
        </>
      ) : catLoading && !refreshing ? (
        <View className="py-12 items-center">
          <ActivityIndicator color="#0d9488" />
        </View>
      ) : (
        <FlatList
          className="flex-1"
          data={categories}
          keyExtractor={(x) => x.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void refreshAll()}
              tintColor="#0d9488"
            />
          }
          renderItem={({ item: c }) => (
            <HealthcareCard>
              <View className="flex-row justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-slate-900">{c.name}</Text>
                  {c.description ? (
                    <Text className="text-sm text-slate-600">{c.description}</Text>
                  ) : null}
                </View>
                <View className="flex-row gap-2">
                  <Pressable onPress={() => openCatEdit(c)}>
                    <Ionicons name="pencil" size={20} color="#475569" />
                  </Pressable>
                  <Pressable onPress={() => delCat(c)}>
                    <Ionicons name="trash-outline" size={20} color="#b91c1c" />
                  </Pressable>
                </View>
              </View>
            </HealthcareCard>
          )}
        />
      )}

      <PickerModal
        visible={filterCatPick}
        title="Category filter"
        items={[{ id: '__all__', label: 'All categories' }, ...catItems]}
        onSelect={(x) => setCategoryFilter(x.id)}
        onClose={() => setFilterCatPick(false)}
      />
      <PickerModal
        visible={formCatPick}
        title="Category"
        items={catItems}
        onSelect={(x) => setExpCategoryId(x.id)}
        onClose={() => setFormCatPick(false)}
      />

      <AppModal
        visible={catFormOpen}
        animationType="slide"
        transparent
        onClose={() => setCatFormOpen(false)}
      >
        <KeyboardBottomSheetShell overlayColor="rgba(0,0,0,0.4)">
          <View className="rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="mb-3 text-lg font-semibold">
              {editingCat ? 'Edit category' : 'New category'}
            </Text>
            <HealthcareFieldLabel>Name *</HealthcareFieldLabel>
            <TextInput
              className="mb-3 rounded-lg border border-slate-200 px-3 py-2"
              value={catName}
              onChangeText={setCatName}
            />
            <HealthcareFieldLabel>Description</HealthcareFieldLabel>
            <TextInput
              className="mb-4 rounded-lg border border-slate-200 px-3 py-2"
              value={catDesc}
              onChangeText={setCatDesc}
              multiline
            />
            <HealthcarePrimaryButton
              label={catBusy ? 'Saving…' : 'Save'}
              onPress={() => void saveCat()}
              disabled={catBusy}
            />
            <Pressable className="mt-2 items-center py-2" onPress={() => setCatFormOpen(false)}>
              <Text className="text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </KeyboardBottomSheetShell>
      </AppModal>

      <AppModal
        visible={expFormOpen}
        animationType="slide"
        transparent
        onClose={() => setExpFormOpen(false)}
      >
        <KeyboardBottomSheetShell overlayColor="rgba(0,0,0,0.4)">
          <View className="max-h-[85%] rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <Text className="mb-3 text-lg font-semibold">
              {editingExp ? 'Edit expense' : 'New expense'}
            </Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <HealthcareFieldLabel>Category *</HealthcareFieldLabel>
              <Pressable
                onPress={() => setFormCatPick(true)}
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2"
              >
                <Text>
                  {categories.find((c) => c.id === expCategoryId)?.name ??
                    'Select'}
                </Text>
              </Pressable>
              <WorkshopDatePickerField label="Date *" value={expDate} onChange={setExpDate} />
              <HealthcareFieldLabel>Amount *</HealthcareFieldLabel>
              <TextInput
                className="mb-3 rounded-lg border border-slate-200 px-3 py-2"
                keyboardType="decimal-pad"
                value={expAmount}
                onChangeText={setExpAmount}
              />
              <HealthcareFieldLabel>Description</HealthcareFieldLabel>
              <TextInput
                className="mb-4 rounded-lg border border-slate-200 px-3 py-2"
                value={expDesc}
                onChangeText={setExpDesc}
                multiline
              />
            </ScrollView>
            <HealthcarePrimaryButton
              label={expBusy ? 'Saving…' : 'Save'}
              onPress={() => void saveExp()}
              disabled={expBusy}
            />
            <Pressable className="mt-2 items-center py-2" onPress={() => setExpFormOpen(false)}>
              <Text className="text-slate-600">Cancel</Text>
            </Pressable>
          </View>
        </KeyboardBottomSheetShell>
      </AppModal>
    </HealthcareChrome>
  );
}
