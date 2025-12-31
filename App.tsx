
import React, { useState, useEffect } from 'react';
import { WegMotorData, PageData, WidgetData, SummaryItemData } from './types';
import { WEG_MOTORS, getMotorByCv } from './motorData';
import { calculateDimensioning, calculateGeneralSummary } from './calculations';
import { GoogleGenAI } from "@google/genai";

const MotorIconSmall = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-600">
    <rect x="4" y="6" width="12" height="12" rx="1" />
    <path d="M16 9h3v6h-3M2 10v4" strokeLinecap="round" />
    <circle cx="10" cy="12" r="2" />
  </svg>
);

const MotorSVG = () => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-slate-800">
    <rect x="12" y="16" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2" fill="#f8fafc"/>
    <path d="M44 24h6v16h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <rect x="22" y="12" width="12" height="4" rx="1" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 24H8M12 32H8M12 40H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="28" cy="32" r="6" stroke="currentColor" strokeWidth="2"/>
    <path d="M28 29v6M25 32h6" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const App: React.FC = () => {
  const [pages, setPages] = useState<PageData[]>(() => {
    const saved = localStorage.getItem('cf_pages_v2');
    return saved ? JSON.parse(saved) : [{ id: 'p1', type: 'report', title: 'PROJETO DE ENGENHARIA', widgets: [] }];
  });
  const [headerImage, setHeaderImage] = useState<string | null>(() => localStorage.getItem('cf_logo_v2'));
  const [headerOffset, setHeaderOffset] = useState<number>(() => Number(localStorage.getItem('cf_h_offset_v2')) || 0);
  const [headerZoom, setHeaderZoom] = useState<number>(() => Number(localStorage.getItem('cf_h_zoom_v2')) || 100);
  
  const [isLocked, setIsLocked] = useState(false);
  const [isGeneratingIA, setIsGeneratingIA] = useState(false);

  useEffect(() => { localStorage.setItem('cf_pages_v2', JSON.stringify(pages)); }, [pages]);
  useEffect(() => { if (headerImage) localStorage.setItem('cf_logo_v2', headerImage); }, [headerImage]);
  useEffect(() => { localStorage.setItem('cf_h_offset_v2', headerOffset.toString()); }, [headerOffset]);
  useEffect(() => { localStorage.setItem('cf_h_zoom_v2', headerZoom.toString()); }, [headerZoom]);

  const addPage = () => {
    setPages([...pages, { id: Math.random().toString(36).substr(2, 9), type: 'report', title: 'NOVA PÁGINA', widgets: [] }]);
  };

  const removePage = (id: string) => {
    if (pages.length > 1 && window.confirm("Excluir esta página?")) {
      setPages(pages.filter(p => p.id !== id));
    }
  };

  const addWidget = (pageId: string, type: 'text' | 'motor') => {
    const newWidget: WidgetData = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      value: type === 'motor' ? '1' : '',
      width: type === 'motor' ? 450 : 680,
      height: type === 'motor' ? 140 : 100,
      fontSize: 14
    };
    setPages(pages.map(p => p.id === pageId ? { ...p, widgets: [...p.widgets, newWidget] } : p));
  };

  const updateWidget = (pageId: string, widgetId: string, updates: Partial<WidgetData>) => {
    setPages(pages.map(p => p.id === pageId ? { 
      ...p, 
      widgets: p.widgets.map(w => w.id === widgetId ? { ...w, ...updates } : w) 
    } : p));
  };

  const removeWidget = (pageId: string, widgetId: string) => {
    setPages(pages.map(p => p.id === pageId ? { ...p, widgets: p.widgets.filter(w => w.id !== widgetId) } : p));
  };

  const generateIASummary = async () => {
    setIsGeneratingIA(true);
    try {
      const allMotorWidgets = pages.flatMap(p => p.widgets).filter(w => w.type === 'motor');
      const motors = allMotorWidgets.map(w => getMotorByCv(parseFloat(w.value))).filter((m): m is WegMotorData => !!m);
      
      if (motors.length === 0) {
        alert("Adicione motores antes de gerar o resumo.");
        return;
      }

      const s = calculateGeneralSummary(motors);
      const summaryItems: SummaryItemData[] = motors.map(m => {
        const d = calculateDimensioning(m);
        return {
          motorCv: m.cv,
          in: m.currentIn,
          ip: m.currentIn * 7, // Estimativa para ficha técnica
          cable: d.cableSize,
          breaker: d.circuitBreaker.split(' (')[0],
          contactor: d.contactor,
          vfd: d.softStarter
        };
      });

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-3-pro-preview';
      
      const systemInstruction = `Engenheiro Chefe Campo Forte. 
      Analise a lista de motores enviada e escreva um MEMORIAL TÉCNICO COMPACTO. 
      Foque em: Eficiência Energética, Justificativa de VFDs/Soft-starters e Proteção Geral do Painel.
      Não use markdown de títulos (#), use apenas parágrafos técnicos.`;

      const prompt = `Projeto: ${s.motorCount} motores, total ${s.totalCv}CV / ${s.totalKw}kW. Disjuntor Geral: ${s.recommendedMainBreaker}. Ip Máximo: ${s.totalIp}A. Detalhe os benefícios da configuração.`;

      const response = await ai.models.generateContent({ model, contents: prompt, config: { systemInstruction } });
      
      const newPage: PageData = {
        id: 'summary-' + Date.now(),
        type: 'summary',
        title: 'MEMORIAL E RESUMO TÉCNICO',
        widgets: [
          {
            id: 'summary-table-' + Date.now(),
            type: 'summary-list',
            value: '',
            items: summaryItems,
            width: 700,
            height: 300,
            fontSize: 10
          },
          {
            id: 'summary-text-' + Date.now(),
            type: 'text',
            value: response.text || '',
            width: 700,
            height: 400,
            fontSize: 12
          }
        ]
      };
      setPages([...pages, newPage]);
    } catch (e) {
      alert("Erro na IA. Verifique sua conexão.");
    } finally {
      setIsGeneratingIA(false);
    }
  };

  const downloadPDF = async (pageId?: string) => {
    const { jsPDF } = (window as any).jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const targetPages = pageId ? pages.filter(p => p.id === pageId) : pages;

    for (let i = 0; i < targetPages.length; i++) {
      const el = document.getElementById(`page-${targetPages[i].id}`);
      if (el) {
        const canvas = await (window as any).html2canvas(el, { scale: 3, useCORS: true });
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
      }
    }
    pdf.save(`CAMPO_FORTE_${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-400 flex flex-col items-center pb-40 select-none">
      
      {/* TOOLBAR */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/95 backdrop-blur-md shadow-2xl px-10 py-5 rounded-full z-[500] no-print border border-slate-200">
        <button onClick={addPage} className="p-2 hover:scale-125 transition active:scale-95">📄<span className="text-[10px] font-bold">+</span></button>
        <button onClick={() => addWidget(pages[pages.length-1].id, 'motor')} className="p-2 hover:scale-125 transition active:scale-95">⚙️<span className="text-[10px] font-bold">+</span></button>
        <button onClick={() => addWidget(pages[pages.length-1].id, 'text')} className="p-2 hover:scale-125 transition active:scale-95">T<span className="text-[10px] font-bold">+</span></button>
        <div className="w-px h-8 bg-slate-200 mx-2"></div>
        <button onClick={generateIASummary} disabled={isGeneratingIA} className={`px-8 py-2 rounded-full text-xs font-black transition-all ${isGeneratingIA ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white shadow-xl hover:bg-blue-700 active:scale-95'}`}>
          {isGeneratingIA ? 'PROCESSANDO IA...' : 'RESUMO TÉCNICO'}
        </button>
        <button onClick={() => downloadPDF()} className="bg-slate-900 text-white px-8 py-2 rounded-full text-xs font-black hover:bg-black transition active:scale-95">PDF</button>
        <button onClick={() => setIsLocked(!isLocked)} className={`px-8 py-2 rounded-full text-xs font-black transition-all ${isLocked ? 'bg-red-500 text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}>
          {isLocked ? 'VISUALIZAR' : 'EDITAR'}
        </button>
      </div>

      {/* CONTROLES HEADER */}
      {!isLocked && (
        <div className="fixed top-10 left-10 bg-white/95 p-6 rounded-3xl shadow-2xl no-print z-[500] flex flex-col gap-4 border border-slate-100 w-60">
          <span className="text-[11px] font-black uppercase text-blue-600 tracking-tighter border-b pb-2">Ajustes Cabeçalho</span>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold"><span>Margem Topo</span><span>{headerOffset}mm</span></div>
            <input type="range" min="-30" max="150" value={headerOffset} onChange={(e) => setHeaderOffset(parseInt(e.target.value))} className="w-full" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold"><span>Zoom Logo</span><span>{headerZoom}%</span></div>
            <input type="range" min="10" max="400" value={headerZoom} onChange={(e) => setHeaderZoom(parseInt(e.target.value))} className="w-full" />
          </div>
          <button onClick={() => { if(confirm("Resetar projeto?")) { localStorage.clear(); window.location.reload(); } }} className="text-[9px] text-red-500 font-bold hover:underline">LIMPAR TUDO</button>
        </div>
      )}

      {/* VIEWPORT */}
      <div className="mt-16 flex flex-col gap-20">
        {pages.map((page, pIdx) => (
          <div key={page.id} className="relative">
            {!isLocked && (
              <button onClick={() => removePage(page.id)} className="absolute -left-16 top-0 bg-white p-3 rounded-2xl shadow-xl text-red-500 hover:bg-red-50 no-print font-black border border-slate-100 transition-all">×</button>
            )}
            
            <div id={`page-${page.id}`} className="bg-white w-[210mm] min-h-[297mm] shadow-2xl relative flex flex-col p-[20mm] border border-slate-200">
              
              {/* HEADER */}
              <div className="flex flex-col items-center border-b-2 border-slate-900 pb-6" style={{ marginTop: `${headerOffset}mm` }}>
                <div className="flex flex-col items-center w-full">
                  <div className="relative mb-4 flex justify-center" style={{ width: `${headerZoom}%`, maxWidth: '100%' }}>
                    {headerImage ? (
                      <img src={headerImage} className="w-full object-contain cursor-pointer transition-transform" alt="Logo" onClick={() => !isLocked && document.getElementById('logo-file')?.click()} />
                    ) : (
                      <div onClick={() => !isLocked && document.getElementById('logo-file')?.click()} className="w-48 h-20 border-2 border-dashed border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-300 uppercase cursor-pointer no-print rounded-xl">Inserir Logo</div>
                    )}
                    <input type="file" id="logo-file" className="hidden" accept="image/*" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if(f){ const r = new FileReader(); r.onloadend = () => setHeaderImage(r.result as string); r.readAsDataURL(f); }
                    }} />
                  </div>
                  <textarea 
                    className="w-full text-center text-3xl font-black uppercase text-slate-900 bg-transparent border-none outline-none resize-none overflow-hidden p-0 leading-none placeholder:text-slate-200"
                    rows={1} value={page.title} 
                    onChange={(e) => setPages(pages.map(p => p.id === page.id ? { ...p, title: e.target.value } : p))}
                    onInput={(e) => { (e.target as any).style.height = 'auto'; (e.target as any).style.height = (e.target as any).scrollHeight + 'px'; }}
                    disabled={isLocked}
                  />
                </div>
              </div>

              {/* CONTENT AREA */}
              <div className="flex-1 relative pt-10">
                {page.widgets.map((w) => (
                  <div 
                    key={w.id} 
                    className={`relative mb-8 border-2 ${isLocked ? 'border-transparent' : 'border-slate-50 hover:border-blue-400/30'} rounded-2xl transition-all group/widget overflow-visible`}
                    style={{ width: `${w.width}px` }}
                  >
                    {!isLocked && (
                      <div className="absolute -top-4 -right-4 flex gap-2 opacity-0 group-hover/widget:opacity-100 transition-all no-print z-50">
                        <div className="bg-white shadow-xl rounded-full flex gap-1 p-1 border">
                           <button onClick={() => updateWidget(page.id, w.id, { fontSize: w.fontSize + 1 })} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 font-bold">+</button>
                           <button onClick={() => updateWidget(page.id, w.id, { fontSize: w.fontSize - 1 })} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 font-bold">-</button>
                        </div>
                        <button onClick={() => removeWidget(page.id, w.id)} className="bg-red-500 text-white shadow-xl w-7 h-7 flex items-center justify-center rounded-full font-black hover:bg-red-600 transition">×</button>
                      </div>
                    )}

                    {w.type === 'text' ? (
                      <textarea 
                        className="w-full bg-transparent border-none outline-none resize-none font-medium leading-relaxed p-4 text-justify placeholder:text-slate-200"
                        style={{ fontSize: `${w.fontSize}px`, minHeight: `${w.height}px` }}
                        placeholder="Clique para editar..."
                        value={w.value}
                        onChange={(e) => updateWidget(page.id, w.id, { value: e.target.value })}
                        disabled={isLocked}
                      />
                    ) : w.type === 'summary-list' ? (
                      <div 
                        className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-4"
                        style={{ height: `${w.height}px`, fontSize: `${w.fontSize}px` }}
                      >
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-900 bg-slate-50 text-[0.8em] font-black uppercase text-slate-500">
                              <th className="p-2 w-12 text-center">Icon</th>
                              <th className="p-2">Motor</th>
                              <th className="p-2">In/Ip (A)</th>
                              <th className="p-2">Proteção</th>
                              <th className="p-2">Cabo</th>
                              <th className="p-2">Partida</th>
                            </tr>
                          </thead>
                          <tbody>
                            {w.items?.map((item, idx) => (
                              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors last:border-0">
                                <td className="p-2 flex justify-center"><MotorIconSmall /></td>
                                <td className="p-2 font-bold">{item.motorCv} CV</td>
                                <td className="p-2">{item.in} / {item.ip.toFixed(1)}</td>
                                <td className="p-2 font-medium">{item.breaker}</td>
                                <td className="p-2">{item.cable}</td>
                                <td className="p-2 text-blue-600 font-bold truncate max-w-[120px]" title={item.vfd}>{item.vfd ? item.vfd.split(' ')[0] : 'DIRETA'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-slate-50/40 p-6 rounded-2xl flex gap-8 border border-slate-100 group-hover/widget:bg-white transition-all overflow-hidden" style={{ height: `${w.height}px` }}>
                        <div className="h-full aspect-square flex-shrink-0 flex items-center justify-center bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                          <MotorSVG />
                        </div>
                        <div className="flex-1 flex flex-col justify-center min-w-0">
                          <div className="flex items-center gap-4 mb-3">
                            <select 
                              className="text-2xl font-black bg-white border border-slate-200 rounded-xl px-4 py-1 outline-none cursor-pointer hover:border-blue-500 transition-all shadow-sm"
                              value={w.value} 
                              onChange={(e) => updateWidget(page.id, w.id, { value: e.target.value })}
                              disabled={isLocked}
                            >
                              {WEG_MOTORS.map(m => <option key={m.cv} value={m.cv}>{m.cv} CV | {(m.kw).toFixed(2)} kW</option>)}
                            </select>
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">380V IE3</span>
                          </div>
                          {(() => {
                            const motor = getMotorByCv(parseFloat(w.value));
                            if (!motor) return null;
                            const dim = calculateDimensioning(motor);
                            return (
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-[11px] font-bold text-slate-700 leading-tight">
                                <div className="flex flex-col"><span className="text-[8px] text-slate-400 uppercase">Cabeamento</span><span className="text-blue-700">{dim.cableSize}</span></div>
                                <div className="flex flex-col"><span className="text-[8px] text-slate-400 uppercase">Disjuntor</span><span className="truncate">{dim.circuitBreaker.split(' (')[0]}</span></div>
                                <div className="flex flex-col"><span className="text-[8px] text-slate-400 uppercase">Contatora</span><span className="truncate">{dim.contactor}</span></div>
                                <div className="flex flex-col"><span className="text-[8px] text-slate-400 uppercase">Partida</span><span className="text-amber-600 truncate">{dim.softStarter ? "INVERSOR" : "DIRETA"}</span></div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {!isLocked && (
                      <div 
                        className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize opacity-0 group-hover/widget:opacity-100 no-print flex items-end justify-end p-2"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const startX = e.clientX; const startY = e.clientY;
                          const startW = w.width; const startH = w.height;
                          const onMove = (me: MouseEvent) => {
                            updateWidget(page.id, w.id, {
                              width: Math.max(150, startW + (me.clientX - startX)),
                              height: Math.max(60, startH + (me.clientY - startY))
                            });
                          };
                          const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                          window.addEventListener('mousemove', onMove);
                          window.addEventListener('mouseup', onUp);
                        }}
                      >
                        <div className="w-3 h-3 bg-blue-600 rounded-br-lg rounded-tl-sm shadow-lg"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* FOOTER */}
              <div className="mt-12 pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest no-print">
                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Campo Forte Elite</span>
                <div className="flex gap-6 items-center">
                  <button onClick={() => downloadPDF(page.id)} className="hover:text-blue-600 transition-colors">Exportar PDF</button>
                  <span className="bg-slate-50 px-4 py-1 rounded-full">Pág. {pIdx + 1}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        body { background-color: #94a3b8; }
        input[type="range"] { accent-color: #2563eb; }
        textarea { cursor: text; line-height: 1.6; }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .shadow-2xl { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
