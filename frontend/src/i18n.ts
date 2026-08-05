import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: { translation: {
    nav: { home: 'Home', games: 'Games', tracking: 'Track Order', blog: 'News & Guides', support: 'Support & FAQ', login: 'Sign In', register: 'Sign Up', profile: 'Account Dashboard', admin: 'Admin Portal', logout: 'Log Out' },
    hero: { title: 'INSTANT GAME TOP-UP', subtitle: 'Fast, reliable and secure game top-ups in Cambodia', searchPlaceholder: 'Search Mobile Legends, Free Fire, Valorant...', popularGames: 'Popular Games', flashSale: 'Flash Sale Deals' },
    game: { selectPackage: '1. Select Top-Up Package', enterAccount: '2. Enter Player Credentials', selectPayment: '3. Select Payment Gateway', summary: 'Order Summary', payNow: 'Proceed to Payment', discount: 'Discount' },
    order: { trackTitle: 'Order Fulfillment Status', orderNumber: 'Order #', paymentStatus: 'Payment Status', providerStatus: 'Top-up Status', completed: 'Completed & Delivered', processing: 'Fulfilling Top-Up...', pending: 'Awaiting Payment', failed: 'Transaction Failed' },
    customer: { gameCatalog: 'Game Catalog', popularGames: 'Popular Games', chooseGame: 'Choose a game and top up in a few simple steps.', searchGames: 'Search games', allGames: 'All Games', noGames: 'No games match your search', clearFilters: 'Clear filters', catalogueUnavailable: 'Catalogue updates are temporarily unavailable. The preview below cannot be purchased.', backToGames: 'Back to Games', gameUnavailable: 'This game is currently unavailable for purchase.', enterPlayer: 'Enter Player Information', selectPackage: 'Select a top-up package', paymentConfirmation: 'Payment & Confirmation', loading: 'Loading…', tracking: 'Track your order', profile: 'Profile and order history', empty: 'Nothing to show yet.' }
  } },
  km: { translation: {
    nav: { home: 'ទំព័រដើម', games: 'ហ្គេម', tracking: 'តាមដានបញ្ជាទិញ', blog: 'ព័ត៌មាន និងការណែនាំ', support: 'ជំនួយ និងសំណួរញឹកញាប់', login: 'ចូលគណនី', register: 'ចុះឈ្មោះ', profile: 'គណនីរបស់ខ្ញុំ', admin: 'គ្រប់គ្រង', logout: 'ចាកចេញ' },
    hero: { title: 'បញ្ចូលទឹកប្រាក់ហ្គេមភ្លាមៗ', subtitle: 'សេវាបញ្ចូលទឹកប្រាក់ហ្គេមលឿន សុវត្ថិភាព និងគួរឱ្យទុកចិត្តនៅកម្ពុជា', searchPlaceholder: 'ស្វែងរក Mobile Legends, Free Fire, Valorant...', popularGames: 'ហ្គេមពេញនិយម', flashSale: 'ការបញ្ចុះតម្លៃពិសេស' },
    game: { selectPackage: '១. ជ្រើសរើសកញ្ចប់បញ្ចូលទឹកប្រាក់', enterAccount: '២. បញ្ចូលព័ត៌មានអ្នកលេង', selectPayment: '៣. ជ្រើសរើសវិធីទូទាត់', summary: 'សង្ខេបការបញ្ជាទិញ', payNow: 'បន្តទៅការទូទាត់', discount: 'បញ្ចុះតម្លៃ' },
    order: { trackTitle: 'ស្ថានភាពការបញ្ជាទិញ', orderNumber: 'លេខបញ្ជាទិញ #', paymentStatus: 'ស្ថានភាពការទូទាត់', providerStatus: 'ស្ថានភាពបញ្ចូលទឹកប្រាក់', completed: 'បានបញ្ចប់ និងប្រគល់រួច', processing: 'កំពុងបញ្ចូលទឹកប្រាក់…', pending: 'កំពុងរង់ចាំការទូទាត់', failed: 'ប្រតិបត្តិការបរាជ័យ' },
    customer: { gameCatalog: 'បញ្ជីហ្គេម', popularGames: 'ហ្គេមពេញនិយម', chooseGame: 'ជ្រើសរើសហ្គេម ហើយបញ្ចូលទឹកប្រាក់តាមជំហានងាយៗ។', searchGames: 'ស្វែងរកហ្គេម', allGames: 'ហ្គេមទាំងអស់', noGames: 'រកមិនឃើញហ្គេមដែលត្រូវគ្នា', clearFilters: 'សម្អាតតម្រង', catalogueUnavailable: 'បញ្ជីហ្គេមមិនអាចផ្ទុកបានបណ្តោះអាសន្ន។ ទិន្នន័យខាងក្រោមគ្រាន់តែសម្រាប់មើលប៉ុណ្ណោះ។', backToGames: 'ត្រឡប់ទៅហ្គេម', gameUnavailable: 'ហ្គេមនេះមិនអាចទិញបាននៅពេលនេះទេ។', enterPlayer: 'បញ្ចូលព័ត៌មានអ្នកលេង', selectPackage: 'ជ្រើសរើសកញ្ចប់បញ្ចូលទឹកប្រាក់', paymentConfirmation: 'ការទូទាត់ និងការបញ្ជាក់', loading: 'កំពុងផ្ទុក…', tracking: 'តាមដានការបញ្ជាទិញ', profile: 'ប្រវត្តិរូប និងប្រវត្តិបញ្ជាទិញ', empty: 'មិនទាន់មានទិន្នន័យសម្រាប់បង្ហាញទេ។' }
  } }
};

i18n.use(LanguageDetector).use(initReactI18next).init({ resources, fallbackLng: 'en', interpolation: { escapeValue: false } });

export default i18n;
