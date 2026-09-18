import { RsvpSubmission } from '../types';

export interface SpreadsheetInfo {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

const DEFAULT_SHEET_TITLE = 'Confirmaciones Boda - Bricia & Alan';
const SHEET_TAB_NAME = 'Confirmaciones';

export const findOrCreateWeddingSpreadsheet = async (
  accessToken: string,
  title: string = DEFAULT_SHEET_TITLE
): Promise<SpreadsheetInfo> => {
  try {
    // 1. Check if spreadsheet already exists in user's Drive
    const query = encodeURIComponent(
      `name = '${title}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
    );
    const driveSearchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (driveSearchRes.ok) {
      const searchData = await driveSearchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        const existing = searchData.files[0];
        return {
          spreadsheetId: existing.id,
          spreadsheetUrl: existing.webViewLink || `https://docs.google.com/spreadsheets/d/${existing.id}/edit`,
          title: existing.name,
        };
      }
    }

    // 2. Create new spreadsheet if not found
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title,
        },
        sheets: [
          {
            properties: {
              title: SHEET_TAB_NAME,
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      }),
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      throw new Error(`Error al crear la hoja en Google Drive: ${errorText}`);
    }

    const createdSheet = await createRes.json();
    const spreadsheetId = createdSheet.spreadsheetId;
    const spreadsheetUrl =
      createdSheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // 3. Add header row
    const headers = [
      'Fecha y Hora',
      'Nombre Completo',
      '¿Asiste?',
      'Total Asistentes',
      'Pases Asignados',
      'Acompañantes',
      'Alergias / Restricciones',
      'Detalles de Alergias',
      'Mensaje a los Novios',
    ];

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_TAB_NAME}!A1:I1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `${SHEET_TAB_NAME}!A1:I1`,
          majorDimension: 'ROWS',
          values: [headers],
        }),
      }
    );

    // 4. Style header row with elegant gold background and bold text
    try {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: 9,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 0.76,
                      green: 0.62,
                      blue: 0.36, // Elegant warm gold
                    },
                    textFormat: {
                      foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                      bold: true,
                      fontSize: 11,
                    },
                    horizontalAlignment: 'CENTER',
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
              },
            },
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: 0,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: 9,
                },
              },
            },
          ],
        }),
      });
    } catch (e) {
      console.warn('Opcional: no se pudo aplicar formato estético a cabeceras de sheets', e);
    }

    return {
      spreadsheetId,
      spreadsheetUrl,
      title,
    };
  } catch (error) {
    console.error('Error in findOrCreateWeddingSpreadsheet:', error);
    throw error;
  }
};

export const appendRsvpToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  rsvp: RsvpSubmission
): Promise<boolean> => {
  try {
    const row = [
      rsvp.timestamp,
      rsvp.fullName,
      rsvp.attending === 'yes' ? 'SÍ' : 'NO',
      rsvp.attending === 'yes' ? rsvp.guestCount : 0,
      rsvp.maxGuestsAllocated,
      rsvp.companionNames.length > 0 ? rsvp.companionNames.join(', ') : 'Ninguno',
      rsvp.dietaryRestrictions.length > 0 ? rsvp.dietaryRestrictions.join(', ') : 'Ninguna',
      rsvp.dietaryDetails || '-',
      rsvp.message || '-',
    ];

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_TAB_NAME}!A:I:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `${SHEET_TAB_NAME}!A:I`,
          majorDimension: 'ROWS',
          values: [row],
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Error al agregar fila en Google Sheets: ${err}`);
    }

    return true;
  } catch (error) {
    console.error('Error in appendRsvpToSheet:', error);
    throw error;
  }
};

export const fetchSheetRows = async (
  accessToken: string,
  spreadsheetId: string
): Promise<string[][]> => {
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${SHEET_TAB_NAME}!A2:I`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.values || [];
  } catch (error) {
    console.error('Error in fetchSheetRows:', error);
    return [];
  }
};
