-- Migration 0008: Learning courses and destination hubs tables
-- Moves static COURSES and HUBS from data.ts into PostgreSQL

CREATE TABLE public.courses (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL,
  modules int NOT NULL DEFAULT 0,
  duration text NOT NULL DEFAULT '',
  difficulty text NOT NULL DEFAULT 'Foundation' CHECK (difficulty IN ('Foundation','Intermediate','Advanced')),
  skills text[] NOT NULL DEFAULT '{}',
  relevance text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read courses" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage courses" ON public.courses FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- User course progress
CREATE TABLE public.user_course_progress (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id text NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  progress int NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);
GRANT SELECT, INSERT, UPDATE ON public.user_course_progress TO authenticated;
GRANT ALL ON public.user_course_progress TO service_role;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own course progress" ON public.user_course_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Destination hubs
CREATE TABLE public.hubs (
  id text PRIMARY KEY,
  destination text NOT NULL,
  programme text NOT NULL,
  focus text NOT NULL,
  next_date date,
  next_date_text text,
  participants int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Planning' CHECK (status IN ('Enrolling','Upcoming','Planning','Completed')),
  project text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hubs TO authenticated;
GRANT ALL ON public.hubs TO service_role;
ALTER TABLE public.hubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read hubs" ON public.hubs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage hubs" ON public.hubs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Hub enrolments
CREATE TABLE public.hub_enrolments (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hub_id text NOT NULL REFERENCES public.hubs(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, hub_id)
);
GRANT SELECT, INSERT, DELETE ON public.hub_enrolments TO authenticated;
GRANT ALL ON public.hub_enrolments TO service_role;
ALTER TABLE public.hub_enrolments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own hub enrolments" ON public.hub_enrolments FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Seed courses
INSERT INTO public.courses (id, title, category, modules, duration, difficulty, skills, relevance) VALUES
  ('c1', 'Hotel Operations Fundamentals', 'Hospitality Operations', 6, '4h 30m', 'Foundation', ARRAY['Front Office','Reservations','Customer Experience'], 'Required by 9 of 10 hotel employers'),
  ('c2', 'Reservation Systems in Practice', 'Digital Skills', 5, '3h 45m', 'Intermediate', ARRAY['Property Management Systems','Reservation Management'], 'Directly addresses the systems exposure gap'),
  ('c3', 'AI for Hospitality Professionals', 'Artificial Intelligence', 4, '2h 50m', 'Foundation', ARRAY['AI-assisted Service','Prompt Judgement'], 'Fastest-growing skill in 2031 job adverts'),
  ('c4', 'Service Recovery & Guest Complaints', 'Customer Experience', 5, '3h', 'Intermediate', ARRAY['Service Recovery','Guest Communication'], 'Top competency for guest-facing roles'),
  ('c5', 'Ticketing & Travel Distribution', 'Tourism Operations', 6, '4h', 'Intermediate', ARRAY['Ticket Booking Systems','Itinerary Planning'], 'Core for travel agency roles'),
  ('c6', 'Leading Hospitality Teams', 'Management', 7, '5h', 'Advanced', ARRAY['Staff Allocation','Decision Making'], 'Pathway to supervisor roles'),
  ('c7', 'Starting a Digital Tourism Business', 'Entrepreneurship', 6, '4h 15m', 'Foundation', ARRAY['Digital Marketing','Online Booking'], 'For operators moving bookings online'),
  ('c8', 'Sustainable & Community Tourism', 'Sustainable Tourism', 4, '2h 40m', 'Foundation', ARRAY['Sustainability','Community Engagement'], 'Growing visitor expectation')
ON CONFLICT (id) DO NOTHING;

-- Seed hubs
INSERT INTO public.hubs (id, destination, programme, focus, next_date_text, participants, status, project) VALUES
  ('h1', 'Kariba', 'Lakeside Hospitality Skills Week', 'Houseboat guest service & digital bookings', '14 Oct 2031', 46, 'Enrolling', 'Online booking set-up for 8 community operators'),
  ('h2', 'Mutoko', 'Community Heritage Tourism Lab', 'Guiding, storytelling & sustainable tourism', '21 Oct 2031', 32, 'Enrolling', 'Heritage trail digital map with local guides'),
  ('h3', 'Victoria Falls', 'Front Office Readiness Clinic', 'Reservation systems & peak-season operations', '04 Nov 2031', 58, 'Upcoming', 'Graduate placement pipeline with 5 hotels'),
  ('h4', 'Nyanga', 'Eastern Highlands Lodge Skills', 'Small lodge operations & AI-assisted marketing', '18 Nov 2031', 24, 'Upcoming', 'Shared digital marketing toolkit'),
  ('h5', 'Masvingo', 'Great Zimbabwe Visitor Experience', 'Heritage interpretation & digital CX', '02 Dec 2031', 38, 'Planning', 'Visitor feedback system for heritage site')
ON CONFLICT (id) DO NOTHING;
