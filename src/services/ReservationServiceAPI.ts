import ApiService, { ApiReservation, ApiShift } from './ApiService';
import { Reservation, Shift } from '../types';
import { scheduleLocalNotification } from './NotificationService';
import { format } from 'date-fns';

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

// Set per tracciare le notifiche già mostrate
let globalProcessedNotifications = new Set<string>();

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
  });

  return unsubscribe;
};

export const updateReservation = async (key: string, reservation: Reservation): Promise<void> => {
  try {
    const updates = convertToApiReservation(reservation);
    const response = await ApiService.updateReservation(key, updates);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to update reservation');
    }
  } catch (error) {
    console.error('Error updating reservation:', error);
    throw error;
  }
};

export const deleteReservation = async (key: string): Promise<void> => {
  try {
    const response = await ApiService.deleteReservation(key);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete reservation');
    }
  } catch (error) {
    console.error('Error deleting reservation:', error);
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