CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  image_path text,
  linkedin_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read posts" ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authors create posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id AND length(body) <= 3000);
CREATE POLICY "Authors update posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors delete posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = author_id);
CREATE INDEX posts_created_idx ON public.posts (created_at DESC);

CREATE TABLE public.post_likes (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read likes" ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members like as self" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Members unlike own" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.post_comments TO authenticated;
GRANT ALL ON public.post_comments TO service_role;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read comments" ON public.post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Members comment as self" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id AND length(body) BETWEEN 1 AND 1000);
CREATE POLICY "Authors delete comments" ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE TABLE public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties read connections" ON public.connections FOR SELECT TO authenticated USING (auth.uid() IN (requester_id, addressee_id) OR status = 'accepted');
CREATE POLICY "Request as self" ON public.connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id AND status = 'pending');
CREATE POLICY "Addressee accepts" ON public.connections FOR UPDATE TO authenticated USING (auth.uid() = addressee_id) WITH CHECK (auth.uid() = addressee_id);
CREATE POLICY "Parties remove" ON public.connections FOR DELETE TO authenticated USING (auth.uid() IN (requester_id, addressee_id));

CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties read messages" ON public.direct_messages FOR SELECT TO authenticated USING (auth.uid() IN (sender_id, recipient_id));
CREATE POLICY "Send as self" ON public.direct_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND length(body) BETWEEN 1 AND 2000);
CREATE POLICY "Recipient marks read" ON public.direct_messages FOR UPDATE TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
CREATE INDEX dm_pair_idx ON public.direct_messages (sender_id, recipient_id, created_at);

CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  organisation text NOT NULL,
  location text NOT NULL DEFAULT 'Zimbabwe',
  job_type text NOT NULL DEFAULT 'Full-time',
  description text NOT NULL DEFAULT '',
  skills text[] NOT NULL DEFAULT '{}',
  closes_on date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read active jobs" ON public.jobs FOR SELECT TO authenticated USING (active OR auth.uid() = employer_id);
CREATE POLICY "Employers post jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = employer_id AND (public.has_role(auth.uid(), 'employer') OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Employers edit own jobs" ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = employer_id) WITH CHECK (auth.uid() = employer_id);
CREATE POLICY "Employers delete own jobs" ON public.jobs FOR DELETE TO authenticated USING (auth.uid() = employer_id);

CREATE OR REPLACE FUNCTION public.is_job_owner(_job_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.jobs WHERE id = _job_id AND employer_id = _user_id)
$$;

CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note text NOT NULL DEFAULT '',
  passport jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','shortlisted','declined','hired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, applicant_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Applicant or employer reads" ON public.job_applications FOR SELECT TO authenticated USING (auth.uid() = applicant_id OR public.is_job_owner(job_id, auth.uid()));
CREATE POLICY "Apply as self" ON public.job_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = applicant_id AND status = 'submitted');
CREATE POLICY "Employer updates status" ON public.job_applications FOR UPDATE TO authenticated USING (public.is_job_owner(job_id, auth.uid())) WITH CHECK (public.is_job_owner(job_id, auth.uid()));
CREATE POLICY "Applicant withdraws" ON public.job_applications FOR DELETE TO authenticated USING (auth.uid() = applicant_id);

CREATE POLICY "Members read passports" ON public.user_competencies FOR SELECT TO authenticated USING (true);

CREATE POLICY "Members read post images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'post-images');
CREATE POLICY "Members upload own post images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'post-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Members delete own post images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'post-images' AND (storage.foldername(name))[1] = auth.uid()::text);
