const menu = document.querySelectorAll('.menu li');
menu.forEach(li=>{
  li.addEventListener('click',()=>{
    menu.forEach(x=>x.classList.remove('active'));
    li.classList.add('active');
  });
});

document.querySelectorAll('.action').forEach(btn=>{
  btn.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){
      e.preventDefault();
      btn.click();
    }
  });
});

const search = document.querySelector('.search input');
if(search){
  search.addEventListener('focus',()=>search.parentElement.classList.add('focus'));
  search.addEventListener('blur',()=>search.parentElement.classList.remove('focus'));
}

const people = document.querySelectorAll('.people li');
if(people.length){
  const clear = () => {
    people.forEach(x=>x.classList.remove('is-selected','accent-blue','accent-green','accent-gray','accent-red'));
  };
  people.forEach(li=>{
    li.addEventListener('click',()=>{
      clear();
      const av = li.querySelector('.avatar');
      let accent = 'blue';
      if(av.classList.contains('avatar-green')) accent = 'green';
      else if(av.classList.contains('avatar-gray')) accent = 'gray';
      else if(av.classList.contains('avatar-red')) accent = 'red';
      li.classList.add('is-selected',`accent-${accent}`);
    });
  });
}

// View: Relação de viagens
(function(){
  const openBtn = document.getElementById('open-viagens');
  const view = document.getElementById('view-viagens');
  const closeBtn = document.getElementById('close-viagens');
  if(!openBtn || !view || !closeBtn) return;

  const open = ()=>{
    view.classList.add('is-active');
    document.body.classList.add('sidebar-collapsed');
  };
  const close = ()=>{
    view.classList.remove('is-active');
    document.body.classList.remove('sidebar-collapsed');
  };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  view.addEventListener('click', (e)=>{
    if(e.target === view) close();
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && view.classList.contains('is-active')) close();
  });
})();

