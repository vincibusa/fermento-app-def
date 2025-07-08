import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Switch,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { format, addDays } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Shift } from '../types';
import {
  getShiftsForDate,
  updateShift,
  initializeShiftsForDate,
  checkServerConnection,
} from '../services/ReservationServiceAPI';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any>;

const SettingsScreen: React.FC<Props> = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState(new Date());
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
  
  // Nuovi stati per la gestione del refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  useEffect(() => {
    loadShifts();
  }, [selectedDate]);

  const loadShifts = async () => {
    try {
      setLoading(true);
      setConnectionStatus('checking');
      
      let shiftsData = await getShiftsForDate(selectedDate);
      if (shiftsData.length === 0) {
        await initializeShiftsForDate(selectedDate);
        shiftsData = await getShiftsForDate(selectedDate);
      }
      setShifts(shiftsData);
      setConnectionStatus('connected');
      setLastUpdateTime(new Date());
    } catch (error) {
      setConnectionStatus('disconnected');
      showToast('error', 'Errore nel caricamento dei turni');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    Alert.alert(
      type === 'success' ? 'Operazione completata' : 'Errore',
      message,
      [{ text: 'OK' }],
      { cancelable: true }
    );
  };

  const handleToggleShift = async (time: string, currentEnabled: boolean) => {
    try {
      await updateShift(selectedDate, time, { enabled: !currentEnabled });
      await loadShifts();
      showToast('success', 'Turno aggiornato con successo');
    } catch (error) {
      showToast('error', 'Errore nell\'aggiornamento del turno');
    }
  };

  const handleQuickDateSelect = (days: number) => {
    const date = addDays(new Date(), days);
    setSelectedDate(format(date, 'yyyy-MM-dd'));
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

  // Funzione per refresh manuale
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadShifts();
      showToast('success', 'Dati aggiornati con successo');
    } catch (error) {
      showToast('error', 'Errore durante l\'aggiornamento');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Gestione Turni</Text>
        
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
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => handleQuickDateSelect(0)}
          >
            <Text style={[
              styles.dateButtonText, 
              selectedDate === format(new Date(), 'yyyy-MM-dd') && styles.activeDateText
            ]}>
              Oggi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => handleQuickDateSelect(1)}
          >
            <Text style={[
              styles.dateButtonText, 
              selectedDate === format(addDays(new Date(), 1), 'yyyy-MM-dd') && styles.activeDateText
            ]}>
              Domani
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.customDateButton} 
            onPress={showDatePicker}
          >
            <MaterialCommunityIcons name="calendar" size={18} color="#2962ff" />
            <Text style={styles.customDateText}>
              {format(new Date(`${selectedDate}T00:00:00`), 'dd/MM/yyyy')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <View style={styles.shiftsContainer}>
          {shifts.map((shift) => (
            <View key={shift.time} style={styles.shiftItem}>
              <View style={styles.shiftInfo}>
                <Text style={styles.shiftTime}>{shift.time}</Text>
                {shift.enabled ? (
                  <Text style={styles.shiftStatus}>Disponibile</Text>
                ) : (
                  <Text style={[styles.shiftStatus, styles.disabledStatus]}>Non disponibile</Text>
                )}
              </View>
              <Switch
                value={shift.enabled}
                onValueChange={() => handleToggleShift(shift.time, shift.enabled)}
                trackColor={{ false: '#c5cfe0', true: '#bbdefb' }}
                thumbColor={shift.enabled ? '#2962ff' : '#f4f4f4'}
              />
            </View>
          ))}
        </View>
      </ScrollView>

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
    marginBottom: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#191919',
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
  statusText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
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
  scrollView: {
    flex: 1,
  },
  shiftsContainer: {
    padding: 16,
  },
  shiftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  shiftInfo: {
    flex: 1,
  },
  shiftTime: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#191919',
  },
  shiftStatus: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '500',
  },
  disabledStatus: {
    color: '#c62828',
    fontWeight: '500',
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

export default SettingsScreen; 