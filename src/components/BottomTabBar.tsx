"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  Home,
  BarChart3,
  FileText,
  FileClock,
  Menu,
  GitFork,
  Bell,
  Car,
  Settings,
  Building2,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BottomTabBar() {
  const {
    activeTab,
    setActiveTab,
    setIsViagensOpen,
    setIsSyncOpen
  } = useApp();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const primaryTabs = [
    { id: "dashboard", label: "Indicadores", icon: BarChart3 },
    { id: "portarias", label: "Portarias", icon: FileText },
    { id: "inicio", label: "Início", icon: Home },
    { id: "analise", label: "Análise", icon: FileClock }
  ];

  const handleSecondaryClick = (action: () => void) => {
    setIsDrawerOpen(false);
    setTimeout(action, 200); // Allow drawer close animation to finish
  };

  return (
    <>
      {/* Floating Pill Dock */}
      <div className="fixed bottom-4 left-4 right-4 h-[62px] bg-white/75 backdrop-blur-[25px] border border-white/50 rounded-full flex items-center justify-around px-3 z-40 md:hidden shadow-[0_12px_36px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.01),inset_0_1px_0_rgba(255,255,255,0.45)] select-none">
        {primaryTabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 cursor-pointer outline-none border-0 bg-transparent transition-colors ${
                isActive ? "text-[#28cd41]" : "text-[#86868b] hover:text-[#1d1d1f]"
              }`}
            >
              <div className="relative flex items-center justify-center p-1 rounded-lg">
                <Icon className={`w-[20px] h-[20px] stroke-[2.2px] transition-transform duration-200 ${isActive ? "scale-105" : ""}`} />
                {isActive && (
                  <motion.span
                    layoutId="active-dot-bottom"
                    className="absolute -bottom-1 w-[4px] h-[4px] bg-[#28cd41] rounded-full shadow-[0_0_6px_rgba(40,205,65,0.5)]"
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  />
                )}
              </div>
              <span className="text-[9.5px] font-bold mt-0.5 tracking-tight leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Menu "Mais" Button */}
        <button
          onClick={() => setIsDrawerOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 cursor-pointer outline-none border-0 bg-transparent ${
            isDrawerOpen || !primaryTabs.some(t => t.id === activeTab)
              ? "text-[#28cd41]"
              : "text-[#86868b] hover:text-[#1d1d1f]"
          }`}
        >
          <div className="relative flex items-center justify-center p-1">
            <Menu className="w-[20px] h-[20px] stroke-[2.2px]" />
            {!primaryTabs.some(t => t.id === activeTab) && !isDrawerOpen && (
              <span className="absolute -bottom-1 w-[4px] h-[4px] bg-[#28cd41] rounded-full shadow-[0_0_6px_rgba(40,205,65,0.5)]" />
            )}
          </div>
          <span className="text-[9.5px] font-bold mt-0.5 tracking-tight leading-none">
            Mais
          </span>
        </button>
      </div>

      {/* Drawer overlay & slide-up pane */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-[4px] z-50 md:hidden"
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-[#F8F9FA] rounded-t-[24px] border-t border-black/5 p-4 pb-8 z-50 md:hidden flex flex-col gap-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] max-h-[80vh] overflow-y-auto select-none"
            >
              {/* Drag Handle Indicator */}
              <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto cursor-pointer" onClick={() => setIsDrawerOpen(false)} />

              {/* Title & Close Header */}
              <div className="flex justify-between items-center px-1 border-b border-black/[0.04] pb-2 mt-1">
                <div>
                  <h3 className="text-xs font-black text-[#1d1d1f] tracking-tight">Recursos do Portal</h3>
                  <p className="text-[9px] text-[#86868b] mt-0.5">Selecione uma opção</p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-full bg-black/5 hover:bg-black/10 text-[#86868b] hover:text-[#1d1d1f] transition-colors cursor-pointer outline-none border-0 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Grid Actions List */}
              <div className="grid grid-cols-2 gap-3 mt-1">
                {/* Tab: Fluxos */}
                <button
                  onClick={() => handleSecondaryClick(() => setActiveTab("fluxos"))}
                  className={`flex items-center gap-3 p-3 rounded-[14px] bg-white border text-left cursor-pointer outline-none transition-all ${
                    activeTab === "fluxos"
                      ? "border-[#28cd41] bg-[#28cd41]/5 text-[#28cd41]"
                      : "border-black/[0.04] text-[#1d1d1f] hover:bg-black/[0.01]"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${activeTab === "fluxos" ? "bg-[#28cd41]/15 text-[#28cd41]" : "bg-black/[0.03] text-[#6b7280]"}`}>
                    <GitFork className="w-4 h-4 stroke-[2.2px]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold truncate">Fluxos</span>
                    <span className="text-[9px] font-semibold text-[#86868b] leading-tight">Fluxogramas</span>
                  </div>
                </button>

                {/* Tab: Notificações */}
                <button
                  onClick={() => handleSecondaryClick(() => setActiveTab("notificacoes"))}
                  className={`flex items-center gap-3 p-3 rounded-[14px] bg-white border text-left cursor-pointer outline-none transition-all ${
                    activeTab === "notificacoes"
                      ? "border-[#28cd41] bg-[#28cd41]/5 text-[#28cd41]"
                      : "border-black/[0.04] text-[#1d1d1f] hover:bg-black/[0.01]"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${activeTab === "notificacoes" ? "bg-[#28cd41]/15 text-[#28cd41]" : "bg-black/[0.03] text-[#6b7280]"}`}>
                    <Bell className="w-4 h-4 stroke-[2.2px]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold truncate">Notificações</span>
                    <span className="text-[9px] font-semibold text-[#86868b] leading-tight">Processos do TCE</span>
                  </div>
                </button>

                {/* Action: Viagens Modal */}
                <button
                  onClick={() => handleSecondaryClick(() => setIsViagensOpen(true))}
                  className="flex items-center gap-3 p-3 rounded-[14px] bg-white border border-black/[0.04] text-[#1d1d1f] hover:bg-black/[0.01] text-left cursor-pointer outline-none transition-all"
                >
                  <div className="p-2 rounded-lg bg-black/[0.03] text-[#6b7280]">
                    <Car className="w-4 h-4 stroke-[2.2px]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold truncate">Viagens</span>
                    <span className="text-[9px] font-semibold text-[#86868b] leading-tight">Relação mensal</span>
                  </div>
                </button>

                {/* Action: Sincronização Sheets */}
                <button
                  onClick={() => handleSecondaryClick(() => setIsSyncOpen(true))}
                  className="flex items-center gap-3 p-3 rounded-[14px] bg-white border border-black/[0.04] text-[#1d1d1f] hover:bg-black/[0.01] text-left cursor-pointer outline-none transition-all"
                >
                  <div className="p-2 rounded-lg bg-black/[0.03] text-[#6b7280]">
                    <Settings className="w-4 h-4 stroke-[2.2px]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold truncate">Integração</span>
                    <span className="text-[9px] font-semibold text-[#86868b] leading-tight">Google Sheets</span>
                  </div>
                </button>

                {/* External link: SETAFs Map */}
                <button
                  onClick={() =>
                    handleSecondaryClick(() => {
                      window.open(
                        "https://www.google.com/maps/d/u/0/viewer?hl=pt-BR&mid=1jQYv-EgT6W8SrZvi43_ZIl4tCESFRg3d&ll=-13.491084402633808%2C-41.979122&z=6",
                        "_blank"
                      );
                    })
                  }
                  className="flex items-center gap-3 p-3 rounded-[14px] bg-white border border-black/[0.04] text-[#1d1d1f] hover:bg-black/[0.01] text-left cursor-pointer outline-none transition-all col-span-2"
                >
                  <div className="p-2 rounded-lg bg-black/[0.03] text-[#6b7280]">
                    <Building2 className="w-4 h-4 stroke-[2.2px]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-bold truncate">SETAFs</span>
                    <span className="text-[9px] font-semibold text-[#86868b] leading-tight">
                      Mapa de territórios e divisões da Bahia
                    </span>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
