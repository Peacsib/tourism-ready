DELETE FROM public.connections a USING public.connections b WHERE a.id > b.id AND least(a.requester_id,a.addressee_id)=least(b.requester_id,b.addressee_id) AND greatest(a.requester_id,a.addressee_id)=greatest(b.requester_id,b.addressee_id);
DELETE FROM public.connections WHERE requester_id = addressee_id;
ALTER TABLE public.connections ADD CONSTRAINT connections_not_self CHECK (requester_id <> addressee_id);
CREATE UNIQUE INDEX IF NOT EXISTS connections_pair_unique ON public.connections (least(requester_id, addressee_id), greatest(requester_id, addressee_id));