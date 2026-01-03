
import React, { useState, useEffect, useRef } from 'react';
import { Save, FileDown, History, LogOut, FileText, FolderArchive, XCircle, FilePlus, Download, Share2, MessageCircle } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import saveAs from 'file-saver';

import { getDateString, getDisplayDate, INITIAL_FINANCIALS, INITIAL_PRODUCT_ROW, formatCurrency, USERS_DB, COMPANY_INFO } from './constants';
import { SalesNote, ProductRow, ClientData, Financials, LogEntry, User as UserType } from './types';
import { ModernButton, ModernCard, ModernInput, ModernSelect } from './components/ModernUI';
import { Receipt } from './components/Receipt';

const App: React.FC = () => {
  // --- STATE ---
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Data
  const [sequence, setSequence] = useState<number>(1);
  const [savedNotes, setSavedNotes] = useState<SalesNote[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Form
  const [client, setClient] = useState<ClientData>({ name: '', fullAddress: '', phone: '' });
  const [products, setProducts] = useState<ProductRow[]>([{ ...INITIAL_PRODUCT_ROW, id: crypto.randomUUID() }]);
  const [financials, setFinancials] = useState<Financials>(INITIAL_FINANCIALS);
  
  // UI
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [filterUser, setFilterUser] = useState('all');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Refs
  const hiddenPrintRef = useRef<HTMLDivElement>(null);
  const [tempNoteForPrint, setTempNoteForPrint] = useState<SalesNote | null>(null);

  const currentDateString = getDisplayDate();

  // --- SUPER ADMIN CHECK ---
  const isSuperAdmin = (userName: string) => {
      const superAdmins = [
          "Griselda Ruiz de la Cruz",
          "José Antonio Ruiz de la Cruz",
          "Antonio Ruiz Palacios"
      ];
      return superAdmins.includes(userName);
  };

  // --- EFFECTS ---
  useEffect(() => {
    const sessionUserJson = sessionStorage.getItem('cai_user_obj');
    if (sessionUserJson) {
        try {
            const user = JSON.parse(sessionUserJson);
            setCurrentUser(user);
        } catch (e) {
            sessionStorage.removeItem('cai_user_obj');
        }
    }
    const savedSeq = localStorage.getItem('cai_sequence');
    const savedDailyNotes = localStorage.getItem(`cai_notes_${getDateString()}`);
    const savedLogs = localStorage.getItem(`cai_historial_${getDateString()}`);
    
    if (savedSeq) setSequence(parseInt(savedSeq));
    if (savedDailyNotes) setSavedNotes(JSON.parse(savedDailyNotes));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  useEffect(() => {
    const totalNote = products.reduce((acc, curr) => acc + curr.amount, 0);
    const subTotal = totalNote - financials.discount - financials.reposition - financials.returnAmount;
    const finalBalance = (subTotal + financials.previousBalance) - financials.payment;

    setFinancials(prev => ({ ...prev, totalNote, subTotal, finalBalance }));
  }, [products, financials.discount, financials.reposition, financials.returnAmount, financials.previousBalance, financials.payment]);

  // --- LOGGING SYSTEM ---
  const addLog = (action: string, details: string) => {
    if (!currentUser) return;
    const newLog: LogEntry = { id: crypto.randomUUID(), timestamp: Date.now(), user: currentUser.name, action, details };
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem(`cai_historial_${getDateString()}`, JSON.stringify(updatedLogs));
  };

  // --- HELPERS ---
  const getControlNumber = () => {
    const seqStr = String(sequence).padStart(3, '0');
    return `CAI${seqStr}${getDateString()}`;
  };

  const resetForm = () => {
    setClient({ name: '', fullAddress: '', phone: '' });
    setProducts([{ ...INITIAL_PRODUCT_ROW, id: crypto.randomUUID() }]);
    setFinancials(INITIAL_FINANCIALS);
  };

  // --- AUTH ---
  const handleLogin = () => {
    if (!loginUsername || !loginPassword) return;
    const userFound = USERS_DB.find(u => u.name === loginUsername && u.password === loginPassword);
    if (userFound) {
        setCurrentUser(userFound);
        sessionStorage.setItem('cai_user_obj', JSON.stringify(userFound));
        setLoginError('');
        setLoginPassword('');
        resetForm(); 
        addLog("Inicio de Sesión", `Usuario ${userFound.name} accedió`);
    } else {
        setLoginError('Usuario o contraseña incorrectos.');
    }
  };

  const handleLogout = () => {
      if (window.confirm("¿Confirma que desea cerrar la sesión actual?")) {
          addLog("Cerrar Sesión", "Salida del sistema");
          sessionStorage.removeItem('cai_user_obj');
          setCurrentUser(null);
          setLoginUsername('');
          setLoginPassword('');
          resetForm();
          // Al poner currentUser en null, el render mostrará el modal de login automáticamente
      }
  };

  // --- LOCATION HELPER ---
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("La geolocalización no es compatible.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setClient(prev => ({ ...prev, fullAddress: mapsUrl }));
        setIsLocating(false);
        addLog("Ubicación", `GPS: ${latitude},${longitude}`);
      },
      (error) => {
        alert("Error al obtener ubicación. Verifique los permisos del navegador.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  // --- NOTE OPERATIONS ---
  const saveNoteInternal = async (): Promise<SalesNote | null> => {
    if (!currentUser) return null;
    setIsSaving(true);
    
    const controlNum = getControlNumber();
    const newNote: SalesNote = {
      id: crypto.randomUUID(),
      controlNumber: controlNum,
      sequence,
      date: currentDateString,
      client,
      products: [...products],
      financials: {...financials},
      timestamp: Date.now(),
      creator: currentUser.name,
      status: 'active'
    };

    const updatedNotes = [newNote, ...savedNotes];
    setSavedNotes(updatedNotes);
    localStorage.setItem(`cai_notes_${getDateString()}`, JSON.stringify(updatedNotes));

    const nextSeq = sequence + 1;
    setSequence(nextSeq);
    localStorage.setItem('cai_sequence', nextSeq.toString());

    addLog("Crear Nota", `Nota ${controlNum} para ${client.name || 'Público General'}`);
    
    setIsSaving(false);
    return newNote;
  };

  const handleNewNote = async () => {
      const hasData = products.some(p => p.amount > 0) || client.name.trim() !== '';
      if (hasData) {
          await saveNoteInternal();
      }
      resetForm();
  }

  // --- SHARING ---
  const handleShareText = () => {
      const summary = `*CAI - NOTA DE VENTA*\n` +
          `*Control:* ${getControlNumber()}\n` +
          `*Fecha:* ${currentDateString}\n` +
          `*Cliente:* ${client.name || 'Público General'}\n` +
          `--------------------------\n` +
          `*Detalle:*\n` +
          products.map(p => `• ${p.chickens} pollos - ${p.netWeight.toFixed(2)}kg x $${p.price} = $${p.amount.toFixed(2)}`).join('\n') +
          `\n--------------------------\n` +
          `*Subtotal:* ${formatCurrency(financials.subTotal)}\n` +
          `*Abono:* ${formatCurrency(financials.payment)}\n` +
          `*Saldo:* ${formatCurrency(financials.finalBalance)}\n\n` +
          `_Le atendió: ${currentUser?.name}_`;

      navigator.clipboard.writeText(summary).then(() => {
          alert("Resumen copiado. ¡Listo para enviar!");
          addLog("Compartir", `Copiado texto de nota ${getControlNumber()}`);
      });
  };

  // --- EXPORT UTILS ---
  const waitForRender = () => new Promise(resolve => setTimeout(resolve, 800)); 

  const captureHiddenReceipt = async (): Promise<HTMLCanvasElement | null> => {
      if (hiddenPrintRef.current) {
          return await html2canvas(hiddenPrintRef.current, { 
            scale: 2, 
            backgroundColor: '#ffffff', 
            useCORS: true, 
            logging: false,
            width: 816, 
            windowWidth: 816
          });
      }
      return null;
  };

  const getReportStats = (notes: SalesNote[]) => {
      const active = notes.filter(n => n.status === 'active');
      const totalNotes = active.length;
      const totalChickens = active.reduce((acc, n) => acc + n.products.reduce((pAcc, p) => pAcc + p.chickens, 0), 0);
      const totalKilos = active.reduce((acc, n) => acc + n.products.reduce((pAcc, p) => pAcc + p.netWeight, 0), 0);
      const totalBilled = active.reduce((acc, n) => acc + n.financials.subTotal, 0); 
      const totalPayments = active.reduce((acc, n) => acc + n.financials.payment, 0);
      
      const userStats: Record<string, number> = {};
      active.forEach(n => {
          userStats[n.creator] = (userStats[n.creator] || 0) + 1;
      });

      return { totalNotes, totalChickens, totalKilos, totalBilled, totalPayments, userStats };
  };

  const createReportPage = (pdf: jsPDF, targetNotes: SalesNote[]) => {
      const stats = getReportStats(targetNotes);
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setFontSize(22);
      pdf.setTextColor(43, 74, 124);
      pdf.text(COMPANY_INFO.name, pageWidth/2, 20, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setTextColor(0);
      pdf.text(`REPORTE DE VENTAS - ${currentDateString}`, pageWidth/2, 35, { align: 'center' });
      
      let y = 50;
      pdf.setFontSize(12);
      pdf.text(`Notas Activas: ${stats.totalNotes}`, 20, y); y+=10;
      pdf.text(`Total Pollos: ${stats.totalChickens}`, 20, y); y+=10;
      pdf.text(`Total Kilos: ${stats.totalKilos.toFixed(2)} kg`, 20, y); y+=10;
      pdf.text(`Total Billed: ${formatCurrency(stats.totalBilled)}`, 20, y); y+=10;
      pdf.text(`Total Recaudado: ${formatCurrency(stats.totalPayments)}`, 20, y); y+=15;
      
      pdf.setLineWidth(0.5);
      pdf.line(20, y, pageWidth-20, y); y+=10;
      
      pdf.text("Desglose por Vendedor:", 20, y); y+=10;
      Object.entries(stats.userStats).forEach(([user, count]) => {
          pdf.text(`• ${user}: ${count} notas`, 30, y);
          y+=8;
      });
  };

  const handleExportSingleNote = async () => {
      const savedNote = await saveNoteInternal();
      if (!savedNote) return;

      setIsExporting(true);
      setExportMessage("Generando PDF...");
      setTempNoteForPrint(savedNote);

      try {
          await waitForRender();
          const canvas = await captureHiddenReceipt();
          if (canvas) {
              const pdf = new jsPDF('p', 'mm', 'letter');
              const imgData = canvas.toDataURL('image/png');
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
              pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
              
              const pdfBlob = pdf.output('blob');
              
              if (navigator.share) {
                  const file = new File([pdfBlob], `Nota_${savedNote.controlNumber}.pdf`, { type: 'application/pdf' });
                  try {
                      await navigator.share({ title: 'Nota CAI', files: [file] });
                  } catch (err) {
                      pdf.save(`Nota_${savedNote.controlNumber}.pdf`);
                  }
              } else {
                  pdf.save(`Nota_${savedNote.controlNumber}.pdf`);
              }
              addLog("Exportar", `PDF Nota ${savedNote.controlNumber}`);
          }
      } catch (e) {
          alert("Error al generar PDF");
      } finally {
          setIsExporting(false);
          setTempNoteForPrint(null);
      }
  };

  const handleExportConsolidated = async () => {
      setIsExporting(true);
      setShowExportModal(false);
      setExportMessage("Preparando Reporte...");

      let targetNotes = savedNotes;
      if (!isSuperAdmin(currentUser?.name || '')) {
          targetNotes = savedNotes.filter(n => n.creator === currentUser?.name);
      } else if (filterUser !== 'all') {
          targetNotes = savedNotes.filter(n => n.creator === filterUser);
      }

      try {
          const pdf = new jsPDF('p', 'mm', 'letter');
          createReportPage(pdf, targetNotes);
          for (let i = 0; i < targetNotes.length; i++) {
              setExportMessage(`Agregando nota ${i + 1}/${targetNotes.length}`);
              setTempNoteForPrint(targetNotes[i]);
              await waitForRender();
              const canvas = await captureHiddenReceipt();
              if (canvas) {
                  pdf.addPage();
                  const imgData = canvas.toDataURL('image/png');
                  const pdfWidth = pdf.internal.pageSize.getWidth();
                  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
              }
          }
          pdf.save(`Reporte_${getDateString()}.pdf`);
          addLog("Reporte", "Consolidado generado");
      } catch (e) {
          alert("Error generando consolidado");
      } finally {
          setIsExporting(false);
          setTempNoteForPrint(null);
      }
  };

  const handleExportZIP = async () => {
      setIsExporting(true);
      setShowExportModal(false);
      setExportMessage("Creando ZIP...");

      let targetNotes = savedNotes;
      if (!isSuperAdmin(currentUser?.name || '')) {
          targetNotes = savedNotes.filter(n => n.creator === currentUser?.name);
      } else if (filterUser !== 'all') {
          targetNotes = savedNotes.filter(n => n.creator === filterUser);
      }

      try {
          const zip = new JSZip();
          const folder = zip.folder(`Ventas_${getDateString()}`);
          
          const reportPdf = new jsPDF('p', 'mm', 'letter');
          createReportPage(reportPdf, targetNotes);
          folder?.file(`Resumen_Ventas.pdf`, reportPdf.output('blob'));

          for (let i = 0; i < targetNotes.length; i++) {
              setExportMessage(`Comprimiendo ${i + 1}/${targetNotes.length}`);
              const note = targetNotes[i];
              setTempNoteForPrint(note);
              await waitForRender();
              const canvas = await captureHiddenReceipt();
              if (canvas) {
                  const notePdf = new jsPDF('p', 'mm', 'letter');
                  const imgData = canvas.toDataURL('image/png');
                  const pdfWidth = notePdf.internal.pageSize.getWidth();
                  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                  notePdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                  folder?.file(`Nota_${note.controlNumber}.pdf`, notePdf.output('blob'));
              }
          }

          const content = await zip.generateAsync({ type: "blob" });
          saveAs(content, `CAI_Backup_${getDateString()}.zip`);
          addLog("Backup", "Archivo ZIP descargado");
      } catch (e) {
          alert("Error generando ZIP");
      } finally {
          setIsExporting(false);
          setTempNoteForPrint(null);
      }
  };

  // --- RENDER ---
  const currentUserIsSuper = currentUser ? isSuperAdmin(currentUser.name) : false;
  
  let visibleNotes = savedNotes;
  if (!currentUserIsSuper) {
      visibleNotes = savedNotes.filter(n => n.creator === currentUser?.name);
  } else if (filterUser !== 'all') {
      visibleNotes = savedNotes.filter(n => n.creator === filterUser);
  }

  const activeStatsNotes = visibleNotes.filter(n => n.status === 'active');
  const statsTotalVenta = activeStatsNotes.reduce((sum, n) => sum + n.financials.subTotal, 0);
  const statsTotalPago = activeStatsNotes.reduce((sum, n) => sum + n.financials.payment, 0);
  const totalPollos = activeStatsNotes.reduce((sum, n) => sum + n.products.reduce((pAcc, p) => pAcc + p.chickens, 0), 0);

  return (
    <div className="min-h-screen pb-20 font-sans text-gray-800">
      
      {/* HIDDEN PRINT AREA */}
      <div style={{ position: 'absolute', top: 0, left: '-9999px', zIndex: -50 }}>
         {tempNoteForPrint && (
             <div ref={hiddenPrintRef}>
                 <Receipt note={tempNoteForPrint} readOnly={true} />
             </div>
         )}
      </div>

      <main className="max-w-[850px] mx-auto p-4 md:p-8 space-y-8">
        
        {/* MAIN NOTE INTERFACE (Card 1) */}
        <Receipt 
            note={{
                controlNumber: getControlNumber(),
                date: currentDateString,
                client,
                products,
                financials,
                creator: currentUser?.name || 'Cargando...',
                status: 'active'
            }}
            onClientChange={(f, v) => setClient({ ...client, [f]: v })}
            onProductsUpdate={setProducts}
            onFinancialChange={(f, v) => setFinancials({ ...financials, [f]: parseFloat(v) || 0 })}
            onGetLocation={handleGetLocation}
            onNewNote={handleNewNote}
            onChangeUser={handleLogout}
            onExit={handleLogout}
        />

        {/* BOTTOM ACTION BUTTONS (Card 2) */}
        <ModernCard className="bg-white">
            <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-4 ml-1">Herramientas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button onClick={handleExportSingleNote} className="btn-primary btn-action-export">
                    <Share2 size={20} /> Compartir PDF
                </button>
                
                <button onClick={handleShareText} className="btn-primary bg-green-600 hover:bg-green-700">
                    <MessageCircle size={20} /> Nota WhatsApp
                </button>

                <button onClick={handleNewNote} className="btn-primary btn-action-new">
                    <FilePlus size={20} /> Limpiar/Nueva
                </button>

                <button onClick={() => setShowExportModal(true)} className="btn-primary btn-action-report">
                    <FolderArchive size={20} /> Reportes
                </button>
            </div>
        </ModernCard>

        {/* HISTORY SECTION (Card 3) */}
        <ModernCard className="bg-white">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-[#3B82F6] font-bold text-lg flex items-center gap-2">
                    <History size={20}/> Resumen Diario
                </h3>
                {currentUserIsSuper && (
                    <div className="w-full md:w-64">
                         <ModernSelect 
                             options={[
                                 { value: 'all', label: 'Todos los Vendedores' },
                                 ...USERS_DB.map(u => ({ value: u.name, label: u.name }))
                             ]}
                             value={filterUser}
                             onChange={(e) => setFilterUser(e.target.value)}
                         />
                    </div>
                )}
             </div>

             <div className="bg-[#F8FAFC] p-6 rounded-2xl border border-gray-100 space-y-4 shadow-inner-soft">
                 <div className="flex justify-between text-gray-600 font-medium border-b border-gray-200 pb-2">
                     <span>Notas Activas</span>
                     <span className="font-bold text-gray-900">{activeStatsNotes.length}</span>
                 </div>
                 <div className="flex justify-between text-gray-600 font-medium border-b border-gray-200 pb-2">
                     <span>Total Pollos</span>
                     <span className="font-bold text-gray-900">{totalPollos}</span>
                 </div>
                 <div className="flex justify-between text-gray-800 font-bold border-b border-gray-200 pb-2">
                     <span>Total Facturado</span>
                     <span className="text-[#1E293B]">{formatCurrency(statsTotalVenta)}</span>
                 </div>
                 <div className="flex justify-between text-[#16A34A] font-black text-xl pt-2">
                     <span>Abonos Recibidos</span>
                     <span>{formatCurrency(statsTotalPago)}</span>
                 </div>
             </div>

             <div className="mt-6">
                <button onClick={() => setShowHistoryModal(true)} className="btn-secondary w-full">
                    Ver Bitácora de Movimientos
                </button>
             </div>
        </ModernCard>

      </main>

      {/* EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-white/80 backdrop-blur-md">
             <ModernCard className="w-full max-w-sm shadow-2xl p-8">
                 <h3 className="text-2xl font-black text-gray-900 mb-2 text-center">Exportar Datos</h3>
                 <p className="text-gray-500 text-center mb-6 text-sm">
                    {currentUserIsSuper && filterUser === 'all' 
                      ? "Notas de todo el personal." 
                      : `Notas de: ${currentUserIsSuper && filterUser !== 'all' ? filterUser : currentUser?.name}`}
                 </p>
                 <div className="flex flex-col gap-4">
                     <button onClick={handleExportConsolidated} className="btn-primary bg-red-600 hover:bg-red-700 w-full justify-start pl-6">
                        <FileText size={24} />
                        <span>Generar Reporte PDF</span>
                     </button>
                     <button onClick={handleExportZIP} className="btn-primary bg-blue-600 hover:bg-blue-700 w-full justify-start pl-6">
                        <FolderArchive size={24} />
                        <span>Respaldo ZIP Diario</span>
                     </button>
                     <button onClick={() => setShowExportModal(false)} className="btn-secondary w-full">Volver</button>
                 </div>
             </ModernCard>
        </div>
      )}

      {/* LOADING OVERLAY */}
      {(isExporting || isLocating) && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-white/90 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-6">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-bold text-gray-900 text-lg uppercase tracking-widest">{isLocating ? 'Obteniendo GPS...' : exportMessage}</p>
              </div>
          </div>
      )}

      {/* LOGIN MODAL (ALWAYS ON TOP IF NO USER) */}
      {!currentUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#E2E8F0] backdrop-blur-md">
            <ModernCard className="w-full max-w-md shadow-2xl p-10 bg-white border-0">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-[#1E293B] tracking-tight">Acceso al Sistema</h2>
                    <p className="text-gray-500 mt-2 font-medium">Comercializadora Avícola del Istmo</p>
                </div>
                <div className="space-y-6">
                    <ModernSelect 
                        label="Seleccionar Vendedor" 
                        options={USERS_DB.map(u => ({ value: u.name, label: u.name }))} 
                        value={loginUsername} 
                        onChange={(e) => setLoginUsername(e.target.value)} 
                    />
                    <ModernInput 
                        label="Contraseña" 
                        type="password" 
                        value={loginPassword} 
                        onChange={(e) => setLoginPassword(e.target.value)} 
                    />
                    {loginError && <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl font-bold border border-red-100 animate-pulse">{loginError}</div>}
                    <button 
                        onClick={handleLogin} 
                        disabled={!loginUsername || !loginPassword} 
                        className="w-full bg-[#3B82F6] hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:bg-gray-400"
                    >
                        Ingresar Ahora
                    </button>
                </div>
            </ModernCard>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showHistoryModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-white/95">
              <ModernCard className="w-full max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden border border-gray-200 shadow-2xl">
                  <div className="p-6 border-b flex justify-between items-center bg-white">
                      <h3 className="text-xl font-black text-gray-900">Bitácora de Operaciones</h3>
                      <button onClick={() => setShowHistoryModal(false)} className="hover:bg-gray-100 p-2 rounded-full transition-all"><XCircle size={28} className="text-gray-400"/></button>
                  </div>
                  <div className="flex-1 overflow-auto p-6 bg-gray-50">
                      <table className="w-full text-sm bg-white rounded-xl shadow-sm border-collapse">
                          <thead className="bg-gray-100 sticky top-0">
                              <tr>
                                  <th className="p-4 text-left font-bold text-gray-600">Hora</th>
                                  <th className="p-4 text-left font-bold text-gray-600">Vendedor</th>
                                  <th className="p-4 text-left font-bold text-gray-600">Acción</th>
                                  <th className="p-4 text-left font-bold text-gray-600">Detalles</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {logs.filter(l => currentUserIsSuper || l.user === currentUser?.name).map(log => (
                                  <tr key={log.id} className="hover:bg-blue-50/50">
                                      <td className="p-4 font-bold text-gray-700">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                      <td className="p-4 text-gray-600">{log.user}</td>
                                      <td className="p-4"><span className="px-3 py-1 rounded-full text-[10px] font-black bg-gray-200 text-gray-700 uppercase">{log.action}</span></td>
                                      <td className="p-4 text-gray-500 italic">{log.details}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </ModernCard>
          </div>
      )}

    </div>
  );
};

export default App;
