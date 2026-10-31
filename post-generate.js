import fs from 'fs';

const HTTP_CLIENT_FILE = 'src/__generated__/http-client.ts';
const GENERATED_SERVER_FILE = 'src/__generated__/server.ts';
const HANDLERS_FILE = 'src/__generated__/handlers.ts';
// Orval imports a body type for the octet-stream upload endpoint that it never generates
const UNUSED_HANDLER_IMPORT = 'UploadAttachmentFileBody';
const CUSTOM_FETCH_IMPORT = 'import { customFetch as fetch } from "../api/custom-fetch";';

function addCustomFetchImport() {
  if (!fs.existsSync(HTTP_CLIENT_FILE)) {
    console.log(`File ${HTTP_CLIENT_FILE} not found`);
    return;
  }

  const content = fs.readFileSync(HTTP_CLIENT_FILE, 'utf8');
  const lines = content.split('\n');
  
  // Check if import already exists
  if (lines.some(line => line.includes('import { customFetch as fetch }'))) {
    console.log('customFetch import already exists');
    return;
  }
  
  // Find the line with http-schemas import
  const importIndex = lines.findIndex(line => line.includes('} from \'./http-schemas\';'));
  
  if (importIndex === -1) {
    console.log('Could not find http-schemas import line');
    return;
  }
  
  // Insert the customFetch import after the http-schemas import
  lines.splice(importIndex + 1, 0, CUSTOM_FETCH_IMPORT);
  
  fs.writeFileSync(HTTP_CLIENT_FILE, lines.join('\n'));
  console.log('Added customFetch import to http-client.ts');
}

function removeUnusedHandlerImport() {
  if (!fs.existsSync(HANDLERS_FILE)) {
    console.log(`File ${HANDLERS_FILE} not found`);
    return;
  }

  const content = fs.readFileSync(HANDLERS_FILE, 'utf8');
  const lines = content.split('\n');

  // Only remove it when the import is the sole reference
  const occurrences = content.split(UNUSED_HANDLER_IMPORT).length - 1;
  const importIndex = lines.findIndex(line => line.trim() === `${UNUSED_HANDLER_IMPORT},`);
  if (occurrences !== 1 || importIndex === -1) {
    console.log(`${UNUSED_HANDLER_IMPORT} import not removed (occurrences: ${occurrences})`);
    return;
  }

  lines.splice(importIndex, 1);

  fs.writeFileSync(HANDLERS_FILE, lines.join('\n'));
  console.log(`Removed unused ${UNUSED_HANDLER_IMPORT} import from handlers.ts`);
}

function removeGeneratedServer() {
  if (fs.existsSync(GENERATED_SERVER_FILE)) {
    fs.unlinkSync(GENERATED_SERVER_FILE);
    console.log('Removed generated server.ts file');
  }
}

addCustomFetchImport();
removeUnusedHandlerImport();
removeGeneratedServer();