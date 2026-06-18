/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'super_admin' | 'photographer' | 'organizer' | 'guest';
export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';
export type EventStatus = 'active' | 'archived' | 'draft';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  avatar?: string;
  company?: string;
  subscriptionPlan: SubscriptionPlan;
  storageUsed: number; // in MB
  storageLimit: number; // in MB
  revenue: number;
}

export interface CustomBranding {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  watermarkText?: string;
  enableWatermark?: boolean;
}

export interface Event {
  id: string;
  photographerId: string;
  name: string;
  date: string;
  location: string;
  description: string;
  status: EventStatus;
  qrCodeUrl: string;
  shareUrl: string;
  totalGuests: number;
  totalPhotos: number;
  downloadsLimit?: number;
  expiryDate?: string;
  retentionPeriodDays?: number;
  customBranding?: CustomBranding;
}

export interface FaceDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  embeddingVector?: number[]; // simulated or real vector
}

export interface Photo {
  id: string;
  eventId: string;
  url: string;
  thumbnailUrl: string;
  size: number; // in bytes
  format: string;
  faceDetections: FaceDetection[];
  tags: string[];
  isBestShot: boolean;
  uploadedAt: string;
  isArchived?: boolean;
}

export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  selfieUrl?: string;
  eventId: string;
  joinedAt: string;
}

export interface SearchHistory {
  id: string;
  eventId: string;
  selfieUrl: string;
  facesFound: number;
  matchesCount: number;
  timestamp: string;
}

export interface Download {
  id: string;
  photoId: string;
  eventId: string;
  userEmail?: string;
  timestamp: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: SubscriptionPlan;
  status: 'active' | 'canceled' | 'past_due';
  amount: number;
  billingPeriod: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface Invoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  planName: string;
  amount: number;
  currency: string;
  status: 'paid' | 'unpaid';
  invoiceDate: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface FTPSetting {
  id: string;
  userId: string;
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSyncAt?: string;
  scannedFilesCount: number;
}
