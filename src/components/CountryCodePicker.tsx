import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

interface CountryCodePickerProps {
  selectedCode: string;
  onSelect: (code: string) => void;
  placeholder?: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: '+39', country: 'Italia', flag: '🇮🇹' },
  { code: '+1', country: 'Stati Uniti', flag: '🇺🇸' },
  { code: '+44', country: 'Regno Unito', flag: '🇬🇧' },
  { code: '+33', country: 'Francia', flag: '🇫🇷' },
  { code: '+49', country: 'Germania', flag: '🇩🇪' },
  { code: '+34', country: 'Spagna', flag: '🇪🇸' },
  { code: '+41', country: 'Svizzera', flag: '🇨🇭' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+31', country: 'Paesi Bassi', flag: '🇳🇱' },
  { code: '+32', country: 'Belgio', flag: '🇧🇪' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+86', country: 'Cina', flag: '🇨🇳' },
  { code: '+81', country: 'Giappone', flag: '🇯🇵' },
  { code: '+82', country: 'Corea del Sud', flag: '🇰🇷' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+55', country: 'Brasile', flag: '🇧🇷' },
  { code: '+52', country: 'Messico', flag: '🇲🇽' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+64', country: 'Nuova Zelanda', flag: '🇳🇿' },
];

const CountryCodePicker: React.FC<CountryCodePickerProps> = ({
  selectedCode,
  onSelect,
  placeholder = 'Seleziona prefisso'
}) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const selectedCountry = COUNTRY_CODES.find(country => country.code === selectedCode);

  const filteredCountries = COUNTRY_CODES.filter(country =>
    country.country.toLowerCase().includes(searchText.toLowerCase()) ||
    country.code.includes(searchText)
  );

  const handleSelect = (code: string) => {
    onSelect(code);
    setModalVisible(false);
    setSearchText('');
  };

  const renderCountryItem = ({ item }: { item: CountryCode }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => handleSelect(item.code)}
    >
      <Text style={styles.flag}>{item.flag}</Text>
      <View style={styles.countryInfo}>
        <Text style={styles.countryName}>{item.country}</Text>
        <Text style={styles.countryCode}>{item.code}</Text>
      </View>
      {selectedCode === item.code && (
        <MaterialCommunityIcons name="check" size={20} color="#2962ff" />
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        {selectedCountry ? (
          <View style={styles.selectedCountry}>
            <Text style={styles.selectedFlag}>{selectedCountry.flag}</Text>
            <Text style={styles.selectedCode}>{selectedCountry.code}</Text>
          </View>
        ) : (
          <Text style={styles.placeholder}>{placeholder}</Text>
        )}
        <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleziona Prefisso</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                setSearchText('');
              }}
            >
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cerca paese o prefisso..."
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
            />
          </View>

          <FlatList
            data={filteredCountries}
            renderItem={renderCountryItem}
            keyExtractor={(item) => item.code}
            showsVerticalScrollIndicator={false}
            style={styles.countryList}
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    minWidth: 100,
  },
  selectedCountry: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedFlag: {
    fontSize: 18,
    marginRight: 8,
  },
  selectedCode: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  placeholder: {
    fontSize: 16,
    color: '#999',
  },
  modal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingLeft: 12,
    color: '#333',
  },
  countryList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  flag: {
    fontSize: 24,
    marginRight: 16,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  countryCode: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default CountryCodePicker; 