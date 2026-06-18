/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import Jimp from 'jimp';
import { 
  User, Event, Photo, Guest, SearchHistory, Download, 
  Subscription, Invoice, AuditLog, FTPSetting, EventStatus,
  Notification, SubscriptionPlan
} from './src/types';

dotenv.config();

const app = express();
const PORT = 3000;

// Set request body limits for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database File Path
const DB_FILE = path.join(process.cwd(), 'database.json');

// Initialize Gemini Client
let aiInstance: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiInstance && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

/**
 * Overlays a customizable watermark text and/or logo on base64 image data.
 * Returns the finished base64 data string (with the appropriate data URI prefix).
 */
export async function applyWatermark(
  fileData: string,
  watermarkText?: string,
  logoUrlOrBase64?: string
): Promise<string> {
  try {
    if (!fileData || !fileData.startsWith('data:image')) {
      return fileData; // Not a base64 image data string, or empty
    }

    // Extract the mime type & clean base64 data
    const mimeMatch = fileData.match(/^data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64CleanData = fileData.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64CleanData, 'base64');

    // Load the main image
    const image = await Jimp.read(imageBuffer);
    const imgWidth = image.bitmap.width;
    const imgHeight = image.bitmap.height;

    // Apply logo watermark if provided
    if (logoUrlOrBase64) {
      try {
        let logoImage;
        if (logoUrlOrBase64.startsWith('data:image')) {
          const cleanLogo = logoUrlOrBase64.replace(/^data:image\/[a-z]+;base64,/, '');
          logoImage = await Jimp.read(Buffer.from(cleanLogo, 'base64'));
        } else if (logoUrlOrBase64.startsWith('http') || logoUrlOrBase64.startsWith('https')) {
          logoImage = await Jimp.read(logoUrlOrBase64);
        }

        if (logoImage) {
          // Resize logo to 15% of image width
          const logoWidth = Math.max(60, Math.floor(imgWidth * 0.15));
          logoImage.resize(logoWidth, Jimp.AUTO);
          logoImage.opacity(0.5); // 50% opacity

          // Composite at bottom-right with custom padding
          const padding = Math.max(15, Math.floor(imgWidth * 0.02));
          const lx = imgWidth - logoImage.bitmap.width - padding;
          const ly = imgHeight - logoImage.bitmap.height - padding;
          image.composite(logoImage, lx, ly);
        }
      } catch (logoErr) {
        console.error('Failed to overlay logo watermark:', logoErr);
      }
    }

    // Apply text watermark if provided
    if (watermarkText) {
      try {
        // Select appropriate font based on image size
        let fontPath = Jimp.FONT_SANS_32_WHITE;
        let shadowFontPath = Jimp.FONT_SANS_32_BLACK;

        if (imgWidth < 500) {
          fontPath = Jimp.FONT_SANS_16_WHITE;
          shadowFontPath = Jimp.FONT_SANS_16_BLACK;
        } else if (imgWidth > 1200) {
          fontPath = Jimp.FONT_SANS_64_WHITE;
          shadowFontPath = Jimp.FONT_SANS_64_BLACK;
        }

        const font = await Jimp.loadFont(fontPath);
        const shadowFont = await Jimp.loadFont(shadowFontPath);

        const textWidth = Jimp.measureText(font, watermarkText);
        const textHeight = Jimp.measureTextHeight(font, watermarkText, imgWidth);

        // Center on the image
        const tx = Math.floor((imgWidth - textWidth) / 2);
        const ty = Math.floor((imgHeight - textHeight) / 2);

        // Print drop shadow slightly offset for readability on all contrasts
        image.print(shadowFont, tx + 2, ty + 2, watermarkText);
        // Print main text
        image.print(font, tx, ty, watermarkText);
      } catch (fontErr) {
        console.error('Failed to print watermark text:', fontErr);
      }
    }

    // Get the base64 string
    const processedBase64 = await image.getBase64Async(mimeType);
    return processedBase64;
  } catch (err) {
    console.error('Failed to automate watermarking process on photo:', err);
    return fileData; // Fallback to original image if anything crashes
  }
}

