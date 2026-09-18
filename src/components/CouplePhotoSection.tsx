import React from 'react';
import { WeddingEventInfo } from '../types';
// 1. Importa tu imagen local directamente aquí:
import bannerImage from '../assets/images/bricia_alan.jpg'; 
// (Ajusta los '../' según la carpeta donde esté este componente)

interface Props {
  eventInfo: WeddingEventInfo;
  onUpdatePhoto?: (newPhotoUrl: string) => void;
}

export const CouplePhotoSection: React.FC<Props> = ({ eventInfo }) => {
  return (
    <section className="relative overflow-hidden pt-0 pb-12 min-h-[221px]">
      {/* Full-width Rectangular Couple Photo Banner */}
      <div className="w-full relative overflow-hidden mb-4 sm:mb-6">
        <div className="w-full relative aspect-[16/5] sm:aspect-[21/7] md:aspect-[5/1] min-h-[120px] sm:min-h-[180px] md:min-h-[220px] max-h-[320px] bg-[#1a060d]">
          <img
            src={bannerImage} /* 2. Asigna la imagen importada aquí */
            alt={`Fotografía de los novios ${eventInfo.coupleNames}`}
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Wedding date badge */}
        <div className="flex justify-center -mt-3.5 sm:-mt-4 relative z-10">
          <div className="bg-[#461021] text-[#fcfaf9] px-6 py-1.5 rounded-full text-xs sm:text-sm font-serif-wedding tracking-widest uppercase shadow-md border border-white/25">
            <span>{eventInfo.weddingDate}</span>
          </div>
        </div>
      </div>

      {/* Header Information below Image & Date */}
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 mt-4 sm:mt-6">
        <h1
          id="wedding-couple-title"
          className="font-serif-wedding text-3xl sm:text-5xl md:text-6xl font-normal text-[#2b2520] tracking-wide mb-2"
        >
          {eventInfo.coupleNames}
        </h1>

        <p className="font-serif-wedding text-base text-[#786c63] max-w-xl mx-auto px-4 leading-relaxed">
          {eventInfo.quote || '¡Nos encantará vivir este momento contigo!'}
        </p>
      </div>
    </section>
  );
};