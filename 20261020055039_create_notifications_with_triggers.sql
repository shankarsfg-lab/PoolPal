/*
# Create notifications table with realtime + booking-status triggers

1. New Tables
- `public.notifications`
  - id (uuid, primary key)
  - user_id (uuid, owner of the notification — the recipient)
  - title (text, short headline)
  - message (text, body of the notification)
  - is_read (boolean, default false)
  - created_at (timestamptz, default now())

2. Security
- Enable RLS on `notifications`.
- Owner-scoped CRUD: each authenticated user can only SELECT/UPDATE their own
  notifications. INSERT and DELETE are not exposed to the client (rows are
  created server-side by triggers); policies are still defined for completeness
  with ownership checks.
- An index on (user_id, is_read) supports the unread-count query.

3. Realtime
- Add the `notifications` table to the Supabase Realtime publication so the
  frontend can subscribe to INSERT and UPDATE events live.

4. Triggers
- `notify_passenger_on_booking_status`: after a booking's status changes to
  'accepted' or 'rejected', insert a notification for the passenger so they
  know their seat request was approved or declined.
- `notify_driver_on_new_booking`: after a new booking row is inserted, insert
  a notification for the ride's driver so they know a passenger requested a seat.

5. Notes
- Notifications are created by SECURITY DEFINER trigger functions so they can
  insert rows on behalf of any authenticated user regardless of which role
  fired the trigger. The functions are owned by `postgres` and execute with
  the table owner's privileges, bypassing RLS for the insert only.
- Safe to re-run: functions use CREATE OR REPLACE, triggers use DROP IF EXISTS
  before CREATE.
*/

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id) WHERE is_read = false;

-- Add notifications to the realtime publication.
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger function: notify the passenger when their booking is accepted/rejected.
CREATE OR REPLACE FUNCTION public.notify_passenger_on_booking_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_status text;
  ride_row record;
  notif_title text;
  notif_msg text;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    new_status := NEW.status;
  ELSIF TG_OP = 'INSERT' THEN
    new_status := NEW.status;
  ELSE
    RETURN NEW;
  END IF;

  SELECT origin, destination, departure_date INTO ride_row
    FROM rides WHERE id = NEW.ride_id;

  IF new_status = 'accepted' THEN
    notif_title := 'Seat request accepted';
    notif_msg := 'Your request for ' || COALESCE(ride_row.origin, '?') || ' -> ' ||
                 COALESCE(ride_row.destination, '?') || ' on ' ||
                 COALESCE(ride_row.departure_date::text, '?') || ' was accepted.';
  ELSIF new_status = 'rejected' THEN
    notif_title := 'Seat request declined';
    notif_msg := 'Your request for ' || COALESCE(ride_row.origin, '?') || ' -> ' ||
                 COALESCE(ride_row.destination, '?') || ' on ' ||
                 COALESCE(ride_row.departure_date::text, '?') || ' was declined.';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, title, message)
    VALUES (NEW.passenger_id, notif_title, notif_msg);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_status_notify_passenger ON public.bookings;
CREATE TRIGGER bookings_status_notify_passenger
  AFTER INSERT OR UPDATE OF status ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_passenger_on_booking_status();

-- Trigger function: notify the ride driver when a new booking is created.
CREATE OR REPLACE FUNCTION public.notify_driver_on_new_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  driver_id uuid;
  ride_row record;
  passenger_name text;
BEGIN
  SELECT driver_id, origin, destination, departure_date
    INTO ride_row FROM rides WHERE id = NEW.ride_id;
  driver_id := ride_row.driver_id;

  SELECT full_name INTO passenger_name FROM profiles WHERE id = NEW.passenger_id;

  INSERT INTO public.notifications (user_id, title, message)
    VALUES (
      driver_id,
      'New seat request',
      COALESCE(passenger_name, 'A passenger') || ' requested a seat on ' ||
      COALESCE(ride_row.origin, '?') || ' -> ' ||
      COALESCE(ride_row.destination, '?') || ' on ' ||
      COALESCE(ride_row.departure_date::text, '?') || '.'
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_insert_notify_driver ON public.bookings;
CREATE TRIGGER bookings_insert_notify_driver
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.notify_driver_on_new_booking();
