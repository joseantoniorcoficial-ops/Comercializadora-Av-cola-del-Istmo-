import React from 'react';
import { ProductRow } from '../types';
import { formatCurrency } from '../constants';
import { Trash2 } from 'lucide-react';

interface ProductTableProps {
  products: ProductRow[];
  onUpdate: (products: ProductRow[]) => void;
  readOnly?: boolean;
}

const ProductRowGrid: React.FC<{ 
    row: ProductRow; 
    index: number; 
    onChange: (index: number, field: keyof ProductRow, value: string) => void;
    onRemove: (index: number) => void;
    readOnly: boolean;
    canRemove: boolean;
}> = ({ row, index, onChange, onRemove, readOnly, canRemove }) => {
    
    // Style for Labels
    const labelClass = "font-bold text-xs uppercase tracking-wide text-gray-500 mb-2 block";
    
    // Common Purple Background Class
    const purpleBgClass = "bg-[#F3E5F5] border-none rounded-xl py-3 px-4 font-bold text-gray-800 text-right";

    // Helper to render Input or Div based on readOnly state
    // This ensures PDF export captures the text properly without cutting it off
    const renderInput = (value: number, field: keyof ProductRow, prefix?: string) => {
        if (readOnly) {
            return (
                <div className={`${purpleBgClass} flex justify-end items-center ${prefix ? 'justify-between' : ''}`}>
                    {prefix && <span className="text-gray-500 mr-2">{prefix}</span>}
                    <span>{value}</span>
                </div>
            );
        }
        return (
            <div className="relative">
                {prefix && <span className="absolute left-4 top-3 text-gray-500 font-bold">{prefix}</span>}
                <input 
                    type="number" 
                    value={value || ''} 
                    onChange={(e) => onChange(index, field, e.target.value)}
                    className={`${purpleBgClass} w-full focus:ring-2 focus:ring-purple-200 ${prefix ? 'pl-10' : ''}`}
                />
            </div>
        );
    };

    return (
        <div className="mb-2 pb-2 last:border-0 relative">
            {!readOnly && canRemove && (
                <button onClick={() => onRemove(index)} className="absolute right-0 -top-2 text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 size={18} />
                </button>
            )}

            {/* Row 1: Chickens, Crates, Gross */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                    <label className={labelClass}>Cantidad de Pollos</label>
                    {renderInput(row.chickens, 'chickens')}
                </div>
                <div>
                    <label className={labelClass}>Cantidad de Rejas:</label>
                    {renderInput(row.crates, 'crates')}
                </div>
                <div>
                    <label className={labelClass}>Peso Bruto (Kg)</label>
                    {renderInput(row.grossWeight, 'grossWeight')}
                </div>
            </div>

            {/* Row 2: Tare, Net, Avg */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                    <label className={labelClass}>Peso Tara (Kg):</label>
                    {renderInput(row.tare, 'tare')}
                </div>
                <div>
                    <label className={labelClass}>Peso Neto (Kg):</label>
                    <div className={purpleBgClass}>
                        {row.netWeight.toFixed(2)}
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Promedio:</label>
                    <div className={purpleBgClass}>
                        {row.average.toFixed(3)}
                    </div>
                </div>
            </div>

            {/* Row 3: Price, Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={labelClass}>Precio (Kg):</label>
                    {renderInput(row.price, 'price', '$')}
                </div>
                <div>
                    <label className={labelClass}>Importe Nota:</label>
                    {/* Fixed Div, matching style but specific color if needed, or keeping Purple/Cyan */}
                    <div className="relative bg-[#E0F7FA] rounded-xl overflow-hidden py-3 px-4 flex justify-between items-center">
                         <span className="text-gray-600 font-bold">$</span>
                         <span className="font-black text-gray-900 text-lg">
                             {formatCurrency(row.amount).replace('$', '')}
                         </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ProductTable: React.FC<ProductTableProps> = ({ products, onUpdate, readOnly = false }) => {
  
  const handleRowChange = (index: number, field: keyof ProductRow, value: string) => {
    if (readOnly) return;
    const numValue = parseFloat(value) || 0;
    const newProducts = [...products];
    const row = { ...newProducts[index], [field]: numValue };

    // Auto Calculations
    if (field === 'grossWeight' || field === 'tare') {
      row.netWeight = row.grossWeight - row.tare;
    }
    
    if (field === 'grossWeight' || field === 'tare' || field === 'chickens') {
      const net = field === 'grossWeight' || field === 'tare' ? row.netWeight : (row.grossWeight - row.tare);
      row.average = row.chickens > 0 ? net / row.chickens : 0;
    }

    if (field === 'grossWeight' || field === 'tare' || field === 'price') {
      const currentNet = row.grossWeight - row.tare;
      row.netWeight = currentNet;
      row.amount = currentNet * row.price;
    }

    newProducts[index] = row;
    onUpdate(newProducts);
  };

  const removeRow = (index: number) => {
    if (products.length > 1) {
      onUpdate(products.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="w-full">
      {products.map((row, index) => (
         <ProductRowGrid 
            key={row.id} row={row} index={index}
            onChange={handleRowChange} onRemove={removeRow}
            readOnly={readOnly} canRemove={products.length > 1}
         />
      ))}
    </div>
  );
};