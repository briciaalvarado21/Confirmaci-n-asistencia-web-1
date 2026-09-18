export interface WeddingEventInfo {
  coupleNames: string;
  weddingDate: string;
  weddingDateIso: string;
  ceremonyTime?: string;
  ceremonyVenue?: string;
  ceremonyAddress?: string;
  receptionTime?: string;
  receptionVenue?: string;
  receptionAddress?: string;
  dressCode?: string;
  photoUrl: string;
  quote?: string;
}

export interface GuestInvitation {
  id: string;
  guestName: string;
  maxGuests: number;
  customNote?: string;
}

export interface RsvpSubmission {
  id: string;
  timestamp: string;
  fullName: string;
  attending: 'yes' | 'no';
  guestCount: number;
  companionNames: string[];
  dietaryRestrictions: string[];
  dietaryDetails: string;
  message?: string;
  maxGuestsAllocated: number;
  syncedToSheets?: boolean;
  sheetsRowIndex?: number;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetName: string;
  lastSyncedAt?: string;
}

export interface AdminStats {
  totalResponses: number;
  confirmedAttending: number;
  totalGuestsAttending: number;
  declined: number;
  dietaryRestrictionsCount: number;
}