// Default/Initial Mock Database Structure
const defaultDb = {
  users: [
    {
      id: 'usr_admin',
      email: 'admin@photoseek.ai',
      role: 'super_admin',
      name: 'Elena Vance',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
      company: 'PhotoSeek AI Global',
      subscriptionPlan: 'enterprise',
      storageUsed: 420.5,
      storageLimit: 1000000,
      revenue: 125000
    },
    {
      id: 'usr_photographer',
      email: 'photographer@example.com',
      role: 'photographer',
      name: 'Marcus Sterling',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
      company: 'Sterling Premium Photography',
      subscriptionPlan: 'professional',
      storageUsed: 215.8,
      storageLimit: 500000, // 500 GB
      revenue: 1450
    },
    {
      id: 'usr_organizer',
      email: 'organizer@example.com',
      role: 'organizer',
      name: 'Sarah Jenkins',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150',
      company: ' Jenkins Gala Planners',
      subscriptionPlan: 'starter',
      storageUsed: 45.2,
      storageLimit: 10000, // 10 GB
      revenue: 350
    }
  ] as User[],

  events: [
    {
      id: 'evt_sunset_fest',
      photographerId: 'usr_photographer',
      name: 'Summer Sunset Festival 2026',
      date: '2026-07-15',
      location: 'Malibu Coast Beach Park, CA',
      description: 'A premium music and beach arts festival celebrating the summer solstice. Thousands of young people gathered for high energy live performances.',
      status: 'active',
      qrCodeUrl: '/qr-evt_sunset_fest.png',
      shareUrl: '/event/evt_sunset_fest',
      totalGuests: 240,
      totalPhotos: 4,
      downloadsLimit: 1000,
      expiryDate: '2026-12-31',
      customBranding: {
        primaryColor: '#e11d48',
        secondaryColor: '#f59e0b',
        watermarkText: 'PhotoSeek AI © Sunset Fest',
        enableWatermark: true
      }
    },
    {
      id: 'evt_tech_summit',
      photographerId: 'usr_photographer',
      name: 'Tech Synergy Conference 2026',
      date: '2026-08-10',
      location: 'Silicon Valley Center, San Jose',
      description: 'The leading developer event on decentralization, core visual models, generative media pipelines, and scalable cloud architectures.',
      status: 'active',
      qrCodeUrl: '/qr-evt_tech_summit.png',
      shareUrl: '/event/evt_tech_summit',
      totalGuests: 110,
      totalPhotos: 2,
      downloadsLimit: 500,
      expiryDate: '2026-10-10',
      customBranding: {
        primaryColor: '#2563eb',
        secondaryColor: '#10b981',
        watermarkText: 'Tech-Synergy 2026',
        enableWatermark: false
      }
    },
    {
      id: 'evt_wedding',
      photographerId: 'usr_photographer',
      name: 'Grace & Arthur Wedding',
      date: '2026-06-05',
      location: 'The Vineyards Chateau, Napa Valley',
      description: 'An elegant outdoor summer wedding in the heart of wine country. Intimate celebration with beautiful florals and classical rustic themes.',
      status: 'active',
      qrCodeUrl: '/qr-evt_wedding.png',
      shareUrl: '/event/evt_wedding',
      totalGuests: 85,
      totalPhotos: 2,
      downloadsLimit: 200,
      expiryDate: '2026-09-05',
      customBranding: {
        primaryColor: '#7c3aed',
        secondaryColor: '#db2777',
        watermarkText: 'Grace & Arthur • 2026',
        enableWatermark: true
      }
    }
  ] as Event[],

  photos: [
    {
      id: 'pho_sunset_1',
      eventId: 'evt_sunset_fest',
      url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=400',
      size: 1542300,
      format: 'JPEG',
      faceDetections: [
        { x: 35, y: 25, width: 20, height: 25, confidence: 0.98 }
      ],
      tags: ['glasses', 'female', 'blonde', 'laughing', 'young', 'jacket', 'nightlife'],
      isBestShot: true,
      uploadedAt: '2026-07-15T18:30:22-07:00'
    },
    {
      id: 'pho_sunset_2',
      eventId: 'evt_sunset_fest',
      url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400',
      size: 2153020,
      format: 'JPEG',
      faceDetections: [
        { x: 22, y: 30, width: 12, height: 16, confidence: 0.91 },
        { x: 55, y: 23, width: 14, height: 18, confidence: 0.95 }
      ],
      tags: ['crowd', 'joyful', 'male', 'female', 'happy', 'audience'],
      isBestShot: false,
      uploadedAt: '2026-07-15T19:45:00-07:00'
    },
    {
      id: 'pho_sunset_3',
      eventId: 'evt_sunset_fest',
      url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=400',
      size: 1893200,
      format: 'JPEG',
      faceDetections: [
        { x: 45, y: 15, width: 18, height: 22, confidence: 0.94 }
      ],
      tags: ['celebration', 'dance', 'lights', 'male', 'shouting', 'wild'],
      isBestShot: false,
      uploadedAt: '2026-07-15T21:05:15-07:00'
    },
    {
      id: 'pho_sunset_4',
      eventId: 'evt_sunset_fest',
      url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=400',
      size: 2435010,
      format: 'JPEG',
      faceDetections: [
        { x: 30, y: 28, width: 15, height: 20, confidence: 0.89 }
      ],
      tags: ['party', 'confetti', 'female', 'brunette', 'smiling', 'elegance'],
      isBestShot: false,
      uploadedAt: '2026-07-15T22:15:30-07:00'
    },
    {
      id: 'pho_tech_1',
      eventId: 'evt_tech_summit',
      url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?q=80&w=400',
      size: 1104500,
      format: 'JPEG',
      faceDetections: [
        { x: 48, y: 20, width: 14, height: 18, confidence: 0.99 }
      ],
      tags: ['male', 'beard', 'professional', 'speaking', 'suit', 'smart', 'microphone'],
      isBestShot: true,
      uploadedAt: '2026-08-10T10:15:00-07:00'
    },
    {
      id: 'pho_tech_2',
      eventId: 'evt_tech_summit',
      url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=400',
      size: 1985400,
      format: 'JPEG',
      faceDetections: [
        { x: 15, y: 40, width: 8, height: 11, confidence: 0.85 },
        { x: 62, y: 35, width: 9, height: 13, confidence: 0.92 }
      ],
      tags: ['audience', 'listening', 'glasses', 'multicultural', 'intellectual'],
      isBestShot: false,
      uploadedAt: '2026-08-10T11:45:22-07:00'
    },
    {
      id: 'pho_wed_1',
      eventId: 'evt_wedding',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=400',
      size: 3204900,
      format: 'JPEG',
      faceDetections: [
        { x: 30, y: 31, width: 12, height: 16, confidence: 0.97 },
        { x: 50, y: 28, width: 11, height: 15, confidence: 0.96 }
      ],
      tags: ['bride', 'groom', 'marriage', 'veil', 'suit', 'loving', 'smiling', 'flowers'],
      isBestShot: true,
      uploadedAt: '2026-06-05T15:40:00-07:00'
    },
    {
      id: 'pho_wed_2',
      eventId: 'evt_wedding',
      url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=400',
      size: 2893500,
      format: 'JPEG',
      faceDetections: [
        { x: 42, y: 22, width: 15, height: 20, confidence: 0.95 }
      ],
      tags: ['female', 'brunette', 'bridesmaid', 'smiling', 'rose', 'gown', 'elegant'],
      isBestShot: false,
      uploadedAt: '2026-06-05T16:20:10-07:00'
    }
  ] as Photo[],

  guests: [
    {
      id: 'gst_1',
      name: 'Tiffany Alvarez',
      email: 'tiffany@alvarez.com',
      phone: '+1-555-0144',
      selfieUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
      eventId: 'evt_sunset_fest',
      joinedAt: '2026-07-15T18:15:00-07:00'
    },
    {
      id: 'gst_2',
      name: 'James Cooper',
      email: 'james.cooper@tech.com',
      phone: '+1-555-8941',
      selfieUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
      eventId: 'evt_tech_summit',
      joinedAt: '2026-08-10T09:40:00-07:00'
    }
  ] as Guest[],

  searchHistory: [
    {
      id: 'sch_1',
      eventId: 'evt_sunset_fest',
      selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      facesFound: 1,
      matchesCount: 2,
      timestamp: '2026-07-15T19:30:00-07:00'
    },
    {
      id: 'sch_sunset_01',
      eventId: 'evt_sunset_fest',
      selfieUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6',
      facesFound: 1,
      matchesCount: 3,
      timestamp: '2026-06-12T12:00:00-07:00'
    },
    {
      id: 'sch_sunset_02',
      eventId: 'evt_sunset_fest',
      selfieUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6',
      facesFound: 1,
      matchesCount: 0,
      timestamp: '2026-06-12T14:45:00-07:00'
    },
    {
      id: 'sch_sunset_03',
      eventId: 'evt_sunset_fest',
      selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      facesFound: 1,
      matchesCount: 5,
      timestamp: '2026-06-13T10:15:00-07:00'
    },
    {
      id: 'sch_sunset_04',
      eventId: 'evt_sunset_fest',
      selfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      facesFound: 2,
      matchesCount: 1,
      timestamp: '2026-06-14T15:30:00-07:00'
    },
    {
      id: 'sch_sunset_05',
      eventId: 'evt_sunset_fest',
      selfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      facesFound: 1,
      matchesCount: 0,
      timestamp: '2026-06-14T17:10:00-07:00'
    },
    {
      id: 'sch_sunset_06',
      eventId: 'evt_sunset_fest',
      selfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      facesFound: 1,
      matchesCount: 4,
      timestamp: '2026-06-15T11:20:00-07:00'
    },
    {
      id: 'sch_sunset_07',
      eventId: 'evt_sunset_fest',
      selfieUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      facesFound: 1,
      matchesCount: 6,
      timestamp: '2026-06-16T13:40:00-07:00'
    },
    {
      id: 'sch_sunset_08',
      eventId: 'evt_sunset_fest',
      selfieUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      facesFound: 1,
      matchesCount: 0,
      timestamp: '2026-06-16T16:05:00-07:00'
    },
    {
      id: 'sch_sunset_09',
      eventId: 'evt_sunset_fest',
      selfieUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      facesFound: 1,
      matchesCount: 8,
      timestamp: '2026-06-17T09:12:00-07:00'
    },
    {
      id: 'sch_sunset_10',
      eventId: 'evt_sunset_fest',
      selfieUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      facesFound: 1,
      matchesCount: 2,
      timestamp: '2026-06-17T18:22:00-07:00'
    },
    // Mock Searches for Grace & Arthur Wedding (evt_wedding)
    {
      id: 'sch_wed_01',
      eventId: 'evt_wedding',
      selfieUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
      facesFound: 1,
      matchesCount: 4,
      timestamp: '2026-06-13T14:00:00-07:00'
    },
    {
      id: 'sch_wed_02',
      eventId: 'evt_wedding',
      selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      facesFound: 1,
      matchesCount: 0,
      timestamp: '2026-06-14T11:25:00-07:00'
    },
    {
      id: 'sch_wed_03',
      eventId: 'evt_wedding',
      selfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      facesFound: 1,
      matchesCount: 3,
      timestamp: '2026-06-15T15:50:00-07:00'
    },
    {
      id: 'sch_wed_04',
      eventId: 'evt_wedding',
      selfieUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
      facesFound: 1,
      matchesCount: 2,
      timestamp: '2026-06-16T16:10:00-07:00'
    },
    {
      id: 'sch_wed_05',
      eventId: 'evt_wedding',
      selfieUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
      facesFound: 1,
      matchesCount: 1,
      timestamp: '2026-06-17T11:05:00-07:00'
    }
  ] as SearchHistory[],

  downloads: [
    {
      id: 'dw_1',
      photoId: 'pho_sunset_1',
      eventId: 'evt_sunset_fest',
      userEmail: 'tiffany@alvarez.com',
      timestamp: '2026-07-15T20:10:00-07:00'
    }
  ] as Download[],

  subscriptions: [
    {
      id: 'sub_photo_prof',
      userId: 'usr_photographer',
      planId: 'professional',
      status: 'active',
      amount: 49,
      billingPeriod: 'monthly',
      currentPeriodStart: '2026-06-01T00:00:00Z',
      currentPeriodEnd: '2026-07-01T00:00:00Z'
    },
    {
      id: 'sub_org_start',
      userId: 'usr_organizer',
      planId: 'starter',
      status: 'active',
      amount: 19,
      billingPeriod: 'monthly',
      currentPeriodStart: '2026-06-10T00:00:00Z',
      currentPeriodEnd: '2026-07-10T00:00:00Z'
    }
  ] as Subscription[],

  invoices: [
    {
      id: 'inv_1091',
      userId: 'usr_photographer',
      invoiceNumber: 'INV-2026-1091',
      planName: 'Professional Plan',
      amount: 49,
      currency: 'USD',
      status: 'paid',
      invoiceDate: '2026-06-01'
    },
    {
      id: 'inv_1092',
      userId: 'usr_organizer',
      invoiceNumber: 'INV-2026-1092',
      planName: 'Starter Plan',
      amount: 19,
      currency: 'USD',
      status: 'paid',
      invoiceDate: '2026-06-10'
    }
  ] as Invoice[],

  notifications: [
    {
      id: 'not_1',
      userId: 'usr_photographer',
      message: 'New event "Grace & Arthur Wedding" successfully provisioned!',
      type: 'success',
      isRead: false,
      timestamp: '2026-06-17T21:00:00-07:00'
    },
    {
      id: 'not_2',
      userId: 'usr_photographer',
      message: 'Your monthly storage usage has passed 200 GB.',
      type: 'info',
      isRead: true,
      timestamp: '2026-06-15T12:00:00-07:00'
    }
  ] as Notification[],

  auditLogs: [
    {
      id: 'log_1',
      userId: 'usr_photographer',
      userEmail: 'photographer@example.com',
      action: 'EVENT_CREATE',
      details: 'Created event "Summer Sunset Festival 2026"',
      timestamp: '2026-06-17T11:20:00-07:00'
    },
    {
      id: 'log_2',
      userId: 'usr_photographer',
      userEmail: 'photographer@example.com',
      action: 'PHOTO_UPLOAD_BULK',
      details: 'Uploaded 4 festival main camera files to evt_sunset_fest',
      timestamp: '2026-06-17T11:45:00-07:00'
    }
  ] as AuditLog[],

  ftpSettings: [
    {
      id: 'ftp_1',
      userId: 'usr_photographer',
      enabled: false,
      host: 'ftp.photoseek.ai',
      port: 2121,
      username: 'sterling_shutter',
      status: 'disconnected',
      lastSyncAt: undefined,
      scannedFilesCount: 0
    }
  ] as FTPSetting[]
};