// Edição e impressão na tela de viagens
(function(){
  const table = document.getElementById('viagens-table');
  const addRowBtn = document.getElementById('btn-add-row');
  const printBtn = document.getElementById('btn-print-viagens');
  const monthInput = document.getElementById('viagens-month');
  const saveBtn = document.getElementById('btn-save-viagens');
  const toast = document.getElementById('viagens-toast');
  if(!table || !addRowBtn || !printBtn) return;

  // Preenche mês atual por padrão
  if(monthInput && !monthInput.value){
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth()+1).padStart(2,'0');
    monthInput.value = `${yyyy}-${mm}`;
  }

  const keyForMonth = () => {
    const v = (monthInput && monthInput.value) ? monthInput.value : '';
    return v ? `viagens:${v}` : null;
  };
  const serialize = () => {
    const rows = [];
    const trs = table.querySelectorAll('tbody tr');
    trs.forEach(tr=>{
      const cells = Array.from(tr.querySelectorAll('td')).map(td=>td.textContent.trim());
      if(cells.some(v=>v)) rows.push(cells);
    });
    return rows;
  };
  const ensureMinRows = (n) => {
    const tbody = table.querySelector('tbody');
    while(tbody.rows.length < n){
      const tr = document.createElement('tr');
      for(let i=0;i<6;i++){
        const td = document.createElement('td');
        td.setAttribute('contenteditable','true');
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  };
  const populate = (rows) => {
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    if(Array.isArray(rows) && rows.length){
      rows.forEach(r=>{
        const tr = document.createElement('tr');
        for(let i=0;i<6;i++){
          const td = document.createElement('td');
          td.setAttribute('contenteditable','true');
          td.textContent = r[i] || '';
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      });
    }
    ensureMinRows(4);
  };
  const showToast = (msg) => {
    if(!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'), 1800);
  };
  const loadFromStorage = () => {
    const key = keyForMonth();
    if(!key) { populate([]); return; }
    try{
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : null;
      populate(data && Array.isArray(data.rows) ? data.rows : []);
      if(raw) showToast('Tabela carregada');
    }catch{ populate([]); }
  };
  const saveToStorage = () => {
    const key = keyForMonth();
    if(!key) return;
    const rows = serialize();
    const payload = { month: monthInput ? monthInput.value : '', rows };
    try{
      localStorage.setItem(key, JSON.stringify(payload));
      const v = monthInput ? monthInput.value : '';
      if(v){
        const [yyyy, mm] = v.split('-');
        const nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        const nomeMes = nomes[parseInt(mm,10)-1] || mm;
        showToast(`Tabela salva • ${nomeMes}/${yyyy}`);
      }else{
        showToast('Tabela salva');
      }
    }catch{
      showToast('Erro ao salvar');
    }
  };

  const addRow = ()=>{
    const tr = document.createElement('tr');
    for(let i=0;i<6;i++){
      const td = document.createElement('td');
      td.setAttribute('contenteditable','true');
      tr.appendChild(td);
    }
    table.querySelector('tbody').appendChild(tr);
    tr.scrollIntoView({behavior:'smooth',block:'nearest'});
    const firstCell = tr.querySelector('td');
    if(firstCell) firstCell.focus();
  };

  addRowBtn.addEventListener('click', addRow);
  if(saveBtn) saveBtn.addEventListener('click', saveToStorage);
  if(monthInput) monthInput.addEventListener('change', loadFromStorage);
  loadFromStorage();

  // Enter cria nova linha quando está na última célula da última linha
  table.addEventListener('keydown',(e)=>{
    if(e.key === 'Enter'){
      e.preventDefault();
      addRow();
    }
  });

  // Imprimir apenas a tabela
  printBtn.addEventListener('click', ()=>{
    // Copia o mês selecionado para o cabeçalho de impressão
    const monthInput = document.getElementById('viagens-month');
    const out = document.getElementById('viagens-print-month');
    if(monthInput && out){
      const [yyyy, mm] = (monthInput.value || '').split('-');
      if(yyyy && mm){
        const nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        const nomeMes = nomes[parseInt(mm,10)-1] || mm;
        out.textContent = `${nomeMes}/${yyyy}`;
      }else{
        out.textContent = '';
      }
    }
    window.print();
  });

  // Máscara de data dd/mm para as colunas "Data saída" e "Data retorno"
  const isDateCell = (td) => {
    if(!td || td.tagName !== 'TD') return false;
    const idx = td.cellIndex; // 0-based
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
    digits = digits.replace(/\D/g,'').slice(0,4);
    if(digits.length <= 2) return digits;
    return digits.slice(0,2) + '/' + digits.slice(2);
  };
  const normalizeDDMM = (val) => {
    const d = val.replace(/\D/g,'');
    let dd = d.slice(0,2);
    let mm = d.slice(2,4);
    if(!dd) dd = '';
    if(!mm) mm = '';
    if(dd) dd = String(Math.max(1, Math.min(31, parseInt(dd,10)))).padStart(2,'0');
    if(mm) mm = String(Math.max(1, Math.min(12, parseInt(mm,10)))).padStart(2,'0');
    if(dd && mm) return `${dd}/${mm}`;
    if(dd) return dd;
    return '';
  };
  table.addEventListener('keydown', (e)=>{
    const td = e.target.closest('td');
    if(!isDateCell(td)) return;
    const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Tab','Enter'];
    if(allowed.includes(e.key)) return;
    if(e.key.length === 1 && !/[0-9]/.test(e.key)){
      e.preventDefault();
    }
  }, true);
  table.addEventListener('input', (e)=>{
    const td = e.target.closest('td');
    if(!isDateCell(td)) return;
    const val = td.textContent || '';
    td.textContent = formatDDMM(val);
    setCaretToEnd(td);
  });
  table.addEventListener('paste', (e)=>{
    const td = e.target.closest('td');
    if(!isDateCell(td)) return;
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text') || '';
    td.textContent = formatDDMM(text);
    setCaretToEnd(td);
  });
  table.addEventListener('blur', (e)=>{
    const td = e.target.closest('td');
    if(!isDateCell(td)) return;
    td.textContent = normalizeDDMM(td.textContent || '');
  }, true);
})();
