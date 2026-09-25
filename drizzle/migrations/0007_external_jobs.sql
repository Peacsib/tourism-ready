ALTER TABLE public.jobs ALTER COLUMN employer_id DROP NOT NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_external boolean NOT NULL DEFAULT false;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'employer';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS apply_url text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS dedupe_key text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS jobs_dedupe_key_idx ON public.jobs(dedupe_key);