// Database utility functions
function loadDb(): typeof defaultDb {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading database file:', error);
  }
  // If anything fails or file doesn't exist, build/write new one
  saveDb(defaultDb);
  return defaultDb;
}

function saveDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving database file:', error);
  }
}

// Ensure database file exists on startup
loadDb();

// Logger/Auditor Helper
function logAction(userId: string, email: string, action: string, details: string) {
  const db = loadDb();
  const newLog: AuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    userId,
    userEmail: email,
    action,
    details,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(newLog);
  saveDb(db);
}

// --- JWT/Session Auth Simulation Middleware ---
// To make things seamless for development, we will look for an Authorization header with Bearer <userId>.
// If present, we populate the current user. Otherwise, we default to Photographer if requested.
function authenticateUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const db = loadDb();
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const userId = authHeader.replace('Bearer ', '').trim();
    const user = db.users.find(u => u.id === userId);
    if (user) {
      (req as any).user = user;
      return next();
    }
  }
  // Soft fallback: If an action needs authorization, we can either throw 401 or fail gently.
  // For easy previewing, if we don't have token we will attach a mock photographer header so they never get stuck.
  const fallbackUser = db.users.find(u => u.role === 'photographer');
  (req as any).user = fallbackUser;
  next();
}

// Helper to calculate score similarities
function getJaccardSimilarity(arr1: string[], arr2: string[]): number {
  const s1 = new Set(arr1.map(t => t.toLowerCase()));
  const s2 = new Set(arr2.map(t => t.toLowerCase()));
  
  const intersection = new Set([...s1].filter(x => s2.has(x)));
  const union = new Set([...s1, ...s2]);
  
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

// SIMULATE FTPS automatic uploading detection logs
let ftpsScandRunning = false;
let ftpLogs: string[] = ['⚡ FTPS Monitor initialized. Ready to watch directory "/uploads"'];

// --- ENDPOINTS ---

// Auth Endpoints
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, role, company } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and Name are required fields' });
  }

  const db = loadDb();
  const existing = db.users.find(u => u.email === email);
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const newUser: User = {
    id: `usr_${Math.random().toString(36).substr(2, 9)}`,
    email,
    role: (role || 'photographer') as any,
    name,
    avatar: `https://images.unsplash.com/photo-${['1534528741775-53994a69daeb', '1500648767791-00dcc994a43e', '1544005313-94ddf0286df2'][Math.floor(Math.random() * 3)]}?auto=format&fit=crop&q=80&w=150`,
    company: company || '',
    subscriptionPlan: 'free',
    storageUsed: 0,
    storageLimit: 100, // 100 MB free tier
    revenue: 0
  };

  db.users.push(newUser);
  saveDb(db);
  
  logAction(newUser.id, newUser.email, 'USER_REGISTER', `Registered new role: ${newUser.role}`);
  res.json({ user: newUser, token: newUser.id });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  const db = loadDb();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'User not found. Try registering or use photographer@example.com' });
  }
  
  logAction(user.id, user.email, 'USER_LOGIN', `Logged in successfully via email provider`);
  res.json({ user, token: user.id });
});

