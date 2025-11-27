alter table public.patients
add column if not exists caregiver_name text,
add column if not exists media_consent boolean,
add column if not exists transportation text,
add column if not exists parking_requirement boolean,
add column if not exists distance_from_home numeric(5, 2),
add column if not exists gender text,
add column if not exists marital_status text,
add column if not exists education_level text,
add column if not exists fall_history boolean,
add column if not exists underlying_diseases text[],
add column if not exists hospitalization_history boolean;
