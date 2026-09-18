import React, { useState, useEffect } from 'react';
import { Check, X, Users, Utensils, Send, AlertCircle, ShieldCheck } from 'lucide-react';
import { RsvpSubmission } from '../types';

interface Props {
  maxGuestsAllocated: number;
  initialGuestName?: string;
  onSubmitRsvp: (submission: Omit<RsvpSubmission, 'id' | 'timestamp' | 'syncedToSheets'>) => Promise<void>;
  isSubmitting: boolean;
}

const DIETARY_OPTIONS = [
  'Ninguna',
];

export const RsvpForm: React.FC<Props> = ({
  maxGuestsAllocated,
  initialGuestName = '',
  onSubmitRsvp,
  isSubmitting,
}) => {
  const [fullName, setFullName] = useState(initialGuestName);
  const [attending, setAttending] = useState<'yes' | 'no' | null>(null);
  const [guestCount, setGuestCount] = useState<number>(Math.min(1, maxGuestsAllocated));
  const [companionNames, setCompanionNames] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [dietaryDetails, setDietaryDetails] = useState('');
  const [message, setMessage] = useState('');

  // Confirmation modal before submission
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Update companion array length when guestCount changes
  useEffect(() => {
    if (attending === 'yes') {
      const companionsNeeded = Math.max(0, guestCount - 1);
      setCompanionNames((prev) => {
        const next = [...prev];
        if (next.length < companionsNeeded) {
          while (next.length < companionsNeeded) {
            next.push('');
          }
        } else if (next.length > companionsNeeded) {
          return next.slice(0, companionsNeeded);
        }
        return next;
      });
    } else {
      setCompanionNames([]);
    }
  }, [guestCount, attending]);

  // Adjust guestCount if maxGuestsAllocated changes
  useEffect(() => {
    if (guestCount > maxGuestsAllocated) {
      setGuestCount(maxGuestsAllocated);
    }
  }, [maxGuestsAllocated, guestCount]);

  const handleCompanionChange = (index: number, value: string) => {
    setCompanionNames((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const toggleDietary = (option: string) => {
    if (option === 'Ninguna') {
      setSelectedDietary(['Ninguna']);
      return;
    }
    setSelectedDietary((prev) => {
      const withoutNone = prev.filter((o) => o !== 'Ninguna');
      if (withoutNone.includes(option)) {
        return withoutNone.filter((o) => o !== option);
      } else {
        return [...withoutNone, option];
      }
    });
  };

  const handleInitialValidation = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!fullName.trim()) {
      setValidationError('Por favor ingresa tu nombre completo.');
      return;
    }

    if (!attending) {
      setValidationError('Por favor selecciona si confirmas tu asistencia o no.');
      return;
    }

    if (attending === 'yes') {
      if (guestCount < 1) {
        setValidationError('Por favor indica cuántas personas asistirán.');
        return;
      }
      // Check if companions are filled
      const emptyCompanions = companionNames.some((c) => !c.trim());
      if (guestCount > 1 && emptyCompanions) {
        setValidationError('Por favor ingresa el nombre de todos tus acompañantes.');
        return;
      }
    }

    setShowConfirmModal(true);
  };

  const handleFinalSubmit = async () => {
    try {
      await onSubmitRsvp({
        fullName: fullName.trim(),
        attending: attending || 'no',
        guestCount: attending === 'yes' ? guestCount : 0,
        companionNames: attending === 'yes' ? companionNames.filter((c) => c.trim()) : [],
        dietaryRestrictions: selectedDietary.filter((d) => d !== 'Ninguna'),
        dietaryDetails: dietaryDetails.trim(),
        message: message.trim(),
        maxGuestsAllocated,
      });
      setShowConfirmModal(false);
    } catch (err: any) {
      setValidationError(err.message || 'Error al enviar la confirmación');
      setShowConfirmModal(false);
    }
  };

  return (
    <section id="rsvp-section" className="py-12 px-4 sm:px-6 max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#ebdcd8] shadow-xl shadow-[#461021]/5">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-[0.25em] text-[#461021] font-semibold block mb-2">
            R.S.V.P.
          </span>
          <h2 className="font-serif-wedding text-3xl sm:text-4xl text-[#2b2520]">
            Confirmación de Asistencia
          </h2>
          <p className="text-sm text-[#786c63] mt-2 max-w-lg mx-auto">
            Por favor confirma tu respuesta para poder preparar cada detalle de la celebración y compartirlo contigo.
          </p>
          <div className="w-16 h-[2px] bg-[#461021]/60 mx-auto mt-4" />
        </div>

        {/* Notice of Allocated Passes from Admin */}
        <div className="mb-8 p-4 rounded-2xl bg-[#fbf4f6] border border-[#ecd5db] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#461021] text-white flex items-center justify-center shrink-0 font-serif-wedding font-bold text-lg shadow-sm">
              {maxGuestsAllocated}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#461021]">
                Pases asignados para esta invitación
              </p>
              <p className="text-xs text-[#6e6258]">
                {maxGuestsAllocated === 1
                  ? 'Tienes 1 pase individual reservado.'
                  : `Hemos reservado ${maxGuestsAllocated} lugares para ti y tus acompañantes.`}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleInitialValidation} className="space-y-8">
          {/* 1. Nombre Completo */}
          <div>
            <label
              htmlFor="guest-full-name"
              className="block text-xs uppercase tracking-widest font-semibold text-[#2b2520] mb-2"
            >
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              id="guest-full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. Mariana Valenzuela Mendoza"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#d8ccc0] focus:border-[#461021] focus:ring-2 focus:ring-[#461021]/20 outline-none text-base text-[#2b2520] bg-[#fbf9f6] transition-all"
            />
          </div>

          {/* 2. ¿Confirmas tu asistencia al evento? */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-semibold text-[#2b2520] mb-3">
              ¿Confirmas tu asistencia al evento? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                id="btn-confirm-yes"
                onClick={() => setAttending('yes')}
                className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  attending === 'yes'
                    ? 'border-[#461021] bg-[#fbf4f6] shadow-sm ring-1 ring-[#461021]'
                    : 'border-[#e2d7ca] bg-white hover:bg-[#faf7f2]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      attending === 'yes' ? 'bg-[#461021] text-white' : 'border border-[#d0c2b2] text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-[#2b2520] block">
                      ¡Sí, asistiré con mucho gusto!
                    </span>
                    <span className="text-xs text-[#70645a]">Celebraré con ustedes</span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                id="btn-confirm-no"
                onClick={() => setAttending('no')}
                className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  attending === 'no'
                    ? 'border-[#9e8f85] bg-[#f2ede9] shadow-sm ring-1 ring-[#9e8f85]'
                    : 'border-[#e2d7ca] bg-white hover:bg-[#faf7f2]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      attending === 'no' ? 'bg-[#786c63] text-white' : 'border border-[#d0c2b2] text-transparent'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-[#2b2520] block">
                      No podré asistir
                    </span>
                    <span className="text-xs text-[#70645a]">Estaré de corazón</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* If Attending YES: Show guest count selector and details */}
          {attending === 'yes' && (
            <div className="space-y-8 pt-4 border-t border-[#eee6dc]">
              {/* 3. ¿Cuántos asistirán? Selector numérico controlado por administrador */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase tracking-widest font-semibold text-[#2b2520]">
                    ¿Cuántos asistirán? <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-[#461021] font-semibold">
                    Máximo permitido: {maxGuestsAllocated} {maxGuestsAllocated === 1 ? 'persona' : 'personas'}
                  </span>
                </div>

                <p className="text-xs text-[#786c63] mb-4">
                  Selecciona el total de personas que harán uso de los pases asignados a tu invitación.
                </p>

                {/* Number selector buttons */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {Array.from({ length: maxGuestsAllocated }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      type="button"
                      id={`guest-count-btn-${num}`}
                      onClick={() => setGuestCount(num)}
                      className={`h-12 min-w-[54px] px-4 rounded-xl text-base font-semibold transition-all flex items-center justify-center gap-1.5 ${
                        guestCount === num
                          ? 'bg-[#461021] text-white shadow-md scale-105 ring-2 ring-[#461021]/30'
                          : 'bg-[#faf5f6] text-[#2b2520] border border-[#e8d5d9] hover:bg-[#f4e6e9]'
                      }`}
                    >
                      <Users className={`w-4 h-4 ${guestCount === num ? 'text-[#e8b5c2]' : 'text-[#461021]'}`} />
                      <span>{num}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-3 text-xs text-[#70645a]">
                  Total de invitados confirmando:{' '}
                  <strong className="text-[#2b2520]">
                    {guestCount} {guestCount === 1 ? 'persona (tú)' : `personas (tú y ${guestCount - 1} acompañante${guestCount > 2 ? 's' : ''})`}
                  </strong>
                </div>
              </div>

              {/* 4. Nombre de los acompañantes (if guestCount > 1) */}
              {guestCount > 1 && (
                <div className="bg-[#fbf5f7] p-5 sm:p-6 rounded-2xl border border-[#ecd8dd]">
                  <label className="block text-xs uppercase tracking-widest font-semibold text-[#2b2520] mb-2">
                    Nombre de los acompañantes <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-[#70645a] mb-4">
                    Por favor escribe el nombre completo de cada persona que te acompañará para preparar sus asignaciones de mesa y recordatorios:
                  </p>

                  <div className="space-y-3">
                    {companionNames.map((compName, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-white border border-[#dec4cb] text-xs font-semibold text-[#461021] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          id={`companion-name-input-${idx}`}
                          value={compName}
                          onChange={(e) => handleCompanionChange(idx, e.target.value)}
                          placeholder={`Nombre completo del Acompañante ${idx + 1}`}
                          required
                          className="w-full px-4 py-2.5 rounded-xl border border-[#d8ccc0] focus:border-[#461021] focus:ring-2 focus:ring-[#461021]/20 outline-none text-sm text-[#2b2520] bg-white transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. ¿Tienes alguna alergia / restricción alimentaria? */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Utensils className="w-4 h-4 text-[#461021]" />
                  <label className="text-xs uppercase tracking-widest font-semibold text-[#2b2520]">
                    ¿Tienes alguna alergia o restricción alimentaria?
                  </label>
                </div>
                <p className="text-xs text-[#70645a] mb-3">
                  Queremos que disfrutes el banquete al máximo. Selecciona las opciones aplicables a ti o a tus acompañantes:
                </p>

                {/* Dietary Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {DIETARY_OPTIONS.map((option) => {
                    const isSelected = selectedDietary.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleDietary(option)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                          isSelected
                            ? 'bg-[#461021] text-white border-[#461021]'
                            : 'bg-white text-[#574d44] border-[#d8ccc0] hover:bg-[#faf5f6]'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {/* Additional Details */}
                <input
                  type="text"
                  id="dietary-details-input"
                  value={dietaryDetails}
                  onChange={(e) => setDietaryDetails(e.target.value)}
                  placeholder="Detalles adicionales (ej. intolerancia severa a la lactosa, alergia a mariscos)"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#d8ccc0] focus:border-[#461021] focus:ring-2 focus:ring-[#461021]/20 outline-none text-sm text-[#2b2520] bg-[#fbf9f6]"
                />
              </div>
            </div>
          )}

          {/* Warm Message / Felicitaciones para los Novios */}
          <div>
            <div className="mb-2">
              <label
                htmlFor="wedding-message-input"
                className="text-xs uppercase tracking-widest font-semibold text-[#2b2520]"
              >
                Mensaje o Felicitación para los Novios (Opcional)
              </label>
            </div>
            <textarea
              id="wedding-message-input"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe unas palabras de cariño, deseos o dedicatoria para Bricia y Alan..."
              className="w-full px-4 py-3 rounded-xl border border-[#d8ccc0] focus:border-[#461021] focus:ring-2 focus:ring-[#461021]/20 outline-none text-sm text-[#2b2520] bg-[#fbf9f6] resize-none"
            />
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Botón Principal para Confirmar Respuesta */}
          <div className="pt-2">
            <button
              id="btn-submit-rsvp"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-[#461021] hover:bg-[#330b18] text-[#fcfaf9] font-serif-wedding text-xl tracking-wider transition-all shadow-lg shadow-[#461021]/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {isSubmitting ? (
                <span>Guardando confirmación...</span>
              ) : (
                <>
                  <Send className="w-5 h-5 text-[#e8b5c2] group-hover:translate-x-1 transition-transform" />
                  <span>Confirmar Respuesta</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal Before Final Sending */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#ecd8dd] shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-[#fbf4f6] border border-[#ecd5db] flex items-center justify-center mx-auto mb-4 text-[#461021]">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <h3 className="font-serif-wedding text-2xl text-center text-[#2b2520] mb-2">
              Confirmar envío de respuesta
            </h3>
            <p className="text-xs text-center text-[#70645a] mb-6">
              Por favor revisa los datos antes de enviar tu confirmación final:
            </p>

            <div className="bg-[#fbf7f8] p-4 rounded-xl space-y-2 text-xs text-[#423932] mb-6 border border-[#ecd8dd]">
              <div>
                <span className="text-[#461021] font-semibold">Invitado: </span>
                <strong className="text-[#2b2520]">{fullName}</strong>
              </div>
              <div>
                <span className="text-[#461021] font-semibold">Asistencia: </span>
                <strong className={attending === 'yes' ? 'text-emerald-700' : 'text-stone-600'}>
                  {attending === 'yes' ? 'Confirmado (Asistirá)' : 'No asistirá'}
                </strong>
              </div>
              {attending === 'yes' && (
                <>
                  <div>
                    <span className="text-[#461021] font-semibold">Total de asistentes: </span>
                    <strong className="text-[#2b2520]">{guestCount}</strong>
                  </div>
                  {companionNames.length > 0 && (
                    <div>
                      <span className="text-[#461021] font-semibold">Acompañantes: </span>
                      <span>{companionNames.join(', ')}</span>
                    </div>
                  )}
                  {selectedDietary.length > 0 && selectedDietary[0] !== 'Ninguna' && (
                    <div>
                      <span className="text-[#461021] font-semibold">Restricciones: </span>
                      <span>{selectedDietary.join(', ')}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-[#d8ccc0] text-xs uppercase tracking-wider font-semibold text-[#665a50] hover:bg-[#faf5f6] transition-colors"
              >
                Modificar
              </button>
              <button
                id="btn-modal-final-confirm"
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#461021] text-white text-xs uppercase tracking-wider font-semibold hover:bg-[#330b18] transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {isSubmitting ? 'Enviando...' : 'Confirmar y Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
