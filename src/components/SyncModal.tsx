"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { X, Copy, Check } from "lucide-react";

const appsScriptCodeText = `function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    if (payload.action === 'sync') {
      var data = payload.data;
      var headerRow = ["Convênio", "Programa", "Município", "Entidade", "Objeto", "Vigência", "Dias Passados", "Data Tomada", "Ano", "Andamento", "Código Portaria", "Observação", "Comissão", "Resultado"];
      
      sheet.clearContents();
      sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
      
      if (data.length > 0) {
        var formattedData = data.map(function(row) {
          var newRow = [];
          for (var i = 0; i < 14; i++) {
            newRow.push(row[i] !== undefined && row[i] !== null ? String(row[i]) : "");
          }
          return newRow;
        });
        sheet.getRange(2, 1, formattedData.length, 14).setValues(formattedData);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

export default function SyncModal() {
  const { isSyncOpen, setIsSyncOpen, scriptUrl, saveScriptUrl } = useApp();
  const [urlInput, setUrlInput] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrlInput(scriptUrl);
  }, [scriptUrl]);

  const handleSave = () => {
    saveScriptUrl(urlInput);
    setIsSyncOpen(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(appsScriptCodeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isSyncOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[100] flex justify-center items-end md:justify-end md:items-stretch transition-opacity duration-300">
      {/* Click Outside overlay */}
      <div className="absolute inset-0" onClick={() => setIsSyncOpen(false)} />

      {/* Modal Card */}
      <div className="relative w-full max-w-[500px] h-[92vh] md:h-full bg-white/95 backdrop-blur-[25px] shadow-[0_0_50px_rgba(0,0,0,0.1)] border-t md:border-t-0 md:border-l border-black/5 rounded-t-[24px] md:rounded-t-none md:rounded-l-[24px] p-6 flex flex-col justify-between z-10 animate-in slide-in-from-bottom md:slide-in-from-right duration-300">
        {/* iOS style handle indicator at the top for mobile bottom sheets */}
        <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mb-2 md:hidden flex-shrink-0" />
        <div className="flex flex-col gap-6 overflow-y-auto pr-1 custom-scrollbar">
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-black/5">
            <div>
              <h2 className="text-lg font-bold text-[#1d1d1f] tracking-tight">Sincronização</h2>
              <p className="text-[11px] text-[#86868b] mt-0.5">Configurações de integração Google Sheets</p>
            </div>
            <button
              onClick={() => setIsSyncOpen(false)}
              className="p-1.5 rounded-full hover:bg-black/5 text-[#86868b] hover:text-[#1d1d1f] transition-colors cursor-pointer outline-none border-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Apps Script URL input */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider">
              URL do Script da Planilha (Web App)
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full h-10 px-3 border border-black/10 rounded-[10px] bg-black/[0.02] text-xs font-semibold focus:bg-white focus:border-[#28cd41] focus:ring-2 focus:ring-[#28cd41]/15 outline-none transition-all duration-200"
            />
          </div>

          {/* Description */}
          <div className="p-4 bg-[#f5f5f7] border border-black/5 rounded-[10px] text-xs text-[#86868b] leading-relaxed">
            <p className="font-semibold text-[#1d1d1f] mb-1">Como integrar com o Google Planilhas:</p>
            <ol className="list-decimal pl-4 flex flex-col gap-1.5 mt-2">
              <li>No painel do Google Planilhas, acesse <strong>Extensões &gt; Apps Script</strong>.</li>
              <li>Copie o código fornecido abaixo e cole-o no seu arquivo de Apps Script.</li>
              <li>Acesse <strong>Implantar &gt; Nova implantação</strong> no topo direito.</li>
              <li>Selecione o tipo <strong>Web App</strong> (Aplicativo da Web).</li>
              <li>Configure: <em>Executar como:</em> <strong>Você</strong> e <em>Quem tem acesso:</em> <strong>Qualquer pessoa</strong>.</li>
              <li>Copie a URL gerada e cole no campo acima!</li>
            </ol>
          </div>

          {/* Script Code Template */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Código Apps Script</span>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1 px-2.5 h-6 rounded-md border text-[10px] font-bold cursor-pointer transition-colors ${
                  copied
                    ? "bg-emerald-50 border-emerald-300 text-emerald-600"
                    : "bg-white hover:bg-black/5 border-black/10 text-[#2d3142]"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copiar Código
                  </>
                )}
              </button>
            </div>
            <textarea
              readOnly
              value={appsScriptCodeText}
              className="w-full h-[180px] p-3 font-mono text-[10px] border border-black/10 bg-[#f5f5f7] rounded-[10px] outline-none resize-none custom-scrollbar text-[#2d3142]"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 pt-4 border-t border-black/5 justify-end mt-4">
          <button
            onClick={() => setIsSyncOpen(false)}
            className="px-4 h-9 text-xs font-semibold text-[#86868b] hover:bg-black/5 rounded-[10px] border-0 cursor-pointer bg-transparent"
          >
            Fechar
          </button>
          <button
            onClick={handleSave}
            className="px-5 h-9 text-xs font-semibold bg-[#28cd41] text-white hover:bg-[#20a632] rounded-[10px] border-0 cursor-pointer shadow-[0_2px_10px_rgba(40,205,65,0.2)]"
          >
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
