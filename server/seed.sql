-- ============================================================
-- Dati di test - Gestione richieste di rimborso spese
-- Eseguire UNA SOLA VOLTA (gli insert usano email/nome per le FK).
-- Password di tutti gli utenti: Password123!
-- ============================================================

-- 1) UTENTI (1 responsabile amministrativo + 2 dipendenti)
insert into "RSA_Users" (name, surname, email, password, "isAdmin") values
  ('Mario',  'Rossi',   'admin@example.com',      '$2b$10$O43y/dzjn4z3S73.AjHNsOuRg2GdUO2C/000YGFeUQEQx43fnwN/C', true),
  ('Luca',   'Bianchi', 'dipendente@example.com', '$2b$10$O43y/dzjn4z3S73.AjHNsOuRg2GdUO2C/000YGFeUQEQx43fnwN/C', false),
  ('Giulia', 'Verdi',   'giulia@example.com',     '$2b$10$O43y/dzjn4z3S73.AjHNsOuRg2GdUO2C/000YGFeUQEQx43fnwN/C', false);

-- 2) CATEGORIE DI SPESA
insert into "RSA_ExpenseCategory" (name, description) values
  ('Trasferta', 'Spese di trasferta'),
  ('Pasti',     'Pasti e ristorazione'),
  ('Pedaggi',   'Pedaggi autostradali'),
  ('Parcheggi', 'Parcheggi'),
  ('Acquisti',  'Acquisti autorizzati di piccolo importo');

-- 3) RICHIESTE DI RIMBORSO (stati: in_attesa / approvata / rifiutata / liquidata)
insert into "RSA_RefundRequest"
  (submission_date, expense_date, category_id, amount, description, receipt_reference,
   status, employee_id, evaluation_date, admin_id, rejection_reason, settlement_date)
values
  -- Luca - In attesa
  ('2026-05-05T09:00:00Z', '2026-05-04',
   (select id from "RSA_ExpenseCategory" where name = 'Trasferta'),
   120.50, 'Trasferta a Milano per riunione cliente', 'RIC-0001',
   'in_attesa', (select id from "RSA_Users" where email = 'dipendente@example.com'),
   null, null, null, null),

  -- Luca - Approvata
  ('2026-05-11T08:30:00Z', '2026-05-10',
   (select id from "RSA_ExpenseCategory" where name = 'Pasti'),
   35.00, 'Pranzo di lavoro con fornitore', 'RIC-0002',
   'approvata', (select id from "RSA_Users" where email = 'dipendente@example.com'),
   '2026-05-12T10:00:00Z', (select id from "RSA_Users" where email = 'admin@example.com'),
   null, null),

  -- Luca - Liquidata
  ('2026-04-21T07:45:00Z', '2026-04-20',
   (select id from "RSA_ExpenseCategory" where name = 'Pedaggi'),
   18.20, 'Pedaggio autostradale A4', 'RIC-0003',
   'liquidata', (select id from "RSA_Users" where email = 'dipendente@example.com'),
   '2026-04-22T09:00:00Z', (select id from "RSA_Users" where email = 'admin@example.com'),
   null, '2026-04-25T12:00:00Z'),

  -- Luca - In attesa
  ('2026-06-03T11:10:00Z', '2026-06-02',
   (select id from "RSA_ExpenseCategory" where name = 'Parcheggi'),
   12.00, 'Parcheggio aeroporto', null,
   'in_attesa', (select id from "RSA_Users" where email = 'dipendente@example.com'),
   null, null, null, null),

  -- Luca - Rifiutata
  ('2026-05-23T14:00:00Z', '2026-05-22',
   (select id from "RSA_ExpenseCategory" where name = 'Trasferta'),
   310.00, 'Trasferta non autorizzata', 'RIC-0004',
   'rifiutata', (select id from "RSA_Users" where email = 'dipendente@example.com'),
   '2026-05-24T09:30:00Z', (select id from "RSA_Users" where email = 'admin@example.com'),
   'Spesa non autorizzata preventivamente', null),

  -- Giulia - Approvata
  ('2026-05-16T08:00:00Z', '2026-05-15',
   (select id from "RSA_ExpenseCategory" where name = 'Trasferta'),
   240.00, 'Trasferta a Roma per fiera di settore', 'RIC-0005',
   'approvata', (select id from "RSA_Users" where email = 'giulia@example.com'),
   '2026-05-17T10:15:00Z', (select id from "RSA_Users" where email = 'admin@example.com'),
   null, null),

  -- Giulia - Rifiutata
  ('2026-05-19T16:20:00Z', '2026-05-18',
   (select id from "RSA_ExpenseCategory" where name = 'Pasti'),
   28.50, 'Cena personale', null,
   'rifiutata', (select id from "RSA_Users" where email = 'giulia@example.com'),
   '2026-05-20T09:00:00Z', (select id from "RSA_Users" where email = 'admin@example.com'),
   'Spesa di natura personale, non rimborsabile', null),

  -- Giulia - In attesa
  ('2026-06-02T10:00:00Z', '2026-06-01',
   (select id from "RSA_ExpenseCategory" where name = 'Acquisti'),
   75.90, 'Acquisto materiale di cancelleria', 'RIC-0006',
   'in_attesa', (select id from "RSA_Users" where email = 'giulia@example.com'),
   null, null, null, null),

  -- Giulia - Liquidata
  ('2026-04-29T09:15:00Z', '2026-04-28',
   (select id from "RSA_ExpenseCategory" where name = 'Pedaggi'),
   22.00, 'Pedaggi trasferta Torino', 'RIC-0007',
   'liquidata', (select id from "RSA_Users" where email = 'giulia@example.com'),
   '2026-04-30T11:00:00Z', (select id from "RSA_Users" where email = 'admin@example.com'),
   null, '2026-05-02T12:00:00Z');
