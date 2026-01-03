export interface ProductRow {
  id: string;
  crates: number; // C/Rejas
  chickens: number; // C/Pollos
  grossWeight: number; // P/Bruto
  tare: number; // Tara
  netWeight: number; // P/Neto (Calculated)
  average: number; // Promedio (Calculated)
  price: number; // Precio
  amount: number; // Importe (Calculated)
}

export interface ClientData {
  name: string;
  fullAddress: string; // Combined Address + City + Google Maps
  phone: string;
}

export interface Financials {
  totalNote: number;
  discount: number;
  reposition: number;
  returnAmount: number; // Devolución
  subTotal: number;
  previousBalance: number; // Saldo Anterior
  payment: number; // Pago o Abono
  finalBalance: number; // Saldo Total
}

export interface SalesNote {
  id: string; 
  controlNumber: string; // CAI+SEQ+DATE
  sequence: number;
  date: string; // DD/MM/AAAA
  client: ClientData;
  products: ProductRow[];
  financials: Financials;
  timestamp: number;
  creator: string; // Who made it
  status: 'active' | 'cancelled'; // Status
  cancellationReason?: string; // Reason if cancelled
}

export interface LogEntry {
  id: string;
  timestamp: number;
  user: string;
  action: string; 
  details: string; 
}

export type UserRole = 'admin' | 'user';

export interface User {
  name: string;
  password?: string;
  role: UserRole;
}
