'use client';

import React from 'react';

// ==============================================================================
// Official Google Product Vector Icons (SVGs)
// ==============================================================================

export function GmailIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6Z" fill="#EA4335" />
      <path d="M2 6L12 13L22 6V18H2V6Z" fill="#C5221F" />
      <path d="M22 6L12 13L2 6H22Z" fill="#EA4335" />
      <path d="M2 6V18H7V9.5L2 6Z" fill="#4285F4" />
      <path d="M22 6V18H17V9.5L22 6Z" fill="#34A853" />
      <path d="M17 9.5L12 13L7 9.5V18H17V9.5Z" fill="#FBBC05" />
      <path d="M7 9.5L12 13L17 9.5L12 6L7 9.5Z" fill="#EA4335" />
    </svg>
  );
}

export function GoogleDriveIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.07 19.5L2.83 10.42L5.83 5.22L11.07 14.3L8.07 19.5Z" fill="#0066DA" />
      <path d="M15.93 19.5H8.07L11.07 14.3H18.93L15.93 19.5Z" fill="#00AC47" />
      <path d="M18.93 14.3L13.69 5.22H19.69L24.93 14.3H18.93Z" fill="#EA4335" />
      <path d="M13.69 5.22L11.07 9.76L5.83 5.22H13.69Z" fill="#FFBA00" />
      <path d="M11.07 9.76L8.07 14.3L2.83 10.42L5.83 5.22L11.07 9.76Z" fill="#0066DA" />
      <path d="M13.69 5.22H19.69L14.45 14.3L11.07 9.76L13.69 5.22Z" fill="#FFBA00" />
    </svg>
  );
}

export function GoogleSheetsIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.5 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V7.5L14.5 2Z" fill="#0F9D58" />
      <path d="M14.5 2V7.5H20L14.5 2Z" fill="#87CEAB" />
      <rect x="7" y="11" width="10" height="7" rx="0.5" fill="#FFFFFF" fillOpacity="0.9" />
      <rect x="7" y="11" width="10" height="2" fill="#0B8043" />
      <path d="M10.3 11V18M13.7 11V18" stroke="#0B8043" strokeWidth="0.8" />
      <path d="M7 15.5H17" stroke="#0B8043" strokeWidth="0.8" />
    </svg>
  );
}

export function GoogleDocsIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.5 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V7.5L14.5 2Z" fill="#4285F4" />
      <path d="M14.5 2V7.5H20L14.5 2Z" fill="#A1C2FA" />
      <rect x="7.5" y="11" width="9" height="1.5" rx="0.5" fill="#FFFFFF" />
      <rect x="7.5" y="14" width="9" height="1.5" rx="0.5" fill="#FFFFFF" />
      <rect x="7.5" y="17" width="6" height="1.5" rx="0.5" fill="#FFFFFF" />
    </svg>
  );
}

export function GoogleCalendarIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="17" rx="2.5" fill="#FFFFFF" />
      <path d="M3 6.5C3 5.12 4.12 4 5.5 4H18.5C19.88 4 21 5.12 21 6.5V9H3V6.5Z" fill="#4285F4" />
      <path d="M8 2V5M16 2V5" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
      <rect x="3" y="9" width="18" height="12" rx="0 0 2.5 2.5" fill="#4285F4" fillOpacity="0.08" />
      <text x="12" y="17.5" textAnchor="middle" fill="#1E40AF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
        31
      </text>
    </svg>
  );
}

export function GoogleMeetIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="5" width="13" height="14" rx="2.5" fill="#00AC47" />
      <path d="M15 10.5L20.5 6.5C21.1 6.1 22 6.5 22 7.2V16.8C22 17.5 21.1 17.9 20.5 17.5L15 13.5V10.5Z" fill="#00832D" />
      <path d="M15 13.5L20.5 17.5C21.1 17.9 22 17.5 22 16.8V15.5L15 10.5V13.5Z" fill="#EA4335" />
      <path d="M15 7.5V10.5L20.5 6.5C21.1 6.1 22 6.5 22 7.2V8.5L15 13.5V7.5Z" fill="#FFBA00" />
      <rect x="4.5" y="7.5" width="8" height="9" rx="1.5" fill="#FFFFFF" fillOpacity="0.25" />
    </svg>
  );
}

export function GoogleFormsIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.5 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V7.5L14.5 2Z" fill="#7248B9" />
      <path d="M14.5 2V7.5H20L14.5 2Z" fill="#B39DDB" />
      <circle cx="7.5" cy="11.5" r="1" fill="#FFFFFF" />
      <rect x="10" y="11" width="6.5" height="1.2" rx="0.5" fill="#FFFFFF" />
      <circle cx="7.5" cy="14.5" r="1" fill="#FFFFFF" />
      <rect x="10" y="14" width="6.5" height="1.2" rx="0.5" fill="#FFFFFF" />
      <circle cx="7.5" cy="17.5" r="1" fill="#FFFFFF" />
      <rect x="10" y="17" width="6.5" height="1.2" rx="0.5" fill="#FFFFFF" />
    </svg>
  );
}

export function GoogleSlidesIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.5 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V7.5L14.5 2Z" fill="#F4B400" />
      <path d="M14.5 2V7.5H20L14.5 2Z" fill="#FCE8B2" />
      <rect x="7" y="11" width="10" height="7" rx="1" fill="#FFFFFF" />
      <rect x="8.5" y="12.5" width="7" height="4" rx="0.5" fill="#F4B400" />
    </svg>
  );
}

// ==============================================================================
// Product Definition & Registry Interface
// ==============================================================================