app.get('/api/auth/me', authenticateUser, (req, res) => {
  res.json({ user: (req as any).user });
});

app.post('/api/auth/logout', authenticateUser, (req, res) => {
  const user = (req as any).user;
  if (user) {
    logAction(user.id, user.email, 'USER_LOGOUT', `User logged out of active session`);
  }
  res.json({ success: true });
});

// Event Endpoints
app.get('/api/events', authenticateUser, (req, res) => {
  const db = loadDb();
  const user = (req as any).user;
  
  // Super admin can see all; Photographer/Organizer see their owned events
  if (user && user.role === 'super_admin') {
    return res.json(db.events);
  } else if (user) {
    const list = db.events.filter(e => e.photographerId === user.id);
    return res.json(list);
  }
  res.json([]);
});

app.get('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDb();
  const event = db.events.find(e => e.id === id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json(event);
});

app.post('/api/events', authenticateUser, (req, res) => {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { name, date, location, description, downloadsLimit, expiryDate, customBranding } = req.body;
  if (!name) return res.status(400).json({ error: 'Event name is required' });

  const db = loadDb();
  
  // Custom plan limit constraints checks
  const currentEvents = db.events.filter(e => e.photographerId === user.id);
  const planLimits = { free: 1, starter: 10, professional: 100, enterprise: 99999 };
  const userLimit = planLimits[user.subscriptionPlan] || 1;
  
  if (currentEvents.length >= userLimit) {
    return res.status(400).json({ 
      error: `Upgrade Required! Your current subscription plan (${user.subscriptionPlan.toUpperCase()}) limits you to ${userLimit} events.` 
    });
  }

  const id = `evt_${Math.random().toString(36).substr(2, 9)}`;
  const newEvent: Event = {
    id,
    photographerId: user.id,
    name,
    date: date || new Date().toISOString().split('T')[0],
    location: location || '',
    description: description || '',
    status: 'active',
    qrCodeUrl: `/qr-${id}.png`,
    shareUrl: `/event/${id}`,
    totalGuests: 0,
    totalPhotos: 0,
    downloadsLimit: downloadsLimit ? parseInt(downloadsLimit) : undefined,
    expiryDate: expiryDate || undefined,
    customBranding: customBranding || {
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      watermarkText: `${name} © PhotoSeek`,
      enableWatermark: false
    }
  };

  db.events.push(newEvent);
  saveDb(db);
  
  logAction(user.id, user.email, 'EVENT_CREATE', `Created event: "${name}" (${id})`);
  res.json(newEvent);
});

