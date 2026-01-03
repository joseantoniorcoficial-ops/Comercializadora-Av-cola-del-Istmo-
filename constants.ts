import { User } from './types';

export const COMPANY_INFO = {
  name: "COMERCIALIZADORA AVÍCOLA DEL ISTMO",
  rfc: "RUPA6312037P5",
  address: "Dr. José Morín Torres No. 8, Manzana N, Fracc. Infonavit Sandunga, Tehuantepec, Oax.",
  phones: "Tel: 971 71 5 0196 | Cel: 971 100 3874",
};

export const USERS_DB: User[] = [
  { name: "Daniel Ruiz Barrera", password: "ruiz1264", role: "user" },
  { name: "Eduardo Romero Hernández", password: "romero8976", role: "user" },
  { name: "Antonio Ruiz Palacios", password: "rupa7754", role: "admin" },
  { name: "Griselda Ruiz de la Cruz", password: "ruca6467", role: "admin" },
  { name: "José Antonio Ruiz de la Cruz", password: "ruiz7879", role: "admin" },
  { name: "Luis Ángel Cruz Guzmán", password: "guzmán4523", role: "user" }
];

export const INITIAL_PRODUCT_ROW = {
  crates: 0,
  chickens: 0,
  grossWeight: 0,
  tare: 0,
  netWeight: 0,
  average: 0,
  price: 0,
  amount: 0,
};

export const INITIAL_FINANCIALS = {
  totalNote: 0,
  discount: 0,
  reposition: 0,
  returnAmount: 0,
  subTotal: 0,
  previousBalance: 0,
  payment: 0,
  finalBalance: 0,
};

// Format currency to Mexican Peso
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value);
};

// Generate Date String DDMMAAAA
export const getDateString = (date: Date = new Date()) => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}${m}${y}`;
};

// Generate Date String DD/MM/AAAA for display
export const getDisplayDate = (date: Date = new Date()) => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};