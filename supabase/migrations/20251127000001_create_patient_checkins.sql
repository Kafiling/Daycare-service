create table public.patient_checkins (
  id uuid not null default gen_random_uuid(),
  patient_id text not null,
  check_in_time timestamp with time zone not null default now(),
  created_by uuid null, -- references auth.users(id)
  created_at timestamp with time zone not null default now(),
  constraint patient_checkins_pkey primary key (id),
  constraint patient_checkins_patient_id_fkey foreign key (patient_id) references patients (id) on delete cascade
) tablespace pg_default;

create index if not exists patient_checkins_patient_id_idx on public.patient_checkins using btree (patient_id) tablespace pg_default;
create index if not exists patient_checkins_check_in_time_idx on public.patient_checkins using btree (check_in_time) tablespace pg_default;

-- Add RLS policies
alter table public.patient_checkins enable row level security;

create policy "Enable read access for authenticated users"
on public.patient_checkins
for select
to authenticated
using (true);

create policy "Enable insert access for authenticated users"
on public.patient_checkins
for insert
to authenticated
with check (true);
