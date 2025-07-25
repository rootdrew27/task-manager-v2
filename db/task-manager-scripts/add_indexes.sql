CREATE INDEX ON task(user_id);
CREATE INDEX ON google_account(user_id);

CREATE UNIQUE INDEX task_userid_lowername_idx
ON task(user_id, LOWER(name));

CREATE INDEX task_name ON task (LOWER(name));

create unique index tts_userid on tts(user_id);

create unique index stt_user_id on stt(user_id);

create unique index llm_user_id on llm(user_id);