app.put('/api/events/:id', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const updateData = req.body;

  const db = loadDb();
  const eventIdx = db.events.findIndex(e => e.id === id);
  if (eventIdx === -1) return res.status(404).json({ error: 'Event not found' });
  
  // Verify ownership
  if (user.role !== 'super_admin' && db.events[eventIdx].photographerId !== user.id) {
    return res.status(430).json({ error: 'Unauthorized to modify this event' });
  }

  db.events[eventIdx] = {
    ...db.events[eventIdx],
    ...updateData
  };

  saveDb(db);
  logAction(user.id, user.email, 'EVENT_UPDATE', `Updated settings for event: "${db.events[eventIdx].name}"`);
  res.json(db.events[eventIdx]);
});

app.delete('/api/events/:id', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  const db = loadDb();
  const idx = db.events.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Event not found' });

  if (user.role !== 'super_admin' && db.events[idx].photographerId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized delete action' });
  }

  const name = db.events[idx].name;
  db.events.splice(idx, 1);
  
  // Delete related photos
  db.photos = db.photos.filter(p => p.eventId !== id);
  db.guests = db.guests.filter(g => g.eventId !== id);
  
  saveDb(db);
  logAction(user.id, user.email, 'EVENT_DELETE', `Deleted event: "${name}" and all associated metadata`);
  res.json({ success: true });
});

// Archive event
app.post('/api/events/:id/archive', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  const db = loadDb();
  const event = db.events.find(e => e.id === id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  if (user.role !== 'super_admin' && event.photographerId !== user.id) {
    return res.status(403).json({ error: 'Unauthorized archive action' });
  }

  event.status = event.status === 'archived' ? 'active' : 'archived';
  saveDb(db);
  
  logAction(user.id, user.email, 'EVENT_ARCHIVE', `Toggled archive state to "${event.status}" on event: ${event.name}`);
  res.json(event);
});

// Event Analytics & Search Trends Endpoint
app.get('/api/events/:id/analytics', authenticateUser, (req, res) => {
  const { id } = req.params;
  const db = loadDb();
  
  const event = db.events.find(e => e.id === id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  // Get matching searches
  const history = db.searchHistory.filter((sh: any) => sh.eventId === id);
  
  // Aggregate daily: last 7 days from now
  const dailyAggregation: Record<string, { date: string; searches: number; success: number; failed: number }> = {};
  
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dailyAggregation[dateStr] = {
      date: dateStr,
      searches: 0,
      success: 0,
      failed: 0
    };
  }

  history.forEach((sh: any) => {
    if (!sh.timestamp) return;
    // Extract YYYY-MM-DD
    const dateStr = sh.timestamp.split('T')[0];
    if (!dailyAggregation[dateStr]) {
      dailyAggregation[dateStr] = {
        date: dateStr,
        searches: 0,
        success: 0,
        failed: 0
      };
    }
    dailyAggregation[dateStr].searches += 1;
    if (sh.matchesCount > 0) {
      dailyAggregation[dateStr].success += 1;
    } else {
      dailyAggregation[dateStr].failed += 1;
    }
  });

  const trend = Object.values(dailyAggregation).sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    searchHistory: history,
    trend,
    totalSearches: history.length,
    successfulSearches: history.filter((h: any) => h.matchesCount > 0).length,
    unsuccessfulSearches: history.filter((h: any) => h.matchesCount === 0).length
  });
});

// Duplicate event
app.post('/api/events/:id/duplicate', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  const db = loadDb();
  const source = db.events.find(e => e.id === id);
  if (!source) return res.status(404).json({ error: 'Event not found' });

  const duplicId = `evt_${Math.random().toString(36).substr(2, 9)}`;
  const duplicate: Event = {
    ...source,
    id: duplicId,
    name: `${source.name} (Copy)`,
    qrCodeUrl: `/qr-${duplicId}.png`,
    shareUrl: `/event/${duplicId}`,
    totalGuests: 0,
    totalPhotos: 0,
    status: 'draft'
  };

  db.events.push(duplicate);
  saveDb(db);
  
  logAction(user.id, user.email, 'EVENT_DUPLICATE', `Duplicated event: "${source.name}" into new draft copy: "${duplicate.name}"`);
  res.json(duplicate);
});

// Photo Management Endpoints
app.get('/api/photos', (req, res) => {
  const { eventId, includeArchived } = req.query;
  const db = loadDb();
  if (eventId) {
    const list = db.photos.filter(p => p.eventId === eventId && (includeArchived === 'true' || !p.isArchived));
    return res.json(list);
  }
  const list = db.photos.filter(p => includeArchived === 'true' || !p.isArchived);
  res.json(list);
});

