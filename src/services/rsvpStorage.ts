import { RsvpSubmission, WeddingEventInfo, GoogleSheetsConfig, AdminStats } from '../types';
import couplePhoto from '../assets/images/bricia_alan_banner_1789495448570.jpg'; 

const STORAGE_KEY_RSVPS = 'boda_rsvp_submissions_v1';
const STORAGE_KEY_CONFIG = 'boda_sheet_config_v1';
const STORAGE_KEY_EVENT = 'boda_event_info_v2';


export const DEFAULT_EVENT_INFO: WeddingEventInfo = {
  coupleNames: 'Bricia & Alan',
  weddingDate: 'Sábado 14 de Noviembre de 2026',
  weddingDateIso: '2026-11-14T17:00:00',
  ceremonyTime: '12:00 hrs',
  photoUrl: couplePhoto, // 2. Usa la variable importada aquí
  quote: '¡Nos encantará vivir este momento contigo!',
};

const INITIAL_SAMPLE_RSVPS: RsvpSubmission[] = [
  {
    id: 'rsvp_sample_1',
    timestamp: '2026-09-12 14:30:22',
    fullName: 'Mariana Valenzuela & Carlos Ruiz',
    attending: 'yes',
    guestCount: 2,
    companionNames: ['Carlos Ruiz'],
    dietaryRestrictions: ['Vegetariano'],
    dietaryDetails: 'Mariana es vegetariana, Carlos sin restricciones.',
    message: '¡Muchísimas felicidades Bricia y Alan! No podemos esperar para celebrar con ustedes.',
    maxGuestsAllocated: 2,
    syncedToSheets: false,
  },
  
];

export const getStoredRsvps = (): RsvpSubmission[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RSVPS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_RSVPS, JSON.stringify(INITIAL_SAMPLE_RSVPS));
      return INITIAL_SAMPLE_RSVPS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading RSVPs from storage', e);
    return INITIAL_SAMPLE_RSVPS;
  }
};

export const saveRsvpToStorage = (rsvp: RsvpSubmission): RsvpSubmission[] => {
  const current = getStoredRsvps();
  // If exists with same name/id, update or prepend
  const filtered = current.filter((item) => item.id !== rsvp.id);
  const updated = [rsvp, ...filtered];
  try {
    localStorage.setItem(STORAGE_KEY_RSVPS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving RSVP to storage', e);
  }
  return updated;
};

export const markRsvpsAsSynced = (ids: string[]): RsvpSubmission[] => {
  const current = getStoredRsvps();
  const updated = current.map((item) => {
    if (ids.includes(item.id)) {
      return { ...item, syncedToSheets: true };
    }
    return item;
  });
  localStorage.setItem(STORAGE_KEY_RSVPS, JSON.stringify(updated));
  return updated;
};

export const getStoredEventInfo = (): WeddingEventInfo => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EVENT);
    if (!raw) return DEFAULT_EVENT_INFO;
    const parsed = JSON.parse(raw);
    const dateFormatted = parsed.weddingDate
      ? parsed.weddingDate.replace('Sábado, 14', 'Sábado 14')
      : 'Sábado 14 de Noviembre de 2026';
    return { ...DEFAULT_EVENT_INFO, ...parsed, weddingDate: dateFormatted };
  } catch (e) {
    return DEFAULT_EVENT_INFO;
  }
};

export const saveEventInfo = (info: WeddingEventInfo): void => {
  try {
    localStorage.setItem(STORAGE_KEY_EVENT, JSON.stringify(info));
  } catch (e) {
    console.error('Error saving event info', e);
  }
};

export const getStoredSheetConfig = (): GoogleSheetsConfig | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const saveStoredSheetConfig = (config: GoogleSheetsConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving sheet config', e);
  }
};

export const calculateStats = (rsvps: RsvpSubmission[]): AdminStats => {
  const totalResponses = rsvps.length;
  let confirmedAttending = 0;
  let totalGuestsAttending = 0;
  let declined = 0;
  let dietaryRestrictionsCount = 0;

  rsvps.forEach((r) => {
    if (r.attending === 'yes') {
      confirmedAttending += 1;
      totalGuestsAttending += r.guestCount || 1;
    } else {
      declined += 1;
    }
    if (r.dietaryRestrictions.length > 0 || (r.dietaryDetails && r.dietaryDetails.trim().length > 0)) {
      dietaryRestrictionsCount += 1;
    }
  });

  return {
    totalResponses,
    confirmedAttending,
    totalGuestsAttending,
    declined,
    dietaryRestrictionsCount,
  };
};

export const exportToCsv = (rsvps: RsvpSubmission[], coupleNames: string): void => {
  const headers = [
    'Fecha y Hora',
    'Nombre Completo',
    '¿Asiste?',
    'Total Asistentes',
    'Pases Asignados',
    'Acompañantes',
    'Restricciones Alimentarias',
    'Detalles de Alergias',
    'Mensaje a los Novios',
    'Sincronizado en Drive',
  ];

  const escapeCsv = (val: string | number | undefined) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = rsvps.map((r) => [
    escapeCsv(r.timestamp),
    escapeCsv(r.fullName),
    escapeCsv(r.attending === 'yes' ? 'SÍ' : 'NO'),
    escapeCsv(r.attending === 'yes' ? r.guestCount : 0),
    escapeCsv(r.maxGuestsAllocated),
    escapeCsv(r.companionNames.join('; ')),
    escapeCsv(r.dietaryRestrictions.join('; ')),
    escapeCsv(r.dietaryDetails),
    escapeCsv(r.message),
    escapeCsv(r.syncedToSheets ? 'Sí' : 'Pendiente'),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const cleanNames = coupleNames.replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `Confirmaciones_Boda_${cleanNames}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
