// config.js - التهيئة الموحدة لقاعدة البيانات
const SB_URL = 'https://fwyacpvbhwdlivzeiper.supabase.co';
const SB_KEY = 'sb_publishable_6xYRIb6tT-Na8wvnDoGMsQ_EeMfQzdz';

window.supabaseClient = (window.supabase && typeof window.supabase.createClient === 'function')
  ? window.supabase.createClient(SB_URL, SB_KEY)
  : null;

const db = window.supabaseClient;
