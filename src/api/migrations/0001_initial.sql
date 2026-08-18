CREATE TABLE tasks (
    id           TEXT PRIMARY KEY,
    title        TEXT        NOT NULL,
    description  TEXT        NOT NULL DEFAULT '',
    start_date   TEXT,
    end_date     TEXT,
    status       TEXT        NOT NULL DEFAULT 'pending',
    project_id   TEXT,
    owner_id     TEXT,
    created_date TIMESTAMPTZ NOT NULL,
    updated_date TIMESTAMPTZ NOT NULL
);
