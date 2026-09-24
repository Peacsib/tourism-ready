-- Roles enum
CREATE TYPE public.app_role AS ENUM ('student', 'professional', 'employer', 'educator', 'entrepreneur', 'admin');

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  full_name text,
  headline text,
  organisation text,
  location text,
  avatar_url text,
  bio text,
  goal text,
  role text NOT NULL DEFAULT 'student',
  app_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are readable by signed-in users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users delete own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- Roles table (never on profiles)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users claim own non-admin role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND role <> 'admin');

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Competencies per user
CREATE TABLE public.user_competencies (
  user_id uuid NOT NULL,
  competency_id text NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Operations',
  level integer NOT NULL DEFAULT 0,
  state text NOT NULL DEFAULT 'Developing',
  links jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, competency_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_competencies TO authenticated;
GRANT ALL ON public.user_competencies TO service_role;
ALTER TABLE public.user_competencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own competencies" ON public.user_competencies FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Simulation attempts
CREATE TABLE public.sim_attempts (
  id text NOT NULL,
  user_id uuid NOT NULL,
  sim_id text NOT NULL,
  title text NOT NULL,
  scores jsonb NOT NULL DEFAULT '[]'::jsonb,
  competencies jsonb NOT NULL DEFAULT '[]'::jsonb,
  added_to_passport boolean NOT NULL DEFAULT false,
  taken_on text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sim_attempts TO authenticated;
GRANT ALL ON public.sim_attempts TO service_role;
ALTER TABLE public.sim_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own attempts" ON public.sim_attempts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Timeline / milestones
CREATE TABLE public.user_timeline (
  id text NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  detail text,
  entry_date text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_timeline TO authenticated;
GRANT ALL ON public.user_timeline TO service_role;
ALTER TABLE public.user_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own timeline" ON public.user_timeline FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(COALESCE(NEW.email, 'member'), '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();