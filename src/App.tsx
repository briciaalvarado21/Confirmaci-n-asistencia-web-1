/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/auth';
import {
  findOrCreateWeddingSpreadsheet,
  appendRsvpToSheet,
} from './services/googleSheets';
import {
  getStoredRsvps,
  saveRsvpToStorage,
  markRsvpsAsSynced,
  getStoredEventInfo,
  saveEventInfo,
  getStoredSheetConfig,
  saveStoredSheetConfig,
  calculateStats,
  exportToCsv,
} from './services/rsvpStorage';
import { RsvpSubmission, WeddingEventInfo, GoogleSheetsConfig } from './types';
import { CouplePhotoSection } from './components/CouplePhotoSection';
import { RsvpForm } from './components/RsvpForm';
import { ConfirmationSuccessModal } from './components/ConfirmationSuccessModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [eventInfo, setEventInfo] = useState<WeddingEventInfo>(getStoredEventInfo);
  const [rsvps, setRsvps] = useState<RsvpSubmission[]>(getStoredRsvps);
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig | null>(getStoredSheetConfig);

  // Authentication state for Google Workspace
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Invitation link query parameters
  const [guestNameFromUrl, setGuestNameFromUrl] = useState('');
  const [maxGuestsFromUrl, setMaxGuestsFromUrl] = useState<number>(2);

  // Modals
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [latestSubmission, setLatestSubmission] = useState<RsvpSubmission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  // Parse URL parameters (?nombre=...&pases=...&admin=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nombre = params.get('nombre') || params.get('name') || '';
    const pases = params.get('pases') || params.get('invitados') || params.get('max') || '2';
    const adminMode = params.get('admin');

    if (nombre) {
      setGuestNameFromUrl(nombre);
    }
    const parsedPasses = parseInt(pases, 10);
    if (!isNaN(parsedPasses) && parsedPasses > 0) {
      setMaxGuestsFromUrl(parsedPasses);
    }
    if (adminMode === '1' || adminMode === 'true') {
      setIsAdminOpen(true);
    }
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setCurrentUser(user);
        setGoogleToken(token);
        // Automatically find or create the wedding spreadsheet upon sign-in
        try {
          const sheetInfo = await findOrCreateWeddingSpreadsheet(token, `Confirmaciones Boda - ${eventInfo.coupleNames}`);
          const config: GoogleSheetsConfig = {
            spreadsheetId: sheetInfo.spreadsheetId,
            spreadsheetUrl: sheetInfo.spreadsheetUrl,
            sheetName: sheetInfo.title,
            lastSyncedAt: new Date().toISOString(),
          };
          setSheetsConfig(config);
          saveStoredSheetConfig(config);

          // Auto-sync any pending local submissions
          const currentRsvps = getStoredRsvps();
          const pending = currentRsvps.filter((r) => !r.syncedToSheets);
          if (pending.length > 0) {
            for (const r of pending) {
              await appendRsvpToSheet(token, sheetInfo.spreadsheetId, r);
            }
            const synced = markRsvpsAsSynced(pending.map((p) => p.id));
            setRsvps(synced);
            showNotification(`¡Sincronizadas ${pending.length} confirmaciones con Google Sheets!`);
          }
        } catch (e) {
          console.error('Error auto-syncing spreadsheet after auth', e);
        }
      },
      () => {
        setCurrentUser(null);
        setGoogleToken(null);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [eventInfo.coupleNames]);

  const showNotification = (msg: string) => {
    setSyncNotification(msg);
    setTimeout(() => {
      setSyncNotification(null);
    }, 4000);
  };

  // Google Sign-In handler
  const handleGoogleSignIn = async () => {
    setIsConnectingGoogle(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setGoogleToken(result.accessToken);

        // Find or create spreadsheet
        const sheetInfo = await findOrCreateWeddingSpreadsheet(
          result.accessToken,
          `Confirmaciones Boda - ${eventInfo.coupleNames}`
        );
        const config: GoogleSheetsConfig = {
          spreadsheetId: sheetInfo.spreadsheetId,
          spreadsheetUrl: sheetInfo.spreadsheetUrl,
          sheetName: sheetInfo.title,
          lastSyncedAt: new Date().toISOString(),
        };
        setSheetsConfig(config);
        saveStoredSheetConfig(config);

        // Sync pending RSVPs
        const currentRsvps = getStoredRsvps();
        const pending = currentRsvps.filter((r) => !r.syncedToSheets);
        if (pending.length > 0) {
          for (const item of pending) {
            await appendRsvpToSheet(result.accessToken, sheetInfo.spreadsheetId, item);
          }
          const updated = markRsvpsAsSynced(pending.map((p) => p.id));
          setRsvps(updated);
        }
        showNotification('¡Conectado exitosamente con Google Drive y Google Sheets!');
      }
    } catch (err: any) {
      console.error('Error signing in with Google:', err);
      alert(err.message || 'No se pudo conectar con Google');
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setGoogleToken(null);
    showNotification('Sesión de Google cerrada.');
  };

  // Sync with Google Sheets manually
  const handleSyncWithSheets = async () => {
    const token = googleToken || (await getAccessToken());
    if (!token) {
      setIsAdminOpen(true);
      return;
    }

    if (!sheetsConfig?.spreadsheetId) {
      showNotification('Creando y vinculando hoja en Google Drive...');
      const sheet = await findOrCreateWeddingSpreadsheet(token, `Confirmaciones Boda - ${eventInfo.coupleNames}`);
      const newConf: GoogleSheetsConfig = {
        spreadsheetId: sheet.spreadsheetId,
        spreadsheetUrl: sheet.spreadsheetUrl,
        sheetName: sheet.title,
        lastSyncedAt: new Date().toISOString(),
      };
      setSheetsConfig(newConf);
      saveStoredSheetConfig(newConf);
    }

    setIsSyncing(true);
    try {
      const activeSpreadsheetId = sheetsConfig?.spreadsheetId;
      if (!activeSpreadsheetId) throw new Error('No hay ID de hoja configurado');

      const current = getStoredRsvps();
      const pending = current.filter((r) => !r.syncedToSheets);

      for (const item of pending) {
        await appendRsvpToSheet(token, activeSpreadsheetId, item);
      }

      const updated = markRsvpsAsSynced(pending.map((p) => p.id));
      setRsvps(updated);
      showNotification(`Sincronización completa: ${pending.length} filas agregadas a Google Sheets`);
    } catch (err: any) {
      console.error('Error syncing:', err);
      showNotification('Error al sincronizar con Google Sheets');
    } finally {
      setIsSyncing(false);
    }
  };

  // Submit RSVP from the guest
  const handleSubmitRsvp = async (
    data: Omit<RsvpSubmission, 'id' | 'timestamp' | 'syncedToSheets'>
  ) => {
    setIsSubmitting(true);
    try {
      const now = new Date();
      const formattedDate = `${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES')}`;
      const newSubmission: RsvpSubmission = {
        ...data,
        id: `rsvp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: formattedDate,
        syncedToSheets: false,
      };

      // 1. Save to local storage first (failsafe)
      const updatedList = saveRsvpToStorage(newSubmission);
      setRsvps(updatedList);

      // 2. Real-time sync to Google Sheets if token & config available
      const token = googleToken || (await getAccessToken());
      if (token && sheetsConfig?.spreadsheetId) {
        try {
          await appendRsvpToSheet(token, sheetsConfig.spreadsheetId, newSubmission);
          newSubmission.syncedToSheets = true;
          markRsvpsAsSynced([newSubmission.id]);
          setRsvps(getStoredRsvps());
          showNotification('¡Confirmación sincronizada en tiempo real con Google Sheets!');
        } catch (syncErr) {
          console.warn('Sync to sheets deferred:', syncErr);
        }
      }

      // 3. Show success celebration modal
      setLatestSubmission(newSubmission);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePhoto = (newPhotoUrl: string) => {
    const updated = { ...eventInfo, photoUrl: newPhotoUrl };
    setEventInfo(updated);
    saveEventInfo(updated);
    showNotification('¡Fotografía de Bricia & Alan actualizada!');
  };

  const stats = calculateStats(rsvps);

  return (
    <div className="min-h-screen bg-[#fcfaf9] text-[#2b2520] flex flex-col font-sans-wedding selection:bg-[#461021]/20 selection:text-[#461021]">
      {/* Top Floating Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#fcfaf9]/90 backdrop-blur-md border-b border-[#ebdcd8] px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif-wedding text-lg sm:text-xl font-semibold text-[#2b2520] tracking-wide">
              {eventInfo.coupleNames}
            </span>
          </div>
        </div>
      </header>

      {/* Sync Notification Banner */}
      {syncNotification && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#2b2520] text-white text-xs py-3 px-4 rounded-xl shadow-xl border border-[#461021] flex items-center gap-2 animate-in fade-in slide-in-from-bottom duration-300">
          <Sparkles className="w-4 h-4 text-[#e8b5c2]" />
          <span>{syncNotification}</span>
        </div>
      )}

      {/* Main Wedding RSVP Content */}
      <main className="flex-1 pb-16">
        {/* Section 1: Fotografía de los novios & Monograma */}
        <CouplePhotoSection
          eventInfo={eventInfo}
          onUpdatePhoto={handleUpdatePhoto}
        />

        {/* Section 2: Formulario de Confirmación con Control de Pases */}
        <RsvpForm
          maxGuestsAllocated={maxGuestsFromUrl}
          initialGuestName={guestNameFromUrl}
          onSubmitRsvp={handleSubmitRsvp}
          isSubmitting={isSubmitting}
        />
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-[#ebdcd8] text-center text-xs text-[#70645a] bg-[#f9f4f3]">
        <div className="max-w-md mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center">
            <span className="font-serif-wedding text-base text-[#2b2520]">
              {eventInfo.coupleNames}
            </span>
          </div>
          <p>{eventInfo.weddingDate}</p>
          <p className="text-[11px] text-[#91817c]">
            Agradecemos tu sinceridad en tu respuesta. ¡Nos vemos pronto!
          </p>
        </div>
      </footer>

      {/* Modal: Respuesta enviada exitosamente con Confetti y Pase Digital */}
      {latestSubmission && (
        <ConfirmationSuccessModal
          submission={latestSubmission}
          eventInfo={eventInfo}
          onClose={() => setLatestSubmission(null)}
        />
      )}

      {/* Modal: Panel de Administrador / Novios */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        rsvps={rsvps}
        stats={stats}
        eventInfo={eventInfo}
        currentUser={currentUser}
        googleToken={googleToken}
        sheetsConfig={sheetsConfig}
        isConnectingGoogle={isConnectingGoogle}
        isSyncing={isSyncing}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        onSyncWithSheets={handleSyncWithSheets}
        onExportCsv={() => exportToCsv(rsvps, eventInfo.coupleNames)}
        onUpdatePhoto={handleUpdatePhoto}
      />
    </div>
  );
}
