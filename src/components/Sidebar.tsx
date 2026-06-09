"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import {
  PanelLeftClose,
  PanelLeft,
  Home,
  BarChart3,
  GitFork,
  Bell,
  Car,
  Building2,
  FileClock
} from "lucide-react";
import { motion } from "framer-motion";

const menuItems = [
  { id: "inicio", label: "Início", icon: Home },
  { id: "dashboard", label: "Indicadores", icon: BarChart3 },
  { id: "analise", label: "Em análise", icon: FileClock },
  { id: "fluxos", label: "Fluxos", icon: GitFork },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "visitas", label: "Visitas", icon: Car },
  { id: "setafs", label: "SETAFs", icon: Building2 }
];

export default function Sidebar() {
  const { activeTab, setActiveTab, activeCommissionFilter, toggleCommissionFilter } = useApp();
  const [isComissoesOpen, setIsComissoesOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Load minimized state on client side
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_minimized");
      if (saved === "true") {
        setIsMinimized(true);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleToggleMinimize = () => {
    setIsMinimized(prev => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar_minimized", String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  return (
    <aside
      className={`sidebar flex-shrink-0 h-full flex flex-col justify-between z-20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] bg-[rgba(245,245,247,0.6)] backdrop-blur-[25px] border-r border-[rgba(0,0,0,0.05)] rounded-[20px] ${isMinimized ? "w-[56px] py-3.5 px-1.5" : "w-[136px] py-3.5 px-2.5"
        }`}
    >
      <div className="flex flex-col gap-4 w-full items-center">

        {/* Toggle Minimize Header */}
        <div className={`w-full flex items-center ${isMinimized ? "justify-center" : "justify-between px-1"}`}>
          {!isMinimized && (
            <span className="text-[9.5px] font-bold text-[#86868b] uppercase tracking-wider select-none">Menu</span>
          )}
          <button
            onClick={handleToggleMinimize}
            className="p-1 rounded-[6px] hover:bg-black/5 text-[#86868b] hover:text-[#1d1d1f] transition-colors border-0 bg-transparent outline-none cursor-pointer flex items-center justify-center"
            title={isMinimized ? "Expandir Menu" : "Recolher Menu"}
          >
            {isMinimized ? (
              <PanelLeft className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="menu w-full">
          <ul className="flex flex-col gap-0.5 m-0 p-0 list-none w-full">
            {menuItems.map(item => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <li key={item.id} className="relative w-full flex justify-center">
                  <motion.button
                    onClick={() => {
                      if (item.id === "setafs") {
                        window.open("https://www.google.com/maps/d/u/0/viewer?hl=pt-BR&mid=1jQYv-EgT6W8SrZvi43_ZIl4tCESFRg3d&ll=-13.491084402633808%2C-41.979122&z=6", "_blank");
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    title={isMinimized ? item.label : undefined}
                    className={`rounded-[8px] flex items-center cursor-pointer outline-none border-0 transition-colors duration-150 ${isMinimized
                      ? "w-8 h-8 justify-center p-0"
                      : "w-full text-left px-2 py-[6px] justify-between text-[10.5px] font-semibold"
                      } ${isActive
                        ? "bg-[rgba(40,205,65,0.08)] text-[#28cd41]"
                        : "text-[#6B7280] bg-transparent hover:bg-[rgba(0,0,0,0.03)] hover:text-[#374151]"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 stroke-[2.2px]" />
                      {!isMinimized && <span className="truncate">{item.label}</span>}
                    </div>
                    {!isMinimized && isActive && (
                      <span className="w-[4px] h-[4px] bg-[#28cd41] rounded-full inline-block shadow-[0_0_6px_rgba(40,205,65,0.5)]" />
                    )}
                  </motion.button>
                </li>
              );
            })}
          </ul>
        </nav>


      </div>

      {/* Footer Section */}
      {!isMinimized && (
        <div className="flex flex-col gap-3 w-full mt-auto animate-in fade-in duration-300">
          {/* TCE Logo Card */}
          <div className="relative w-full h-[65px] overflow-hidden rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-black/[0.04] bg-white/60 flex items-center justify-center p-2.5 flex-shrink-0 group hover:bg-white transition-all duration-200">
            <div className="relative w-full h-full">
              <Image
                src="/imagens/logotce.png"
                alt="Logo TCE"
                fill
                className="object-contain filter group-hover:scale-[1.03] transition-transform duration-200"
                sizes="120px"
              />
            </div>
          </div>

          {/* LOGO CAR */}
          <div className="flex items-center justify-center py-1 w-full">
            <Image
              src="/imagens/logo-car.png"
              alt="Logo CAR"
              width={85}
              height={28}
              className="object-contain opacity-80"
              priority
            />
          </div>
        </div>
      )}
    </aside>
  );
}
