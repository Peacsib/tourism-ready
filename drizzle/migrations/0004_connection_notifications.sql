ALTER TABLE public.connections ADD COLUMN IF NOT EXISTS intro_message text;

CREATE UNIQUE INDEX IF NOT EXISTS connections_pair_unique ON public.connections (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind text NOT NULL,
  connection_id uuid REFERENCES public.connections(id) ON DELETE CASCADE,
  body text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, connection_id)
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notifications read" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own notifications mark read" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own notifications delete" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.notify_connection_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, actor_id, kind, connection_id, body)
    VALUES (NEW.addressee_id, NEW.requester_id, 'connection_request', NEW.id, NEW.intro_message)
    ON CONFLICT (user_id, kind, connection_id) DO NOTHING;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    INSERT INTO public.notifications (user_id, actor_id, kind, connection_id)
    VALUES (NEW.requester_id, NEW.addressee_id, 'connection_accepted', NEW.id)
    ON CONFLICT (user_id, kind, connection_id) DO NOTHING;
    UPDATE public.notifications SET read_at = COALESCE(read_at, now())
    WHERE connection_id = NEW.id AND kind = 'connection_request';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER connections_notify AFTER INSERT OR UPDATE ON public.connections
FOR EACH ROW EXECUTE FUNCTION public.notify_connection_event();

CREATE OR REPLACE FUNCTION public.guard_connection_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.requester_id = NEW.addressee_id THEN RAISE EXCEPTION 'You cannot connect with yourself.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.addressee_id) THEN RAISE EXCEPTION 'That member no longer exists.'; END IF;
  IF NEW.intro_message IS NOT NULL THEN NEW.intro_message := left(NEW.intro_message, 1000); END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER connections_guard BEFORE INSERT ON public.connections
FOR EACH ROW EXECUTE FUNCTION public.guard_connection_insert();

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;