app.post('/api/photos/upload', authenticateUser, async (req, res) => {
  const user = (req as any).user;
  const { eventId, fileName, fileData, tags, size } = req.body; // fileData represents base64 image data
  
  if (!eventId || !fileData) {
    return res.status(400).json({ error: 'Missing eventId or fileData payload' });
  }

  const db = loadDb();
  const event = db.events.find(e => e.id === eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  // Photo size calculation and storage allocation limit guard
  const incomingSizeMB = size ? (size / (1024 * 1024)) : 1.5; // defaults to 1.5 MB if missing
  if (user.storageUsed + incomingSizeMB > user.storageLimit) {
    return res.status(400).json({
      error: `Storage Threshold Reached! Uploading would exceed your ${user.subscriptionPlan.toUpperCase()} storage quota of ${user.storageLimit} MB. Please upgrade plan.`
    });
  }

  // Auto processing pipeline states simulation
  // 1. Store in Cloudflare R2 Mock Url (Apply watermark dynamically if event customization has it enabled)
  const branding = event.customBranding;
  const showWatermark = branding?.enableWatermark;
  const watermarkText = branding?.watermarkText;
  const watermarkLogo = branding?.logo;

  let finalFileData = fileData;
  if (showWatermark && fileData.startsWith('data:image')) {
    console.log(`Applying automated watermark on photo with text "${watermarkText}" and logo "${watermarkLogo ? 'custom-logo' : 'none'}"`);
    finalFileData = await applyWatermark(fileData, watermarkText || 'PhotoSeek AI Protected', watermarkLogo);
  }

  const generatedId = `pho_${Math.random().toString(36).substr(2, 9)}`;
  const mockUrl = finalFileData.startsWith('data:image') ? finalFileData : `https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800`;
  const mockThumbnail = mockUrl;

  let faceDetectionsList = [
    { x: Math.floor(Math.random() * 50) + 15, y: Math.floor(Math.random() * 40) + 15, width: 14, height: 18, confidence: 0.95 }
  ];
  let customTags = tags || ['auto-processed'];

  // 2. Call server-side Gemini to analyze faces and generate tags!
  const gemini = getGemini();
  if (gemini && fileData.startsWith('data:image')) {
    try {
      const mimeMatch = fileData.match(/^data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const base64CleanData = fileData.replace(/^data:image\/[a-z]+;base64,/, '');

      const response = await gemini.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            inlineData: {
              data: base64CleanData,
              mimeType
            }
          },
          'Analyze this photograph. Perform: 1. Count faces. 2. Provide realistic bounding boxes in percent [x, y, width, height] for each face. 3. Suggest 6 descriptive tags (e.g., gender, hair color, glasses, expressions). Give response strictly as a JSON object inside blocks.'
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              faceCount: { type: Type.INTEGER },
              faces: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    x: { type: Type.INTEGER },
                    y: { type: Type.INTEGER },
                    width: { type: Type.INTEGER },
                    height: { type: Type.INTEGER },
                    confidence: { type: Type.NUMBER }
                  }
                }
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['faceCount', 'faces', 'tags']
          }
        }
      });

      const text = response.text || '{}';
      const result = JSON.parse(text);
      if (result.faces && result.faces.length > 0) {
        faceDetectionsList = result.faces;
      }
      if (result.tags && result.tags.length > 0) {
        customTags = result.tags;
      }
    } catch (err) {
      console.error('Gemini Photo Pipeline analysis failed, falling back to smart rules:', err);
    }
  }

  const newPhoto: Photo = {
    id: generatedId,
    eventId,
    url: mockUrl,
    thumbnailUrl: mockThumbnail,
    size: size || (1.5 * 1024 * 1024),
    format: 'JPEG',
    faceDetections: faceDetectionsList,
    tags: Array.from(new Set([...customTags, 'detected-face'])),
    isBestShot: Math.random() > 0.8,
    uploadedAt: new Date().toISOString()
  };

  db.photos.unshift(newPhoto);
  event.totalPhotos = db.photos.filter(p => p.eventId === eventId).length;
  user.storageUsed = Math.floor((user.storageUsed + incomingSizeMB) * 10) / 10;
  
  saveDb(db);
  logAction(user.id, user.email, 'PHOTO_UPLOAD', `Uploaded photo ${generatedId} dynamically. Face search database updated.`);
  res.json(newPhoto);
});

// Batch uploading simulations (Folders, ZIPs)
app.post('/api/photos/batch', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const { eventId, count } = req.body;
  if (!eventId || !count) return res.status(400).json({ error: 'Missing batch arguments' });

  const db = loadDb();
  const event = db.events.find(e => e.id === eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const unsplashTemplates = [
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800',
    'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800',
  ];

  const added: Photo[] = [];
  for (let i = 0; i < count; i++) {
    const id = `pho_batch_${Date.now()}_${i}`;
    const url = unsplashTemplates[i % unsplashTemplates.length];
    const newPhoto: Photo = {
      id,
      eventId,
      url,
      thumbnailUrl: url,
      size: 1.2 * 1024 * 1024,
      format: 'JPEG',
      faceDetections: [{ x: 40, y: 30, width: 10, height: 14, confidence: 0.90 }],
      tags: [['female', 'joyful'], ['event', 'corporate'], ['wedding', 'party'], ['glasses']][i % 4],
      isBestShot: i === 0,
      uploadedAt: new Date().toISOString()
    };
    db.photos.unshift(newPhoto);
    added.push(newPhoto);
  }

  event.totalPhotos = db.photos.filter(p => p.eventId === eventId).length;
  saveDb(db);
  logAction(user.id, user.email, 'PHOTO_UPLOAD_BULK', `Batch uploaded ${count} photos successfully under ${event.name}`);
  res.json({ success: true, count, added });
});

app.post('/api/photos/:id/best-shot', authenticateUser, (req, res) => {
  const { id } = req.params;
  const db = loadDb();
  const photo = db.photos.find(p => p.id === id);
  if (!photo) return res.status(404).json({ error: 'Photo not found' });

  photo.isBestShot = !photo.isBestShot;
  saveDb(db);
  res.json(photo);
});

app.delete('/api/photos/:id', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;

  const db = loadDb();
  const idx = db.photos.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Photo not found' });

  const eventId = db.photos[idx].eventId;
  const event = db.events.find(e => e.id === eventId);
  db.photos.splice(idx, 1);

  if (event) {
    event.totalPhotos = db.photos.filter(p => p.eventId === eventId).length;
  }

  saveDb(db);
  logAction(user.id, user.id, 'PHOTO_DELETE', `Deleted photo ID: ${id}`);
  res.json({ success: true });
});

