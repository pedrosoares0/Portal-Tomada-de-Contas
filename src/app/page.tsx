"use client";

import React from "react";
import Image from "next/image";
import { AppProvider, useApp } from "@/context/AppContext";
import Sidebar from "@/components/Sidebar";
import SpotlightSearch from "@/components/SpotlightSearch";
import Spreadsheet from "@/components/Spreadsheet";
import DashboardView from "@/components/DashboardView";
import ViagensModal from "@/components/ViagensModal";
import SyncModal from "@/components/SyncModal";
import BentoWidgets from "@/components/BentoWidgets";
import YearFolders from "@/components/YearFolders";
import PortariasView from "@/components/PortariasView";
import { Settings, RefreshCw, ArrowUp, AlertCircle, CheckCircle, FileClock } from "lucide-react";
import { motion } from "framer-motion";
import { TAB_LABELS } from "@/lib/utils";

function DashboardContent() {
  const {
    activeTab,
    addRecord,
    fetchSheetData,
    setIsSyncOpen,
    toastMessage,
    isLoading,
    isSyncing
  } = useApp();

  return (
    <div className="app w-full h-screen p-4 flex gap-4 overflow-hidden print:p-0 print:h-auto print:overflow-visible">
      {/* Finder Sidebar */}
      <Sidebar />

      {/* Main Panel Content Container */}
      <main className="main flex flex-col flex-1 h-full min-w-0 overflow-hidden gap-4 print:h-auto print:overflow-visible">
        <div className="center-column flex flex-col flex-1 min-h-0 gap-4 print:h-auto print:overflow-visible">
          
          {/* Topbar Header Dashboard Control Panel */}
          <div className="topbar flex items-center gap-3 py-1 pb-3 print:hidden">
            
            {/* Header Brand */}
            <div className="header-brand-container flex items-center gap-3">
              <div className="section-icon flex items-center justify-center hover:scale-105 transition-transform duration-200 relative p-1">
                <Image
                  src="/imagens/logo-controle-tomada.png?v=2"
                  alt="Controle de Tomada de Contas"
                  width={36}
                  height={36}
                  className="block drop-shadow-[0_4px_8px_rgba(40,205,65,0.15)]"
                  unoptimized
                />
                {(isLoading || isSyncing) && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSyncing ? "bg-amber-400" : "bg-emerald-400"}`}></span>
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isSyncing ? "bg-amber-500" : "bg-emerald-500"}`}></span>
                  </span>
                )}
              </div>
              <div className="section-title flex flex-col leading-tight select-none">
                <div className="text-[9.5px] text-[#28cd41] font-bold uppercase tracking-wider">
                  {TAB_LABELS[activeTab] || "Início"}
                </div>
                <h1 className="text-sm font-black text-[#1d1d1f] tracking-tight mt-0.5">Tomada de Contas</h1>
              </div>
            </div>

            {/* Spotlight Search */}
            {activeTab === "inicio" && <SpotlightSearch />}

            {/* Table Action Buttons */}
            {activeTab === "inicio" && (
              <div className="table-actions flex items-center gap-2 flex-shrink-0">
                <motion.button
                  onClick={addRecord}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="btn-nova-tomada relative overflow-hidden inline-flex justify-center items-center gap-0 bg-gradient-to-b from-[#30D158] to-[#28CD41] text-white font-bold text-[11px] h-[32px] px-4 rounded-[8px] border border-white/20 cursor-pointer shadow-[0_2px_6px_rgba(40,205,65,0.2),0_1px_2px_rgba(40,205,65,0.08)] hover:shadow-[0_4px_12px_rgba(40,205,65,0.3),0_2px_4px_rgba(40,205,65,0.12)] transition-all duration-200 outline-none group"
                  type="button"
                >
                  {/* Sliding Sheen sweep — left to right on hover */}
                  <span className="pointer-events-none absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-[20deg] -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-10" />
                  <span className="relative z-10 tracking-[-0.01em]">Nova Tomada</span>
                  {/* Arrow — hidden by default, slides in on hover */}
                  <ArrowUp className="w-3 h-3 relative z-10 ml-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:ml-1 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]" />
                </motion.button>

                <motion.button
                  onClick={() => fetchSheetData(true)}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="btn inline-flex items-center gap-1.5 px-3 h-[32px] bg-white/80 hover:bg-white border border-black/[0.06] hover:border-black/[0.1] rounded-[8px] text-[11px] font-semibold text-[#374151] cursor-pointer outline-none shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.05)] transition-all duration-150"
                  type="button"
                >
                  <RefreshCw className={`w-3 h-3 text-[#6B7280] ${isLoading ? "animate-spin text-emerald-500" : ""}`} />
                  <span>Recarregar Planilha</span>
                </motion.button>

                <motion.button
                  onClick={() => setIsSyncOpen(true)}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  title="Configurar Sincronização Google Sheets"
                  className="btn-icon p-1.5 bg-white/80 hover:bg-white border border-black/[0.06] hover:border-black/[0.1] rounded-[8px] text-[#374151] cursor-pointer outline-none shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.05)] transition-all duration-150 flex items-center justify-center h-[32px] w-[32px]"
                  type="button"
                >
                  <Settings className={`w-3.5 h-3.5 text-[#6B7280] ${isSyncing ? "animate-pulse text-amber-500" : ""}`} />
                </motion.button>
              </div>
            )}

            {/* Dynamic page-specific header portal slot */}
            {activeTab !== "inicio" && (
              <div id="topbar-actions-slot" className="flex items-center gap-2 ml-auto min-w-0" />
            )}
          </div>

          {/* Spreadsheet Control Board */}
          <section className="section-control bg-white/75 backdrop-blur-[25px] border border-[rgba(0,0,0,0.06)] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.04),inset_0_1.5px_0_rgba(255,255,255,0.6)] flex flex-col flex-1 min-h-0 p-4 print:border-none print:shadow-none print:bg-transparent print:p-0">
            {activeTab === "dashboard" ? (
              <DashboardView />
            ) : activeTab === "portarias" ? (
              <PortariasView />
            ) : activeTab === "analise" ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white/50 backdrop-blur-md rounded-[16px] border border-black/[0.04]">
                <div className="w-12 h-12 rounded-[12px] bg-[rgba(40,205,65,0.05)] border border-[rgba(40,205,65,0.1)] flex items-center justify-center text-[#28cd41] mb-3">
                  <FileClock className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-[#1d1d1f]">Convênios em Análise</h3>
                <p className="text-xs text-[#86868b] mt-1 max-w-sm">
                  Esta tela exibirá os processos atualmente em fase de análise detalhada. O desenvolvimento está em andamento.
                </p>
              </div>
            ) : (
              <>
                <YearFolders />
                <Spreadsheet />
              </>
            )}
          </section>

          {/* Footer Bento Widgets Grid */}
          <BentoWidgets />
        </div>
      </main>

      {/* Slideout Modals */}
      <ViagensModal />
      <SyncModal />

      {/* Floating Capsule Toast Alerts */}
      {toastMessage && (
        <div
          className={`fixed left-1/2 bottom-8 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] font-semibold text-xs border backdrop-blur-md z-[1000] animate-in fade-in slide-in-from-bottom-2 duration-300 ${
            toastMessage.success
              ? "bg-emerald-50/95 border-emerald-500/20 text-[#1D7531]"
              : "bg-red-50/95 border-red-500/20 text-[#B21B14]"
          }`}
          role="status"
        >
          {toastMessage.success ? (
            <CheckCircle className="w-4 h-4 text-[#34C759]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#FF3B30]" />
          )}
          <span>{toastMessage.msg}</span>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}
