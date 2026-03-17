import { google } from 'googleapis';

export function getGoogleOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_PEOPLE_CLIENT_ID,
    process.env.GOOGLE_PEOPLE_CLIENT_SECRET,
    process.env.GOOGLE_PEOPLE_REDIRECT_URI
  );
}

export function getGoogleAuthUrl() {
  const client = getGoogleOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/contacts.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'consent', // Refresh token alabilmek için
  });
}
