# Fermento App Mobile - Gestione Prenotazioni

App mobile React Native per la gestione delle prenotazioni del ristorante Fermento.

## 🚀 Migrazione Completata

L'app è stata completamente migrata da Firebase client SDK al backend API centralizzato.

### ✅ Cosa è stato fatto:

- ❌ **Rimosso Firebase client SDK** (`firebase`)
- ❌ **Rimosso EmailJS** (`@emailjs/react-native`)
- ✅ **Aggiunto servizio API** (`ApiService.ts`)
- ✅ **Nuovo servizio prenotazioni** (`ReservationServiceAPI.ts`)
- ✅ **Configurazione ambiente** (`environment.ts`)
- ✅ **UI migliorata** con indicatori di connessione
- ✅ **Gestione errori** robusta
- ✅ **Refresh pull-to-refresh**

### 📱 Funzionalità

- **Gestione prenotazioni**: visualizza, accetta, rifiuta, modifica, elimina
- **Gestione turni**: abilita/disabilita orari per data specifica
- **Real-time updates**: polling automatico ogni 30 secondi
- **Notifiche push**: per nuove prenotazioni
- **Offline handling**: indicatori di stato connessione
- **Date picker**: selezione date con scorciatoie rapide

### 🛠 Tecnologie

- **React Native** con Expo
- **TypeScript**
- **React Navigation** per la navigazione
- **date-fns** per gestione date
- **Expo Notifications** per push notifications
- **REST API** comunicazione con backend

### 🔧 Configurazione

1. **Installa dipendenze**:
   ```bash
   npm install
   ```

2. **Configura ambiente** in `src/config/environment.ts`:
   ```typescript
   export const API_CONFIG = {
     development: {
       baseURL: 'http://localhost:3001/api', // Il tuo backend locale
       timeout: 10000,
     },
     production: {
       baseURL: 'https://api.fermentocefalu.it/api', // Il tuo dominio
       timeout: 15000,
     }
   };
   ```

3. **Avvia l'app**:
   ```bash
   npm start
   ```

### 📡 API Backend

L'app comunica con il backend Node.js tramite REST API:

- `GET /api/reservations` - Lista prenotazioni
- `POST /api/reservations` - Crea prenotazione
- `PUT /api/reservations/:id` - Aggiorna prenotazione
- `DELETE /api/reservations/:id` - Elimina prenotazione
- `POST /api/reservations/:id/accept` - Accetta prenotazione
- `POST /api/reservations/:id/reject` - Rifiuta prenotazione
- `GET /api/shifts/:date` - Turni per data
- `PUT /api/shifts/:date/:time` - Aggiorna turno

### 🔄 Real-time Updates

L'app utilizza polling ogni 30 secondi per aggiornamenti real-time. Per implementazioni future si può considerare:

- **WebSockets** per aggiornamenti istantanei
- **Server-Sent Events** (già supportato dal backend)
- **Push notifications** per aggiornamenti critici

### 📱 Build e Deploy

1. **Build per Android**:
   ```bash
   npm run android
   ```

2. **Build per iOS**:
   ```bash
   npm run ios
   ```

3. **Build per produzione** (con EAS):
   ```bash
   eas build --platform all
   ```

### 🗂 Struttura File

```
src/
├── components/          # Componenti riusabili
├── config/             # Configurazione ambiente
├── navigation/         # Navigazione app
├── screens/           # Schermate principali
├── services/          # Servizi API
├── types/            # TypeScript types
└── App.tsx           # App principale
```

### 🔧 Dipendenze Principali

- `@react-navigation/*` - Navigazione
- `expo-notifications` - Notifiche push
- `date-fns` - Gestione date
- `react-native-modal-datetime-picker` - Date picker
- `react-native-toast-message` - Toast notifications

### 🚨 Note Importanti

- **Backend richiesto**: L'app richiede il backend Node.js attivo
- **Connessione internet**: Necessaria per tutte le operazioni
- **Notifiche**: Configurate per dispositivi fisici (non simulatore)
- **Permessi**: Richiesti per notifiche push

### 🐛 Troubleshooting

1. **Errore connessione API**:
   - Verifica che il backend sia attivo
   - Controlla l'URL in `environment.ts`
   - Verifica la connessione internet

2. **Notifiche non funzionano**:
   - Testa su dispositivo fisico
   - Verifica permessi notifiche
   - Controlla configurazione Expo

3. **Date picker non funziona**:
   - Installa `react-native-modal-datetime-picker`
   - Su Android potrebbe servire configurazione aggiuntiva

### 📞 Supporto

Per problemi o domande:
- Controlla i log del backend
- Verifica la connessione di rete
- Controlla la console React Native per errori
