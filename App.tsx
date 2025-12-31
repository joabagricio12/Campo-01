
import React, { useState, useEffect, useRef } from 'react';
import { WegMotorData, DimensioningResult } from './types';
import { WEG_MOTORS, getMotorByCv } from './motorData';
import { calculateDimensioning, calculateGeneralSummary } from './calculations';
import { GoogleGenAI } from "@google/genai";

interface PageData {
  id: string;
  type: 'report' | 'materials' | 'summary';
  title: string;
  content: any[];
  text: string;
}

const App: React.FC = () => {
  const [pages, setPages] = useState<PageData[]>([
    { id: 'p1', type: 'report', title: 'LAUDO DE ENGENHARIA ELÉTRICA', content: [{ id: 't1', type: 'text', value: '' }], text: '' }
  ]);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inicio' | 'inserir' | 'engenharia'>('inicio');
  
  const reportRef = useRef<HTMLDivElement>(null);
  const currentDate = new Date().toLocaleDateString('pt-BR');

  // IA Sênior Setup
  const callSeniorEngineerAI = async (mode: 'audit' | 'optimize' | 'chat', userQuery?: string) => {
    setAiLoading(true);
    setAiPanelOpen(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const model = 'gemini-3-pro-preview'; 
      
      const allMotors = pages.flatMap(p => p.content).filter(i => i.type === 'motor').map(i => getMotorByCv(parseFloat(i.value)));
      const summary = calculateGeneralSummary(allMotors.filter((m): m is WegMotorData => !!m));
      
      const systemInstruction = `VOCÊ É O ENGENHEIRO CHEFE DA CAMPO FORTE.
Sua especialidade é auditoria técnica de sistemas industriais trifásicos.
Sua comunicação deve ser: Altamente técnica, formal, baseada na NBR 5410 e visando Eficiência Energética.

REGRAS DE OURO:
1. Sempre avalie a necessidade de INVERSORES DE FREQUÊNCIA (VFD) da WEG série CFW500/CFW11. 
2. Se houver motores acima de 5CV, avalie se a partida suave (Soft-Starter) ou o VFD é melhor para evitar picos de ${summary.totalIp}A.
3. Mencione a necessidade de banco de capacitores se o Fator de Potência médio for baixo.
4. Organize seu parecer com cabeçalhos claros: [ANÁLISE DE CARGA], [PROTEÇÃO E COORDENAÇÃO], [RECOMENDAÇÕES NBR 5410].
5. Use tabelas em Markdown se for listar materiais.`;

      let prompt = userQuery || "";
      if (mode === 'audit') prompt = "Realize uma auditoria completa nos motores listados. Verifique se o disjuntor geral de " + summary.recommendedMainBreaker + " está corretamente dimensionado para a carga total de " + summary.totalIn + "A e pico de " + summary.totalIp + "A.";
      if (mode === 'optimize') prompt = "Como posso otimizar este sistema para reduzir a conta de energia e aumentar a vida útil dos motores usando tecnologia WEG?";

      const response = await ai.models.generateContent({ 
        model, 
        contents: prompt, 
        config: { systemInstruction, temperature: 0.1 } 
      });
      setAiResponse(response.text);
    } catch (e) {
      setAiResponse("ERRO DE CONEXÃO COM O SERVIDOR DE ENGENHARIA.");
    } finally {
      setAiLoading(false);
    }
  };

  const addPage = (type: 'report' | 'materials' | 'summary') => {
    const titles = { report: 'LAUDO TÉCNICO', materials: 'ESPECIFICAÇÃO DE MATERIAIS', summary: 'MEMORIAL DE CÁLCULO' };
    setPages([...pages, { id: Math.random().toString(36).substr(2, 9), type, title: titles[type], content: type === 'report' ? [{ id: 't1', type: 'text', value: '' }] : [], text: '' }]);
  };

  const addItem = (pageId: string, type: 'text' | 'motor') => {
    setPages(pages.map(p => p.id === pageId ? { ...p, content: [...p.content, { id: Math.random().toString(36).substr(2, 9), type, value: type === 'motor' ? '1' : '' }] } : p));
  };

  const updateItem = (pageId: string, itemId: string, value: string) => {
    setPages(pages.map(p => p.id === pageId ? { ...p, content: p.content.map(i => i.id === itemId ? { ...i, value } : i) } : p));
  };

  const downloadPDF = async () => {
    const { jsPDF } = (window as any).jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    for (let i = 0; i < pages.length; i++) {
      const el = document.getElementById(`page-${pages[i].id}`);
      if (el) {
        const canvas = await (window as any).html2canvas(el, { scale: 2 });
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
      }
    }
    pdf.save('CAMPO_FORTE_PROJETO.pdf');
  };

  return (
    <div className="min-h-screen bg-[#f3f2f1] flex flex-col items-center font-sans selection:bg-blue-200">
      
      {/* MS WORD STYLE RIBBON */}
      <div className="w-full bg-[#2b579a] text-white no-print shadow-xl sticky top-0 z-[100]">
        <div className="px-4 py-1 flex items-center justify-between border-b border-blue-800">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1 rounded">
              <div className="w-4 h-4 bg-[#2b579a]"></div>
            </div>
            <span className="text-xs font-bold tracking-widest uppercase">Campo Forte - Word Station</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-medium opacity-80">
            <span>Arquivo</span><span>Editar</span><span>Exibir</span><span>Ajuda</span>
          </div>
        </div>
        
        <div className="bg-[#f3f2f1] text-slate-700 px-6 py-2 flex flex-col border-b border-slate-300">
          <div className="flex gap-6 mb-2">
            {['Início', 'Inserir', 'Engenharia'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase() as any)}
                className={`text-[11px] font-bold px-1 pb-1 transition-all ${activeTab === tab.toLowerCase() ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4 py-2 h-14 overflow-x-auto">
            {activeTab === 'inicio' && (
              <>
                <div className="flex flex-col items-center gap-1 border-r border-slate-300 pr-4">
                  <button onClick={() => addPage('report')} className="p-2 hover:bg-slate-200 rounded transition"><div className="w-6 h-6 border-2 border-slate-400"></div></button>
                  <span className="text-[9px] font-bold uppercase text-slate-500">Nova Página</span>
                </div>
                <div className="flex items-center gap-2 border-r border-slate-300 pr-4">
                  <button onClick={downloadPDF} className="bg-white border border-slate-300 px-4 py-1.5 rounded text-[10px] font-black shadow-sm hover:bg-white transition">SALVAR PDF</button>
                  <button onClick={() => setIsLocked(!isLocked)} className={`px-4 py-1.5 rounded text-[10px] font-black shadow-sm transition ${isLocked ? 'bg-red-500 text-white' : 'bg-green-600 text-white'}`}>{isLocked ? 'MODO LEITURA' : 'MODO EDIÇÃO'}</button>
                </div>
              </>
            )}
            {activeTab === 'inserir' && (
              <>
                <button onClick={() => addItem(pages[0].id, 'text')} className="flex flex-col items-center gap-1 px-3 hover:bg-slate-200 py-1 rounded">
                  <span className="text-lg font-black">T</span>
                  <span className="text-[9px] font-bold uppercase">Texto</span>
                </button>
                <button onClick={() => addItem(pages[0].id, 'motor')} className="flex flex-col items-center gap-1 px-3 hover:bg-slate-200 py-1 rounded">
                  <div className="w-5 h-5 border-2 border-slate-800 rounded-full flex items-center justify-center font-black">M</div>
                  <span className="text-[9px] font-bold uppercase">Motor WEG</span>
                </button>
              </>
            )}
            {activeTab === 'engenharia' && (
              <div className="flex items-center gap-3">
                <button onClick={() => callSeniorEngineerAI('audit')} className="bg-blue-700 text-white px-4 py-2 rounded-lg text-[10px] font-black shadow-lg hover:bg-blue-800 transition">AUDITORIA NBR 5410</button>
                <button onClick={() => callSeniorEngineerAI('optimize')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] font-black shadow-lg hover:bg-indigo-700 transition">EFICIÊNCIA WEG</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI SIDE PANEL - INDUSTRIAL CONSOLE */}
      <div className={`fixed right-0 top-0 h-full w-full md:w-[480px] bg-[#1a1c24] shadow-2xl z-[200] transition-transform duration-500 ${aiPanelOpen ? 'translate-x-0' : 'translate-x-full'} border-l border-slate-700`}>
        <div className="p-6 h-full flex flex-col text-slate-100 font-mono">
          <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
            <div>
              <h2 className="text-blue-400 font-black text-sm uppercase tracking-widest">Consultor Sênior IA</h2>
              <p className="text-[9px] text-slate-500">Análise de Redes de Potência v11.0</p>
            </div>
            <button onClick={() => setAiPanelOpen(false)} className="text-slate-400 hover:text-white text-3xl">&times;</button>
          </div>
          
          <div className="flex-1 overflow-y-auto mb-6 bg-black/40 p-5 rounded-lg border border-slate-800 text-xs leading-relaxed space-y-4">
            {aiResponse ? (
              aiResponse.split('\n').map((l, i) => (
                <p key={i} className={l.startsWith('[') ? 'text-blue-400 font-bold mt-4 border-l-2 border-blue-500 pl-2' : ''}>{l}</p>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-30">
                <div className="w-12 h-12 border-2 border-slate-700 rounded-full animate-pulse flex items-center justify-center">?</div>
                <p className="mt-4 uppercase font-black text-[9px]">Aguardando Prompt de Engenharia</p>
              </div>
            )}
            {aiLoading && <div className="text-blue-500 animate-pulse font-bold mt-4 flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div> COMPILANDO DADOS TÉCNICOS...</div>}
          </div>

          <div className="flex gap-2 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
            <input 
              type="text" 
              className="flex-1 bg-transparent border-none outline-none text-xs placeholder-slate-600" 
              placeholder="Ex: Qual o cabo ideal para motor 50CV a 150m?"
              onKeyDown={(e) => e.key === 'Enter' && callSeniorEngineerAI('chat', (e.target as HTMLInputElement).value)}
            />
            <button className="text-blue-400 font-black px-2">➔</button>
          </div>
        </div>
      </div>

      {/* VIEWPORT DO DOCUMENTO */}
      <div className="w-full flex-1 overflow-y-auto py-12 flex flex-col items-center gap-12">
        <div ref={reportRef} className="flex flex-col gap-10">
          {pages.map((page, pIdx) => (
            <div 
              id={`page-${page.id}`} 
              key={page.id}
              className="bg-white w-[210mm] min-h-[297mm] shadow-[0_15px_45px_rgba(0,0,0,0.1)] relative flex flex-col p-[25mm] border border-slate-300"
            >
              {/* Header de Documento Oficial */}
              <div className="flex justify-between items-end border-b-2 border-slate-800 pb-6 mb-12">
                <div className="h-16 flex items-center">
                  {headerImage ? (
                    <img src={headerImage} className="max-h-full" alt="Logo" />
                  ) : (
                    <div onClick={() => !isLocked && document.getElementById('logo-up')?.click()} className="cursor-pointer border-2 border-dashed border-slate-200 px-4 py-2 text-[10px] font-black text-slate-300 uppercase">Logo da Empresa</div>
                  )}
                  <input type="file" id="logo-up" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onloadend = () => setHeaderImage(r.result as string);
                      r.readAsDataURL(f);
                    }
                  }} />
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="text-[13px] font-black text-slate-950 tracking-tighter">LAUDO DE ENGENHARIA ELÉTRICA</span>
                  <span className="text-[9px] font-bold text-slate-400 mt-1">{currentDate} | CAMPO FORTE PRO</span>
                </div>
              </div>

              <textarea 
                className="w-full text-4xl font-black uppercase text-slate-950 bg-transparent border-none focus:outline-none resize-none overflow-hidden mb-12"
                rows={1} value={page.title}
                onChange={(e) => setPages(pages.map(p => p.id === page.id ? { ...p, title: e.target.value } : p))}
                disabled={isLocked}
              />

              {/* Conteúdo do Editor */}
              <div className="flex flex-col gap-8 flex-1">
                {page.type === 'report' && page.content.map(item => (
                  <div key={item.id} className="relative group">
                    {item.type === 'text' ? (
                      <textarea 
                        className="w-full text-[12pt] leading-[1.8] text-justify bg-transparent border-none focus:outline-none resize-none overflow-hidden font-medium text-slate-800"
                        placeholder="Inicie o parecer aqui..."
                        value={item.value}
                        onChange={(e) => updateItem(page.id, item.id, e.target.value)}
                        onInput={(e) => { (e.target as any).style.height = 'auto'; (e.target as any).style.height = (e.target as any).scrollHeight + 'px'; }}
                        disabled={isLocked}
                      />
                    ) : (
                      <div className="bg-slate-50 border-l-[12px] border-blue-700 p-6 rounded-xl flex flex-col md:flex-row gap-8 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                             <span className="font-black text-blue-700">W</span>
                          </div>
                          <select 
                            className="text-xl font-black bg-transparent border-none outline-none appearance-none cursor-pointer"
                            value={item.value} onChange={(e) => updateItem(page.id, item.id, e.target.value)} disabled={isLocked}
                          >
                            {WEG_MOTORS.map(m => <option key={m.cv} value={m.cv}>{m.cv} CV | W22 IE3</option>)}
                          </select>
                        </div>
                        {(() => {
                          const m = getMotorByCv(parseFloat(item.value));
                          if (!m) return null;
                          const d = calculateDimensioning(m);
                          return (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 border-l-2 border-slate-200 pl-8">
                              <div className="flex flex-col"><span className="text-[8px] font-black uppercase text-slate-400">Cabo</span><span className="text-xs font-black text-blue-600">{d.cableSize}</span></div>
                              <div className="flex flex-col"><span className="text-[8px] font-black uppercase text-slate-400">Proteção</span><span className="text-xs font-black">{d.circuitBreaker}</span></div>
                              <div className="flex flex-col"><span className="text-[8px] font-black uppercase text-slate-400">Contator</span><span className="text-xs font-black">{d.contactor}</span></div>
                              <div className="flex flex-col"><span className="text-[8px] font-black uppercase text-blue-400">Inversor</span><span className="text-xs font-black text-indigo-600">{d.softStarter || "N/A"}</span></div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))}

                {page.type === 'summary' && (
                  <div className="flex flex-col gap-12">
                     <table className="w-full text-xs text-center border-collapse">
                        <thead className="bg-slate-950 text-white uppercase font-black">
                          <tr>
                            <th className="p-3 text-left">Motor</th>
                            <th className="p-3">In (A)</th>
                            <th className="p-3">Proteção</th>
                            <th className="p-3">Cabo</th>
                            <th className="p-3">Partida</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pages.flatMap(p => p.content).filter(i => i.type === 'motor').map((item, idx) => {
                            const m = getMotorByCv(parseFloat(item.value))!;
                            const d = calculateDimensioning(m);
                            return (
                              <tr key={idx} className="border-b border-slate-100 font-bold">
                                <td className="p-3 text-left">{m.cv} CV</td>
                                <td className="p-3">{m.currentIn} A</td>
                                <td className="p-3">{d.circuitBreaker.split(' ')[0]}</td>
                                <td className="p-3 text-blue-700">{d.cableSize}</td>
                                <td className="p-3 text-[10px]">{d.softStarter || "DIRETA"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                     </table>
                     
                     {(() => {
                        const motors = pages.flatMap(p => p.content).filter(i => i.type === 'motor').map(i => getMotorByCv(parseFloat(i.value))!).filter(Boolean);
                        const s = calculateGeneralSummary(motors);
                        return (
                          <div className="grid grid-cols-2 gap-10 border-t-4 border-slate-950 pt-10">
                            <div className="space-y-3">
                              <h4 className="text-xs font-black uppercase text-blue-600">Totalização da Carga</h4>
                              <div className="flex justify-between text-sm"><span>Potência Total:</span><span className="font-black">{s.totalCv} CV</span></div>
                              <div className="flex justify-between text-sm"><span>Corrente Nominal:</span><span className="font-black">{s.totalIn} A</span></div>
                              <div className="flex justify-between text-sm text-red-600 font-bold"><span>Demanda de Pico:</span><span className="font-black">{s.totalIp} A</span></div>
                            </div>
                            <div className="bg-slate-950 text-white p-8 rounded-3xl flex flex-col items-center justify-center">
                              <span className="text-[10px] font-black uppercase opacity-60 mb-2">Disjuntor Geral Sugerido</span>
                              <span className="text-5xl font-black text-blue-400 tracking-tighter">{s.recommendedMainBreaker}</span>
                            </div>
                          </div>
                        );
                     })()}
                  </div>
                )}
              </div>

              {/* Rodapé Word */}
              <div className="mt-auto pt-8 border-t border-slate-100 flex justify-between items-end text-[10px] font-black text-slate-300 uppercase tracking-widest">
                <span>Campo Forte Engineering Solutions</span>
                <span>Página {pIdx + 1} de {pages.length}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WORD STATUS BAR */}
      <div className="w-full bg-[#2b579a] text-white px-4 py-1 text-[10px] font-bold flex justify-between fixed bottom-0 z-[100] shadow-inner no-print">
        <div className="flex gap-6">
          <span>PÁGINA {pages.length}</span>
          <span>SISTEMA: TRIFÁSICO 380V</span>
          <span className="text-blue-300">ESTADO: NBR 5410 ATIVA</span>
        </div>
        <div className="flex gap-4">
          <span className="animate-pulse">● ENGENHEIRO IA ONLINE</span>
          <span>100% ZOOM</span>
        </div>
      </div>

      <style>{`
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #2b579a; border-radius: 5px; }
        body { -webkit-font-smoothing: antialiased; }
      `}</style>
    </div>
  );
};

export default App;
