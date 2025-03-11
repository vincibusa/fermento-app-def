import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Switch, Alert, Modal, Platform } from 'react-native';
import { format, addDays } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Shift, allTimes } from '../types';
import { getShiftsForDate, updateShift, initializeShiftsForDate } from '../services/ReservationService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { scheduleLocalNotification } from '../services/NotificationService';

type Props = NativeStackScreenProps<any>;

const SettingsScreen: React.FC<Props> = () => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState(new Date());
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);

  useEffect(() => {
    loadShifts();
  }, [selectedDate]);

  const loadShifts = async () => {
    try {
      setLoading(true);
      let shiftsData = await getShiftsForDate(selectedDate);
      if (shiftsData.length === 0) {
        await initializeShiftsForDate(selectedDate);
        shiftsData = await getShiftsForDate(selectedDate);
      }
      setShifts(shiftsData);
    } catch (error) {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Gestione Turni</Text>
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
            <MaterialCommunityIcons name="calendar" size={18} color="#e91e63" />
            <Text style={styles.customDateText}>
              {format(new Date(`${selectedDate}T00:00:00`), 'dd/MM/yyyy')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
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
                trackColor={{ false: '#767577', true: '#e91e6360' }}
                thumbColor={shift.enabled ? '#e91e63' : '#f4f3f4'}
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
                accentColor="#d81b60"
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#191919',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  dateButtonText: {
    color: '#444',
    fontWeight: '500',
  },
  activeDateText: {
    color: '#d81b60',
    fontWeight: 'bold',
  },
  customDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
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
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  shiftInfo: {
    flex: 1,
  },
  shiftTime: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#191919',
  },
  shiftStatus: {
    fontSize: 14,
    color: '#388e3c',
    fontWeight: '500',
  },
  disabledStatus: {
    color: '#d32f2f',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: '#d81b60',
  },
  modalButtonText: {
    fontWeight: 'bold',
    color: '#333',
  },
});

export default SettingsScreen; 