import * as migration_20261014_111832_initial from './20261014_111832_initial';
import * as migration_20261014_164403_lead_notification_email from './20261014_164403_lead_notification_email';
import * as migration_20261014_173923_audit_doc_ids_text from './20261014_173923_audit_doc_ids_text';

export const migrations = [
  {
    up: migration_20261014_111832_initial.up,
    down: migration_20261014_111832_initial.down,
    name: '20261014_111832_initial',
  },
  {
    up: migration_20261014_164403_lead_notification_email.up,
    down: migration_20261014_164403_lead_notification_email.down,
    name: '20261014_164403_lead_notification_email',
  },
  {
    up: migration_20261014_173923_audit_doc_ids_text.up,
    down: migration_20261014_173923_audit_doc_ids_text.down,
    name: '20261014_173923_audit_doc_ids_text'
  },
];
