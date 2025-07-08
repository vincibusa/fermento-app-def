import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import PushNotificationAPI from './PushNotificationAPI';

// Configura come le notifiche dovrebbero apparire quando l'app è in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => {
    console.log('Handling notification in foreground');
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    };
  },
});

// Configura il canale di notifica per Android
export async function setupNotificationChannels() {
  console.log('Setting up notification channels for platform:', Platform.OS);
  
  if (Platform.OS === 'android') {
    try {
      console.log('Creating Android notification channel');
      
      // Canale principale per tutte le notifiche
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notifiche Fermento',
        description: 'Ricevi aggiornamenti per le tue prenotazioni',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#e91e63',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
        sound: 'default',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
      
      console.log('Android notification channel created successfully');
    } catch (error) {
      console.error('Failed to create Android notification channel:', error);
    }
  }
}

// Richiedi i permessi per le notifiche
export async function requestNotificationPermissions() {
  console.log('Requesting notification permissions');
  
  if (!Device.isDevice) {
    Alert.alert('Notifiche non disponibili', 'Le notifiche richiedono un dispositivo fisico');
    console.log('Not a physical device, cannot request permissions');
    return false;
  }
  
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('Existing notification permission status:', existingStatus);
    
    let finalStatus = existingStatus;
    
    // Solo se i permessi non sono già stati concessi, richiedi nuovamente
    if (existingStatus !== 'granted') {
      console.log('Requesting permissions explicitly');
      
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
        android: {},
      });
      
      finalStatus = status;
      console.log('New permission status after request:', finalStatus);
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert(
        'Permessi richiesti',
        'Per ricevere notifiche è necessario concedere i permessi nelle impostazioni',
        [
          { text: 'Capito', style: 'cancel' }
        ]
      );
      console.log('Permission not granted after request');
      return false;
    }
    
    console.log('Notification permissions granted successfully');
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

// Registra per le notifiche push (usiamo questa per inizializzare tutto)
export async function registerForPushNotificationsAsync() {
  console.log('Starting push notification registration process');
  
  // Prima configura i canali
  await setupNotificationChannels();
  
  // Poi richiedi i permessi
  const hasPermissions = await requestNotificationPermissions();
  if (!hasPermissions) {
    console.log('Cannot register for push - missing permissions');
    return null;
  }
  
  // Ottieni il token push
  try {
    console.log('Getting Expo push token');
    
    // Prendi il project ID da app.json per Expo
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    // Se non c'è il projectId, usa la configurazione predefinita
    const pushTokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    const token = pushTokenResponse.data;
    console.log('Expo push token:', token);
    
    // Registra il token con il backend
    try {
      const registrationResult = await PushNotificationAPI.registerPushToken(token);
      if (registrationResult.success) {
        console.log('✅ Push token registered with backend successfully');
      } else {
        console.error('❌ Failed to register push token with backend:', registrationResult.error);
      }
    } catch (backendError) {
      console.error('❌ Error registering push token with backend:', backendError);
      // Non bloccare il processo se il backend non è raggiungibile
    }
    
    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

// Manda una notifica locale
export async function scheduleLocalNotification(title: string, body: string) {
  console.log(`Scheduling local notification - Title: "${title}", Body: "${body}"`);
  
  try {
    // Assicura che i canali e i permessi siano configurati
    await setupNotificationChannels();
    const hasPermissions = await requestNotificationPermissions();
    
    if (!hasPermissions) {
      console.log('Cannot send notification - missing permissions');
      return null;
    }
    
    // Android: assicura che il canale sia specificato
    const notificationContent: Notifications.NotificationContentInput = {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      badge: 1,
      autoDismiss: true,
      sticky: false,
      data: { 
        type: 'local-notification',
        createdAt: new Date().toISOString() 
      },
    };
    
    // Aggiungi il channelId su Android
    if (Platform.OS === 'android') {
      // @ts-ignore - channelId è supportato su Android ma non definito nel tipo
      notificationContent.channelId = 'default';
    }
    
    console.log('Sending notification with content:', JSON.stringify(notificationContent));
    
    // Schedula la notifica (trigger null = immediata)
    const identifier = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null,
    });
    
    console.log('Notification scheduled successfully with ID:', identifier);
    
    // Test aggiuntivo: verifica che la notifica sia stata schedulata
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('Currently scheduled notifications:', scheduledNotifications.length);
    
    return identifier;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
} 