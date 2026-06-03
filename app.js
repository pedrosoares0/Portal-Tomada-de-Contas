const menu = document.querySelectorAll('.menu li');
menu.forEach(li => {
  li.addEventListener('click', () => {
    menu.forEach(x => x.classList.remove('active'));
    li.classList.add('active');
  });
});

document.querySelectorAll('.action').forEach(btn => {
  btn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      btn.click();
    }
  });
});

const search = document.querySelector('.search input');
if (search) {
  search.addEventListener('focus', () => search.parentElement.classList.add('focus'));
  search.addEventListener('blur', () => search.parentElement.classList.remove('focus'));
}

const people = document.querySelectorAll('.people li');
if (people.length) {
  const clear = () => {
    people.forEach(x => x.classList.remove('is-selected', 'accent-blue', 'accent-green', 'accent-gray', 'accent-red'));
  };
  people.forEach(li => {
    li.addEventListener('click', () => {
      clear();
      const av = li.querySelector('.avatar');
      let accent = 'blue';
      if (av.classList.contains('avatar-green')) accent = 'green';
      else if (av.classList.contains('avatar-gray')) accent = 'gray';
      else if (av.classList.contains('avatar-red')) accent = 'red';
      li.classList.add('is-selected', `accent-${accent}`);
    });
  });
}

// View: Relação de viagens
(function() {
  const openBtn = document.getElementById('open-viagens');
  const view = document.getElementById('view-viagens');
  const closeBtn = document.getElementById('close-viagens');
  if (!openBtn || !view || !closeBtn) return;

  const open = () => {
    view.classList.add('is-active');
    document.body.classList.add('sidebar-collapsed');
  };
  const close = () => {
    view.classList.remove('is-active');
    document.body.classList.remove('sidebar-collapsed');
  };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  view.addEventListener('click', (e) => {
    if (e.target === view) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && view.classList.contains('is-active')) close();
  });
})();

// Edição e impressão na tela de viagens
(function() {
  const table = document.getElementById('viagens-table');
  const addRowBtn = document.getElementById('btn-add-row');
  const printBtn = document.getElementById('btn-print-viagens');
  const monthInput = document.getElementById('viagens-month');
  const saveBtn = document.getElementById('btn-save-viagens');
  const toast = document.getElementById('viagens-toast');
  if (!table || !addRowBtn || !printBtn) return;

  // Preenche mês atual por padrão
  if (monthInput && !monthInput.value) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    monthInput.value = `${yyyy}-${mm}`;
  }

  const keyForMonth = () => {
    const v = (monthInput && monthInput.value) ? monthInput.value : '';
    return v ? `viagens:${v}` : null;
  };
  const serialize = () => {
    const rows = [];
    const trs = table.querySelectorAll('tbody tr');
    trs.forEach(tr => {
      const cells = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
      if (cells.some(v => v)) rows.push(cells);
    });
    return rows;
  };
  const ensureMinRows = (n) => {
    const tbody = table.querySelector('tbody');
    while (tbody.rows.length < n) {
      const tr = document.createElement('tr');
      for (let i = 0; i < 6; i++) {
        const td = document.createElement('td');
        td.setAttribute('contenteditable', 'true');
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  };
  const populate = (rows) => {
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    if (Array.isArray(rows) && rows.length) {
      rows.forEach(r => {
        const tr = document.createElement('tr');
        for (let i = 0; i < 6; i++) {
          const td = document.createElement('td');
          td.setAttribute('contenteditable', 'true');
          td.textContent = r[i] || '';
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      });
    }
    ensureMinRows(4);
  };
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
  };
  const loadFromStorage = () => {
    const key = keyForMonth();
    if (!key) { populate([]); return; }
    try {
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : null;
      populate(data && Array.isArray(data.rows) ? data.rows : []);
      if (raw) showToast('Tabela carregada');
    } catch { populate([]); }
  };
  const saveToStorage = () => {
    const key = keyForMonth();
    if (!key) return;
    const rows = serialize();
    const payload = { month: monthInput ? monthInput.value : '', rows };
    try {
      localStorage.setItem(key, JSON.stringify(payload));
      const v = monthInput ? monthInput.value : '';
      if (v) {
        const [yyyy, mm] = v.split('-');
        const nomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const nomeMes = nomes[parseInt(mm, 10) - 1] || mm;
        showToast(`Tabela salva • ${nomeMes}/${yyyy}`);
      } else {
        showToast('Tabela salva');
      }
    } catch {
      showToast('Erro ao salvar');
    }
  };

  const addRow = () => {
    const tr = document.createElement('tr');
    for (let i = 0; i < 6; i++) {
      const td = document.createElement('td');
      td.setAttribute('contenteditable', 'true');
      tr.appendChild(td);
    }
    table.querySelector('tbody').appendChild(tr);
    tr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const firstCell = tr.querySelector('td');
    if (firstCell) firstCell.focus();
  };

  addRowBtn.addEventListener('click', addRow);
  if (saveBtn) saveBtn.addEventListener('click', saveToStorage);
  if (monthInput) monthInput.addEventListener('change', loadFromStorage);
  loadFromStorage();

  // Enter cria nova linha
  table.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRow();
    }
  });

  // Imprimir apenas a tabela
  printBtn.addEventListener('click', () => {
    const monthInput = document.getElementById('viagens-month');
    const out = document.getElementById('viagens-print-month');
    if (monthInput && out) {
      const [yyyy, mm] = (monthInput.value || '').split('-');
      if (yyyy && mm) {
        const nomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const nomeMes = nomes[parseInt(mm, 10) - 1] || mm;
        out.textContent = `${nomeMes}/${yyyy}`;
      } else {
        out.textContent = '';
      }
    }
    window.print();
  });

  // Máscara de data dd/mm para as colunas "Data saída" e "Data retorno"
  const isDateCell = (td) => {
    if (!td || td.tagName !== 'TD') return false;
    const idx = td.cellIndex;
    return idx === 4 || idx === 5;
  };
  const setCaretToEnd = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  };
  const formatDDMM = (digits) => {
    digits = digits.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + '/' + digits.slice(2);
  };
  const normalizeDDMM = (val) => {
    const d = val.replace(/\D/g, '');
    let dd = d.slice(0, 2);
    let mm = d.slice(2, 4);
    if (!dd) dd = '';
    if (!mm) mm = '';
    if (dd) dd = String(Math.max(1, Math.min(31, parseInt(dd, 10)))).padStart(2, '0');
    if (mm) mm = String(Math.max(1, Math.min(12, parseInt(mm, 10)))).padStart(2, '0');
    if (dd && mm) return `${dd}/${mm}`;
    if (dd) return dd;
    return '';
  };
  table.addEventListener('keydown', (e) => {
    const td = e.target.closest('td');
    if (!isDateCell(td)) return;
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab', 'Enter'];
    if (allowed.includes(e.key)) return;
    if (e.key.length === 1 && !/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  }, true);
  table.addEventListener('input', (e) => {
    const td = e.target.closest('td');
    if (!isDateCell(td)) return;
    const val = td.textContent || '';
    td.textContent = formatDDMM(val);
    setCaretToEnd(td);
  });
  table.addEventListener('paste', (e) => {
    const td = e.target.closest('td');
    if (!isDateCell(td)) return;
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text') || '';
    td.textContent = formatDDMM(text);
    setCaretToEnd(td);
  });
  table.addEventListener('blur', (e) => {
    const td = e.target.closest('td');
    if (!isDateCell(td)) return;
    td.textContent = normalizeDDMM(td.textContent || '');
  }, true);
})();

