-- Rooms (resources for day-view lanes)
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  color text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read rooms" ON public.rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert rooms" ON public.rooms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update rooms" ON public.rooms FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete rooms" ON public.rooms FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Provider availability windows + OOO blocks
CREATE TABLE public.provider_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'available', -- 'available' | 'ooo'
  -- Recurring weekly window
  weekday smallint,                       -- 0..6 (Sun..Sat); null when one-off
  start_minute smallint,                  -- minutes from 00:00 local
  end_minute smallint,
  -- One-off range
  starts_at timestamptz,
  ends_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_schedules TO authenticated;
GRANT ALL ON public.provider_schedules TO service_role;
ALTER TABLE public.provider_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read schedules" ON public.provider_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert schedules" ON public.provider_schedules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update schedules" ON public.provider_schedules FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete schedules" ON public.provider_schedules FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX idx_provider_schedules_provider ON public.provider_schedules(provider_id);

-- Waitlist
CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  provider_id uuid,
  visit_type text NOT NULL DEFAULT 'in-person',
  reason text,
  duration_min integer NOT NULL DEFAULT 30,
  preferred_from timestamptz,
  preferred_to timestamptz,
  priority smallint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'waiting', -- waiting | offered | scheduled | cancelled
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waitlist TO authenticated;
GRANT ALL ON public.waitlist TO service_role;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read waitlist" ON public.waitlist FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff insert waitlist" ON public.waitlist FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff update waitlist" ON public.waitlist FOR UPDATE TO authenticated USING (true);
CREATE POLICY "admin delete waitlist" ON public.waitlist FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_waitlist_updated BEFORE UPDATE ON public.waitlist
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_waitlist_status ON public.waitlist(status);

-- Appointments: recurring series + room assignment + reminders
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS room_id uuid,
  ADD COLUMN IF NOT EXISTS series_id uuid,
  ADD COLUMN IF NOT EXISTS recurrence_rule text,        -- e.g. FREQ=WEEKLY;BYDAY=MO,WE;COUNT=8
  ADD COLUMN IF NOT EXISTS recurrence_end date,
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_appointments_series ON public.appointments(series_id);
CREATE INDEX IF NOT EXISTS idx_appointments_room ON public.appointments(room_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON public.appointments(scheduled_at);

-- Enable realtime on appointments + waitlist
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.waitlist REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.waitlist;