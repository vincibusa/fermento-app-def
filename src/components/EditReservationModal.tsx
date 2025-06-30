import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Reservation, Shift, DEFAULT_TIMES } from '../types';
import { 
  updateReservation, 
  getShiftsForDate
} from '../services/ReservationServiceAPI';

interface EditReservationModalProps {
  visible: boolean;
  reservation: Reservation | null;
  onClose: () => void;
  onSave: (updatedData: Partial<Reservation>) => void;
}

const EditReservationModal: React.FC<EditReservationModalProps> = ({
  visible,
  reservation,
  onClose,
  onSave,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState('19:00');
  const [seats, setSeats] = useState('2');
  const [specialRequests, setSpecialRequests] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>(DEFAULT_TIMES);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reservation) {
      setFullName(reservation.fullName);
      setPhone(reservation.phone);
      setEmail(reservation.email);
      setDate(new Date(reservation.date));
      setTime(reservation.time);
      setSeats(reservation.seats.toString());
      setSpecialRequests(reservation.specialRequests || '');
      loadAvailableTimes(reservation.date);
    }
  }, [reservation]);

  const loadAvailableTimes = async (selectedDate: string) => {
    try {
      const shifts = await getShiftsForDate(selectedDate);
      const enabledTimes = shifts
        .filter(shift => shift.enabled)
        .map(shift => shift.time)
        .sort();
      
      if (enabledTimes.length > 0) {
        setAvailableTimes(enabledTimes);
        // Se l'orario corrente non è disponibile, seleziona il primo disponibile
        if (!enabledTimes.includes(time)) {
          setTime(enabledTimes[0]);
        }
      } else {
        setAvailableTimes(DEFAULT_TIMES);
      }
    } catch (error) {
      console.error('Error loading available times:', error);
      setAvailableTimes(DEFAULT_TIMES);
    }
  };

  const showDatePicker = () => {
    if (Platform.OS === 'ios') {
      setDatePickerVisible(true);
    } else {
      setShowAndroidDatePicker(true);
    }
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowAndroidDatePicker(false);
    }
    
    if (selectedDate) {
      setDate(selectedDate);
      if (Platform.OS === 'ios') {
        setDatePickerVisible(false);
      }
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      loadAvailableTimes(dateString);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      Alert.alert('Errore', 'Compila tutti i campi obbligatori');
      return;
    }

    if (parseInt(seats) < 1 || parseInt(seats) > 20) {
      Alert.alert('Errore', 'Il numero di posti deve essere tra 1 e 20');
      return;
    }

    try {
      setLoading(true);
      
      const updatedData: Partial<Reservation> = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        date: format(date, 'yyyy-MM-dd'),
        time,
        seats: parseInt(seats),
        specialRequests: specialRequests.trim(),
      };

      await onSave(updatedData);
      onClose();
    } catch (error: any) {
      console.error('Error updating reservation:', error);
      Alert.alert(
        'Errore', 
        error.message || 'Errore durante l\'aggiornamento della prenotazione'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setDate(new Date());
    setTime('19:00');
    setSeats('2');
    setSpecialRequests('');
    setAvailableTimes(DEFAULT_TIMES);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!reservation) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelButton}>Annulla</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Modifica Prenotazione</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[
              styles.saveButton, 
              loading && styles.disabledButton
            ]}>
              {loading ? 'Salvataggio...' : 'Salva'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.label}>Nome completo *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Inserisci il nome completo"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Telefono *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Inserisci il numero di telefono"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Inserisci l'indirizzo email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Data</Text>
            <TouchableOpacity style={styles.dateButton} onPress={showDatePicker}>
              <Text style={styles.dateButtonText}>
                {format(date, 'dd/MM/yyyy')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Orario</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={time}
                onValueChange={setTime}
                style={styles.picker}
              >
                {availableTimes.map(timeSlot => (
                  <Picker.Item
                    key={timeSlot}
                    label={timeSlot}
                    value={timeSlot}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Numero persone *</Text>
            <TextInput
              style={styles.input}
              value={seats}
              onChangeText={setSeats}
              placeholder="Inserisci il numero di persone"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Richieste speciali</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={specialRequests}
              onChangeText={setSpecialRequests}
              placeholder="Inserisci eventuali richieste speciali"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
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
                  value={date}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  textColor="#000000"
                  accentColor="#2962ff"
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={hideDatePicker}
                  >
                    <Text style={styles.modalButtonText}>Annulla</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalConfirmButton]}
                    onPress={hideDatePicker}
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
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f8',
    marginBottom: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#191919',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2962ff',
  },
  disabledButton: {
    color: '#ccc',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191919',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    paddingTop: 14,
  },
  dateButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e8f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
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
  modalCancelButton: {
    backgroundColor: '#f0f4f8',
  },
  modalConfirmButton: {
    backgroundColor: '#2962ff',
  },
  modalButtonText: {
    fontWeight: 'bold',
    color: '#333',
  },
});

export default EditReservationModal; 