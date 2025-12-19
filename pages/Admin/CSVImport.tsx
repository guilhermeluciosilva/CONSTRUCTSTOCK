
import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../contexts/AppContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Work, Warehouse } from '../../types';

interface CSVLine {
  OBRA: string;
  RM: string;
  DATA_RM: string;
  COD_PRODUTO: string;
  DESCRICAO: string;
  QUANTIDADE_SOLICITADA: string;
  DATA_SOL_ALMOXARIFADO: string;
  SOL_COMPRA: string;
  QTD_SOL_ALMOX: string;
  DATA_SOL_COMPRA: string;
  PEDIDO_COMPRA: string;
  QTD_PO: string;
  VALOR: string;
  DATA_PEDIDO_COMPRA: string;
  DATA_ENTRADA: string;
  status: 'OK' | 'ERRO' | 'AVISO';
  motivo: string;
  workIdMapped?: string;
}

export const CSVImport: React.FC = () => {
  const { currentScope, works, warehouses, getLabel } = useApp();
  const { notify } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState('');
  const [rawLines, setRawLines] = useState<CSVLine[]>([]);
  const [lines, setLines] = useState<CSVLine[]>([]);
  const [isValidated, setIsValidated] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [stats, setStats] = useState({ total: 0, errors: 0, warnings: 0 });
  const [activeView, setActiveView] = useState<'ALL' | 'ERRORS'>('ALL');

  // Configs
  const [importMode, setImportMode] = useState<'A' | 'B'>('A');
  const [duplicityMode, setDuplicityMode] = useState<'IGNORE' | 'UPDATE' | 'ALLOW'>('IGNORE');
  const [targetWarehouseId, setTargetWarehouseId] = useState('');
  const [workMappings, setWorkMappings] = useState<Record<string, string>>({});

  const reset = () => {
    setFileName('');
    setRawLines([]);
    setLines([]);
    setIsValidated(false);
    setStats({ total: 0, errors: 0, warnings: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseCSV = (text: string) => {
    const rows = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (rows.length < 2) throw new Error('CSV vazio ou sem dados.');
    const separator = rows[0].includes(';') ? ';' : ',';
    const dataRows = rows.slice(1);
    return dataRows.map(row => {
      const cols = row.split(separator).map(c => c.trim().replace(/^"|"$/g, ''));
      return {
        OBRA: cols[0] || '', RM: cols[1] || '', DATA_RM: cols[2] || '', COD_PRODUTO: cols[3] || '',
        DESCRICAO: cols[4] || '', QUANTIDADE_SOLICITADA: cols[5] || '', DATA_SOL_ALMOXARIFADO: cols[6] || '',
        SOL_COMPRA: cols[7] || '', QTD_SOL_ALMOX: cols[8] || '', DATA_SOL_COMPRA: cols[9] || '',
        PEDIDO_COMPRA: cols[10] || '', QTD_PO: cols[11] || '', VALOR: cols[12] || '',
        DATA_PEDIDO_COMPRA: cols[13] || '', DATA_ENTRADA: cols[14] || '',
        status: 'OK' as const, motivo: ''
      };
    });
  };

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const validateLines = (raw: CSVLine[]) => {
    let errCount = 0;
    let warnCount = 0;

    const validated = raw.map(line => {
      let status: 'OK' | 'ERRO' | 'AVISO' = 'OK';
      let motivo = '';

      if (!line.OBRA) { status = 'ERRO'; motivo = 'Obra ausente.'; }
      else if (!line.COD_PRODUTO && !line.DESCRICAO) { status = 'ERRO'; motivo = 'Material sem ID e sem Descrição.'; }
      else if (isNaN(Number(line.QUANTIDADE_SOLICITADA)) || Number(line.QUANTIDADE_SOLICITADA) <= 0) { status = 'ERRO'; motivo = 'Qtd. Solicitada inválida.'; }

      if (importMode === 'B') {
        if (!line.DATA_ENTRADA) { status = 'AVISO'; motivo = 'Sem Data Entrada: não lançará estoque.'; }
        else if (isNaN(Number(line.QTD_PO)) || Number(line.QTD_PO) <= 0) { status = 'AVISO'; motivo = 'Qtd. PO inválida: não lançará estoque.'; }
      }

      const normalizedCSVWork = normalize(line.OBRA);
      const matchedWork = works.find(w => normalize(w.name) === normalizedCSVWork || normalize(w.id) === normalizedCSVWork);
      const workIdMapped = workMappings[line.OBRA] || matchedWork?.id;
      
      if (!workIdMapped && status !== 'ERRO') {
         status = 'AVISO'; motivo = `${getLabel('UNIT')} não reconhecida. Mapeie manualmente.`;
      }

      if (status === 'ERRO') errCount++;
      if (status === 'AVISO') warnCount++;

      return { ...line, status, motivo, workIdMapped };
    });

    setStats({ total: validated.length, errors: errCount, warnings: warnCount });
    setLines(validated);
    setIsValidated(true);
  };

  // Revalida sempre que mapeamentos ou modo mudarem
  useEffect(() => {
    if (rawLines.length > 0) {
      validateLines(rawLines);
    }
  }, [workMappings, importMode, rawLines]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        setRawLines(parsed);
      } catch (err: any) {
        notify(err.message, 'error');
        reset();
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (stats.errors > 0) return notify('Resolva os erros antes de importar.', 'warning');
    if (importMode === 'B' && !targetWarehouseId) return notify('Selecione um almoxarifado de destino.', 'warning');

    try {
      setIsImporting(true);
      const res = await api.importCSVBatch(lines, {
        mode: importMode,
        tenantId: currentScope!.tenantId,
        warehouseId: targetWarehouseId,
        duplicityMode
      });
      notify(`Sucesso! ${res.success} linhas processadas.`, 'success');
      reset();
    } catch (err) {
      notify('Falha na importação massiva.', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadReport = (onlyErrors = false) => {
    const filtered = onlyErrors ? lines.filter(l => l.status === 'ERRO') : lines;
    const headers = ['OBRA', 'RM', 'COD_PRODUTO', 'DESCRICAO', 'STATUS', 'MOTIVO'];
    const rows = filtered.map(l => [l.OBRA, l.RM, l.COD_PRODUTO, l.DESCRICAO, l.status, l.motivo]);
    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_importacao_${onlyErrors ? 'erros' : 'completo'}.csv`;
    link.click();
  };

  const visibleLines = activeView === 'ERRORS' ? lines.filter(l => l.status === 'ERRO') : lines;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight tracking-tight uppercase">Importação Massiva (CSV)</h1>
          <p className="text-gray-500 text-sm italic">Sincronize processos logísticos via arquivo de planilha.</p>
        </div>
        <button onClick={reset} className="text-xs font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors">Limpar Tudo</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-4">1. Carregar Arquivo</h3>
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-all group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input type="file" className="hidden" ref={fileInputRef} accept=".csv" onChange={handleFileUpload} />
              <i className="fas fa-file-csv text-4xl text-slate-200 group-hover:text-blue-500 mb-4 transition-colors"></i>
              <p className="text-xs font-bold text-slate-500 truncate px-4">{fileName || 'Clique para escolher arquivo .csv'}</p>
            </div>
            {rawLines.length > 0 && <p className="text-[10px] font-black text-emerald-600 uppercase text-center"><i className="fas fa-check-circle mr-1"></i> {rawLines.length} registros detectados</p>}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
             <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-4">2. Configurações</h3>
             <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400">Modo de Importação</label>
                   <div className="grid grid-cols-1 gap-2">
                      <button onClick={() => setImportMode('A')} className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all active:scale-95 ${importMode === 'A' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-100 shadow-sm'}`} >
                         <span className="text-xs font-bold text-slate-700 uppercase">A. Cadastros de RMs / POs</span>
                         {importMode === 'A' && <i className="fas fa-check-circle text-blue-600"></i>}
                      </button>
                      <button onClick={() => setImportMode('B')} className={`p-4 rounded-xl border text-left flex justify-between items-center transition-all active:scale-95 ${importMode === 'B' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-100 shadow-sm'}`} >
                         <span className="text-xs font-bold text-slate-700 uppercase">B. Cadastrar + Lançar Estoque</span>
                         {importMode === 'B' && <i className="fas fa-check-circle text-blue-600"></i>}
                      </button>
                   </div>
                </div>
                {importMode === 'B' && (
                  <div className="space-y-2 animate-in zoom-in-95">
                    <label className="text-[10px] font-black uppercase text-slate-400">Almoxarifado Destino para Saldos</label>
                    <select className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl font-bold text-xs outline-none" value={targetWarehouseId} onChange={e => setTargetWarehouseId(e.target.value)} >
                       <option value="">Selecione...</option>
                       {warehouses.map(wh => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400">Política de Duplicidade</label>
                   <select className="w-full p-3 bg-gray-50 border border-slate-200 rounded-xl font-bold text-xs outline-none" value={duplicityMode} onChange={e => setDuplicityMode(e.target.value as any)} >
                       <option value="IGNORE">Ignorar registros existentes</option>
                       <option value="UPDATE">Sobrescrever dados existentes</option>
                       <option value="ALLOW">Permitir duplicatas</option>
                    </select>
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
           {lines.length > 0 ? (
             <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full max-h-[800px]">
                <div className="p-6 border-b flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
                   <div className="flex gap-6">
                      <button onClick={() => setActiveView('ALL')} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${activeView === 'ALL' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>Preview Total ({stats.total})</button>
                      <button onClick={() => setActiveView('ERRORS')} className={`text-[10px] font-black uppercase tracking-widest transition-colors ${activeView === 'ERRORS' ? 'text-rose-600 border-b-2 border-rose-600' : 'text-slate-400'}`}>Somente Erros ({stats.errors})</button>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => downloadReport(true)} className="px-3 py-1.5 bg-white border border-rose-100 text-rose-600 rounded-lg text-[9px] font-black uppercase hover:bg-rose-50 transition-colors shadow-sm">Relat. Erros</button>
                      <button onClick={() => downloadReport(false)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 rounded-lg text-[9px] font-black uppercase hover:bg-slate-50 transition-colors shadow-sm">Completo</button>
                   </div>
                </div>

                <div className="overflow-auto flex-1 custom-scrollbar">
                   <table className="w-full text-left">
                      <thead className="bg-white text-[9px] font-black uppercase text-slate-400 border-b sticky top-0 z-10 shadow-sm">
                         <tr>
                            <th className="px-6 py-4">Linha</th>
                            <th className="px-6 py-4">{getLabel('UNIT')} (CSV)</th>
                            <th className="px-6 py-4">Material</th>
                            <th className="px-6 py-4 text-center">Qtd.</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Motivo</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {visibleLines.slice(0, 100).map((line, idx) => (
                           <tr key={idx} className={`text-sm hover:bg-slate-50/50 transition-colors ${line.status === 'ERRO' ? 'bg-rose-50/20' : ''}`}>
                              <td className="px-6 py-4 text-xs font-mono text-slate-300">{(idx + 1).toString().padStart(3, '0')}</td>
                              <td className="px-6 py-4 min-w-[200px]">
                                 <p className="font-bold text-slate-700 truncate">{line.OBRA}</p>
                                 {!line.workIdMapped && (
                                   <select 
                                     className="mt-1 w-full text-[9px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-200 rounded p-1.5 outline-none focus:ring-1 focus:ring-amber-500"
                                     value={workMappings[line.OBRA] || ''}
                                     onChange={e => setWorkMappings({...workMappings, [line.OBRA]: e.target.value})}
                                   >
                                      <option value="">Mapear {getLabel('UNIT')}...</option>
                                      {works.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                   </select>
                                 )}
                              </td>
                              <td className="px-6 py-4">
                                 <p className="font-bold text-slate-800 truncate max-w-[150px]">{line.COD_PRODUTO || 'S/ SKU'}</p>
                                 <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{line.DESCRICAO}</p>
                              </td>
                              <td className="px-6 py-4 text-center font-black">{line.QUANTIDADE_SOLICITADA}</td>
                              <td className="px-6 py-4">
                                 <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${
                                   line.status === 'OK' ? 'bg-emerald-50 text-emerald-600' :
                                   line.status === 'ERRO' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                 }`}>{line.status}</span>
                              </td>
                              <td className="px-6 py-4 text-[10px] text-slate-400 font-bold max-w-[150px] truncate" title={line.motivo}>{line.motivo || '---'}</td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                   {lines.length > 100 && <p className="p-6 text-center text-xs text-slate-400 italic bg-slate-50 border-t">Mostrando apenas os primeiros 100 registros para performance.</p>}
                </div>

                <div className="p-8 bg-slate-900 flex justify-between items-center text-white border-t border-slate-800">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Resumo da Validação</p>
                      <p className="text-sm font-bold">
                        {stats.total} registros | 
                        <span className="text-rose-400 ml-2">{stats.errors} erros</span> | 
                        <span className="text-amber-400 ml-2">{stats.warnings} avisos</span>
                      </p>
                   </div>
                   <button 
                     disabled={stats.errors > 0 || isImporting || lines.length === 0}
                     onClick={handleImport}
                     className="px-10 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-3 active:scale-95"
                   >
                     {isImporting ? <i className="fas fa-sync fa-spin"></i> : <i className="fas fa-cloud-upload-alt text-lg"></i>}
                     Executar Processamento
                   </button>
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-dashed border-slate-100 text-slate-300 p-20 space-y-6">
                <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-4xl shadow-inner">
                  <i className="fas fa-table opacity-20"></i>
                </div>
                <p className="font-bold text-sm uppercase tracking-widest text-center">Aguardando arquivo para processamento<br/><span className="text-[10px] font-medium text-slate-300 normal-case mt-2 block">Selecione o CSV no painel lateral esquerdo</span></p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
