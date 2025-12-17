-- Add UPDATE policy for patient_checkins table
create policy "Enable update access for authenticated users"
on public.patient_checkins
for update
to authenticated
using (true)
with check (true);
