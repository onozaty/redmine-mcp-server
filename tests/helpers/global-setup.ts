import fs from "fs";
import { SERVER_PATH } from "./mcp";

// Tests run the built server, so make a missing build an explicit failure
export default function setup() {
  if (!fs.existsSync(SERVER_PATH)) {
    throw new Error(`${SERVER_PATH} not found. Run "pnpm build" before the tests.`);
  }
}
