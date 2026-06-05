-- Supabase schema for order chat messages
CREATE TABLE IF NOT EXISTS public.order_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'user',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_chats_order_id_idx ON public.order_chats(order_id);
CREATE INDEX IF NOT EXISTS order_chats_order_number_idx ON public.order_chats(order_number);
CREATE INDEX IF NOT EXISTS order_chats_created_at_idx ON public.order_chats(created_at);

-- Enable row-level security so only authorized users can read/write chat rows.
ALTER TABLE public.order_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for order owner or admin"
  ON public.order_chats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_id
        AND o.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(p.role) = 'admin'
    )
  );

CREATE POLICY "Allow insert for order owner"
  ON public.order_chats
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_id
        AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow insert for admin"
  ON public.order_chats
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(p.role) = 'admin'
    )
  );
