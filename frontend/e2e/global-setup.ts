import { setPrivacyStatus } from "./db";

export default async function globalSetup() {
  await setPrivacyStatus("published");
}
