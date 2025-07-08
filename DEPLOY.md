# 🚀 Deploy Fermento App su TestFlight

Questa guida ti accompagnerà nel processo di deploy dell'app Fermento su TestFlight per la distribuzione beta.

## 📋 Prerequisiti

### 1. Account Apple Developer
- Account Apple Developer attivo ($99/anno)
- Accesso ad **App Store Connect**
- **Xcode** installato (solo per alcune operazioni opzionali)

### 2. Strumenti necessari
- **Node.js** (v18 o superiore)
- **Expo CLI** e **EAS CLI** (installati automaticamente con `npm install`)
- **Git** configurato

### 3. Configurazione iniziale
- Account Expo configurato
- Progetto EAS associato (già configurato: `0326aea9-1b91-4b8c-85ea-4f75f0e12911`)

## 🛠 Setup Iniziale

### 1. Installa le dipendenze
```bash
cd fermento-app-def
npm install
```

### 2. Login in Expo/EAS
```bash
npx eas login
```

### 3. Verifica la configurazione del progetto
```bash
npx eas project:info
```

## 📱 Configurazione App Store Connect

### 1. Crea l'app in App Store Connect
1. Vai su [App Store Connect](https://appstoreconnect.apple.com)
2. Clicca su **"Le mie app"** → **"+"** → **"Nuova app"**
3. Compila le informazioni:
   - **Nome**: Fermento 2.0
   - **Lingua principale**: Italiano
   - **Bundle ID**: `com.fermento.app`
   - **SKU**: `fermento-app-2024` (o simile)

### 2. Aggiorna la configurazione EAS
Modifica `eas.json` con i tuoi dati reali:
```json
"submit": {
  "production": {
    "ios": {
      "appleId": "tua-email@esempio.com",
      "ascAppId": "1234567890",
      "appleTeamId": "ABCD123456"
    }
  }
}
```

**Come trovare questi valori:**
- **appleId**: La tua email Apple Developer
- **ascAppId**: ID app da App Store Connect → App → Informazioni generali
- **appleTeamId**: Membership → Team ID nella console developer

## 🏗 Build e Deploy

### 1. Build per TestFlight
```bash
# Build di produzione per iOS
npm run build:ios

# Oppure build completo (iOS + Android)
npm run build:all
```

### 2. Monitoraggio del build
- Il build verrà eseguito sui server Expo
- Puoi monitorare il progresso su [Expo Dashboard](https://expo.dev)
- Tempo stimato: 5-15 minuti

### 3. Submit a App Store Connect
```bash
# Carica automaticamente su App Store Connect
npm run submit:ios
```

### 4. Configurazione TestFlight
1. Vai su **App Store Connect** → **TestFlight**
2. Trova il build appena caricato
3. Aggiungi le **"Note sulla versione"**:
   ```
   Prima versione beta dell'app Fermento 2.0
   
   Funzionalità incluse:
   - Gestione prenotazioni in tempo reale
   - Modifica e cancellazione prenotazioni
   - Gestione turni per data
   - Notifiche push per nuove prenotazioni
   - Interfaccia moderna e intuitiva
   ```

### 5. Aggiungi tester interni
1. **TestFlight** → **Tester interni**
2. Clicca **"+"** per aggiungere tester
3. Inserisci gli indirizzi email dei tester
4. Seleziona il build da testare

### 6. (Opzionale) Aggiungi tester esterni
1. **TestFlight** → **Tester esterni**
2. Crea un nuovo gruppo di test
3. Aggiungi i tester esterni
4. **Nota**: Richiede approvazione Apple (1-2 giorni)

## 📝 Aggiornamenti successivi

### 1. Incrementa la versione
Modifica `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",  // Incrementa qui
    "ios": {
      "buildNumber": "2"  // Incrementa anche qui
    }
  }
}
```

### 2. Build e deploy dell'aggiornamento
```bash
npm run build:ios
npm run submit:ios
```

## 🔧 Troubleshooting

### Errori comuni

#### Build fallisce per dipendenze mancanti
```bash
npm install
npx expo install --fix
```

#### Errore di firma del codice
- Verifica che il **Bundle ID** sia unico
- Controlla che l'account Apple Developer sia attivo
- Verifica i permessi del team

#### Timeout durante l'upload
```bash
# Riprova l'upload
npx eas submit --platform ios --latest
```

#### App respinta da TestFlight
- Controlla le **Note di revisione** in App Store Connect
- Verifica che tutte le **Privacy Policy** siano configurate
- Assicurati che l'app non violi le linee guida Apple

### Log e debugging
```bash
# Visualizza i log dell'ultimo build
npx eas build:list --platform ios --status finished --limit 1

# Scarica i log di build
npx eas build:view [BUILD_ID]
```

## 📚 Risorse utili

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [TestFlight Beta Testing](https://developer.apple.com/testflight/)
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

## 🎉 Prossimi passi

Una volta che l'app è su TestFlight:

1. **Testa accuratamente** tutte le funzionalità
2. **Raccogli feedback** dai tester beta
3. **Correggi i bug** identificati
4. **Rilascia aggiornamenti** regolari
5. **Prepara il lancio** pubblico su App Store

---

**Importante**: Tieni sempre aggiornata questa documentazione con eventuali modifiche al processo di deploy! 