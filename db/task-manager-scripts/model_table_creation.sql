drop table stt;

CREATE TABLE stt(
   id INT GENERATED ALWAYS AS IDENTITY,
   user_id UUID UNIQUE,
   provider VARCHAR(64),
   key VARCHAR(512),
   model VARCHAR(255),
   constraint fk_stt
   	foreign key(user_id)
   	  references "user"(id)
);

drop table llm;

CREATE TABLE llm(
   id INT GENERATED ALWAYS AS IDENTITY,
   user_id UUID UNIQUE,
   provider VARCHAR(64),
   key VARCHAR(512),
   model VARCHAR(255),
   constraint fk_llm
   	foreign key(user_id)
   	  references "user"(id)
);

drop table tts;

CREATE TABLE tts(
   id INT GENERATED ALWAYS AS IDENTITY,
   user_id UUID UNIQUE,
   provider VARCHAR(64),
   key VARCHAR(512),
   model VARCHAR(255),
   active BOOL,
   constraint fk_tts
   	foreign key(user_id)
   	  references "user"(id)
);