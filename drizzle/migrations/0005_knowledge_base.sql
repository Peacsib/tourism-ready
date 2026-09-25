CREATE TABLE public.kb_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  section text NOT NULL DEFAULT '',
  content text NOT NULL,
  version int NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  fts tsvector GENERATED ALWAYS AS (to_tsvector('english', section || ' ' || content)) STORED
);
CREATE INDEX kb_chunks_fts_idx ON public.kb_chunks USING gin (fts);
GRANT SELECT ON public.kb_chunks TO authenticated;
GRANT ALL ON public.kb_chunks TO service_role;
ALTER TABLE public.kb_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read active knowledge" ON public.kb_chunks FOR SELECT TO authenticated USING (active);
CREATE POLICY "Admins manage knowledge" ON public.kb_chunks FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.search_kb(q text, n int DEFAULT 5)
RETURNS TABLE(source text, section text, content text, rank real)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT c.source, c.section, c.content, ts_rank(c.fts, websearch_to_tsquery('english', q)) AS rank
  FROM public.kb_chunks c
  WHERE c.active AND c.fts @@ websearch_to_tsquery('english', q)
  ORDER BY rank DESC LIMIT least(n, 8)
$$;
GRANT EXECUTE ON FUNCTION public.search_kb(text,int) TO authenticated, service_role;