// Selfie Instant matching and Face vector search
app.post('/api/photos/search', async (req, res) => {
  const { eventId, selfieBase64, name, email, phone, threshold = 0.5 } = req.body;
  if (!eventId || !selfieBase64) {
    return res.status(400).json({ error: 'eventId and selfieBase64 are required' });
  }

  const db = loadDb();
  const event = db.events.find(e => e.id === eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  // 1. Create a guest profile entry for security mapping
  const gstId = `gst_${Math.random().toString(36).substr(2, 9)}`;
  const newGuest: Guest = {
    id: gstId,
    name: name || 'Guest Explorer',
    email: email || undefined,
    phone: phone || undefined,
    selfieUrl: selfieBase64,
    eventId,
    joinedAt: new Date().toISOString()
  };
  db.guests.push(newGuest);

  // 2. Perform AI Face embedding/tags generation via Gemini
  let selfieTags: string[] = ['joyful'];
  let facesDetected = 1;
  const gemini = getGemini();

  if (gemini) {
    try {
      // clean base64 data strings
      const base64CleanData = selfieBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      const mimeMatch = selfieBase64.match(/^data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      const response = await gemini.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            inlineData: {
              data: base64CleanData,
              mimeType
            }
          },
          'You are a facial biometric analysis pipeline. Characterize the key visible attributes of the main face in this image. Give me a simple list of exactly 6 keywords (e.g., hair color style, glasses presentation, beard, gender vibes, smile state, clothes color). Return strictly inside a JSON array of strings.'
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const responseText = response.text || '[]';
      const tagsParsed = JSON.parse(responseText);
      if (Array.isArray(tagsParsed) && tagsParsed.length > 0) {
        selfieTags = tagsParsed;
      }
    } catch (e) {
      console.error('Selfie analysis failed, doing fallback tags match:', e);
      // Fallback tags based on simple prompt matches
      selfieTags = ['female', 'smiling', 'brunette', 'sunglasses'];
    }
  } else {
    // Elegant fuzzy random fallback if no API key is specified
    selfieTags = ['female', 'smiling', 'brunette', 'glasses'];
  }

  // 3. Search vector database / tags Jaccard similarity across photos in the event
  const eligiblePhotos = db.photos.filter(p => p.eventId === eventId && !p.isArchived);
  const matchedPhotos = eligiblePhotos.map(photo => {
    // Generate simulated pgvector face-embedding similarity
    const tagSimilarity = getJaccardSimilarity(selfieTags, photo.tags);
    // Add random floating element to simulate realistic biometric match weights in pgvector
    const baseSim = tagSimilarity * 0.7;
    const fuzzSim = 0.3 * (photo.id.startsWith('pho_sunset_1') && selfieBase64.includes('sunglasses') ? 0.95 : Math.random());
    const score = Math.min(1.0, Math.floor((baseSim + fuzzSim) * 100) / 100);

    return {
      photo,
      score
    };
  }).filter(res => res.score >= Number(threshold))
    .sort((a, b) => b.score - a.score);

  // 4. Save Search history trace
  const newHist: SearchHistory = {
    id: `sch_${Date.now()}`,
    eventId,
    selfieUrl: selfieBase64,
    facesFound: facesDetected,
    matchesCount: matchedPhotos.length,
    timestamp: new Date().toISOString()
  };
  db.searchHistory.push(newHist);
  saveDb(db);

  // Update total guest metric count
  event.totalGuests = db.guests.filter(g => g.eventId === eventId).length;
  saveDb(db);

  res.json({
    guest: newGuest,
    searchHistoryId: newHist.id,
    selfieTags,
    resultsCount: matchedPhotos.length,
    results: matchedPhotos.map(m => ({
      ...m.photo,
      matchScore: m.score
    }))
  });
});

// Logs for downloading files + watermarking count
app.post('/api/downloads', (req, res) => {
  const { photoId, eventId, userEmail } = req.body;
  if (!photoId || !eventId) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  const db = loadDb();
  const newDown: Download = {
    id: `dw_${Date.now()}`,
    photoId,
    eventId,
    userEmail: userEmail || 'anonymous@guest.com',
    timestamp: new Date().toISOString()
  };
  db.downloads.unshift(newDown);
  saveDb(db);
  res.json(newDown);
});

// FTP Synchronization settings & logs watcher
app.get('/api/ftp/config', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const db = loadDb();
  let conf = db.ftpSettings.find(f => f.userId === user.id);
  if (!conf) {
    conf = {
      id: `ftp_${Date.now()}`,
      userId: user.id,
      enabled: false,
      host: 'ftps.photoseek.ai',
      port: 21,
      username: user.email.split('@')[0],
      status: 'disconnected',
      scannedFilesCount: 0
    };
    db.ftpSettings.push(conf);
    saveDb(db);
  }
  res.json({ config: conf, logs: ftpLogs });
});

app.post('/api/ftp/config', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const db = loadDb();
  const index = db.ftpSettings.findIndex(f => f.userId === user.id);
  if (index === -1) {
    return res.status(410).json({ error: 'Config missing' });
  }
  db.ftpSettings[index] = {
    ...db.ftpSettings[index],
    ...req.body
  };
  saveDb(db);
  res.json(db.ftpSettings[index]);
});

app.post('/api/ftp/sync-trigger', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const { eventId } = req.body;
  const db = loadDb();
  const ftp = db.ftpSettings.find(f => f.userId === user.id);

  if (!ftp) return res.status(404).json({ error: 'FTP Config not initialized' });
  
  ftp.status = 'connected';
  const timestamp = new Date().toLocaleTimeString();
  ftpLogs.unshift(`[${timestamp}] 🔁 Sync request initialized. Connecting to FTPS ${ftp.host}:${ftp.port}...`);
  ftpLogs.unshift(`[${timestamp}] ✔ Authentication successful for user '${ftp.username}'`);
  ftpLogs.unshift(`[${timestamp}] 📁 Scanning directory: /wedding_raw/`);
  ftpLogs.unshift(`[${timestamp}] 🔍 Detected 3 unresolved RAW camera files.`);

  // Append simulated photo uploads
  const mockUnsplash = 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800';
  for (let i = 1; i <= 3; i++) {
    const id = `pho_ftps_${Date.now()}_${i}`;
    const newPhoto: Photo = {
      id,
      eventId: eventId || 'evt_wedding',
      url: mockUnsplash,
      thumbnailUrl: mockUnsplash,
      size: 3400500,
      format: 'JPEG/RAW',
      faceDetections: [{ x: 45, y: 25, width: 12, height: 16, confidence: 0.94 }],
      tags: ['wedding', 'ftps-synced', 'couple'],
      isBestShot: false,
      uploadedAt: new Date().toISOString()
    };
    db.photos.unshift(newPhoto);
    ftpLogs.unshift(`[${timestamp}] ⚙ Processing: "DSC_049${i}.JPG" — Cloudflare R2 backup success. Embeddings mapped.`);
  }

  ftp.scannedFilesCount += 3;
  ftp.lastSyncAt = new Date().toISOString();
  
  // update related event total photos
  const event = db.events.find(e => e.id === (eventId || 'evt_wedding'));
  if (event) {
    event.totalPhotos = db.photos.filter(p => p.eventId === event.id).length;
  }

  saveDb(db);
  res.json({ success: true, ftp, logs: ftpLogs });
});

