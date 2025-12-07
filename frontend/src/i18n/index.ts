import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      welcome: 'Welcome',
      chat: 'Chat',
      guide: 'Guide',
      askQuestion: 'Ask a question...',
      send: 'Send',
      wifi: 'WiFi',
      checkIn: 'Check-in',
      checkOut: 'Check-out',
      breakfast: 'Breakfast',
      emergency: 'Emergency',
      loading: 'Loading...',
      error: 'Error',
      tryAgain: 'Try Again',
      login: 'Login',
      email: 'Email',
      password: 'Password',
      dashboard: 'Dashboard',
      faqs: 'FAQs',
      documents: 'Documents',
      analytics: 'Analytics',
      settings: 'Settings',
      logout: 'Logout',
    },
  },
  es: {
    translation: {
      welcome: 'Bienvenido',
      chat: 'Chat',
      guide: 'Guía',
      askQuestion: 'Haz una pregunta...',
      send: 'Enviar',
      wifi: 'WiFi',
      checkIn: 'Check-in',
      checkOut: 'Check-out',
      breakfast: 'Desayuno',
      emergency: 'Emergencia',
      loading: 'Cargando...',
      error: 'Error',
      tryAgain: 'Intentar de nuevo',
      login: 'Iniciar sesión',
      email: 'Correo electrónico',
      password: 'Contraseña',
      dashboard: 'Panel',
      faqs: 'Preguntas frecuentes',
      documents: 'Documentos',
      analytics: 'Analíticas',
      settings: 'Configuración',
      logout: 'Cerrar sesión',
    },
  },
  fr: {
    translation: {
      welcome: 'Bienvenue',
      chat: 'Chat',
      guide: 'Guide',
      askQuestion: 'Posez une question...',
      send: 'Envoyer',
      wifi: 'WiFi',
      checkIn: 'Enregistrement',
      checkOut: 'Départ',
      breakfast: 'Petit-déjeuner',
      emergency: 'Urgence',
      loading: 'Chargement...',
      error: 'Erreur',
      tryAgain: 'Réessayer',
      login: 'Connexion',
      email: 'Email',
      password: 'Mot de passe',
      dashboard: 'Tableau de bord',
      faqs: 'FAQ',
      documents: 'Documents',
      analytics: 'Analyses',
      settings: 'Paramètres',
      logout: 'Déconnexion',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

