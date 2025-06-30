export interface Reservation {
    id?: string;
    fullName: string;
    phone: string;
    date: string;   // formato "YYYY-MM-DD"
    time: string;   // formato "HH:mm" (es. "19:00", "19:30", ecc.)
    seats: number;
    specialRequests?: string;
    status: 'pending' | 'accepted' | 'rejected';
    email: string;
}

export interface Shift {
    time: string;           // Es. "19:00", "20:00", ecc.
    enabled: boolean;       // Indica se il turno è attivo (sbloccato) oppure no
    maxReservations: number; // Numero massimo di posti prenotabili (default 15)
}

// Orari disponibili - ora vengono recuperati dal backend
export const DEFAULT_TIMES: string[] = [
  "19:00", "19:15", "19:30", "19:45", 
  "20:00", "20:15", "20:30", "20:45", 
  "21:00", "21:15", "21:30"
];

export type TimeSlot = typeof DEFAULT_TIMES[number]; 