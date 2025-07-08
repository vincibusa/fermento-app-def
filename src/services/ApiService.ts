import { currentConfig } from '../config/environment';
import { Reservation, Shift } from '../types';

// Interfacce per le risposte API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiReservation {
  id?: string;
  fullName: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  seats: number;
  specialRequests?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiShift {
  time: string;
  date: string;
  enabled: boolean;
  maxReservations: number;
}

export interface ReservationStats {
  date: string;
  totalReservations: number;
  totalSeats: number;
  pendingReservations: number;
  acceptedReservations: number;
  rejectedReservations: number;
  shiftStats: Array<{
    time: string;
    reservations: number;
    seats: number;
    available: boolean;
  }>;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = currentConfig.baseURL;
    console.log('🔗 API Service initialized with URL:', this.baseURL);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Aggiungi timeout alla richiesta
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), currentConfig.timeout || 10000);
    
    config.signal = controller.signal;

    try {
      console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ API Error (${response.status}):`, data.error || data.message);
        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }

      console.log(`✅ API Success: ${options.method || 'GET'} ${url}`);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('⏰ Request timeout:', url);
          throw new Error('Richiesta scaduta. Controlla la connessione internet.');
        }
        
        if (error.message.includes('fetch')) {
          console.error('🌐 Network error:', url);
          throw new Error('Errore di connessione. Controlla la connessione internet.');
        }
      }
      
      console.error('💥 API request failed:', error);
      throw error;
    }
  }

  // Metodi per le prenotazioni
  async getReservations(filters?: {
    date?: string;
    status?: string;
    limit?: number;
  }): Promise<ApiReservation[]> {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await this.request<ApiReservation[]>(`/reservations${query}`);
    return response.data || [];
  }

  async getReservationById(id: string): Promise<ApiReservation | null> {
    try {
      const response = await this.request<ApiReservation>(`/reservations/${id}`);
      return response.data || null;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async createReservation(reservation: Omit<ApiReservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ApiReservation>> {
    return await this.request<ApiReservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(reservation),
    });
  }

  async updateReservation(id: string, updates: Partial<ApiReservation>): Promise<ApiResponse> {
    return await this.request(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteReservation(id: string): Promise<ApiResponse> {
    return await this.request(`/reservations/${id}`, {
      method: 'DELETE',
    });
  }

  async acceptReservation(id: string): Promise<ApiResponse> {
    return await this.request(`/reservations/${id}/accept`, {
      method: 'POST',
    });
  }

  async rejectReservation(id: string, reason?: string): Promise<ApiResponse> {
    return await this.request(`/reservations/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Metodi per i turni
  async getShiftsForDate(date: string): Promise<ApiShift[]> {
    const response = await this.request<ApiShift[]>(`/shifts/${date}`);
    return response.data || [];
  }

  async getShift(date: string, time: string): Promise<ApiShift | null> {
    try {
      const response = await this.request<ApiShift>(`/shifts/${date}/${time}`);
      return response.data || null;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async updateShift(date: string, time: string, updates: Partial<ApiShift>): Promise<ApiResponse> {
    return await this.request(`/shifts/${date}/${time}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async initializeShiftsForDate(date: string): Promise<ApiResponse> {
    return await this.request(`/shifts/${date}/initialize`, {
      method: 'POST',
    });
  }

  async getReservationStats(date: string): Promise<ReservationStats> {
    const response = await this.request<ReservationStats>(`/shifts/${date}/stats`);
    return response.data || {} as ReservationStats;
  }

  async getAvailableTimes(): Promise<ApiResponse<string[]>> {
    return this.request<string[]>('/shifts/times/available');
  }

  // Metodo per verificare la connessione al server
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL.replace('/api', '')}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Real-time updates with improved polling
  subscribeToReservations(
    callback: (reservations: ApiReservation[]) => void
  ): () => void {
    let intervalId: NodeJS.Timeout;
    let lastDataHash: string = '';
    let isActive = true;

    const fetchReservations = async () => {
      if (!isActive) return;
      
      try {
        const reservations = await this.getReservations();
        
        // Create a simple hash to detect changes
        const currentDataHash = JSON.stringify(reservations.map(r => ({ 
          id: r.id, 
          status: r.status, 
          updatedAt: r.updatedAt 
        })));
        
        // Only call callback if data has changed
        if (currentDataHash !== lastDataHash) {
          lastDataHash = currentDataHash;
          callback(reservations);
        }
      } catch (error) {
        console.error('Error fetching reservations:', error);
      }
    };

    // Initial fetch
    fetchReservations();

    // Poll every 5 seconds for better responsiveness
    intervalId = setInterval(fetchReservations, 5000);

    console.log('✅ Real-time polling started (5s interval)');

    // Return cleanup function
    return () => {
      isActive = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      console.log('🔄 Real-time polling stopped');
    };
  }

  // Server connection check
  async checkServerConnection(): Promise<boolean> {
    return await this.healthCheck();
  }
}

export default new ApiService(); 