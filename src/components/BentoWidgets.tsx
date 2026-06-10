"use client";

import React from "react";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import { motion } from "framer-motion";

interface WidgetProps {
  title: string;
  desc: string;
  iconSrc: string;
  hoverBorderClass: string;
  hoverTextClass: string;
  onClick?: () => void;
}

function Widget({ title, desc, iconSrc, hoverBorderClass, hoverTextClass, onClick }: WidgetProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -1.5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`action relative flex items-center gap-3 p-2.5 rounded-[14px] bg-white/60 backdrop-blur-[20px] border border-black/[0.04] shadow-[0_2px_6px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.03)] hover:bg-white/95 transition-all duration-200 w-full min-h-[62px] text-left cursor-pointer outline-none group select-none ${hoverBorderClass}`}
    >
      {/* macOS Icon */}
      <motion.div
        whileHover={{ y: -1, scale: 1.04 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="flex-shrink-0 relative z-10"
      >
        <Image
          src={iconSrc}
          alt={title}
          width={38}
          height={38}
          className="object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.06)] group-hover:drop-shadow-[0_6px_12px_rgba(0,0,0,0.1)] transition-all duration-200"
          unoptimized
        />
      </motion.div>

      {/* Labels */}
      <div className="relative flex flex-col min-w-0 z-10 leading-snug">
        <span className={`action-title text-[11px] font-bold text-[#1d1d1f] tracking-tight transition-colors duration-200 truncate ${hoverTextClass}`}>
          {title}
        </span>
        <span className="action-desc text-[9.5px] font-semibold text-[#86868b] mt-0.5 tracking-tight truncate">
          {desc}
        </span>
      </div>

      {/* Subtle border shine effect */}
      <div className="absolute inset-0 rounded-[14px] border border-white/40 pointer-events-none" />
    </motion.button>
  );
}

export default function BentoWidgets() {
  const { setIsViagensOpen, setActiveTab } = useApp();

  const widgetsList = [
    {
      title: "Números do Setor",
      desc: "Dados estatísticos",
      iconSrc: "/imagens/logo-dados.png",
      hoverBorderClass: "hover:border-[#28CD41]/20 hover:shadow-[0_12px_24px_rgba(40,205,65,0.06)]",
      hoverTextClass: "group-hover:text-[#28CD41]",
      onClick: () => setActiveTab("dashboard") // Navigate to dashboard/indicadores
    },
    {
      title: "Controle de Prazos",
      desc: "Prazos de portarias",
      iconSrc: "/imagens/logo-prazos.png",
      hoverBorderClass: "hover:border-[#FF9500]/20 hover:shadow-[0_12px_24px_rgba(255,149,0,0.06)]",
      hoverTextClass: "group-hover:text-[#FF9500]"
    },
    {
      title: "Relação de Viagens",
      desc: "Programações de campo",
      iconSrc: "/imagens/logo-viagens.png",
      hoverBorderClass: "hover:border-[#00BCD4]/20 hover:shadow-[0_12px_24px_rgba(0,188,212,0.06)]",
      hoverTextClass: "group-hover:text-[#00BCD4]",
      onClick: () => setIsViagensOpen(true)
    },
    {
      title: "Portarias e Ofícios",
      desc: "Controle de Tomadas e TCE's",
      iconSrc: "/imagens/portarias.png",
      hoverBorderClass: "hover:border-[#007AFF]/20 hover:shadow-[0_12px_24px_rgba(0,122,255,0.06)]",
      hoverTextClass: "group-hover:text-[#007AFF]",
      onClick: () => setActiveTab("portarias")
    },
    {
      title: "Notificações TCE",
      desc: "Alertas de controle",
      iconSrc: "/imagens/logo-TCE.png",
      hoverBorderClass: "hover:border-[#FF3B30]/20 hover:shadow-[0_12px_24px_rgba(255,59,48,0.06)]",
      hoverTextClass: "group-hover:text-[#FF3B30]"
    }
  ];

  return (
    <div className="bottom-row grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full print:hidden">
      {widgetsList.map((w, idx) => (
        <Widget
          key={idx}
          title={w.title}
          desc={w.desc}
          iconSrc={w.iconSrc}
          hoverBorderClass={w.hoverBorderClass}
          hoverTextClass={w.hoverTextClass}
          onClick={w.onClick}
        />
      ))}
    </div>
  );
}
