import { google } from "googleapis";

function getCredentials() {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !privateKey) {
    throw new Error("Missing GOOGLE_SHEETS_CLIENT_EMAIL or GOOGLE_SHEETS_PRIVATE_KEY");
  }
  return { client_email: email, private_key: privateKey };
}

export async function fetchSheetRows(
  spreadsheetId: string,
  sheetName: string
): Promise<string[][]> {
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const range = `'${sheetName.replace(/'/g, "''")}'`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return (res.data.values as string[][]) ?? [];
}
