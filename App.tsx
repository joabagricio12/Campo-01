
import React, { useState, useEffect, useRef } from 'react';
import { WegMotorData, BlockData, ProjectData, PageData, ComparisonData } from './types';
import { WEG_MOTORS, getMotorByCv } from './motorData';
import { calculateDimensioning, calculateGeneralSummary } from './calculations';
import { GoogleGenAI } from "@google/genai";

const WegMotorIcon = ({ color = "#005792" }: { color?: string }) => (
  <svg viewBox="0 0 128 128" className="w-4 h-4 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="40" width="70" height="48" rx="4" fill={color} />
    <rect x="95" y="50" width="12" height="28" rx="2" fill="#334155" />
    <circle cx="25" cy="64" r="14" fill={color} stroke="white" strokeWidth="2"/>
  </svg>
);

const App: React.FC = () => {
  const [project, setProject] = useState<ProjectData>(() => {
    const saved = localStorage.getItem('cf_production_v5');
    return saved ? JSON.parse(saved) : {
      title: 'Projeto Campo Forte',
      pages: [{
        id: 'p1',
        blocks: [
          { id: 'b1', type: 'text', value: 'MEMORIAL DESCRITIVO DE ENGENHARIA', fontSize: 12, bold: true, align: 'center' },
          { id: 'b2', type: 'text', value: 'Campo Forte - Soluções em Eficiência Energética', fontSize: 9, align: 'center' },
          { id: 'b3', type: 'text', value: '', fontSize: 11 }
        ]
      }]
    };
  });

  const [headerImage, setHeaderImage] = useState<string | null>(() => localStorage.getItem('cf_logo_v12'));
  const [isLocked, setIsLocked] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem('cf_production_v5', JSON.stringify(project)); }, [project]);
  useEffect(() => { if (headerImage) localStorage.setItem('cf_logo_v12', headerImage); }, [headerImage]);

  const addBlock = (type: 'text' | 'comparison', pageId: string) => {
    const newBlock: BlockData = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      value: type === 'comparison' ? { before: { cv: 1, cable: '2,5' }, after: { cv: 1 } } : '',
      fontSize: 11,
      align: 'left'
    };
    setProject(prev => ({
      ...prev,
      pages: prev.pages.map(p => p.id === pageId ? { ...p, blocks: [...p.blocks, newBlock] } : p)
    }));
    setActiveBlockId(newBlock.id);
  };

  const updateBlock = (blockId: string, updates: Partial<BlockData>) => {
    setProject(prev => ({
      ...prev,
      pages: prev.pages.map(p => ({
        ...p,
        blocks: p.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b)
      }))
    }));
  };

  const removeBlock = (blockId: string) => {
    setProject(prev => ({
      ...prev,
      pages: prev.pages.map(p => ({
        ...p,
        blocks: p.blocks.filter(b => b.id !== blockId)
      }))
    }));
  };

  const generateAI = async () => {
    if (isGenerating) return;
    const afterMotors = project.pages.flatMap(p => p.blocks)
      .filter(b => b.type === 'comparison')
      .map(b => getMotorByCv((b.value as ComparisonData).after.cv))
      .filter((m): m is WegMotorData => !!m);

    if (afterMotors.length === 0) return alert("Adicione motores para gerar o resumo.");

    setIsGenerating(true);
    const summary = calculateGeneralSummary(afterMotors);
    let resultText = `CONCLUSÃO TÉCNICA:\nSistema composto por ${summary.motorCount} unidades motrizes totalizando ${summary.totalCv} CV. Recomenda-se o uso de ${summary.recommendedMainBreaker}. Dimensionamento realizado sob rigor técnico NBR 5410.`;

    if (process.env.API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const res = await ai.models.generateContent({ 
          model: 'gemini-3-flash-preview', 
          contents: `Gere conclusão sênior Campo Forte: ${summary.motorCount} motores, ${summary.totalCv}CV, ${summary.totalIn}A. Recomende o ${summary.recommendedMainBreaker}. Mencione conformidade NBR 5410 e cabos dimensionados por queda de tensão.` 
        });
        if (res.text) resultText = res.text;
      } catch (e) {}
    }

    const lastPageId = project.pages[project.pages.length - 1].id;
    addBlock('text', lastPageId);
    setTimeout(() => {
      setProject(prev => ({
        ...prev,
        pages: prev.pages.map(p => p.id === lastPageId ? {
          ...p,
          blocks: p.blocks.map((b, i) => i === p.blocks.length - 1 ? { ...b, value: resultText, bold: true } : b)
        } : p)
      }));
    }, 50);
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center">
      
      {/* TOOLBAR */}
      <div className="fixed top-0 left-0 w-full h-10 bg-[#001d3d] shadow-xl z-[9999] no-print flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="text-white font-black text-[10px] tracking-tighter">CAMPO FORTE</span>
          <button onClick={() => addBlock('text', project.pages[0].id)} className="tool-btn">TEXTO</button>
          <button onClick={() => addBlock('comparison', project.pages[0].id)} className="tool-btn">MOTOR</button>
          <button onClick={() => setProject(prev => ({ ...prev, pages: [...prev.pages, { id: Math.random().toString(36), blocks: [] }] }))} className="tool-btn bg-blue-900">+PÁG</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={generateAI} className="action-btn bg-blue-600">{isGenerating ? '...' : 'GERAR IA'}</button>
          <button onClick={() => window.print()} className="action-btn bg-white text-black">PDF</button>
          <button onClick={() => setIsLocked(!isLocked)} className={`action-btn ${isLocked ? 'bg-red-500' : 'bg-green-600'}`}>{isLocked ? 'EDITAR' : 'TRAVAR'}</button>
        </div>
      </div>

      {/* DOCUMENTO A4 */}
      <div className="mt-12 mb-20 w-full flex flex-col items-center gap-4 px-1">
        {project.pages.map((page) => (
          <div key={page.id} className="bg-white w-full max-w-[210mm] min-h-[297mm] p-10 md:p-14 relative flex flex-col print:p-8 print:shadow-none shadow-sm overflow-hidden">
            
            {/* LOGO */}
            <div className="w-full flex justify-center mb-4 no-print-img">
              {headerImage ? (
                <img src={headerImage} className="max-h-12 cursor-pointer" onClick={() => !isLocked && document.getElementById('logo-up')?.click()} />
              ) : (
                !isLocked && <button onClick={() => document.getElementById('logo-up')?.click()} className="text-[9px] text-slate-200 border border-dashed p-4">CABEÇALHO</button>
              )}
              <input type="file" id="logo-up" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if(f){ const r = new FileReader(); r.onloadend = () => setHeaderImage(r.result as string); r.readAsDataURL(f); }
              }} />
            </div>

            {/* FLUXO DE BLOCOS */}
            <div className="flex flex-col flex-1">
              {page.blocks.map((block) => (
                <div key={block.id} className={`relative mb-0.5 group ${activeBlockId === block.id && !isLocked ? 'bg-blue-50/10' : ''}`} onClick={() => !isLocked && setActiveBlockId(block.id)}>
                  
                  {!isLocked && activeBlockId === block.id && (
                    <div className="absolute -left-8 top-0 flex flex-col no-print z-50">
                      <button onClick={() => removeBlock(block.id)} className="text-red-300 font-bold text-lg leading-none">×</button>
                    </div>
                  )}

                  {block.type === 'text' ? (
                    <textarea
                      className="w-full bg-transparent border-none outline-none resize-none overflow-hidden text-slate-900 leading-tight p-0 m-0"
                      style={{ fontSize: `${block.fontSize}px`, fontWeight: block.bold ? 'bold' : 'normal', textAlign: block.align }}
                      value={block.value as string}
                      onChange={(e) => {
                        updateBlock(block.id, { value: e.target.value });
                        e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onFocus={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                      disabled={isLocked}
                      placeholder="..."
                    />
                  ) : (
                    /* WIDGET MOTOR ULTRA-DENSITY (26px HEIGHT) */
                    <div className="flex items-center w-full gap-2 h-[26px] overflow-hidden border-b border-transparent hover:border-slate-50 transition">
                      {/* ANTES (ESQUERDA) */}
                      <div className="flex-1 flex items-center gap-1 border-r border-slate-50 pr-2">
                        <WegMotorIcon color="#94a3b8" />
                        <span className="text-[7px] font-black text-slate-200 shrink-0">ANT:</span>
                        <select 
                          className="text-[10px] font-bold text-slate-400 bg-transparent outline-none p-0 cursor-pointer appearance-none"
                          value={(block.value as ComparisonData).before.cv}
                          onChange={(e) => updateBlock(block.id, { value: { ...(block.value as ComparisonData), before: { ...(block.value as ComparisonData).before, cv: parseFloat(e.target.value) } } })}
                          disabled={isLocked}
                        >
                          {WEG_MOTORS.map(m => <option key={m.cv} value={m.cv}>{m.cv}CV</option>)}
                        </select>
                        <div className="flex items-center gap-0.5 ml-auto text-slate-300 font-bold text-[9px]">
                          <input 
                            className="w-5 bg-transparent border-none outline-none text-right"
                            value={(block.value as ComparisonData).before.cable}
                            onChange={(e) => updateBlock(block.id, { value: { ...(block.value as ComparisonData), before: { ...(block.value as ComparisonData).before, cable: e.target.value } } })}
                            disabled={isLocked}
                          />
                          <span className="text-[6px]">mm²</span>
                        </div>
                      </div>

                      {/* DEPOIS (DIREITA) */}
                      <div className="flex-[1.8] flex items-center gap-1.5 pl-1">
                        <WegMotorIcon color="#005792" />
                        <span className="text-[7px] font-black text-[#005792] shrink-0">DEP:</span>
                        <select 
                          className="text-[11px] font-black text-[#005792] bg-transparent outline-none p-0 cursor-pointer"
                          value={(block.value as ComparisonData).after.cv}
                          onChange={(e) => updateBlock(block.id, { value: { ...(block.value as ComparisonData), after: { cv: parseFloat(e.target.value) } } })}
                          disabled={isLocked}
                        >
                          {WEG_MOTORS.map(m => <option key={m.cv} value={m.cv}>{m.cv} CV W22 IE3</option>)}
                        </select>
                        
                        <div className="flex gap-4 ml-auto text-[10px] font-bold text-slate-800">
                          <span className="text-[#005792]">{calculateDimensioning(getMotorByCv((block.value as ComparisonData).after.cv)!).cableSize}</span>
                          <span className="truncate max-w-[60px]">{calculateDimensioning(getMotorByCv((block.value as ComparisonData).after.cv)!).circuitBreaker.split('-')[0]}</span>
                          <span className="text-orange-600 hidden md:inline">
                            {(block.value as ComparisonData).after.cv >= 10 ? 'SOFT' : 'DIR'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-slate-50 pt-1 flex justify-between opacity-20 text-[7px] font-bold uppercase">
              <span>Campo Forte Engenharia</span>
              <span>Página {project.pages.findIndex(p => p.id === page.id) + 1} de {project.pages.length}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .tool-btn { color: #94a3b8; padding: 4px 10px; border-radius: 4px; font-weight: 800; font-size: 9px; border: 1px solid #1e293b; text-transform: uppercase; transition: 0.1s; }
        .tool-btn:hover { color: white; background: #1e293b; }
        .action-btn { padding: 4px 12px; border-radius: 4px; font-weight: 900; font-size: 10px; text-transform: uppercase; transition: 0.1s; }
        @media print {
          .no-print, .no-print-img { display: none !important; }
          body { background: white !important; padding: 0 !important; }
          .bg-slate-100 { background: white !important; }
          .max-w-[210mm] { width: 100% !important; max-width: 100% !important; border: none !important; box-shadow: none !important; padding: 1cm !important; margin: 0 !important; }
          textarea { height: auto !important; overflow: visible !important; }
        }
        textarea { border: none !important; box-shadow: none !important; outline: none !important; }
        select { -webkit-appearance: none; -moz-appearance: none; appearance: none; }
      `}</style>
    </div>
  );
};

export default App;