// Payments & Subscriptions
app.post('/api/payments/create-session', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const { planId, billingPeriod } = req.body;
  if (!planId) return res.status(400).json({ error: 'planId is required' });

  const priceMapping = {
    free: 0,
    starter: 19,
    professional: 49,
    enterprise: 199
  };

  const amount = priceMapping[planId as SubscriptionPlan] || 0;
  res.json({
    sessionId: `pay_sess_${Date.now()}`,
    amount,
    currency: 'USD',
    planId,
    billingPeriod: billingPeriod || 'monthly'
  });
});

app.post('/api/payments/verify', authenticateUser, (req, res) => {
  const user = (req as any).user;
  const { sessionId, planId, billingPeriod } = req.body;
  if (!sessionId || !planId) return res.status(400).json({ error: 'Missing payment args' });

  const db = loadDb();
  
  // 1. Upgrade User subscription tier status
  const userIdx = db.users.findIndex(u => u.id === user.id);
  if (userIdx !== -1) {
    db.users[userIdx].subscriptionPlan = planId;
    const limits = { free: 100, starter: 10000, professional: 500000, enterprise: 99999999 };
    db.users[userIdx].storageLimit = limits[planId as SubscriptionPlan];
  }

  const amt = { free: 0, starter: 19, professional: 49, enterprise: 199 }[planId as SubscriptionPlan] || 0;

  // 2. Generate Invoice record
  const invNumber = `INV-2026-${Math.floor(Math.random() * 9000) + 1000}`;
  const invoice: Invoice = {
    id: `inv_${Date.now()}`,
    userId: user.id,
    invoiceNumber: invNumber,
    planName: `${planId.toUpperCase()} Subscription Pack`,
    amount: amt,
    currency: 'USD',
    status: 'paid',
    invoiceDate: new Date().toISOString().split('T')[0]
  };
  db.invoices.unshift(invoice);

  // 3. Register Subscription log
  const newSub: Subscription = {
    id: `sub_${Date.now()}`,
    userId: user.id,
    planId,
    status: 'active',
    amount: amt,
    billingPeriod: billingPeriod || 'monthly',
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };
  db.subscriptions.unshift(newSub);

  saveDb(db);
  logAction(user.id, user.email, 'PAYMENT_BILLING', `Upgraded to subscription plan: ${planId.toUpperCase()} via session ${sessionId}`);
  res.json({ success: true, user: db.users[userIdx], invoice });
});

// Admin Panel Lists & Stats
app.get('/api/admin/overview', authenticateUser, (req, res) => {
  const user = (req as any).user;
  if (user && user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const db = loadDb();
  const totalUsers = db.users.length;
  const totalEvents = db.events.length;
  const totalPhotosCount = db.photos.length;
  const totalInvoiced = db.invoices.reduce((sum, i) => sum + i.amount, 0);

  res.json({
    totalUsers,
    totalEvents,
    totalPhotosCount,
    totalInvoiced,
    users: db.users,
    invoices: db.invoices,
    recentLogs: db.auditLogs.slice(0, 10)
  });
});

app.get('/api/audit-logs', authenticateUser, (req, res) => {
  const db = loadDb();
  res.json(db.auditLogs);
});

// --- BACKGROUND EXPIRY & AUTOPURGE RETENTION TASK CRON ---
function runBackgroundExpiryCheck() {
  try {
    const db = loadDb();
    let changed = false;
    const now = new Date();

    db.events.forEach((event: any) => {
      // Find normal active photos for this event
      let hasActivePhotos = db.photos.some((p: any) => p.eventId === event.id && !p.isArchived);
      if (!hasActivePhotos) return;

      let shouldArchive = false;
      let reason = '';

      // 1. Explicit Expiry Date check
      if (event.expiryDate) {
        const expDate = new Date(event.expiryDate);
        if (expDate < now) {
          shouldArchive = true;
          reason = `Explicit Event Expiry Date (${event.expiryDate}) has passed.`;
        }
      }

      // 2. Retention Period in Days after Event Date check
      if (!shouldArchive && event.retentionPeriodDays && event.date) {
        const eventDate = new Date(event.date);
        const retentionDateLimit = new Date(eventDate.getTime() + event.retentionPeriodDays * 24 * 60 * 60 * 1000);
        if (retentionDateLimit < now) {
          shouldArchive = true;
          reason = `Auto-retention expiry term of ${event.retentionPeriodDays} days has passed since Event Date (${event.date}).`;
        }
      }

      if (shouldArchive) {
        // Move all matching photos to archived state
        db.photos.forEach((p: any) => {
          if (p.eventId === event.id && !p.isArchived) {
            p.isArchived = true;
            changed = true;
          }
        });

        // Add to audit logs
        const systemLog = {
          id: `log_cron_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: event.photographerId || 'system',
          userEmail: 'system-retention@photoseek.ai',
          action: 'AUTO_ARCHIVE_PHOTOS',
          details: `Cron Task Auto-Archival triggered for event "${event.name}" (${event.id}). Reason: ${reason} Photos updated.`,
          timestamp: new Date().toISOString()
        };
        db.auditLogs.unshift(systemLog);

        // Notify user/owner
        const notification: Notification = {
          id: `notif_cron_${Date.now()}`,
          userId: event.photographerId,
          message: `Notice: Photos for "${event.name}" have been auto-archived. Expiry/Retention rules satisfied.`,
          type: 'warning',
          isRead: false,
          timestamp: new Date().toISOString()
        };
        db.notifications.unshift(notification);
        changed = true;
      }
    });

    if (changed) {
      saveDb(db);
      console.log(`[Expiry Cron] Checked active event datasets. Automatic purging/archiving updated.`);
    }
  } catch (error) {
    console.error('[Expiry Cron Error]:', error);
  }
}

// Poll every 30 seconds for immediate responsiveness
setInterval(runBackgroundExpiryCheck, 30 * 1000);

// Run also on startup
setTimeout(runBackgroundExpiryCheck, 5000);

// --- LOAD ENGINES ---

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[PhotoSeek AI] Express server launched on host 0.0.0.0 and port ${PORT}`);
});

// Setup Vite Development and Statics Routing Node Process
async function startViteServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('[Vite Engine] Mounted Vite Development Server middleware inside Express.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Production Engine] Static content route serving pointing to /dist.');
  }
}

startViteServer();
