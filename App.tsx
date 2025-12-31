
import React, { useState, useEffect, useRef } from 'react';
import { WegMotorData } from './types';
import { WEG_MOTORS, getMotorByCv } from './motorData';
import { calculateDimensioning, calculateGeneralSummary } from './calculations';

const MotorImg = () => (
  <svg width="60" height="60" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="50" y="70" width="100" height="80" rx="2" fill="#1e293b" />
    <rect x="35" y="85" width="15" height="50" fill="#1e293b" />
    <rect x="150" y="85" width="10" height="50" fill="#1e293b" />
    <rect x="160" y="100" width="25" height="20" fill="#1e293b" />
    <path d="M80 70V55H120V70" stroke="#1e293b" strokeWidth="5" strokeLinecap="round"/>
  </svg>
);

const App: React.FC = () => {
  const [reportTitle, setReportTitle] = useState('');
  const [contentItems, setContentItems] = useState<{id: string, type: 'text' | 'motor' | 'summary' | 'list', value: string}[]>([
    { id: 'initial-text', type: 'text', value: '' }
  ]);
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const currentDate = new Date().toLocaleDateString('pt-BR');

  useEffect(() => {
    const saved = localStorage.getItem('campo-forte-v20');
    if (saved) {
      const parsed = JSON.parse(saved);
      setReportTitle(parsed.reportTitle || '');
      setContentItems(parsed.contentItems || [{ id: 'initial-text', type: 'text', value: '' }]);
      setHeaderImage(parsed.headerImage || null);
    }
  }, []);

  useEffect(() => {
    const data = { reportTitle, contentItems, headerImage };
    localStorage.setItem('campo-forte-v20', JSON.stringify(data));
  }, [reportTitle, contentItems, headerImage]);

  const addMotor = () => {
    if (isLocked) return;
    setContentItems([...contentItems, { id: Math.random().toString(36).substr(2, 9), type: 'motor', value: '1' }]);
  };

  const addText = () => {
    if (isLocked) return;
    setContentItems([...contentItems, { id: Math.random().toString(36).substr(2, 9), type: 'text', value: '' }]);
  };

  const addSummary = () => {
    if (isLocked) return;
    setContentItems([...contentItems, { id: Math.random().toString(36).substr(2, 9), type: 'summary', value: 'general' }]);
  };

  const addMaterialsList = () => {
    if (isLocked) return;
    setContentItems([...contentItems, { id: Math.random().toString(36).substr(2, 9), type: 'list', value: '' }]);
  };

  const removeItem = (id: string) => {
    if (isLocked) return;
    if (contentItems.length <= 1) return;
    setContentItems(contentItems.filter(item => item.id !== id));
  };

  const updateItem = (id: string, value: string) => {
    if (isLocked) return;
    setContentItems(contentItems.map(item => item.id === id ? { ...item, value } : item));
  };

  const handleHeaderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setHeaderImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const generatePDF = async () => {
    if (!reportRef.current) return;
    const canvas = await (window as any).html2canvas(reportRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = (window as any).jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    let heightLeft = pdfHeight;
    let position = 0;
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;
    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }
    pdf.save(`CAMPO_FORTE_PROJETO.pdf`);
  };

  const LogoHeader = () => (
    <div className="flex justify-center w-full mb-8 pt-4">
      {headerImage ? (
        <img 
          src={headerImage} 
          alt="Logo" 
          className="max-h-24 object-contain cursor-pointer hover:opacity-80 transition" 
          onClick={() => !isLocked && document.getElementById('global-logo-input')?.click()}
        />
      ) : (
        <div 
          className="w-full h-16 border-2 border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold cursor-pointer hover:bg-slate-50 transition no-print"
          onClick={() => document.getElementById('global-logo-input')?.click()}
        >
          CLIQUE PARA INSERIR LOGOTIPO (APARECERÁ EM TODAS AS PÁGINAS)
        </div>
      )}
      <input id="global-logo-input" type="file" className="hidden" onChange={handleHeaderUpload} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-300 pb-20 font-sans text-slate-900">
      {/* Menu Superior - Engenharia */}
      <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-700 px-6 py-3 no-print flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="bg-white text-slate-900 px-2 py-1 rounded font-black text-xs tracking-tighter">CAMPO FORTE</div>
          <div className="flex gap-2">
            <button onClick={addMotor} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-sm text-[10px] font-bold uppercase transition">+ MOTOR</button>
            <button onClick={addText} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-sm text-[10px] font-bold uppercase transition">+ TEXTO</button>
            <button onClick={addSummary} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-sm text-[10px] font-bold uppercase transition">+ RESUMO TÉCNICO</button>
            <button onClick={addMaterialsList} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-sm text-[10px] font-bold uppercase transition">+ LISTA DE MATERIAL</button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setIsLocked(!isLocked)} className={`px-4 py-2 rounded-sm text-[10px] font-bold uppercase transition ${isLocked ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-slate-200 text-slate-900'}`}>
            {isLocked ? 'MODO PDF ATIVO' : 'BLOQUEAR PARA PDF'}
          </button>
          <button onClick={generatePDF} className="bg-white hover:bg-slate-100 text-slate-900 px-6 py-2 rounded-sm text-[10px] font-bold uppercase transition shadow-xl">GERAR ARQUIVO</button>
        </div>
      </nav>

      <div ref={reportRef} className="max-w-[210mm] mx-auto mt-8 mb-20 bg-transparent flex flex-col gap-0">
        
        {/* PÁGINA 1: LAUDO TÉCNICO */}
        <div className="bg-white min-h-[297mm] p-[20mm] relative flex flex-col shadow-2xl mb-4" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
          <LogoHeader />
          
          <header className="mb-10 w-full flex flex-col items-center">
            <textarea 
              className="w-full text-center text-3xl font-bold uppercase bg-transparent border-none focus:outline-none placeholder-slate-200 resize-none overflow-hidden" 
              placeholder="TÍTULO DO LAUDO TÉCNICO" 
              rows={1}
              value={reportTitle} 
              onChange={(e) => setReportTitle(e.target.value)} 
              disabled={isLocked}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
            <div className="w-1/3 h-0.5 bg-slate-900 mt-2"></div>
          </header>

          <div className="flex flex-col flex-1 gap-6">
            {contentItems.map((item) => {
              if (item.type === 'text') {
                return (
                  <div key={item.id} className="relative group">
                    <textarea 
                      className="w-full text-xl leading-[1.6] text-justify bg-white resize-none focus:outline-none placeholder-slate-200 p-0 border-none overflow-hidden" 
                      placeholder="Inicie a descrição técnica..." 
                      rows={1} 
                      value={item.value} 
                      onChange={(e) => updateItem(item.id, e.target.value)} 
                      disabled={isLocked} 
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }} 
                    />
                    {!isLocked && (
                      <button onClick={() => removeItem(item.id)} className="absolute -left-12 top-0 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all no-print text-3xl">×</button>
                    )}
                  </div>
                );
              } else if (item.type === 'motor') {
                return (
                  <div key={item.id} className="relative my-2 group w-fit self-start no-print">
                    <button onClick={() => removeItem(item.id)} className="absolute -right-6 top-0 bg-slate-900 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center z-20 hover:bg-red-600 transition">×</button>
                    <div className="border border-slate-200 bg-slate-50 p-3 flex items-center gap-4 rounded-sm shadow-sm">
                      <MotorImg />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Seleção de Motor</span>
                        <select 
                          className="text-lg font-bold bg-transparent border-none p-0 cursor-pointer text-slate-900 focus:outline-none"
                          value={item.value}
                          onChange={(e) => updateItem(item.id, e.target.value)}
                        >
                          {WEG_MOTORS.map(m => <option key={m.cv} value={m.cv}>{m.cv} CV - Trifásico</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              } else if (item.type === 'summary') {
                const projectMotors = contentItems
                  .filter(i => i.type === 'motor')
                  .map(i => getMotorByCv(parseFloat(i.value)))
                  .filter((m): m is WegMotorData => !!m);
                const summary = calculateGeneralSummary(projectMotors);
                return (
                  <div key={item.id} className="relative my-8 group w-full page-break">
                    {!isLocked && <button onClick={() => removeItem(item.id)} className="absolute -right-8 top-0 bg-slate-900 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center no-print z-20 hover:bg-red-600 transition">×</button>}
                    <div className="border-t-4 border-b-4 border-slate-900 py-8 px-2 flex flex-col gap-10">
                      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
                        <h3 className="text-2xl font-bold uppercase tracking-widest">Dimensionamento Consolidado</h3>
                        <span className="text-xl font-black">{summary.motorCount} Motores</span>
                      </div>
                      
                      {/* Dimensionamento de Cada Motor */}
                      <div className="flex flex-col gap-6">
                        {projectMotors.map((m, idx) => {
                          const dim = calculateDimensioning(m);
                          return (
                            <div key={idx} className="border border-slate-100 p-4 bg-slate-50 grid grid-cols-4 gap-4 text-center items-center">
                              <div className="flex flex-col items-start border-r border-slate-200">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Potência</span>
                                <span className="text-lg font-bold">{m.cv} CV</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Disjuntor</span>
                                <span className="text-sm font-black">{dim.circuitBreaker}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Cabo</span>
                                <span className="text-sm font-black text-blue-700">{dim.cableSize}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Partida</span>
                                <span className="text-sm font-black">{dim.softStarter || dim.contactor}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Totais de Carga */}
                      <div className="grid grid-cols-2 gap-x-12 gap-y-4 pt-4 border-t border-slate-900">
                        <div className="flex justify-between border-b border-slate-100 py-1"><span>Potência Total:</span><span className="font-bold">{summary.totalCv} CV</span></div>
                        <div className="flex justify-between border-b border-slate-100 py-1"><span>Corrente Total:</span><span className="font-bold">{summary.totalIn} A</span></div>
                        <div className="flex justify-between border-b border-slate-100 py-1"><span>Pico de Partida:</span><span className="font-bold text-red-600">{summary.totalIp.toFixed(1)} A</span></div>
                        <div className="flex justify-between border-b border-slate-900 py-1 font-bold"><span>Disjuntor Geral Sugerido:</span><span className="text-blue-700">{summary.recommendedMainBreaker}</span></div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* PÁGINAS ADICIONAIS: LISTA DE MATERIAIS */}
        {contentItems.filter(item => item.type === 'list').map((item) => (
          <div key={item.id} className="bg-white min-h-[297mm] p-[20mm] relative flex flex-col shadow-2xl mb-4 page-break-sheet" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
            <LogoHeader />
            
            <header className="mb-10 w-full flex justify-between items-center border-b-2 border-slate-900 pb-2">
              <h2 className="text-3xl font-bold uppercase tracking-[0.2em]">Lista de Materiais</h2>
              {!isLocked && (
                <button onClick={() => removeItem(item.id)} className="bg-red-50 text-red-500 px-3 py-1 rounded text-[10px] font-black no-print hover:bg-red-100 transition">Remover Página</button>
              )}
            </header>

            <textarea 
              className="w-full flex-1 text-xl leading-[1.8] bg-white resize-none focus:outline-none placeholder-slate-200 py-2 border-none overflow-hidden"
              placeholder="Digite aqui os itens, quantidades e marcas..."
              value={item.value}
              onChange={(e) => updateItem(item.id, e.target.value)}
              disabled={isLocked}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />

            <footer className="mt-auto pt-8 text-right border-t border-slate-100 italic text-slate-500">
              Data de Emissão: {currentDate}
            </footer>
          </div>
        ))}
      </div>

      <style>{`
        textarea::placeholder { color: #f1f5f9; }
        .page-break { page-break-inside: avoid; }
        .page-break-sheet { break-before: page; }
        @media print {
          body { background: white !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .shadow-2xl { box-shadow: none !important; }
          .mt-8 { margin-top: 0 !important; }
          .mb-4 { margin-bottom: 0 !important; }
          .p-[20mm] { padding: 15mm !important; }
          .bg-slate-300 { background: white !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
