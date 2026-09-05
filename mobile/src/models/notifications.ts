export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
  SYSTEM = 'system'
}

export enum NotificationCategory {
  HRM = 'hrm',
  INVENTORY = 'inventory',
  CRM = 'crm',
  PRODUCTION = 'production',
  QUALITY = 'quality',
  MAINTENANCE = 'maintenance',
  LEDGER = 'ledger',
  SYSTEM = 'system'
}

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  notification_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NotificationCreate {
  userId?: string; // Optional, defaults to current user
  title: string;
  message: string;
  type?: NotificationType;
  category?: NotificationCategory;
  actionUrl?: string;
  notification_data?: Record<string, any>;
}

export interface NotificationFilters {
  isRead?: boolean;
  notificationType?: NotificationType;
  category?: NotificationCategory;
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface NotificationPreferencesResponse {
  preferences: NotificationPreference[];
}

export interface NotificationPreference {
  id: string;
  tenant_id: string;
  user_id: string;
  category: NotificationCategory;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferenceUpdate {
  category: NotificationCategory;
  email_enabled?: boolean;
  push_enabled?: boolean;
  in_app_enabled?: boolean;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  is_read?: boolean;
  category?: NotificationCategory;
  type?: NotificationType;
}

export const getNotificationTypeColor = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.SUCCESS:
      return 'text-green-600 bg-green-50 border-green-200';
    case NotificationType.WARNING:
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case NotificationType.ERROR:
      return 'text-red-600 bg-red-50 border-red-200';
    case NotificationType.INFO:
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case NotificationType.SYSTEM:
      return 'text-gray-600 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const getNotificationTypeIcon = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.SUCCESS:
      return 'CheckCircle';
    case NotificationType.WARNING:
      return 'AlertTriangle';
    case NotificationType.ERROR:
      return 'XCircle';
    case NotificationType.INFO:
      return 'Info';
    case NotificationType.SYSTEM:
      return 'Settings';
    default:
      return 'Bell';
  }
};

export const getCategoryDisplayName = (category: NotificationCategory): string => {
  switch (category) {
    case NotificationCategory.HRM:
      return 'Human Resources';
    case NotificationCategory.INVENTORY:
      return 'Inventory';
    case NotificationCategory.CRM:
      return 'Customer Relations';
    case NotificationCategory.PRODUCTION:
      return 'Production';
    case NotificationCategory.QUALITY:
      return 'Quality Control';
    case NotificationCategory.MAINTENANCE:
      return 'Maintenance';
    case NotificationCategory.LEDGER:
      return 'Finance';
    case NotificationCategory.SYSTEM:
      return 'System';
    default:
      return 'General';
  }
};

export const getCategoryIcon = (category: NotificationCategory): string => {
  switch (category) {
    case NotificationCategory.HRM:
      return 'Users';
    case NotificationCategory.INVENTORY:
      return 'Package';
    case NotificationCategory.CRM:
      return 'UserCheck';
    case NotificationCategory.PRODUCTION:
      return 'Factory';
    case NotificationCategory.QUALITY:
      return 'Shield';
    case NotificationCategory.MAINTENANCE:
      return 'Wrench';
    case NotificationCategory.LEDGER:
      return 'Calculator';
    case NotificationCategory.SYSTEM:
      return 'Settings';
    default:
      return 'Bell';
  }
};
