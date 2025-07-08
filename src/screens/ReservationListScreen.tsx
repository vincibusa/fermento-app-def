import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Reservation } from '../types';
import EditReservationModal from '../components/EditReservationModal';
import {
  subscribeToReservations,
  deleteReservation,
  acceptReservation,
  rejectReservation,
  updateReservation,
  checkServerConnection,
} from '../services/ReservationServiceAPI';

type Props = NativeStackScreenProps<any>;

const ReservationListScreen: React.FC<Props> = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState(new Date());
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  
  // Nuovi stati per la gestione del refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToReservations((newReservations) => {
      const filteredReservations = newReservations.filter(
        (res) => res.date === selectedDate
      );
      setReservations(filteredReservations);
      setIsLoading(false);
      setConnectionStatus('connected');
      setLastUpdateTime(new Date());
    });

    return () => unsubscribe();
  }, [selectedDate]);

  // Funzione per refresh manuale
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      setConnectionStatus('checking');
      const isConnected = await checkServerConnection();
      if (isConnected) {
        setConnectionStatus('connected');
        setLastUpdateTime(new Date());
        showToast('success', 'Dati aggiornati con successo');
      } else {
        setConnectionStatus('disconnected');
        showToast('error', 'Impossibile connettersi al server');
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      showToast('error', 'Errore durante l\'aggiornamento');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Funzione per verificare la connessione
  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      const isConnected = await checkServerConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      return isConnected;
    } catch (error) {
      setConnectionStatus('disconnected');
      return false;
    }
  };

  const handleDelete = async (reservation: Reservation) => {
    try {
      if (reservation.id) {
        await deleteReservation(reservation.id);
        showToast('success', 'Prenotazione eliminata con successo');
      }
    } catch (error) {
      showToast('error', 'Errore durante l\'eliminazione');
    }
  };

  const handleAccept = async (reservation: Reservation) => {
    try {
      if (reservation.id) {
        await acceptReservation(reservation.id, reservation);
        showToast('success', 'Prenotazione accettata con successo');
      }
    } catch (error) {
      showToast('error', 'Errore durante l\'accettazione');
    }
  };

  const handleReject = async (reservation: Reservation) => {
    try {
      if (reservation.id) {
        await rejectReservation(reservation.id, reservation);
        showToast('success', 'Prenotazione rifiutata con successo');
      }
    } catch (error) {
      showToast('error', 'Errore durante il rifiuto');
    }
  };

  const handleEdit = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (updatedData: Partial<Reservation>) => {
    try {
      if (selectedReservation?.id) {
        await updateReservation(selectedReservation.id, {
          ...selectedReservation,
          ...updatedData
        });
        showToast('success', 'Prenotazione aggiornata con successo');
      }
    } catch (error) {
      showToast('error', 'Errore durante l\'aggiornamento');
    }
  };

  // Funzione per mostrare un semplice toast utilizzando Alert
  const showToast = (type: 'success' | 'error', message: string) => {
    Alert.alert(
      type === 'success' ? 'Operazione completata' : 'Errore',
      message,
      [{ text: 'OK' }],
      { cancelable: true }
    );
  };

  const renderReservation = ({ item: reservation }: { item: Reservation }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{reservation.fullName}</Text>
        <Text style={styles.cardSubtitle}>{reservation.time}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardInfo}>Telefono: {reservation.phone}</Text>
        <Text style={styles.cardInfo}>Email: {reservation.email}</Text>
        <Text style={styles.cardInfo}>Persone: {reservation.seats}</Text>
        {reservation.specialRequests && (
          <Text style={styles.cardInfo}>Note: {reservation.specialRequests}</Text>
        )}
      </View>
      <View style={styles.cardStatus}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(reservation.status) }]} />
        <Text style={styles.statusText}>{getStatusText(reservation.status)}</Text>
      </View>
      <View style={styles.cardActionsContainer}>
        <View style={styles.cardActionsRow}>
          {reservation.status === 'pending' && (
            <>
              <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={() => handleAccept(reservation)}>
                <MaterialCommunityIcons name="check" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Accetta</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => handleReject(reservation)}>
                <MaterialCommunityIcons name="close" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Rifiuta</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <View style={styles.cardActionsRow}>
          <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => handleEdit(reservation)}>
            <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Modifica</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(reservation)}>
            <MaterialCommunityIcons name="delete" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Elimina</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#2e7d32';
      case 'rejected': return '#c62828';
      default: return '#f57c00';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'Confermata';
      case 'rejected': return 'Rifiutata';
      default: return 'In attesa';
    }
  };

  const showDatePicker = () => {
    setDatePickerDate(new Date(`${selectedDate}T00:00:00`));
    if (Platform.OS === 'ios') {
      setDatePickerVisible(true);
    } else {
      setShowAndroidDatePicker(true);
    }
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleConfirm = (date: Date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'));
    hideDatePicker();
    setShowAndroidDatePicker(false);
  };

  const handleQuickDateSelect = (days: number) => {
    const date = addDays(new Date(), days);
    setSelectedDate(format(date, 'yyyy-MM-dd'));
  };

  const ListHeader = () => (
    <View style={styles.header}>
      {/* Status Bar di connessione */}
      <View style={styles.statusBar}>
        <View style={styles.connectionStatus}>
          <MaterialCommunityIcons 
            name={
              connectionStatus === 'connected' ? 'wifi' : 
              connectionStatus === 'disconnected' ? 'wifi-off' : 
              'wifi-sync'
            } 
            size={16} 
            color={
              connectionStatus === 'connected' ? '#4caf50' : 
              connectionStatus === 'disconnected' ? '#f44336' : 
              '#ff9800'
            } 
          />
          <Text style={[
            styles.statusText,
            { color: connectionStatus === 'connected' ? '#4caf50' : 
                     connectionStatus === 'disconnected' ? '#f44336' : '#ff9800' }
          ]}>
            {connectionStatus === 'connected' ? 'Connesso' : 
             connectionStatus === 'disconnected' ? 'Disconnesso' : 'Controllo...'}
          </Text>
          {lastUpdateTime && (
            <Text style={styles.lastUpdateText}>
              {format(lastUpdateTime, 'HH:mm:ss')}
            </Text>
          )}
        </View>
        
        {/* Pulsante di refresh manuale */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#2962ff" />
          ) : (
            <MaterialCommunityIcons name="refresh" size={20} color="#2962ff" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.dateSelector}>
        <TouchableOpacity style={styles.dateButton} onPress={() => handleQuickDateSelect(0)}>
          <Text style={[styles.dateButtonText, selectedDate === format(new Date(), 'yyyy-MM-dd') && styles.activeDateText]}>
            Oggi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateButton} onPress={() => handleQuickDateSelect(1)}>
          <Text style={[styles.dateButtonText, selectedDate === format(addDays(new Date(), 1), 'yyyy-MM-dd') && styles.activeDateText]}>
            Domani
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.customDateButton} onPress={showDatePicker}>
          <MaterialCommunityIcons name="calendar" size={18} color="#2962ff" />
          <Text style={styles.customDateText}>
            {format(new Date(`${selectedDate}T00:00:00`), 'dd/MM/yyyy')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={reservations}
        renderItem={renderReservation}
        keyExtractor={(item) => item.id || `${item.fullName}-${item.time}`}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank" size={64} color="#c5cfe0" />
            <Text style={styles.emptyText}>Nessuna prenotazione per questa data</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      />
      
      {selectedReservation && (
        <EditReservationModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          onSave={handleSaveEdit}
          reservation={selectedReservation}
        />
      )}
      
      {/* iOS DatePicker Modal */}
      {Platform.OS === 'ios' && isDatePickerVisible && (
        <Modal
          visible={isDatePickerVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={datePickerDate}
                mode="date"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) setDatePickerDate(selectedDate);
                }}
                textColor="#000000"
                accentColor="#2962ff"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={hideDatePicker}
                >
                  <Text style={styles.modalButtonText}>Annulla</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={() => handleConfirm(datePickerDate)}
                >
                  <Text style={styles.modalButtonText}>Conferma</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      
      {/* Android DatePicker */}
      {Platform.OS === 'android' && showAndroidDatePicker && (
        <DateTimePicker
          value={datePickerDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowAndroidDatePicker(false);
            if (selectedDate) {
              handleConfirm(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#f0f4f8',
  },
  dateButtonText: {
    color: '#444',
    fontWeight: '500',
  },
  activeDateText: {
    color: '#2962ff',
    fontWeight: 'bold',
  },
  customDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#f0f4f8',
  },
  customDateText: {
    marginLeft: 4,
    color: '#444',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 16,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#191919',
  },
  cardSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2962ff',
  },
  cardContent: {
    marginBottom: 16,
  },
  cardInfo: {
    fontSize: 14,
    color: '#4d4d4d',
    marginBottom: 6,
  },
  cardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastUpdateText: {
    fontSize: 10,
    color: '#999',
    marginLeft: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f4f8',
  },
  cardActionsContainer: {
    marginTop: 8,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
    minWidth: 110,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#2e7d32',
  },
  rejectButton: {
    backgroundColor: '#c62828',
  },
  deleteButton: {
    backgroundColor: '#455a64',
  },
  editButton: {
    backgroundColor: '#2962ff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f4f8',
  },
  confirmButton: {
    backgroundColor: '#2962ff',
  },
  modalButtonText: {
    fontWeight: 'bold',
    color: '#333',
  },
});

export default ReservationListScreen; 