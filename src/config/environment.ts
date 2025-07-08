// Configurazione dell'ambiente per l'app mobile
export const API_CONFIG = {
  development: {
    baseURL: 'https://fermento-backend--fermento-pizzeria.europe-west4.hosted.app/api',
    timeout: 10000,
  },
  production: {
    baseURL: 'https://fermento-backend--fermento-pizzeria.europe-west4.hosted.app/api', // Cambia con il tuo dominio
    timeout: 15000,
  },
  staging: {
    baseURL: 'https://fermento-backend--fermento-pizzeria.europe-west4.hosted.app/api',
    timeout: 12000,
  }
};

// Determina l'ambiente corrente
const getEnvironment = (): keyof typeof API_CONFIG => {
  // In un'app React Native, puoi usare __DEV__ per development
  if (__DEV__) {
    return 'development';
  }
  
  // Puoi aggiungere logica per determinare staging vs production
  // basata su variabili d'ambiente o altri fattori
  return 'production';
};

export const currentConfig = API_CONFIG[getEnvironment()];

// Configurazione del ristorante
export const RESTAURANT_CONFIG = {
  name: 'Fermento 2.0',
  phone: '+39 0921 421788',
  email: 'info@fermentocefalu.it',
  address: 'Via Esempio 123, Cefalù (PA)',
};

export default currentConfig; 