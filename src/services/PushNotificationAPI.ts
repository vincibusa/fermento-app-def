import ApiService from './ApiService';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

export interface PushTokenRegistration {
  token: string;
  deviceId: string;
  platform: 'ios' | 'android';
  userId?: string;
}

export interface PushTokenResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface PushTokensResponse {
  success: boolean;
  data?: {
    tokens: Array<{
      deviceId: string;
      platform: string;
      userId?: string;
      createdAt: string;
      lastUsed: string;
    }>;
    total: number;
  };
  error?: string;
}

class PushNotificationAPI {
  
  /**
   * Registra un token push nel backend
   */
  async registerPushToken(token: string, userId?: string): Promise<PushTokenResponse> {
    try {
      console.log('📱 Registering push token with backend...');
      
      // Genera un device ID unico
      const deviceId = Device.deviceName || 
                      Device.modelName || 
                      Device.osName + '_' + Device.osVersion ||
                      'unknown_device_' + Date.now();

      const platform = Platform.OS as 'ios' | 'android';

      const registrationData: PushTokenRegistration = {
        token,
        deviceId,
        platform,
        userId
      };

      const response = await ApiService.registerPushToken(registrationData);

      if (response.success) {
        console.log('✅ Push token registered successfully');
        return {
          success: true,
          message: 'Token push registrato con successo'
        };
      } else {
        console.error('❌ Failed to register push token:', response.error);
        return {
          success: false,
          error: response.error || 'Errore durante la registrazione'
        };
      }
    } catch (error) {
      console.error('❌ Error registering push token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore di rete'
      };
    }
  }

  /**
   * Rimuove un token push dal backend
   */
  async unregisterPushToken(): Promise<PushTokenResponse> {
    try {
      console.log('📱 Unregistering push token from backend...');
      
      const deviceId = Device.deviceName || 
                      Device.modelName || 
                      Device.osName + '_' + Device.osVersion ||
                      'unknown_device_' + Date.now();

      const response = await ApiService.unregisterPushToken(deviceId);

      if (response.success) {
        console.log('✅ Push token unregistered successfully');
        return {
          success: true,
          message: 'Token push rimosso con successo'
        };
      } else {
        console.error('❌ Failed to unregister push token:', response.error);
        return {
          success: false,
          error: response.error || 'Errore durante la rimozione'
        };
      }
    } catch (error) {
      console.error('❌ Error unregistering push token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore di rete'
      };
    }
  }

  /**
   * Recupera tutti i token push attivi (solo per admin/debug)
   */
  async getActivePushTokens(): Promise<PushTokensResponse> {
    try {
      console.log('📱 Getting active push tokens...');
      
      const response = await ApiService.getActivePushTokens();

      if (response.success && response.data) {
        console.log(`✅ Retrieved ${response.data.total} active push tokens`);
        return {
          success: true,
          data: response.data
        };
      } else {
        console.error('❌ Failed to get push tokens:', response.error);
        return {
          success: false,
          error: response.error || 'Errore durante il recupero'
        };
      }
    } catch (error) {
      console.error('❌ Error getting push tokens:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore di rete'
      };
    }
  }

  /**
   * Invia una notifica push di test
   */
  async sendTestNotification(title: string, body: string, deviceId?: string): Promise<PushTokenResponse> {
    try {
      console.log('📱 Sending test push notification...');
      
      const testData = {
        title,
        body,
        deviceId
      };

      const response = await ApiService.sendTestNotification(testData);

      if (response.success) {
        console.log('✅ Test notification sent successfully');
        return {
          success: true,
          message: `Notifica inviata: ${response.data?.successful}/${response.data?.total} dispositivi`
        };
      } else {
        console.error('❌ Failed to send test notification:', response.error);
        return {
          success: false,
          error: response.error || 'Errore durante l\'invio'
        };
      }
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore di rete'
      };
    }
  }
}

export default new PushNotificationAPI(); 