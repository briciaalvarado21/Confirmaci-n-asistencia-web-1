import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Calendar, MapPin, Download, Share2, Sparkles, X } from 'lucide-react';
import { RsvpSubmission, WeddingEventInfo } from '../types';

interface Props {
  submission: RsvpSubmission;
  eventInfo: WeddingEventInfo;
  onClose: () => void;
}

export const ConfirmationSuccessModal: React.FC<Props> = ({
  submission,
  eventInfo,
  onClose,
}) => {
  useEffect(() => {
    if (submission.attending === 'yes') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#461021', '#781f3b', '#b34d6d', '#f1d6de'],
        });
      } catch (e) {
        // Fallback gracefully
      }
    }
  }, [submission.attending]);

  const isAttending = submission.attending === 'yes';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#ecd8dd] shadow-2xl relative my-8 animate-in fade-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8a7e74] hover:text-[#2b2520] p-1.5 rounded-full hover:bg-[#faf5f6] transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#fbf4f6] border-2 border-[#ecd5db] flex items-center justify-center mx-auto mb-4 text-[#461021]">
            <CheckCircle2 className="w-9 h-9 text-[#461021]" />
          </div>

          <span className="text-[11px] uppercase tracking-[0.25em] text-[#461021] font-semibold block mb-1">
            Respuesta Confirmada
          </span>
          <h3 className="font-serif-wedding text-3xl text-[#2b2520]">
            {isAttending ? '¡Gracias por confirmar!' : 'Respuesta Registrada'}
          </h3>
          <p className="text-sm text-[#70645a] mt-2 max-w-sm mx-auto">
            {isAttending
              ? `¡Qué alegría tenerte con nosotros, ${submission.fullName}! Hemos reservado tu lugar para esta fecha tan especial.`
              : `Agradecemos mucho tu respuesta, ${submission.fullName}. Lamentamos que no puedas asistir pero sabemos que estarás con nosotros con el corazón.`}
          </p>
        </div>

        {/* Digital Pass / Ticket Card if attending */}
        {isAttending && (
          <div className="relative mb-6 p-5 rounded-2xl bg-[#faf5f6] border border-[#ebd8dc] shadow-inner text-left">
            <div className="flex items-center justify-between border-b border-[#ebd8dc] pb-3 mb-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#461021] font-bold">
                  Pase de Asistencia
                </span>
                <h4 className="font-serif-wedding text-xl text-[#2b2520]">
                  {eventInfo.coupleNames}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-[#8a7e74] block">
                  Invitados
                </span>
                <span className="font-serif-wedding text-xl font-bold text-[#461021]">
                  {submission.guestCount} {submission.guestCount === 1 ? 'pase' : 'pases'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#52473f]">
              <div className="flex items-center justify-between">
                <span className="text-[#8a7e74]">Titular:</span>
                <span className="font-medium text-[#2b2520]">{submission.fullName}</span>
              </div>
              {submission.companionNames.length > 0 && (
                <div className="flex items-start justify-between">
                  <span className="text-[#8a7e74]">Acompañantes:</span>
                  <span className="font-medium text-[#2b2520] text-right">
                    {submission.companionNames.join(', ')}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[#8a7e74]">Fecha:</span>
                <span className="font-medium text-[#2b2520]">{eventInfo.weddingDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8a7e74]">Lugar:</span>
                <span className="font-medium text-[#2b2520]">{eventInfo.ceremonyVenue}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-dashed border-[#dec4cb] flex items-center justify-between text-[11px] text-[#461021]">
              <span className="flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3" />
                Registrado en tiempo real
              </span>
              <span className="text-[10px] text-[#70645a]">
                {new Date().toLocaleDateString('es-ES')}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-[#461021] text-white font-serif-wedding text-lg tracking-wider hover:bg-[#330b18] transition-colors shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
