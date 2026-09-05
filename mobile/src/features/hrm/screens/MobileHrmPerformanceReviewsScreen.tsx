import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import {
  getPerformanceReviews,
  createPerformanceReview,
  updatePerformanceReview,
  deletePerformanceReview,
  getEmployees,
} from '../../../services/hrm/hrmMobileApi';
import type { PerformanceReview, Employee, PerformanceReviewCreate, PerformanceReviewUpdate } from '../../../models/hrm';
import { ReviewStatus, ReviewType } from '../../../models/hrm';
import {
  WorkshopChrome,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopDatePickerField,
  WorkshopPickerField,
  WorkshopChipSelect,
  WorkshopPrimaryButton,
  WorkshopOutlineButton,
  WorkshopDetailRow,
  WS,
} from '../../workshop/components/WorkshopChrome';

const REVIEW_TYPES = Object.values(ReviewType);
const REVIEW_STATUSES = Object.values(ReviewStatus);

function todayIsoDate() {
  return new Date().toISOString().split('T')[0] || '';
}

export function MobileHrmPerformanceReviewsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageHRM } = usePermissions();
  const [rows, setRows] = useState<PerformanceReview[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<PerformanceReview | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<PerformanceReview | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    reviewerId: '',
    reviewType: ReviewType.ANNUAL,
    reviewPeriod: '',
    reviewDate: todayIsoDate(),
    status: ReviewStatus.DRAFT,
    overallRating: '',
    comments: '',
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [res, emp] = await Promise.all([getPerformanceReviews(1, 100), getEmployees(1, 100)]);
      setRows(res.reviews ?? []);
      const list = emp.employees ?? [];
      setEmployees(list);
      setForm((prev) => ({
        ...prev,
        employeeId: prev.employeeId || list[0]?.id || '',
        reviewerId: prev.reviewerId || list[0]?.id || '',
      }));
    } catch (e) {
      appError('HRM', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard'
        ? '/dashboard'
        : '/hrm/performance-reviews',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const remove = (r: PerformanceReview) => {
    appConfirm({
      title: 'Delete review',
      message: r.reviewPeriod,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deletePerformanceReview(r.id);
          setDetail(null);
          await load();
        } catch (err) {
          appError('HRM', extractErrorMessage(err, 'Failed to delete'));
        }
      },
    });
  };

  const cycleEmployee = (field: 'employeeId' | 'reviewerId') => {
    if (!employees.length) return;
    setForm((prev) => {
      const ids = employees.map((e) => e.id);
      const current = prev[field];
      const idx = ids.indexOf(current);
      const next = ids[(idx + 1) % ids.length] || ids[0];
      return { ...prev, [field]: next };
    });
  };

  const employeeName = (id: string) => {
    const employee = employees.find((e) => e.id === id);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Select employee';
  };

  const openCreate = () => {
    const firstEmployee = employees[0]?.id || '';
    setForm({
      employeeId: firstEmployee,
      reviewerId: firstEmployee,
      reviewType: ReviewType.ANNUAL,
      reviewPeriod: '',
      reviewDate: todayIsoDate(),
      status: ReviewStatus.DRAFT,
      overallRating: '',
      comments: '',
    });
    setCreateOpen(true);
  };

  const openEdit = (review: PerformanceReview) => {
    setSelected(review);
    setForm({
      employeeId: review.employeeId,
      reviewerId: review.reviewerId,
      reviewType: review.reviewType,
      reviewPeriod: review.reviewPeriod || '',
      reviewDate: review.reviewDate ? review.reviewDate.split('T')[0] || review.reviewDate : todayIsoDate(),
      status: review.status,
      overallRating: review.overallRating != null ? String(review.overallRating) : '',
      comments: review.comments || '',
    });
    setEditOpen(true);
  };

  const validateForm = () => {
    if (!form.employeeId || !form.reviewerId || !form.reviewDate.trim()) {
      appAlert('HRM', 'Employee, reviewer, and review date are required.');
      return false;
    }
    return true;
  };

  const buildPayload = (): PerformanceReviewCreate => {
    const rating = parseFloat(form.overallRating);
    return {
      employeeId: form.employeeId,
      reviewerId: form.reviewerId,
      reviewType: form.reviewType,
      reviewPeriod: form.reviewPeriod.trim() || '',
      reviewDate: form.reviewDate.trim(),
      status: form.status,
      overallRating: Number.isFinite(rating) ? rating : undefined,
      comments: form.comments.trim() || undefined,
    };
  };

  const submitCreate = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      await createPerformanceReview(buildPayload());
      setCreateOpen(false);
      await load();
    } catch (e) {
      appError('HRM', extractErrorMessage(e, 'Failed to create'));
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async () => {
    if (!selected || !validateForm()) return;
    setSaving(true);
    try {
      const payload = buildPayload();
      const updatePayload: PerformanceReviewUpdate = {
        reviewerId: payload.reviewerId,
        reviewType: payload.reviewType,
        reviewPeriod: payload.reviewPeriod,
        reviewDate: payload.reviewDate,
        status: payload.status,
        overallRating: payload.overallRating,
        comments: payload.comments,
      };
      await updatePerformanceReview(selected.id, updatePayload);
      setEditOpen(false);
      setSelected(null);
      await load();
    } catch (e) {
      appError('HRM', extractErrorMessage(e, 'Failed to update'));
    } finally {
      setSaving(false);
    }
  };

  const renderForm = () => (
    <>
      <WorkshopPickerField
        label="Employee"
        value={employeeName(form.employeeId)}
        onPress={() => cycleEmployee('employeeId')}
      />
      <WorkshopPickerField
        label="Reviewer"
        value={employeeName(form.reviewerId)}
        onPress={() => cycleEmployee('reviewerId')}
      />
      <WorkshopChipSelect label="Type" options={[...REVIEW_TYPES]} value={form.reviewType} onChange={(v) => setForm((p) => ({ ...p, reviewType: v as ReviewType }))} />
      <WorkshopChipSelect label="Status" options={[...REVIEW_STATUSES]} value={form.status} onChange={(v) => setForm((p) => ({ ...p, status: v as ReviewStatus }))} />
      <WorkshopFieldLabel>Review period</WorkshopFieldLabel>
      <WorkshopTextInput value={form.reviewPeriod} onChangeText={(v) => setForm((p) => ({ ...p, reviewPeriod: v }))} />
      <WorkshopDatePickerField label="Review date *" value={form.reviewDate} onChange={(v) => setForm((p) => ({ ...p, reviewDate: v }))} />
      <WorkshopFieldLabel>Overall rating (0-5)</WorkshopFieldLabel>
      <WorkshopTextInput value={form.overallRating} onChangeText={(v) => setForm((p) => ({ ...p, overallRating: v }))} keyboardType="decimal-pad" />
      <WorkshopFieldLabel>Comments</WorkshopFieldLabel>
      <WorkshopTextInput value={form.comments} onChangeText={(v) => setForm((p) => ({ ...p, comments: v }))} multiline />
    </>
  );

  const formFooter = (onSave: () => void, saveLabel: string, onCancel: () => void) => (
    <>
      <WorkshopPrimaryButton label={saving ? 'Saving…' : saveLabel} onPress={onSave} disabled={saving} />
      <Pressable onPress={onCancel} style={{ marginTop: 12, alignItems: 'center', paddingVertical: 10 }}>
        <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Cancel</Text>
      </Pressable>
    </>
  );

  return (
    <WorkshopChrome
      title="Performance reviews"
      subtitle="Goals, ratings & feedback"
      right={canManageHRM() ? <WorkshopHeaderButton onPress={openCreate} /> : undefined}
      scroll={false}
    >
      {loading && !refreshing ? (
        <WorkshopLoading />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WS.primary} />
          }
          ListEmptyComponent={
            <WorkshopEmptyState
              icon="ribbon-outline"
              title="No reviews"
              subtitle="Schedule performance reviews for your team."
              actionLabel={canManageHRM() ? 'New review' : undefined}
              onAction={canManageHRM() ? openCreate : undefined}
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="ribbon"
              iconColor="#7c3aed"
              iconBg="#f5f3ff"
              title={item.reviewPeriod || 'Performance review'}
              subtitle={item.reviewDate}
              meta={String(item.reviewType)}
              badges={[
                { label: String(item.status), tone: 'status' },
                ...(item.overallRating != null ? [{ label: `Rating ${item.overallRating}` }] : []),
              ]}
              onPress={() => setDetail(item)}
              actions={
                canManageHRM()
                  ? [
                      { icon: 'create-outline', onPress: () => openEdit(item) },
                      { icon: 'trash-outline', onPress: () => remove(item), danger: true },
                    ]
                  : undefined
              }
            />
          )}
        />
      )}

      <WorkshopFormSheet
        visible={detail != null}
        title="Review"
        onClose={() => setDetail(null)}
        footer={
          <>
            {detail && canManageHRM() ? (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <WorkshopPrimaryButton label="Edit" onPress={() => { setDetail(null); openEdit(detail); }} />
                </View>
                <View style={{ flex: 1 }}>
                  <Pressable
                    onPress={() => remove(detail)}
                    style={{ alignItems: 'center', borderRadius: 14, paddingVertical: 15, backgroundColor: WS.dangerBg }}
                  >
                    <Text style={{ fontWeight: '700', fontSize: 16, color: WS.danger }}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            <WorkshopOutlineButton label="Close" onPress={() => setDetail(null)} />
          </>
        }
      >
        {detail ? (
          <>
            <WorkshopDetailRow label="Period" value={detail.reviewPeriod || '—'} />
            <WorkshopDetailRow label="Type" value={String(detail.reviewType)} />
            <WorkshopDetailRow label="Status" value={String(detail.status)} />
            <WorkshopDetailRow label="Date" value={detail.reviewDate} />
            <WorkshopDetailRow label="Rating" value={detail.overallRating != null ? String(detail.overallRating) : '—'} />
            {detail.comments ? (
              <Text style={{ fontSize: 14, color: WS.textMuted, marginTop: 12, lineHeight: 20 }}>{detail.comments}</Text>
            ) : null}
          </>
        ) : null}
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={createOpen}
        title="New review"
        onClose={() => setCreateOpen(false)}
        footer={formFooter(() => void submitCreate(), 'Create review', () => setCreateOpen(false))}
      >
        {renderForm()}
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={editOpen}
        title="Edit review"
        onClose={() => { setEditOpen(false); setSelected(null); }}
        footer={formFooter(() => void submitEdit(), 'Save review', () => { setEditOpen(false); setSelected(null); })}
      >
        {renderForm()}
      </WorkshopFormSheet>
    </WorkshopChrome>
  );
}
