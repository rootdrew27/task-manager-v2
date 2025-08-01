create table "user"(
	id UUID DEFAULT gen_random_uuid(),
	created_at DATE default current_date,
	name VARCHAR(255),
	is_guest boolean,
	primary key(id)
);