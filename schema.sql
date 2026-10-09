-- ============================================================
--  Spendly – Expense Tracker  |  MySQL schema
--  Run once:  mysql -u root -p < schema.sql
-- ============================================================


CREATE DATABASE IF NOT EXISTS spendly
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE spendly;

-- One row per transaction. Column names avoid MySQL reserved
-- words (desc/date/type) so no backticks are needed in queries;
-- the API maps them back to the field names the dashboard uses.
CREATE TABLE IF NOT EXISTS transactions (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  description  VARCHAR(255)                          NOT NULL,
  category     VARCHAR(50)                           NOT NULL DEFAULT 'Other',
  tx_type      ENUM('income','expense')              NOT NULL,
  amount       DECIMAL(12,2)                         NOT NULL,
  tx_date      DATE                                  NOT NULL,
  status       ENUM('completed','pending','failed')  NOT NULL DEFAULT 'completed',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tx_date (tx_date),
  INDEX idx_tx_type (tx_type)
);

-- ---- Optional seed data (safe to delete) -------------------
-- Dates use the current month so the charts populate right away.
INSERT INTO transactions (description, category, tx_type, amount, tx_date, status) VALUES
  ('Monthly rent',   'Housing',       'expense', 18000, '2026-09-01', 'completed'),
  ('Salary',         'Salary',        'income',  65000, '2026-09-01', 'completed'),
  ('Grocery run',    'Food & dining', 'expense',  2800, '2026-09-05', 'completed'),
  ('Petrol',         'Transport',     'expense',  1500, '2026-09-08', 'completed'),
  ('Netflix',        'Entertainment', 'expense',   499, '2026-09-10', 'completed'),
  ('Pharmacy',       'Health',        'expense',   920, '2026-09-14', 'completed'),
  ('Freelance work', 'Freelance',     'income',  12000, '2026-09-18', 'pending');
