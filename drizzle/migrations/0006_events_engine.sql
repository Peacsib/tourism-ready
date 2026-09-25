CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key text NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'serpapi_google',
  source_event_id text,
  is_external boolean NOT NULL DEFAULT true,
  title text NOT NULL,
  description text,
  source_description text,
  ai_summary text,
  category text,
  subcategory text,
  start_datetime timestamptz,
  end_datetime timestamptz,
  date_text text,
  timezone text,
  venue_name text,
  venue_address text,
  city text,
  region text,
  country text,
  organiser_name text,
  official_url text,
  registration_url text,
  ticket_url text,
  image_url text,
  image_thumbnail_url text,
  image_source_url text,
  image_source_name text,
  image_license text,
  image_attribution text,
  image_source_type text,
  image_verified boolean NOT NULL DEFAULT false,
  related_skills text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'candidate' CHECK (status IN ('candidate','verified','needs_review','cancelled','postponed','past','archived','rejected')),
  is_verified boolean NOT NULL DEFAULT false,
  verification_source_url text,
  verification_source_name text,
  verified_at timestamptz,
  relevance_score int,
  tourism_relevance_reason text,
  last_synced_at timestamptz,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX events_status_start_idx ON public.events (status, start_datetime);
GRANT SELECT, UPDATE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read public events" ON public.events FOR SELECT TO authenticated USING (status IN ('verified','cancelled','postponed','past') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update events" ON public.events FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.saved_events (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_events TO authenticated;
GRANT ALL ON public.saved_events TO service_role;
ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own saved events" ON public.saved_events FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.event_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  queries_run int NOT NULL DEFAULT 0,
  candidates_found int NOT NULL DEFAULT 0,
  duplicates_removed int NOT NULL DEFAULT 0,
  verified_count int NOT NULL DEFAULT 0,
  rejected_count int NOT NULL DEFAULT 0,
  updated_count int NOT NULL DEFAULT 0,
  images_found int NOT NULL DEFAULT 0,
  images_failed int NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'
);
GRANT SELECT ON public.event_sync_runs TO authenticated;
GRANT ALL ON public.event_sync_runs TO service_role;
ALTER TABLE public.event_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read runs" ON public.event_sync_runs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.event_search_log (
  query text PRIMARY KEY,
  engine text NOT NULL,
  last_run_at timestamptz NOT NULL DEFAULT now(),
  result_count int NOT NULL DEFAULT 0
);
GRANT ALL ON public.event_search_log TO service_role;
ALTER TABLE public.event_search_log ENABLE ROW LEVEL SECURITY;