export interface GoogleProductDefinition {
  id: string;
  name: string;
  shortName: string;
  scope: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconUrl?: string; // Optional URL if user supplies custom asset file/folder
  category: 'email' | 'files' | 'collaboration' | 'workspace';
  isGranularPicker?: boolean;
  apiUrlPlaceholder?: string; // Kept as requested without hardcoded live APIs
}

export const GOOGLE_PRODUCTS_MAP: Record<string, GoogleProductDefinition> = {
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    shortName: 'Gmail',
    scope: 'https://www.googleapis.com/auth/gmail.send',
    description: 'Outbound email delivery authorization (gmail.send) to dispatch reports and notifications.',
    icon: GmailIcon,
    category: 'email',
    apiUrlPlaceholder: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
  },
  drive_picker: {
    id: 'drive_picker',
    name: 'Google Drive File Picker',
    shortName: 'Drive Picker',
    scope: 'https://www.googleapis.com/auth/drive.file',
    description: 'Safe granular per-file authorization (drive.file) for specific spreadsheets or docs you explicitly choose.',
    icon: GoogleDriveIcon,
    category: 'files',
    isGranularPicker: true,
    apiUrlPlaceholder: 'https://www.googleapis.com/drive/v3/files',
  },
  sheets: {
    id: 'sheets',
    name: 'Google Sheets',
    shortName: 'Sheets',
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    description: 'Direct read and append operations on Google Spreadsheets data tables.',
    icon: GoogleSheetsIcon,
    category: 'files',
    apiUrlPlaceholder: 'https://sheets.googleapis.com/v4/spreadsheets',
  },
  drive: {
    id: 'drive',
    name: 'Google Drive',
    shortName: 'Drive',
    scope: 'https://www.googleapis.com/auth/drive',
    description: 'Google Drive file management, search, and storage operations.',
    icon: GoogleDriveIcon,
    category: 'files',
    apiUrlPlaceholder: 'https://www.googleapis.com/drive/v3/files',
  },
  docs: {
    id: 'docs',
    name: 'Google Docs',
    shortName: 'Docs',
    scope: 'https://www.googleapis.com/auth/documents',
    description: 'Read and update text, tables, and paragraphs inside Google Documents.',
    icon: GoogleDocsIcon,
    category: 'files',
    apiUrlPlaceholder: 'https://docs.googleapis.com/v1/documents',
  },
  calendar: {
    id: 'calendar',
    name: 'Google Calendar',
    shortName: 'Calendar',
    scope: 'https://www.googleapis.com/auth/calendar.events',
    description: 'Create and sync schedule reminders, event bookings, and meeting invitations.',
    icon: GoogleCalendarIcon,
    category: 'collaboration',
    apiUrlPlaceholder: 'https://www.googleapis.com/calendar/v3/calendars',
  },
  meet: {
    id: 'meet',
    name: 'Google Meet',
    shortName: 'Meet',
    scope: 'https://www.googleapis.com/auth/meetings.space.created',
    description: 'Provision Google Meet video conference spaces and direct join links automatically.',
    icon: GoogleMeetIcon,
    category: 'collaboration',
    apiUrlPlaceholder: 'https://meet.googleapis.com/v2/spaces',
  },
  forms: {
    id: 'forms',
    name: 'Google Forms',
    shortName: 'Forms',
    scope: 'https://www.googleapis.com/auth/forms.body',
    description: 'Read questionnaire responses and configure automated Google Form templates.',
    icon: GoogleFormsIcon,
    category: 'collaboration',
    apiUrlPlaceholder: 'https://forms.googleapis.com/v1/forms',
  },
  slides: {
    id: 'slides',
    name: 'Google Slides',
    shortName: 'Slides',
    scope: 'https://www.googleapis.com/auth/presentations',
    description: 'Generate dynamic presentation slides and charts from automated workflow data.',
    icon: GoogleSlidesIcon,
    category: 'collaboration',
    apiUrlPlaceholder: 'https://slides.googleapis.com/v1/presentations',
  },
};

/**
 * Normalizes any free-form string or product reference into a standard product key.
 */
export function normalizeGoogleProductKey(raw: string): string {
  const s = raw.toLowerCase().trim();
  if (!s) return '';
  if (s === 'drive_picker' || s === 'drive.file' || s.includes('picker')) return 'drive_picker';
  if (s.includes('sheet')) return 'sheets';
  if (s.includes('doc')) return 'docs';
  if (s.includes('slide')) return 'slides';
  if (s.includes('meet')) return 'meet';
  if (s.includes('calendar') || s.includes('cal')) return 'calendar';
  if (s.includes('form')) return 'forms';
  if (s.includes('gmail') || s.includes('email') || s.includes('mail')) return 'gmail';
  if (s.includes('drive')) return 'drive';
  return s;
}

/**
 * Returns metadata definition for a given product name/key.
 */
export function getGoogleProductDefinition(rawKey: string): GoogleProductDefinition {
  const norm = normalizeGoogleProductKey(rawKey);
  if (GOOGLE_PRODUCTS_MAP[norm]) {
    return GOOGLE_PRODUCTS_MAP[norm];
  }
  // Generic fallback if unknown product is provided
  return {
    id: norm,
    name: rawKey.charAt(0).toUpperCase() + rawKey.slice(1),
    shortName: rawKey,
    scope: `https://www.googleapis.com/auth/${norm}`,
    description: `Google ${rawKey} workspace integration permission.`,
    icon: GoogleDriveIcon,
    category: 'workspace',
    apiUrlPlaceholder: `https://${norm}.googleapis.com/v1`,
  };
}

