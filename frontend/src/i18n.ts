import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: { translation: {
    sign_in: 'Sign in',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    dashboard: 'Dashboard',
    welcome: 'Welcome, {{name}}',
    permissions: 'Permissions'
  }},
  ar: { translation: {
    sign_in: 'تسجيل الدخول',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    login: 'دخول',
    dashboard: 'لوحة التحكم',
    welcome: 'مرحباً، {{name}}',
    permissions: 'الصلاحيات'
  }}
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('lang') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  })

export default i18n
