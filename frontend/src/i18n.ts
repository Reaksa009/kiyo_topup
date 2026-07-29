import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      nav: {
        home: 'Home',
        games: 'Games',
        tracking: 'Track Order',
        blog: 'News & Guides',
        support: 'Support & FAQ',
        login: 'Sign In',
        register: 'Sign Up',
        profile: 'Account Dashboard',
        admin: 'Admin Portal',
        logout: 'Log Out'
      },
      hero: {
        title: 'INSTANT GAME TOP-UP',
        subtitle: 'Fastest, Most Reliable & Secure Automated Top-Up Platform in Cambodia',
        searchPlaceholder: 'Search Mobile Legends, Free Fire, Valorant...',
        popularGames: 'Popular Games',
        flashSale: 'Flash Sale Deals'
      },
      game: {
        selectPackage: '1. Select Top-Up Package',
        enterAccount: '2. Enter Player Credentials',
        selectPayment: '3. Select Payment Gateway',
        summary: 'Order Summary',
        payNow: 'Proceed to Payment',
        discount: 'Discount'
      },
      order: {
        trackTitle: 'Order Fulfillment Status',
        orderNumber: 'Order #',
        paymentStatus: 'Payment Status',
        providerStatus: 'Provider Top-Up Status',
        completed: 'Completed & Delivered',
        processing: 'Fulfilling Top-Up...',
        pending: 'Awaiting Payment',
        failed: 'Transaction Failed'
      }
    }
  },
  km: {
    translation: {
      nav: {
        home: 'ទំព័រដើម',
        games: 'ហ្គេមទាំងអស់',
        tracking: 'តាមដានការបញ្ជាទិញ',
        blog: 'ព័ត៌មាន និងការណែនាំ',
        support: 'ជំនួយ និងសំណួរញឹកញាប់',
        login: 'ចូលគណនី',
        register: 'ចុះឈ្មោះ',
        profile: 'ផ្ទាំងគ្រប់គ្រង',
        admin: 'គ្រប់គ្រងប្រព័ន្ធ',
        logout: 'ចាកចេញ'
      },
      hero: {
        title: 'សេវាបញ្ចូលលុយហ្គេមរហ័សទាន់ចិត្ត',
        subtitle: 'វេទិកាបញ្ចូលលុយហ្គេមស្វ័យប្រវត្តិកំពូលគេនៅកម្ពុជា រហ័ស និងសុវត្ថិភាពខ្ពស់',
        searchPlaceholder: 'ស្វែងរកហ្គេម Mobile Legends, Free Fire, Valorant...',
        popularGames: 'ហ្គេមពេញនិយម',
        flashSale: 'ការបញ្ចុះតម្លៃពិសេស'
      },
      game: {
        selectPackage: '១. ជ្រើសរើសកញ្ចប់បញ្ចូលលុយ',
        enterAccount: '២. បញ្ចូលព័ត៌មានគណនីហ្គេម',
        selectPayment: '៣. ជ្រើសរើសវិធីសាស្ត្រទូទាត់',
        summary: 'សង្ខេបការបញ្ជាទិញ',
        payNow: 'បន្តទៅការទូទាត់ប្រាក់',
        discount: 'បញ្ចុះតម្លៃ'
      },
      order: {
        trackTitle: 'ស្ថានភាពដំណើរការបញ្ជាទិញ',
        orderNumber: 'លេខបញ្ជាទិញ #',
        paymentStatus: 'ស្ថានភាពទូទាត់',
        providerStatus: 'ស្ថានភាពបញ្ចូលលុយ',
        completed: 'ជោគជ័យ និងបានប្រគល់រួចរាល់',
        processing: 'កំពុងដំណើរការបញ្ចូល...',
        pending: 'រង់ចាំការទូទាត់ប្រាក់',
        failed: 'បរាជ័យ'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
