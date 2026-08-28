export const environment = {
  production: true,
  apiUrl: 'https://backend-production-7080.up.railway.app/api/v1',
  // Stripe LIVE publishable key - real card payments. Safe to embed
  // client-side (this key can only create charges, never read/move money
  // on its own - the secret key that can is server-side only, in Railway).
  stripePublishableKey: 'pk_live_51U956kCl3rPgITBYlGT3PHIrZ86gSg1vlMaKfNQUN9jorJ44uBaFTkQQnKwlkGzg2WXdI33tTPfia0H30XwrdrDL00tisVRiHT',
};
