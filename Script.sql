-- ============================================================
-- DROP EXISTING TABLES
-- ============================================================
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- ============================================================
-- CREATE TABLES
-- ============================================================

CREATE TABLE teams (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    full_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(254) NOT NULL UNIQUE,
    password    VARCHAR(60)  NOT NULL,
    role        SMALLINT     NOT NULL CHECK (role IN (1, 2, 3)),
    team_id     INT          REFERENCES teams(id)
);

CREATE TABLE seasons (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    start_date  DATE         NOT NULL,
    end_date    DATE         NOT NULL
);

CREATE TABLE events (
    id                  SERIAL PRIMARY KEY,
    title               VARCHAR(100),
    type                SMALLINT     NOT NULL CHECK (type IN (1, 2)),
    start_date          TIMESTAMP    NOT NULL,
    end_date            TIMESTAMP    NOT NULL,
    convocation_date    TIMESTAMP    NOT NULL,
    location            VARCHAR(150) NOT NULL,
    opponent            VARCHAR(100),
    team_id             INT          NOT NULL REFERENCES teams(id),
    season_id           INT          NOT NULL REFERENCES seasons(id)
);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO seasons (name, start_date, end_date)
VALUES ('Printemps 2026', '2026-01-01', '2026-07-31');

INSERT INTO users (full_name, email, password, role)
VALUES ('Admin', 'fc-admin@footclub.com', '$2b$10$qrpgbl.A2j2dxDHqgpBKOeY.ZbxSpM39WJD.MyAzQfl/al0qXLTz2', 1); -- mdp : admin123

-- ============================================================
-- ÉQUIPES
-- ============================================================

INSERT INTO teams (name) VALUES
  ('Seniors A'),
  ('Seniors B'),
  ('Juniors A');

-- ============================================================
-- COACHS (role = 2)
-- Mot de passe par défaut : footclub123
-- Les Aigles : 2 coachs - Les Loups : 1 coach - Les Faucons : 1 coach
-- ============================================================

INSERT INTO users (full_name, email, password, role, team_id) VALUES
  ('Florian Rochat', 'florian.rochat@footclub.com', '$2b$10$/NiB13YvtuYwT2H0Lw9UCOCcPu5dLAyWu/wYLkCNweAiyUzTOBzSe', 2, (SELECT id FROM teams WHERE name = 'Seniors A')),
  ('Yann Reymond', 'yann.reymond@footclub.com', '$2b$10$/NiB13YvtuYwT2H0Lw9UCOCcPu5dLAyWu/wYLkCNweAiyUzTOBzSe', 2, (SELECT id FROM teams WHERE name = 'Seniors A')),
  ('Kevin Vallotton', 'kevin.vallotton@footclub.com', '$2b$10$/NiB13YvtuYwT2H0Lw9UCOCcPu5dLAyWu/wYLkCNweAiyUzTOBzSe', 2, (SELECT id FROM teams WHERE name = 'Seniors B')),
  ('Sandrine Girardet', 'sandrine.girardet@footclub.com', '$2b$10$/NiB13YvtuYwT2H0Lw9UCOCcPu5dLAyWu/wYLkCNweAiyUzTOBzSe', 2, (SELECT id FROM teams WHERE name = 'Juniors A'));

-- ============================================================
-- JOUEURS (role = 3) - 2 max par equipe
-- Mot de passe par défaut : footclub123
-- ============================================================