// Gerenciamento Dinâmico da Planilha & CRUD Bilateral com Google Sheets
(function() {
  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1KAraKreIDk0gdAOMHnBL8fiZll0FaYsej_aHmGBFnUQ/gviz/tq?tqx=out:json';
  const tbody = document.getElementById('spreadsheet-body');
  const btnAdd = document.getElementById('btn-add-record');
  const btnReload = document.getElementById('btn-reload-sheet');
  const searchInput = document.querySelector('.search input');

  // Sync Modal elements
  const modalSync = document.getElementById('view-sync-settings');
  const btnCloseSync = document.getElementById('btn-close-sync');
  const btnSaveSync = document.getElementById('btn-save-sync');
  const inputScriptUrl = document.getElementById('script-url');
  const btnCopyScript = document.getElementById('btn-copy-script');
  const txtCode = document.getElementById('apps-script-code');

  if (!tbody) return;

  // Local State
  let baseData = []; // Data loaded from Google Sheets (rows as arrays)
  let localEdits = {
    added: [],
    updated: {},
    deleted: []
  };
  let activeFilters = {}; // Filters selected for columns { colIndex: [values] }
  let scriptUrl = localStorage.getItem('google_script_url') || 'https://script.google.com/macros/s/AKfycby4Nm0ycDl9f5rxA5UPSe-W8FzmZE1ZtAgCCZGHNxwSoabEvR3srUsn58vCHnZzG_CWgg/exec';

  if (inputScriptUrl) {
    inputScriptUrl.value = scriptUrl;
  }

  // Google Apps Script template code
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

  if (txtCode) {
    txtCode.value = appsScriptCodeText;
  }

  if (btnCopyScript && txtCode) {
    btnCopyScript.addEventListener('click', () => {
      txtCode.select();
      navigator.clipboard.writeText(appsScriptCodeText)
        .then(() => {
          btnCopyScript.textContent = 'Copiado!';
          btnCopyScript.style.background = '#e2fcdb';
          btnCopyScript.style.borderColor = '#34C759';
          setTimeout(() => {
            btnCopyScript.textContent = 'Copiar Código';
            btnCopyScript.style.background = '#fff';
            btnCopyScript.style.borderColor = '#dee2e6';
          }, 2000);
        })
        .catch(err => {
          console.error('Erro ao copiar código:', err);
        });
    });
  }

  // Modal event listeners
  const btnOpenSync = document.getElementById('btn-open-sync-settings');
  const openSyncModal = () => {
    modalSync.classList.add('is-active');
    document.body.classList.add('sidebar-collapsed');
  };
  const closeSyncModal = () => {
    modalSync.classList.remove('is-active');
    document.body.classList.remove('sidebar-collapsed');
  };

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      openSyncModal();
    }
  });

  if (btnOpenSync) {
    btnOpenSync.addEventListener('click', openSyncModal);
  }

  if (btnCloseSync) {
    btnCloseSync.addEventListener('click', closeSyncModal);
  }

  if (btnSaveSync) {
    btnSaveSync.addEventListener('click', () => {
      scriptUrl = inputScriptUrl.value.trim();
      localStorage.setItem('google_script_url', scriptUrl);
      modalSync.classList.remove('is-active');
      document.body.classList.remove('sidebar-collapsed');
      showToast("Configuração de sincronização salva!");
      fetchSheetData(true);
    });
  }

  // Load edits from localStorage
  const loadLocalEdits = () => {
    try {
      const saved = localStorage.getItem('sheet_local_edits');
      if (saved) {
        localEdits = JSON.parse(saved);
        if (!localEdits.added) localEdits.added = [];
        if (!localEdits.updated) localEdits.updated = {};
        if (!localEdits.deleted) localEdits.deleted = [];
      }
    } catch (e) {
      console.error("Erro ao carregar edições locais", e);
    }
  };

  const saveLocalEdits = () => {
    localStorage.setItem('sheet_local_edits', JSON.stringify(localEdits));
  };

  const showToast = (msg, success = true) => {
    const toast = document.getElementById('viagens-toast') || document.createElement('div');
    if (!toast.parentNode) {
      toast.id = 'viagens-toast';
      toast.className = 'viagens-toast no-print';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.background = success ? 'linear-gradient(135deg, #34C759, #5BE272)' : 'linear-gradient(135deg, #FF3B30, #FF7B7B)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  };

  // Fetch from Google Sheet (Apps Script Web App or Visualization JSON API via JSONP script injection)
  const fetchSheetData = async (force = false, silent = false) => {
    if (!silent && !baseData.length) {
      tbody.innerHTML = `<tr><td colspan="13" style="text-align: center; padding: 24px; color: var(--muted);">Carregando dados da planilha do Google...</td></tr>`;
    }
    
    try {
      // SWR Cache loading
      if (!force) {
        const cached = localStorage.getItem('sheet_csv_cache');
        if (cached) {
          try {
            baseData = JSON.parse(cached);
            renderTable();
          } catch (e) {
            console.error("Erro ao ler cache", e);
          }
        }
      }

      const cacheBust = `&t=${Date.now()}`;
      let loadedFromAppsScript = false;

      if (scriptUrl) {
        try {
          // Fetch from Google Apps Script Web App
          const urlWithBust = scriptUrl.includes('?') ? `${scriptUrl}&t=${Date.now()}` : `${scriptUrl}?t=${Date.now()}`;
          const response = await fetch(urlWithBust, { cache: 'no-cache' });
          if (!response.ok) throw new Error("Erro na requisição do Apps Script");
          const rows = await response.json();
          
          if (Array.isArray(rows) && rows.length > 0) {
            const finalRows = rows.slice(1).filter(r => r && r.length && r[0]).map(row => {
              const rowData = [];
              for (let i = 0; i < 14; i++) {
                rowData.push(row[i] !== undefined && row[i] !== null ? String(row[i]) : '');
              }
              return rowData;
            });
            baseData = finalRows;
            localStorage.setItem('sheet_csv_cache', JSON.stringify(finalRows));
            renderTable();
            loadedFromAppsScript = true;
          }
        } catch (scriptErr) {
          console.warn("Falha ao buscar do Apps Script, tentando API de Visualização Pública...", scriptErr);
        }
      }

      if (!loadedFromAppsScript) {
        // Fetch via JSONP script injection to bypass CORS on docs.google.com in local environments (file://)
        await new Promise((resolve, reject) => {
          window.google = window.google || {};
          window.google.visualization = window.google.visualization || {};
          window.google.visualization.Query = window.google.visualization.Query || {};
          
          window.google.visualization.Query.setResponse = function(json) {
            if (scriptTag && scriptTag.parentNode) {
              scriptTag.parentNode.removeChild(scriptTag);
            }
            try {
              if (json && json.status === 'ok' && json.table && json.table.rows) {
                const parsedRows = json.table.rows.map(r => {
                  const cells = r.c || [];
                  const rowData = [];
                  for (let i = 0; i < 14; i++) {
                    const cell = cells[i];
                    rowData.push(cell && cell.v !== null && cell.v !== undefined ? String(cell.v) : '');
                  }
                  return rowData;
                });
                const finalRows = parsedRows.filter(r => r[0] && r[0] !== 'Convenio' && r[0] !== 'Convênio');
                baseData = finalRows;
                localStorage.setItem('sheet_csv_cache', JSON.stringify(finalRows));
                renderTable();
                resolve();
              } else {
                reject(new Error("Formato inválido retornado pelo Google Sheet"));
              }
            } catch (err) {
              reject(err);
            }
          };

          const scriptTag = document.createElement('script');
          scriptTag.src = `${SHEET_URL}${cacheBust}`;
          scriptTag.async = true;
          scriptTag.onerror = function(err) {
            if (scriptTag && scriptTag.parentNode) {
              scriptTag.parentNode.removeChild(scriptTag);
            }
            reject(new Error("Falha ao carregar script JSONP"));
          };
          document.body.appendChild(scriptTag);
        });
      }
    } catch (e) {
      console.error(e);
      if (!silent) {
        showToast("Erro ao carregar planilha do Google: " + e.message, false);
      }
    }
  };

  // Merge base spreadsheet with CRUD local edits
  const getMergedData = () => {
    let merged = baseData.filter(row => {
      const convenio = String(row[0]);
      return !localEdits.deleted.includes(convenio);
    });

    merged = merged.map(row => {
      const convenio = String(row[0]);
      if (localEdits.updated[convenio]) {
        return localEdits.updated[convenio];
      }
      return row;
    });

    merged = [...merged, ...localEdits.added];
    return merged;
  };

  const applyColumnWidthsToTds = () => {
    const table = document.querySelector('.spreadsheet-table');
    if (!table) return;
    const ths = table.querySelectorAll('thead th');
    ths.forEach((th, index) => {
      const width = th.style.width;
      if (width) {
        const cells = table.querySelectorAll(`tbody tr td:nth-child(${index + 1}) .cell-value`);
        cells.forEach(div => {
          if (index !== 4 && index !== 11) {
            div.style.width = width;
            div.style.maxWidth = width;
          }
        });
      }
    });
  };

  const placeholders = [
    "Convênio",
    "Programa",
    "Município",
    "Entidade",
    "Objeto",
    "Vigência",
    "Dias Passados",
    "Data Tomada",
    "Ano",
    "Andamento",
    "Código Portaria",
    "Observação",
    "Comissão"
  ];

  const getCommissionAvatarsHtml = (text) => {
    if (!text) return '';
    
    const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const known = [
      { key: 'joao', name: 'João Rios', img: 'imagens/joao-icon.jpg' },
      { key: 'irail', name: 'Iraildes', img: 'imagens/iraildes-icon.jpg' },
      { key: 'pedro', name: 'Pedro', img: 'imagens/pedro-icon.jpg' },
      { key: 'pablo', name: 'Pablo', img: 'imagens/pablo-icon.jpg' }
    ];

    let html = '<div class="avatar-group">';
    let found = false;

    known.forEach(member => {
      if (normalized.includes(member.key)) {
        found = true;
        html += `<div class="avatar-group-item" data-tooltip="${member.name}" title="${member.name}"><img src="${member.img}" alt="${member.name}"></div>`;
      }
    });

    html += '</div>';
    return found ? html : '';
  };

  const renderCommissionCell = (cellVal, displayText, rawText) => {
    cellVal.dataset.raw = rawText || '';
    if (!displayText || displayText.trim() === '') {
      cellVal.innerHTML = '';
    } else {
      const avatarsHtml = getCommissionAvatarsHtml(displayText);
      cellVal.innerHTML = avatarsHtml || '';
    }
  };

  const formatDateToDDMMYYYY = (val) => {
    if (!val) return '';
    val = String(val).trim();
    const match = val.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|\s|$)/);
    if (match) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }
    return val;
  };

  const normalizeInputDate = (val) => {
    if (!val) return '';
    val = String(val).trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) return val;
    const matchIso = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (matchIso) {
      return `${matchIso[3]}/${matchIso[2]}/${matchIso[1]}`;
    }
    const digits = val.replace(/\D/g, '');
    if (digits.length === 8) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }
    return val;
  };

  // Render merged data to table
  const renderTable = () => {
    const data = getMergedData();

    // Preserve scroll position before re-rendering
    const scrollContainer = tbody.closest('.manual-spreadsheet');
    const savedScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
    const savedScrollLeft = scrollContainer ? scrollContainer.scrollLeft : 0;

    tbody.innerHTML = '';

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="13" style="text-align: center; padding: 24px; color: var(--muted);">Nenhum convênio encontrado.</td></tr>`;
    } else {
      data.forEach((row) => {
        const tr = document.createElement('tr');
        const convenio = String(row[0]);
        tr.dataset.key = convenio;
        
        // Render 13 columns (index 0 to 12)
        for (let i = 0; i < 13; i++) {
          const td = document.createElement('td');
          
          const cellVal = document.createElement('div');
          cellVal.className = 'cell-value';
          if (i === 6) {
            cellVal.contentEditable = 'false';
            cellVal.style.cursor = 'default';
            cellVal.style.userSelect = 'none';
          } else {
            cellVal.contentEditable = 'true';
          }
          
          let val = row[i] || '';
          if (i === 5 || i === 7) {
            val = formatDateToDDMMYYYY(val);
          }
          const isNewRow = convenio.startsWith('NEW_');
          if (isNewRow) {
            val = '';
          }
          if (i === 12) {
            const commText = row[12] || '';
            const obsText = row[11] || '';
            const displayText = commText ? commText : obsText;
            renderCommissionCell(cellVal, displayText, commText);
          } else if (val) {
            cellVal.textContent = val;
          }
          cellVal.dataset.placeholder = placeholders[i] || '';
          
          // Apply custom styling class based on column index
          if (i === 0) {
            cellVal.classList.add('convenio-cell');
          } else if (i === 6) {
            cellVal.classList.add('dias-passados-cell');
            const num = parseInt(val, 10);
            if (!isNaN(num)) {
              if (num > 90) cellVal.classList.add('overdue');
              else cellVal.classList.add('pending');
            }
          } else if (i === 9) {
            cellVal.classList.add('status-badge-cell');
            const statusText = val.trim().toLowerCase();
            if (statusText.includes('aberto')) {
              cellVal.classList.add('status-open');
            } else if (statusText.includes('finalizado') || statusText.includes('concluido')) {
              cellVal.classList.add('status-done');
            } else {
              cellVal.classList.add('status-progress');
            }
          }
          
          if (i === 12) {
            cellVal.addEventListener('focus', () => {
              cellVal.textContent = cellVal.dataset.raw || '';
            });
          }

          cellVal.addEventListener('blur', () => {
            if (i === 5 || i === 7) {
              cellVal.textContent = normalizeInputDate(cellVal.textContent);
            }
            
            // Recalculate cell styling classes on blur
            cellVal.className = 'cell-value';
            const updatedVal = cellVal.textContent.trim();
            
            if (i === 12) {
              renderCommissionCell(cellVal, updatedVal, updatedVal);
            }
            
            if (i === 0) {
              cellVal.classList.add('convenio-cell');
            } else if (i === 6) {
              cellVal.classList.add('dias-passados-cell');
              const num = parseInt(updatedVal, 10);
              if (!isNaN(num)) {
                if (num > 90) cellVal.classList.add('overdue');
                else cellVal.classList.add('pending');
              }
            } else if (i === 9) {
              cellVal.classList.add('status-badge-cell');
              const statusText = updatedVal.toLowerCase();
              if (statusText.includes('aberto')) {
                cellVal.classList.add('status-open');
              } else if (statusText.includes('finalizado') || statusText.includes('concluido')) {
                cellVal.classList.add('status-done');
              } else {
                cellVal.classList.add('status-progress');
              }
            }
            
            if (i !== 12 && cellVal.textContent.trim() === '') {
              cellVal.innerHTML = '';
            }
            handleCellEdit(tr);
          });
          
          cellVal.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              cellVal.blur();
            }
          });
          
          td.appendChild(cellVal);
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      });
    }
    
    // Add bottom inline Add button row
    const trAdd = document.createElement('tr');
    trAdd.className = 'no-print';
    const tdAdd = document.createElement('td');
    tdAdd.colSpan = 13;
    tdAdd.style.textAlign = 'center';
    tdAdd.style.padding = '12px';
    tdAdd.style.background = '#fafafa';
    
    const btnAddInline = document.createElement('button');
    btnAddInline.className = 'btn btn-primary';
    btnAddInline.textContent = '+ Adicionar Novo Convênio';
    btnAddInline.style.height = '32px';
    btnAddInline.style.fontSize = '11px';
    btnAddInline.style.padding = '0 16px';
    btnAddInline.style.borderRadius = '6px';
    btnAddInline.style.background = 'rgba(0, 122, 255, 0.05)';
    btnAddInline.style.color = '#007AFF';
    btnAddInline.style.border = '1px dashed rgba(0, 122, 255, 0.3)';
    btnAddInline.style.cursor = 'pointer';
    btnAddInline.style.fontWeight = '600';
    btnAddInline.style.display = 'inline-flex';
    btnAddInline.style.alignItems = 'center';
    btnAddInline.style.justifyContent = 'center';
    
    btnAddInline.addEventListener('mouseover', () => {
      btnAddInline.style.background = 'rgba(0, 122, 255, 0.1)';
    });
    btnAddInline.addEventListener('mouseout', () => {
      btnAddInline.style.background = 'rgba(0, 122, 255, 0.05)';
    });
    btnAddInline.addEventListener('click', () => {
      addRecord();
    });

    tdAdd.appendChild(btnAddInline);
    trAdd.appendChild(tdAdd);
    tbody.appendChild(trAdd);

    // Apply filters and sizes
    applyAllFilters();
    applyColumnWidthsToTds();

    // Restore scroll position
    if (scrollContainer) {
      scrollContainer.scrollTop = savedScrollTop;
      scrollContainer.scrollLeft = savedScrollLeft;
    }
  };

  // Handle cell edits
  const handleCellEdit = (tr) => {
    const oldKey = String(tr.dataset.key);
    const cells = tr.cells;
    const convenioCell = cells[0].querySelector('.cell-value') || cells[0];
    const newConvenio = convenioCell.textContent.trim();

    if (!newConvenio) {
      if (oldKey.startsWith('NEW_')) {
        let hasAnyValue = false;
        for (let i = 1; i < 13; i++) {
          const text = cells[i].textContent.trim();
          if (text) {
            hasAnyValue = true;
            break;
          }
        }
        if (!hasAnyValue) return;
      }
      showToast("O Convênio não pode ser vazio!", false);
      convenioCell.textContent = oldKey.startsWith('NEW_') ? '' : oldKey;
      return;
    }

    const rowValues = [];
    for (let i = 0; i < 13; i++) {
      const cellValDiv = cells[i].querySelector('.cell-value');
      if (i === 12 && cellValDiv) {
        rowValues.push(cellValDiv.dataset.raw ? cellValDiv.dataset.raw.trim() : '');
      } else {
        rowValues.push(cellValDiv ? cellValDiv.textContent.trim() : cells[i].textContent.trim());
      }
    }

    // Preserve column 13 (Resultado) from the existing record to prevent data loss!
    const existingRow = getMergedData().find(r => String(r[0]) === oldKey);
    const col13 = existingRow ? existingRow[13] : 'Adimplente';
    rowValues.push(col13);

    if (oldKey !== newConvenio) {
      const addedIdx = localEdits.added.findIndex(r => String(r[0]) === oldKey);
      if (addedIdx > -1) {
        localEdits.added[addedIdx] = rowValues;
      } else {
        localEdits.deleted.push(oldKey);
        localEdits.added.push(rowValues);
      }
      tr.dataset.key = newConvenio;
    } else {
      const isNew = localEdits.added.some(r => String(r[0]) === oldKey);
      if (isNew) {
        localEdits.added = localEdits.added.map(r => String(r[0]) === oldKey ? rowValues : r);
      } else {
        localEdits.updated[oldKey] = rowValues;
      }
    }

    saveLocalEdits();
    
    // Trigger design eng save success flash animation on the row
    tr.classList.remove('row-save-flash');
    void tr.offsetWidth; // Trigger reflow
    tr.classList.add('row-save-flash');

    showToast("Edição salva localmente");
    triggerBilateralSync();
  };

  // Add row
  const addRecord = () => {
    const newConvenio = 'NEW_' + Math.floor(100000 + Math.random() * 900000);
    const newRow = [
      newConvenio,
      "", // Programa
      "", // Município
      "", // Entidade
      "", // Objeto
      "", // Vigência
      "", // Dias Passados
      "", // Data Tomada
      new Date().getFullYear().toString(), // Ano
      "Fase de Análise", // Andamento
      "", // Código Portaria
      "", // Observação
      "João Rios", // Comissão default
      "Adimplente" // Resultado default
    ];

    localEdits.added.push(newRow);
    saveLocalEdits();
    renderTable();
    showToast("Novo convênio adicionado. Edite as células!");
    
    const children = tbody.children;
    const newTr = children[children.length - 2];
    if (newTr) {
      newTr.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const firstCell = newTr.cells[0].querySelector('.cell-value');
      if (firstCell) firstCell.focus();
    }
  };

  // Apply search query and checkbox column-level filters
  const applyAllFilters = () => {
    const query = searchInput ? searchInput.value : '';
    const cleanQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    const trs = tbody.querySelectorAll('tr');
    trs.forEach(tr => {
      if (tr.classList.contains('no-print') || tr.cells.length < 13) return;

      let matchSearch = false;
      let matchFilters = true;

      // 1. Check search query match
      if (cleanQuery === '') {
        matchSearch = true;
      } else {
        for (let i = 0; i < 13; i++) {
          const cell = tr.cells[i];
          if (cell) {
            const div = cell.querySelector('.cell-value');
            const cellText = (i === 12 && div) ? (div.dataset.raw || '') : (div ? div.textContent : cell.textContent);
            const text = (cellText || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (text.includes(cleanQuery)) {
              matchSearch = true;
              break;
            }
          }
        }
      }

      // 2. Check column-level checkbox filters
      for (let i = 0; i < 13; i++) {
        if (activeFilters[i]) {
          const cell = tr.cells[i];
          const div = cell ? cell.querySelector('.cell-value') : null;
          const cellText = (i === 12 && div) ? (div.dataset.raw || '').trim() : (div ? div.textContent.trim() : (cell ? cell.textContent.trim() : ''));
          if (!activeFilters[i].includes(cellText)) {
            matchFilters = false;
            break;
          }
        }
      }

      tr.style.display = (matchSearch && matchFilters) ? '' : 'none';
    });
  };

  const filterTable = (query) => {
    applyAllFilters();
  };

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterTable(e.target.value);
    });
  }

  // Sync to Google Sheets via Apps Script Web App
  const triggerBilateralSync = async () => {
    if (!scriptUrl) {
      console.log("Sync ignorado: URL do Google Apps Script não configurada.");
      return;
    }

    try {
      const merged = getMergedData();
      const payload = {
        action: 'sync',
        data: merged,
        edits: localEdits
      };

      const isFileProtocol = window.location.protocol === 'file:';
      const fetchOptions = {
        method: 'POST',
        body: JSON.stringify(payload)
      };

      if (isFileProtocol) {
        fetchOptions.mode = 'no-cors';
      } else {
        fetchOptions.mode = 'cors';
      }

      const response = await fetch(scriptUrl, fetchOptions);

      if (isFileProtocol) {
        // In no-cors mode, the response is opaque (status 0). If the fetch didn't throw, it was sent successfully!
        localEdits = { added: [], updated: {}, deleted: [] };
        saveLocalEdits();
        showToast("Sincronizado com o Google Sheets!");
      } else {
        if (response.ok) {
          const resJson = await response.json();
          if (resJson && resJson.status === 'success') {
            localEdits = { added: [], updated: {}, deleted: [] };
            saveLocalEdits();
            showToast("Sincronizado com o Google Sheets!");
          } else {
            throw new Error(resJson ? resJson.message : "Erro desconhecido no servidor");
          }
        } else {
          throw new Error("Resposta inválida do servidor: " + response.status);
        }
      }
    } catch (e) {
      console.error("Erro na sincronização com Google Sheets", e);
      showToast("Erro ao sincronizar: " + e.message, false);
    }
  };

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      addRecord();
    });
  }
  
  if (btnReload) {
    btnReload.addEventListener('click', () => {
      fetchSheetData(true);
    });
  }

  // Detect if user is currently editing a cell
  const isUserEditing = () => {
    const active = document.activeElement;
    if (!active) return false;
    return active.classList.contains('cell-value') || active.tagName === 'TD' || active.getAttribute('contenteditable') === 'true';
  };

  // 8-second polling interval for faster automatic background synchronization
  setInterval(() => {
    if (!isUserEditing()) {
      console.log("Sincronizando bidirecional: buscando atualizações da planilha...");
      fetchSheetData(true, true);
    }
  }, 8000);

  // Resizable Columns logic
  const enableColumnResizing = () => {
    const table = document.querySelector('.spreadsheet-table');
    if (!table) return;

    const ths = table.querySelectorAll('thead th');
    ths.forEach((th, index) => {
      if (th.querySelector('.resize-handle')) return;

      const handle = document.createElement('div');
      handle.className = 'resize-handle';
      th.appendChild(handle);

      let startX, startWidth;

      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startX = e.clientX;
        startWidth = th.offsetWidth;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        handle.classList.add('resizing');
      });

      const onMouseMove = (e) => {
        const width = startWidth + (e.clientX - startX);
        th.style.width = `${width}px`;
        th.style.minWidth = `${width}px`;
        th.style.maxWidth = `${width}px`;
        applyColumnWidthsToTds();
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        handle.classList.remove('resizing');
        saveColumnWidths();
      };
    });

    loadColumnWidths();
  };

  const saveColumnWidths = () => {
    const widths = {};
    const ths = document.querySelectorAll('.spreadsheet-table thead th');
    ths.forEach((th, index) => {
      widths[index] = th.style.width;
    });
    localStorage.setItem('spreadsheet_column_widths', JSON.stringify(widths));
  };

  const loadColumnWidths = () => {
    try {
      const saved = localStorage.getItem('spreadsheet_column_widths');
      if (saved) {
        const widths = JSON.parse(saved);
        const ths = document.querySelectorAll('.spreadsheet-table thead th');
        ths.forEach((th, index) => {
          if (widths[index]) {
            th.style.width = widths[index];
            th.style.minWidth = widths[index];
            th.style.maxWidth = widths[index];
          }
        });
        applyColumnWidthsToTds();
      }
    } catch (e) {
      console.error("Erro ao carregar larguras das colunas", e);
    }
  };

  // Checkbox Dropdown Filters
  const closeAllFilterDropdowns = () => {
    document.querySelectorAll('.filter-dropdown').forEach(el => el.remove());
  };

  const createFilterPopup = (th, colIndex, triggerBtn) => {
    closeAllFilterDropdowns();

    const rect = triggerBtn.getBoundingClientRect();
    const dropdown = document.createElement('div');
    dropdown.className = 'filter-dropdown no-print';
    dropdown.style.top = `${rect.bottom + window.scrollY + 4}px`;
    dropdown.style.left = `${Math.min(window.innerWidth - 240, rect.left + window.scrollX)}px`;

    const data = getMergedData();
    const uniqueValues = Array.from(new Set(data.map(row => (row[colIndex] || '').trim()))).filter(v => v !== '');
    uniqueValues.sort((a, b) => a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'}));

    const selectedValues = activeFilters[colIndex] || [...uniqueValues];

    dropdown.innerHTML = `
      <div class="filter-search-wrap">
        <input type="text" class="filter-search-input" placeholder="Filtrar valores...">
      </div>
      <div class="filter-actions-bar">
        <button class="filter-action-link select-all" type="button">Selecionar tudo</button>
        <button class="filter-action-link clear-all" type="button">Limpar</button>
      </div>
      <div class="filter-values-list">
        ${uniqueValues.map(val => `
          <label class="filter-value-item">
            <input type="checkbox" value="${val}" ${selectedValues.includes(val) ? 'checked' : ''}>
            <span>${val}</span>
          </label>
        `).join('')}
      </div>
      <div class="filter-buttons">
        <button class="btn btn-ghost filter-cancel-btn" type="button">Cancelar</button>
        <button class="btn btn-primary filter-ok-btn" type="button">OK</button>
      </div>
    `;

    document.body.appendChild(dropdown);

    const searchInputEl = dropdown.querySelector('.filter-search-input');
    searchInputEl.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      dropdown.querySelectorAll('.filter-value-item').forEach(item => {
        const text = item.querySelector('span').textContent.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        item.style.display = text.includes(q) ? '' : 'none';
      });
    });

    dropdown.querySelector('.select-all').addEventListener('click', () => {
      dropdown.querySelectorAll('.filter-value-item input').forEach(cb => cb.checked = true);
    });
    dropdown.querySelector('.clear-all').addEventListener('click', () => {
      dropdown.querySelectorAll('.filter-value-item input').forEach(cb => cb.checked = false);
    });

    const closePopup = () => {
      dropdown.remove();
      document.removeEventListener('mousedown', onOutsideClick);
    };
    dropdown.querySelector('.filter-cancel-btn').addEventListener('click', closePopup);

    dropdown.querySelector('.filter-ok-btn').addEventListener('click', () => {
      const checkedValues = [];
      dropdown.querySelectorAll('.filter-value-item input').forEach(cb => {
        if (cb.checked) checkedValues.push(cb.value);
      });

      if (checkedValues.length === uniqueValues.length) {
        delete activeFilters[colIndex];
        triggerBtn.classList.remove('has-filter');
      } else {
        activeFilters[colIndex] = checkedValues;
        triggerBtn.classList.add('has-filter');
      }

      applyAllFilters();
      closePopup();
    });

    const onOutsideClick = (e) => {
      if (!dropdown.contains(e.target) && !triggerBtn.contains(e.target)) {
        closePopup();
      }
    };
    document.addEventListener('mousedown', onOutsideClick);
  };

  const enableHeaderFilters = () => {
    const table = document.querySelector('.spreadsheet-table');
    if (!table) return;

    const ths = table.querySelectorAll('thead th');
    ths.forEach((th, index) => {
      if (th.querySelector('.filter-btn')) return;

      const filterBtn = document.createElement('button');
      filterBtn.className = 'filter-btn no-print';
      filterBtn.setAttribute('aria-label', `Filtrar coluna ${th.textContent.trim()}`);
      filterBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="10" height="10">
          <path d="M7 10l5 5 5-5z" fill="currentColor"/>
        </svg>
      `;

      filterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        createFilterPopup(th, index, filterBtn);
      });

      th.appendChild(filterBtn);
    });
  };

  // Init
  loadLocalEdits();
  fetchSheetData();
  enableColumnResizing();
  enableHeaderFilters();
})();

