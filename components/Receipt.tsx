
import React from 'react';
import { Bird, MapPin, User, LogOut, FilePlus } from 'lucide-react';
import { SalesNote, ProductRow, Financials, ClientData } from '../types';
import { COMPANY_INFO, formatCurrency } from '../constants';
import { ProductTable } from './ProductTable';

interface ReceiptProps {
  note: {
    controlNumber: string;
    date: string;
    client: ClientData;
    products: ProductRow[];
    financials: Financials;
    creator?: string;
    status?: 'active' | 'cancelled';
  };
  readOnly?: boolean;
  onClientChange?: (field: keyof ClientData, value: string) => void;
  onProductsUpdate?: (products: ProductRow[]) => void;
  onFinancialChange?: (field: keyof Financials, value: string) => void;
  onGetLocation?: () => void;
  onNewNote?: () => void;
  onChangeUser?: () => void;
  onExit?: () => void;
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ note, readOnly = false, onClientChange, onProductsUpdate, onFinancialChange, onGetLocation, onNewNote, onChangeUser, onExit }, ref) => {
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (onClientChange) {
          onClientChange(e.target.name as keyof ClientData, e.target.value);
      }
  };

  // Helper for Financial Inputs
  const renderFinancialInput = (value: number, field: keyof Financials) => {
      if (readOnly) {
          return (
             <div className="relative bg-[#F3E5F5] rounded-xl py-3 px-4 flex justify-between items-center border border-transparent">
                 <span className="text-gray-600 font-bold">$</span>
                 <span className="font-bold text-gray-800 text-lg">{value}</span>
             </div>
          );
      }

      return (
        <div className="relative">
            <span className="absolute left-4 top-3 text-gray-600 font-bold">$</span>
            <input 
                type="number" 
                value={value || ''} 
                onChange={(e) => onFinancialChange?.(field, e.target.value)} 
                className="w-full bg-[#F3E5F5] border-none rounded-xl py-3 pl-10 pr-4 font-bold text-gray-800 text-lg focus:ring-2 focus:ring-purple-200 text-right"
            />
        </div>
      );
  };

  const renderClientInput = (name: keyof ClientData, value: string, placeholder?: string) => {
      if (readOnly) {
          return (
              <div className="bg-[#F1F5F9] rounded-xl py-3 px-4 font-bold text-gray-800 min-h-[3rem] flex items-center">
                  {value}
              </div>
          );
      }
      
      return (
          <input 
            name={name}
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="bg-[#F1F5F9] border-none focus:ring-2 focus:ring-gray-200 rounded-xl py-3 px-4 font-bold text-gray-800 w-full"
            type="text"
          />
      );
  };

  return (
    <div ref={ref} className={`bg-white rounded-[32px] shadow-soft p-6 md:p-10 max-w-4xl mx-auto border border-gray-50 ${readOnly ? 'pdf-container' : ''}`}>
        
        {/* --- HEADER SECTION --- */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6 border-b border-gray-100 pb-8">
            
            <div className="flex gap-5 items-center">
                <div className="text-gray-800 p-4 bg-gray-50 rounded-2xl">
                    <Bird size={40} strokeWidth={1.5} />
                </div>
                <div>
                    <h1 className="font-extrabold text-xl uppercase tracking-wide text-gray-900">{COMPANY_INFO.name}</h1>
                    <div className="text-sm font-bold text-gray-600 mt-1">R.F.C. {COMPANY_INFO.rfc}</div>
                    <div className="text-xs text-gray-500 max-w-sm mt-1 leading-relaxed">{COMPANY_INFO.address}</div>
                    <div className="text-xs text-gray-500 mt-1">{COMPANY_INFO.phones}</div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Le atiende:</span>
                        <div className="text-sm font-bold text-[#1E293B]">{note.creator}</div>
                    </div>
                </div>
            </div>

            <div className="w-full md:w-auto flex flex-col gap-4 min-w-[200px]">
                <div>
                    <label className="text-gray-500">No. de Control:</label>
                    <div className="bg-[#F8FAFC] rounded-xl py-3 px-4 font-bold text-center text-gray-800 border border-gray-200 shadow-sm">
                        {note.controlNumber}
                    </div>
                </div>
                <div>
                    <label className="text-gray-500">Fecha:</label>
                    <div className="bg-[#F8FAFC] rounded-xl py-3 px-4 font-bold text-center text-gray-800 border border-gray-200 shadow-sm">
                        {note.date}
                    </div>
                </div>
            </div>
        </div>

        {/* --- MENU BAR --- */}
        {!readOnly && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <button type="button" onClick={onNewNote} className="btn-primary btn-top-new">
                    <FilePlus size={20} /> Nueva Nota
                </button>
                <button type="button" onClick={() => { if(onChangeUser) onChangeUser(); }} className="btn-primary btn-top-user">
                    <User size={20} /> Cambiar Usuario
                </button>
                <button type="button" onClick={() => { if(onExit) onExit(); }} className="btn-primary btn-top-exit">
                    <LogOut size={20} /> Salir
                </button>
            </div>
        )}

        {/* --- CLIENT DATA --- */}
        <div className="mb-10">
            <h3 className="text-[#3B82F6] font-bold text-lg mb-4 flex items-center gap-2">
                Datos del Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-1">
                    <label>Nombre del Cliente</label>
                    {renderClientInput("name", note.client.name)}
                </div>
                <div className="md:col-span-1">
                    <label>No. de Teléfono</label>
                    {renderClientInput("phone", note.client.phone)}
                </div>
                <div className="md:col-span-1 relative">
                    <label>Dirección / Ubicación</label>
                    {renderClientInput("fullAddress", note.client.fullAddress)}
                    {!readOnly && (
                        <button type="button" onClick={onGetLocation} className="absolute right-3 top-9 text-gray-400 hover:text-blue-600 transition-colors">
                            <MapPin size={20} />
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* --- PRODUCT DATA --- */}
        <div className="mb-10">
            <h3 className="text-[#3B82F6] font-bold text-lg mb-4">Datos del Producto</h3>
            <div className="bg-white rounded-2xl">
                <ProductTable 
                    products={note.products}
                    onUpdate={onProductsUpdate || (() => {})}
                    readOnly={readOnly}
                />
            </div>
        </div>

        {/* --- PAYMENT SUMMARY --- */}
        <div className="mb-6">
            <h3 className="text-[#3B82F6] font-bold text-lg mb-6">Resumen de Pago</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                    <label className="text-gray-500">(-) Descuento:</label>
                    {renderFinancialInput(note.financials.discount, 'discount')}
                </div>
                <div>
                    <label className="text-gray-500">(-) Devolución:</label>
                    {renderFinancialInput(note.financials.returnAmount, 'returnAmount')}
                </div>
                <div>
                    <label className="text-gray-500">(-) Reposición:</label>
                    {renderFinancialInput(note.financials.reposition, 'reposition')}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 items-end">
                <div>
                    <label className="text-gray-500">Sub Total:</label>
                     <div className="bg-[#F3E5F5] rounded-xl py-3 px-4 font-bold text-gray-800 text-lg flex items-center justify-between">
                        <span className="text-gray-600 font-bold">$</span>
                        <span>{formatCurrency(note.financials.subTotal).replace('$', '')}</span>
                    </div>
                </div>
                <div>
                    <label className="text-gray-500">(+) Saldo Anterior:</label>
                     {renderFinancialInput(note.financials.previousBalance, 'previousBalance')}
                </div>
                <div>
                    <label className="text-gray-500">(-) Pago o Abono:</label>
                     {renderFinancialInput(note.financials.payment, 'payment')}
                </div>
            </div>

            <div className="bg-[#EFF6FF] p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center border border-blue-100 shadow-sm">
                <div className="font-black text-2xl text-gray-800">
                    (=) Saldo Total: <span className="text-[#3B82F6]">{formatCurrency(note.financials.finalBalance)}</span>
                </div>
                
                {note.financials.finalBalance <= 0.5 ? (
                    <div className="mt-4 md:mt-0 px-8 py-3 bg-[#DCFCE7] text-[#14532D] font-black rounded-full shadow-sm text-sm uppercase tracking-wide flex items-center gap-2">
                        <span>✅</span> Nota Pagada
                    </div>
                ) : (
                    <div className="mt-4 md:mt-0 px-8 py-3 bg-[#FEE2E2] text-[#7F1D1D] font-black rounded-full shadow-sm text-sm uppercase tracking-wide flex items-center gap-2">
                        <span>⚠️</span> Saldo Pendiente
                    </div>
                )}
            </div>
        </div>

    </div>
  );
});
