create table google_account(
	sub VARCHAR(255) not null,
	email VARCHAR(255),
	email_verified BOOL,
	family_name VARCHAR(255),
	given_name VARCHAR(255),
	picture VARCHAR(1024),
	user_id UUID,
	primary key(sub),
	constraint fk_google_account
		foreign key(user_id)
			references "user"(id)
);