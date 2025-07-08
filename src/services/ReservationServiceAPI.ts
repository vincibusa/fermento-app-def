import ApiService, { ApiReservation, ApiShift } from './ApiService';
import { Reservation, Shift } from '../types';
import { scheduleLocalNotification } from './NotificationService';
import { format } from 'date-fns';

// Set per tracciare le notifiche già mostrate
let globalProcessedNotifications = new Set<string>();

// Funzione di retry per operazioni critiche
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`🔄 Retry ${attempt}/${maxRetries} failed:`, error);
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Attesa progressiva: 1s, 2s, 3s...
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
};

// Funzioni di conversione tra tipi API e tipi locali
const convertFromApiReservation = (apiReservation: ApiReservation): Reservation => {
  return {
    id: apiReservation.id,
    fullName: apiReservation.fullName,
    phone: apiReservation.phone,
    email: apiReservation.email,
    date: apiReservation.date,
    time: apiReservation.time,
    seats: apiReservation.seats,
    specialRequests: apiReservation.specialRequests,
    status: apiReservation.status,
  };
};

const convertToApiReservation = (reservation: Reservation): Omit<ApiReservation, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    fullName: reservation.fullName,
    phone: reservation.phone,
    email: reservation.email,
    date: reservation.date,
    time: reservation.time,
    seats: reservation.seats,
    specialRequests: reservation.specialRequests,
    status: reservation.status,
  };
};

const convertFromApiShift = (apiShift: ApiShift): Shift => {
  return {
    time: apiShift.time,
    enabled: apiShift.enabled,
    maxReservations: apiShift.maxReservations,
  };
};

export const initializeShiftsForDate = async (date: string): Promise<void> => {
  try {
    const response = await ApiService.initializeShiftsForDate(date);
    if (!response.success) {
      throw new Error(response.error || 'Failed to initialize shifts');
    }
  } catch (error) {
    console.error('Error initializing shifts:', error);
    throw error;
  }
};

export const updateShift = async (
  date: string,
  time: string,
  shift: Partial<Shift>
): Promise<void> => {
  try {
    const response = await ApiService.updateShift(date, time, shift);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update shift');
    }
  } catch (error) {
    console.error('Error updating shift:', error);
    throw error;
  }
};

export const getShiftsForDate = async (date: string): Promise<Shift[]> => {
  try {
    const apiShifts = await ApiService.getShiftsForDate(date);
    return apiShifts.map(convertFromApiShift);
  } catch (error) {
    console.error('Error getting shifts:', error);
    throw error;
  }
};

export const addReservation = async (reservation: Reservation): Promise<string | null> => {
  try {
    const apiReservation = convertToApiReservation(reservation);
    const response = await ApiService.createReservation(apiReservation);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to create reservation');
    }
    
    return response.data.id || null;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
};

export const subscribeToReservations = (
  callback: (reservations: Reservation[]) => void
): (() => void) => {
  // Usa il nuovo sistema di polling migliorato dall'ApiService
  const unsubscribe = ApiService.subscribeToReservations((apiReservations) => {
    try {
      const reservations = apiReservations.map(convertFromApiReservation);
      
      // Controlla nuove prenotazioni per le notifiche
      reservations.forEach(reservation => {
        if (
          reservation.id &&
          reservation.status === 'pending' &&
          !globalProcessedNotifications.has(reservation.id)
        ) {
          globalProcessedNotifications.add(reservation.id);
          scheduleLocalNotification(
            'Nuova Prenotazione',
            `Nuova prenotazione da ${reservation.fullName} per ${reservation.seats} persone il ${reservation.date} alle ${reservation.time}`
          );
        }
      });

      callback(reservations);
    } catch (error) {
      console.error('Error processing reservations:', error);
      // Continuiamo comunque a chiamare il callback con un array vuoto
      callback([]);
    }
  });

  return unsubscribe;
};

export const updateReservation = async (key: string, reservation: Reservation): Promise<void> => {
  try {
    await retryOperation(async () => {
      const updates = convertToApiReservation(reservation);
      const response = await ApiService.updateReservation(key, updates);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update reservation');
      }
    });
  } catch (error) {
    console.error('Error updating reservation after retries:', error);
    throw error;
  }
};

export const deleteReservation = async (key: string): Promise<void> => {
  try {
    await retryOperation(async () => {
      const response = await ApiService.deleteReservation(key);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete reservation');
      }
    });
  } catch (error) {
    console.error('Error deleting reservation after retries:', error);
    throw error;
  }
};

export const acceptReservation = async (key: string, reservation: Reservation): Promise<void> => {
  try {
    const response = await ApiService.acceptReservation(key);
    if (!response.success) {
      throw new Error(response.error || 'Failed to accept reservation');
    }

    // Notifica locale
    scheduleLocalNotification(
      'Prenotazione accettata',
      `Hai accettato la prenotazione di ${reservation.fullName} per ${reservation.seats} persone`
    );
  } catch (error) {
    console.error('Error accepting reservation:', error);
    throw error;
  }
};

export const rejectReservation = async (key: string, reservation: Reservation): Promise<void> => {
  try {
    const response = await ApiService.rejectReservation(key);
    if (!response.success) {
      throw new Error(response.error || 'Failed to reject reservation');
    }

    // Notifica locale
    scheduleLocalNotification(
      'Prenotazione rifiutata',
      `Hai rifiutato la prenotazione di ${reservation.fullName} per ${reservation.seats} persone`
    );
  } catch (error) {
    console.error('Error rejecting reservation:', error);
    throw error;
  }
};

export const checkServerConnection = async (): Promise<boolean> => {
  try {
    return await ApiService.checkServerConnection();
  } catch (error) {
    console.error('Error checking server connection:', error);
    return false;
  }
};

export const getReservationStats = async (date: string) => {
  try {
    return await ApiService.getReservationStats(date);
  } catch (error) {
    console.error('Error getting reservation stats:', error);
    throw error;
  }
}; 