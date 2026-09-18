import React, { useState, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Link as LinkIcon,
  Sparkles,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { RsvpSubmission, WeddingEventInfo, GoogleSheetsConfig, AdminStats } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rsvps: RsvpSubmission[];
  stats: AdminStats;
  eventInfo: WeddingEventInfo;
  currentUser: any | null;
  googleToken: string | null;
  sheetsConfig: GoogleSheetsConfig | null;
  isConnectingGoogle: boolean;
  isSyncing: boolean;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  onSyncWithSheets: () => Promise<void>;
  onExportCsv: () => void;
  onUpdatePhoto?: (newPhotoUrl: string) => void;
}

export const AdminPanelModal: React.FC<Props> = ({
  isOpen,
  onClose,
  rsvps,
  stats,
  eventInfo,
  currentUser,
  googleToken,
  sheetsConfig,
  isConnectingGoogle,
  isSyncing,
  onGoogleSignIn,
  onGoogleSignOut,
  onSyncWithSheets,
  onExportCsv,
  onUpdatePhoto,
}) => {
  const [guestNameInput, setGuestNameInput] = useState('');
  const [passesInput, setPassesInput] = useState<number>(2);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [photoUpdatedToast, setPhotoUpdatedToast] = useState(false);
  const adminFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentOrigin = window.location.origin + window.location.pathname;

  // Generate personalized invitation link
  const generatedLink = `${currentOrigin}?nombre=${encodeURIComponent(guestNameInput.trim())}&pases=${passesInput}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsapp = () => {
    const text = `¡Hola ${guestNameInput.trim() || 'amigo/a'}! Nos encantaría que nos acompañes en nuestra boda el ${eventInfo.weddingDate}. Hemos reservado ${passesInput} ${passesInput === 1 ? 'pase' : 'pases'} para ti. Por favor confirma tu asistencia en este enlace:\n\n${generatedLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredRsvps = rsvps.filter((r) => {
    const matchesSearch =
      r.fullName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      r.companionNames.some((c) => c.toLowerCase().includes(searchFilter.toLowerCase())) ||
      r.dietaryDetails.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'yes' && r.attending === 'yes') ||
      (statusFilter === 'no' && r.attending === 'no');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-4xl w-full border border-[#d8ccc0] shadow-2xl relative my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eee6dc] pb-4 mb-5 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs uppercase tracking-widest text-[#461021] font-bold">
                Panel de Control de los Novios
              </span>
            </div>
            <h2 className="font-serif-wedding text-2xl sm:text-3xl text-[#2b2520]">
              Gestión de Invitaciones y Google Sheets
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#8a7e74] hover:text-[#2b2520] rounded-full hover:bg-[#faf6f2] transition-colors"
            aria-label="Cerrar panel de administración"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto space-y-6 pr-1">
          {/* Section 1: Google Sheets & Google Drive Real-Time Sync */}
          <div className="bg-[#faf7f2] rounded-2xl p-5 border border-[#e5dcce]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white border border-[#dfd4c5] flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-[#2b2520] flex items-center gap-2">
                    Sincronización con Google Drive / Sheets
                    {sheetsConfig && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Tiempo Real
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#70645a]">
                    Todas las confirmaciones se recopilan automáticamente en una hoja de cálculo en tu Google Drive.
                  </p>
                </div>
              </div>

              {/* Google Auth Status / Actions */}
              <div>
                {currentUser ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#52473f] hidden sm:inline">
                      Conectado como <strong>{currentUser.email}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={onGoogleSignOut}
                      className="text-xs px-3 py-1.5 rounded-lg border border-[#d6c8b9] text-[#70645a] hover:bg-white"
                    >
                      Desconectar
                    </button>
                  </div>
                ) : (
                  /* Official Google Sign-In button adhering strictly to Workspace skill specification */
                  <button
                    type="button"
                    onClick={onGoogleSignIn}
                    disabled={isConnectingGoogle}
                    className="inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white text-[#3c4043] border border-[#dadce0] hover:bg-[#f8f9fa] shadow-sm text-xs font-semibold tracking-wide transition-all cursor-pointer disabled:opacity-60"
                  >
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      className="w-4 h-4"
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                    <span>{isConnectingGoogle ? 'Conectando...' : 'Conectar con Google Drive'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* If Google Sheets is linked */}
            {sheetsConfig && (
              <div className="pt-3 border-t border-[#dfd4c5] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-[#544941]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Hoja vinculada: <strong>{sheetsConfig.sheetName || 'Confirmaciones Boda'}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onSyncWithSheets}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#d6c8b9] text-xs font-medium text-[#2b2520] hover:bg-[#f3ece2] transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}</span>
                  </button>

                  <a
                    href={sheetsConfig.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#461021] text-white text-xs font-medium hover:bg-[#330b18] transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#e8b5c2]" />
                    <span>Abrir en Google Drive</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Section: Fotografía Original de los Novios */}
          <div className="bg-white rounded-2xl p-5 border border-[#ecd8dd] shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#461021]" />
                <h3 className="font-semibold text-base text-[#2b2520]">
                  Fotografía Principal de la Boda
                </h3>
              </div>
              {photoUpdatedToast && (
                <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" /> ¡Foto actualizada!
                </span>
              )}
            </div>
            <p className="text-xs text-[#70645a] mb-4">
              Visualiza o sustituye la fotografía de Bricia & Alan. Puedes cargar directamente tu archivo original (como <code>image.png</code>) para que se muestre intacto y sin compresión.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-48 aspect-[16/7] rounded-xl overflow-hidden border border-[#dfd4c5] bg-[#1a060d] shrink-0 shadow-inner">
                <img
                  src={eventInfo.photoUrl}
                  alt="Vista previa fotografía de los novios"
                  className="w-full h-full object-cover object-center"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1 space-y-2 w-full">
                <input
                  ref={adminFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0] && onUpdatePhoto) {
                      const file = e.target.files[0];
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const res = ev.target?.result as string;
                        if (res) {
                          onUpdatePhoto(res);
                          setPhotoUpdatedToast(true);
                          setTimeout(() => setPhotoUpdatedToast(false), 3000);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adminFileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#461021] text-white text-xs font-semibold hover:bg-[#330b18] transition-colors shadow-sm cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#e8b5c2]" />
                    <span>Seleccionar archivo image.png</span>
                  </button>

                  <span className="text-[11px] text-[#7d7065]">
                    Formatos: PNG, JPG, WebP. Conserva resolución nativa.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Generador de Invitaciones con Control de Pases */}
          <div className="bg-white rounded-2xl p-5 border border-[#ecd8dd] shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <LinkIcon className="w-4 h-4 text-[#461021]" />
              <h3 className="font-semibold text-base text-[#2b2520]">
                Generador de Enlaces Personalizados y Control de Pases
              </h3>
            </div>
            <p className="text-xs text-[#70645a] mb-4">
              Controla exactamente cuántos invitados puede registrar cada persona. Al abrir su enlace, el selector numérico estará limitado al número de pases que le asignes aquí.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#544941] mb-1.5">
                  Nombre del Invitado o Familia
                </label>
                <input
                  type="text"
                  value={guestNameInput}
                  onChange={(e) => setGuestNameInput(e.target.value)}
                  placeholder="Ej. Familia Morales Sánchez o Lic. Carlos Vega"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8ccc0] text-sm text-[#2b2520] outline-none focus:border-[#461021] focus:ring-2 focus:ring-[#461021]/15"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#544941] mb-1.5">
                  Pases Asignados (Límite)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={passesInput}
                    onChange={(e) => setPassesInput(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8ccc0] text-sm text-[#2b2520] outline-none focus:border-[#461021] focus:ring-2 focus:ring-[#461021]/15"
                  />
                  <span className="text-xs text-[#70645a] shrink-0 font-medium">pases</span>
                </div>
              </div>
            </div>

            {/* Generated Link Display */}
            <div className="p-3.5 rounded-xl bg-[#faf5f6] border border-[#ebd8dc] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="overflow-hidden">
                <span className="text-[10px] uppercase tracking-wider text-[#8a7e74] font-bold block">
                  Enlace para enviar al invitado:
                </span>
                <span className="text-xs text-[#2b2520] font-mono truncate block">
                  {generatedLink}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#dec4cb] text-xs font-semibold text-[#2b2520] hover:bg-[#faf5f6] transition-colors"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#461021]" />
                      <span>Copiar Enlace</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsapp}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Enviar por WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Metrics Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white border border-[#ebdcd8]">
              <span className="text-[10px] uppercase tracking-wider text-[#8a7e74] block">
                Total Respuestas
              </span>
              <span className="font-serif-wedding text-2xl font-bold text-[#2b2520]">
                {stats.totalResponses}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#ebdcd8]">
              <span className="text-[10px] uppercase tracking-wider text-emerald-700 block font-semibold">
                Confirmados (Sí)
              </span>
              <span className="font-serif-wedding text-2xl font-bold text-emerald-700">
                {stats.confirmedAttending}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#ebdcd8]">
              <span className="text-[10px] uppercase tracking-wider text-[#461021] block font-semibold">
                Total Personas Asistiendo
              </span>
              <span className="font-serif-wedding text-2xl font-bold text-[#461021]">
                {stats.totalGuestsAttending}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#ebdcd8]">
              <span className="text-[10px] uppercase tracking-wider text-stone-500 block">
                Declinaron (No)
              </span>
              <span className="font-serif-wedding text-2xl font-bold text-stone-600">
                {stats.declined}
              </span>
            </div>
          </div>

          {/* Section 4: Live RSVPs Table */}
          <div className="bg-white rounded-2xl p-5 border border-[#ebdcd8] shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h3 className="font-semibold text-base text-[#2b2520]">
                Lista de Confirmaciones Recibidas ({filteredRsvps.length})
              </h3>

              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8a7e74]" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Buscar invitado..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#d8ccc0] text-xs text-[#2b2520] outline-none focus:border-[#461021]"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#d8ccc0] text-xs text-[#2b2520] outline-none bg-white focus:border-[#461021]"
                >
                  <option value="all">Todos</option>
                  <option value="yes">Confirmados (Sí)</option>
                  <option value="no">Declinados (No)</option>
                </select>

                <button
                  type="button"
                  onClick={onExportCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dec4cb] bg-[#faf5f6] hover:bg-[#f2e1e5] text-xs font-medium text-[#2b2520] transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#461021]" />
                  <span>Descargar Excel</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-[#e8dfd4]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#faf7f2] text-[#63574d] uppercase font-semibold border-b border-[#e8dfd4]">
                  <tr>
                    <th className="p-3">Invitado</th>
                    <th className="p-3">¿Asiste?</th>
                    <th className="p-3">Personas</th>
                    <th className="p-3">Acompañantes</th>
                    <th className="p-3">Alergias / Menú</th>
                    <th className="p-3">Mensaje</th>
                    <th className="p-3">Drive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee6dc] text-[#3d342d]">
                  {filteredRsvps.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-[#8a7e74]">
                        No se encontraron respuestas con los filtros actuales.
                      </td>
                    </tr>
                  ) : (
                    filteredRsvps.map((rsvp) => (
                      <tr key={rsvp.id} className="hover:bg-[#faf8f5] transition-colors">
                        <td className="p-3 font-medium text-[#2b2520]">
                          <div>{rsvp.fullName}</div>
                          <div className="text-[10px] text-[#8a7e74]">{rsvp.timestamp}</div>
                        </td>
                        <td className="p-3">
                          {rsvp.attending === 'yes' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              Sí ({rsvp.guestCount})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                              <XCircle className="w-3 h-3" />
                              No
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {rsvp.attending === 'yes' ? (
                            <span className="font-semibold text-[#2b2520]">
                              {rsvp.guestCount} / {rsvp.maxGuestsAllocated} pases
                            </span>
                          ) : (
                            <span className="text-[#8a7e74]">0</span>
                          )}
                        </td>
                        <td className="p-3">
                          {rsvp.companionNames.length > 0 ? (
                            <span className="text-[#423932]">{rsvp.companionNames.join(', ')}</span>
                          ) : (
                            <span className="text-[#8a7e74]">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          {rsvp.dietaryRestrictions.length > 0 || rsvp.dietaryDetails ? (
                            <div>
                              {rsvp.dietaryRestrictions.length > 0 && (
                                <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-medium text-[10px] mr-1 mb-0.5">
                                  {rsvp.dietaryRestrictions.join(', ')}
                                </span>
                              )}
                              {rsvp.dietaryDetails && (
                                <div className="text-[10px] text-[#63574d] italic">
                                  {rsvp.dietaryDetails}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#8a7e74]">-</span>
                          )}
                        </td>
                        <td className="p-3 max-w-xs truncate text-[#63574d]">
                          {rsvp.message || '-'}
                        </td>
                        <td className="p-3">
                          {rsvp.syncedToSheets ? (
                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Sincronizado
                            </span>
                          ) : (
                            <span className="text-amber-600 flex items-center gap-1 text-[11px]">
                              Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-2 border-t border-[#eee6dc] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-[#2b2520] text-white text-xs font-semibold uppercase tracking-wider hover:bg-black transition-colors"
          >
            Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
};