INSERT INTO users (full_name, email, password, role, team_id) VALUES
  -- Seniors A
  ('Romain Bertholet', 'romain.bertholet@footclub.com', '$2b$10$/NiB13YvtuYwT2H0Lw9UCOCcPu5dLAyWu/wYLkCNweAiyUzTOBzSe', 3, (SELECT id FROM teams WHERE name = 'Seniors A')),
  ('Mathieu Mayor', 'mathieu.mayor@footclub.com', '$2b$10$/NiB13YvtuYwT2H0Lw9UCOCcPu5dLAyWu/wYLkCNweAiyUzTOBzSe', 3, (SELECT id FROM teams WHERE name = 'Seniors A')),
  -- Seniors B
  ('Loïc Vaucher', 'loic.vaucher@footclub.com', '$2b$10$/NiB13YvtuYwT2H0Lw9UCOCcPu5dLAyWu/wYLkCNweAiyUzTOBzSe', 3, (SELECT id FROM teams WHERE name = 'Seniors B')),
  ('Bastien Grandjean', 'bastien.grandjean@footclub.com', '$2b$10$/NiB13YvtuYwT2H0Lw9UCOCcPu5dLAyWu/wYLkCNweAiyUzTOBzSe', 3, (SELECT id FROM teams WHERE name = 'Seniors B')),
  -- Juniors A
  ('Théo Vuille', 'theo.vuille@footclub.com', '$2b$10$/NiB13YvtuYwT2H0Lw9UCOCcPu5dLAyWu/wYLkCNweAiyUzTOBzSe', 3, (SELECT id FROM teams WHERE name = 'Juniors A')),
  ('Noé Bonnet', 'noe.bonnet@footclub.com', '$2b$10$/NiB13YvtuYwT2H0Lw9UCOCcPu5dLAyWu/wYLkCNweAiyUzTOBzSe', 3, (SELECT id FROM teams WHERE name = 'Juniors A'));

-- ============================================================
-- EVENEMENTS - quelques entrainements et matchs par equipe
-- ============================================================

INSERT INTO events (type, title, start_date, end_date, convocation_date, location, opponent, team_id, season_id) VALUES
  -- Seniors A
  (1, 'Entraînement sur terrain 1', '2026-05-21 18:00', '2026-05-21 20:00', '2026-05-21 17:45', 'Terrain 1, Ste-Croix', NULL, (SELECT id FROM teams WHERE name = 'Seniors A'), (SELECT id FROM seasons WHERE name = 'Printemps 2026')),
  (2, 'Vs FC La Sagne', '2026-05-24 15:00', '2026-05-24 17:00', '2026-05-24 14:30', 'Terrain 1, Ste-Croix', 'FC La Sagne', (SELECT id FROM teams WHERE name = 'Seniors A'), (SELECT id FROM seasons WHERE name = 'Printemps 2026')),
  (1, 'Entraînement sur terrain 2', '2026-05-28 18:00', '2026-05-28 19:30', '2026-05-28 17:50', 'Terrain 2, Ste-Croix', NULL, (SELECT id FROM teams WHERE name = 'Seniors A'), (SELECT id FROM seasons WHERE name = 'Printemps 2026')),
  -- Seniors B
  (1, 'Entraînement sur terrain 2', '2026-05-22 17:30', '2026-05-22 19:30', '2026-05-22 17:15', 'Terrain 2, Ste-Croix', NULL, (SELECT id FROM teams WHERE name = 'Seniors B'), (SELECT id FROM seasons WHERE name = 'Printemps 2026')),
  (2, 'Vs FC Les Bayards', '2026-05-25 14:00', '2026-05-25 16:00', '2026-05-25 13:30', 'Terrain des Bayards', 'FC Les Bayards', (SELECT id FROM teams WHERE name = 'Seniors B'), (SELECT id FROM seasons WHERE name = 'Printemps 2026')),
  -- Juniors A
  (1, 'Entraînement sur terrain 1', '2026-05-23 09:00', '2026-05-23 10:30', '2026-05-23 08:50', 'Terrain 1, Ste-Croix', NULL, (SELECT id FROM teams WHERE name = 'Juniors A'), (SELECT id FROM seasons WHERE name = 'Printemps 2026')),
  (2, 'Vs FC Junior Couvet', '2026-05-26 10:00', '2026-05-26 11:30', '2026-05-26 09:30', 'Terrain de Couvet', 'FC Junior Couvet', (SELECT id FROM teams WHERE name = 'Juniors A'), (SELECT id FROM seasons WHERE name = 'Printemps 2026'));

CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_team_id  ON users(team_id);
CREATE INDEX idx_events_team_id ON events(team_id);
CREATE INDEX idx_events_season_id ON events(season_id);