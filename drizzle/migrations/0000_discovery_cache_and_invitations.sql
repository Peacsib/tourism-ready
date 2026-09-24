CREATE TABLE public.discovery_cache (
  cache_key text PRIMARY KEY,
  results jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.discovery_cache TO service_role;
ALTER TABLE public.discovery_cache ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.external_professionals (
  id text PRIMARY KEY,
  name text NOT NULL,
  headline text,
  role text,
  company text,
  location text,
  profile_url text,
  source text NOT NULL DEFAULT 'enrich',
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.external_professionals TO service_role;
ALTER TABLE public.external_professionals ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.discovery_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id text NOT NULL REFERENCES public.external_professionals(id) ON DELETE CASCADE,
  invited_by text NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professional_id, invited_by)
);
GRANT ALL ON public.discovery_invitations TO service_role;
ALTER TABLE public.discovery_invitations ENABLE ROW LEVEL SECURITY;