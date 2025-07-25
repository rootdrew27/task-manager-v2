CREATE TABLE task(
   id INT GENERATED ALWAYS AS IDENTITY,
   user_id UUID,
   name VARCHAR(64) NOT NULL,
   description VARCHAR(255),
   deadline TIMESTAMP,
   is_complete BOOL default false,
   PRIMARY KEY(id),
   constraint fk_tasks
     FOREIGN KEY(user_id)
   	   REFERENCES "user"(id)
);