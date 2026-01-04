import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
// We need a REFRESH TOKEN to stay logged in continuously.
// Initially, we will use a manual process or a one-time route to get this.
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN; 

export const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

if (REFRESH_TOKEN) {
    oauth2Client.setCredentials({
        refresh_token: REFRESH_TOKEN
    });
}

export const youtube = google.youtube({
  version: 'v3',
  auth: oauth2Client,
});

export const SCOPES = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly' 
];

// Function to generate Auth URL
export const getAuthUrl = () => {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline', // Critical for getting refresh token
        scope: SCOPES,
        prompt: 'consent' // Forces refresh token generation
    });
};
