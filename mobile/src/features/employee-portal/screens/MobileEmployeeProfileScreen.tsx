import { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import {
  getMyEmployeeProfile,
  updateMyEmployeeProfile,
} from '../../../services/employeePortal/employeePortalMobileApi';
import { apiService } from '../../../services/ApiService';
import type { Employee } from '../../../models/hrm';
import {
  WorkshopChrome,
  WorkshopLoading,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopPrimaryButton,
  WorkshopDetailRow,
  WS,
} from '../../workshop/components/WorkshopChrome';

export function MobileEmployeeProfileScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const p = await getMyEmployeeProfile();
      setProfile(p);
      setPhone(p.phone ?? '');
      setAddress(p.address ?? '');
      setEmergencyContact(p.emergencyContact ?? '');
      setEmergencyPhone(p.emergencyPhone ?? '');
      setAvatarPreview(p.avatar ?? null);
    } catch (e) {
      appError('Profile', extractErrorMessage(e, 'Failed to load profile'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath('/employee-portal/profile');
  }, [setSidebarActivePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      appAlert('Photos', 'Permission is required to choose a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;

    const asset = result.assets[0];
    const mime = asset.mimeType || 'image/jpeg';
    const dataUrl = `data:${mime};base64,${asset.base64}`;
    setAvatarPreview(dataUrl);
    setAvatarBusy(true);
    try {
      const updated = await updateMyEmployeeProfile({ avatar: dataUrl });
      setProfile(updated);
      setAvatarPreview(updated.avatar ?? dataUrl);
      appAlert('Profile', 'Profile photo updated');
    } catch (e) {
      setAvatarPreview(profile?.avatar ?? null);
      appError('Profile', extractErrorMessage(e, 'Failed to upload photo'));
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = () => {
    appConfirm({
      title: 'Remove photo',
      message: 'Remove your profile photo?',
      confirmLabel: 'Remove',
      onConfirm: async () => {
        setAvatarBusy(true);
        try {
          await apiService.deleteAvatar();
          setAvatarPreview(null);
          setProfile((prev) => (prev ? { ...prev, avatar: null } : prev));
          appAlert('Profile', 'Profile photo removed');
        } catch (e) {
          appError('Profile', extractErrorMessage(e, 'Failed to remove photo'));
        } finally {
          setAvatarBusy(false);
        }
      },
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateMyEmployeeProfile({
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        emergencyPhone: emergencyPhone.trim() || undefined,
      });
      setProfile(updated);
      setAvatarPreview(updated.avatar ?? avatarPreview);
      appAlert('Profile', 'Profile updated');
    } catch (e) {
      appError('Profile', extractErrorMessage(e, 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <WorkshopLoading />;

  const initials = (profile?.firstName?.[0] ?? '?').toUpperCase();

  return (
    <WorkshopChrome title="My profile" subtitle="Personal information">
      <View className="mb-4 items-center">
        <Pressable onPress={() => void pickAvatar()} disabled={avatarBusy}>
          <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-indigo-100">
            {avatarPreview ? (
              <Image source={{ uri: avatarPreview }} style={{ width: 96, height: 96 }} />
            ) : (
              <Text className="text-3xl font-bold text-indigo-700">{initials}</Text>
            )}
            {avatarBusy ? (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(15,23,42,0.35)',
                }}
              >
                <ActivityIndicator color="#fff" />
              </View>
            ) : null}
          </View>
        </Pressable>
        <Text className="mt-3 text-lg font-bold text-slate-900">
          {profile?.firstName} {profile?.lastName}
        </Text>
        <Text className="text-sm text-slate-500">{profile?.position}</Text>
        <View className="mt-3 flex-row gap-3">
          <Pressable
            onPress={() => void pickAvatar()}
            disabled={avatarBusy}
            style={{
              borderRadius: 999,
              backgroundColor: WS.primary,
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
              {avatarPreview ? 'Change photo' : 'Add photo'}
            </Text>
          </Pressable>
          {avatarPreview ? (
            <Pressable
              onPress={removeAvatar}
              disabled={avatarBusy}
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: '#cbd5e1',
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: '#475569', fontWeight: '700', fontSize: 13 }}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <WorkshopDetailRow label="Email" value={profile?.email ?? '—'} />
      <WorkshopDetailRow label="Department" value={profile?.department ?? '—'} />
      <WorkshopDetailRow label="Employee ID" value={profile?.employeeId ?? '—'} />
      <WorkshopDetailRow label="Hire date" value={profile?.hireDate?.slice(0, 10) ?? '—'} />
      <WorkshopFieldLabel>Phone</WorkshopFieldLabel>
      <WorkshopTextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <WorkshopFieldLabel>Address</WorkshopFieldLabel>
      <WorkshopTextInput value={address} onChangeText={setAddress} multiline />
      <WorkshopFieldLabel>Emergency contact</WorkshopFieldLabel>
      <WorkshopTextInput value={emergencyContact} onChangeText={setEmergencyContact} />
      <WorkshopFieldLabel>Emergency phone</WorkshopFieldLabel>
      <WorkshopTextInput value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" />
      <WorkshopPrimaryButton
        label={saving ? 'Saving...' : 'Save changes'}
        onPress={() => void save()}
        disabled={saving || avatarBusy}
      />
    </WorkshopChrome>
  );
}