// Loader Sofisticado e Slideshow da Sidebar
(function() {
  // 1. Simulação do Loader de inicialização
  const loader = document.getElementById('app-loader');
  const fill = loader ? loader.querySelector('.loader-progress-fill') : null;
  const pct = loader ? loader.querySelector('.loader-percentage') : null;

  if (loader && fill && pct) {
    let progress = 0;
    const duration = 1600; // 1.6 segundos para preenchimento completo e sensação de robustez
    const intervalTime = 16;
    const steps = duration / intervalTime;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      progress += increment;
      if (progress >= 100) {
        progress = 100;
        clearInterval(timer);
        
        fill.style.width = '100%';
        pct.textContent = '100%';
        
        setTimeout(() => {
          loader.classList.add('fade-out');
        }, 350);
      } else {
        // Exibição do progresso de forma natural
        const displayProgress = Math.min(99, Math.floor(progress));
        fill.style.width = `${displayProgress}%`;
        pct.textContent = `${displayProgress}%`;
      }
    }, intervalTime);
  }

  // 2. Slideshow alternado da Sidebar
  const slides = document.querySelectorAll('.sidebar-bg-slideshow .slide');
  if (slides.length > 0) {
    let currentSlide = 0;
    setInterval(() => {
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, 5000); // Troca a imagem a cada 5 segundos
  }
})();
