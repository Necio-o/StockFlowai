// Type definitions for Google API global variables
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const initGapi = async (apiKey: string, clientId: string) => {
  return new Promise<void>((resolve, reject) => {
    if (!window.gapi) {
      reject("Google API Script not loaded");
      return;
    }

    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey: apiKey,
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
};

export const initGis = (clientId: string) => {
  return new Promise<void>((resolve, reject) => {
    if (!window.google) {
      reject("Google Identity Services Script not loaded");
      return;
    }

    try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: '', // defined later
      });
      gisInited = true;
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

export const handleAuthClick = async () => {
  return new Promise<void>((resolve, reject) => {
    if (!tokenClient) {
      reject("Token Client not initialized");
      return;
    }

    tokenClient.callback = async (resp: any) => {
      if (resp.error !== undefined) {
        reject(resp);
      }
      resolve();
    };

    if (window.gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

export const signOut = () => {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken('');
  }
};

export const uploadToDrive = async (fileName: string, content: object) => {
  if (!gapiInited || !gisInited) throw new Error("Google APIs not initialized");

  const fileContent = JSON.stringify(content, null, 2);
  
  const file = new Blob([fileContent], { type: 'application/json' });
  
  const metadata = {
    'name': fileName,
    'mimeType': 'application/json',
  };

  const accessToken = window.gapi.client.getToken().access_token;
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return await response.json();
};