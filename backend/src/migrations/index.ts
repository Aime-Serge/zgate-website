import * as migration_20261014_111832_initial from './20261014_111832_initial';
import * as migration_20261014_164403_lead_notification_email from './20261014_164403_lead_notification_email';
import * as migration_20261014_173923_audit_doc_ids_text from './20261014_173923_audit_doc_ids_text';
import * as migration_20261019_143901_audit_actor_email_changed_fields_login from './20261019_143901_audit_actor_email_changed_fields_login';
import * as migration_20261019_162822_site_redesign_content_model from './20261019_162822_site_redesign_content_model';

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
    name: '20261014_173923_audit_doc_ids_text',
  },
  {
    up: migration_20261019_143901_audit_actor_email_changed_fields_login.up,
    down: migration_20261019_143901_audit_actor_email_changed_fields_login.down,
    name: '20261019_143901_audit_actor_email_changed_fields_login',
  },
  {
    up: migration_20261019_162822_site_redesign_content_model.up,
    down: migration_20261019_162822_site_redesign_content_model.down,
    name: '20261019_162822_site_redesign_content_model'
  },
];
