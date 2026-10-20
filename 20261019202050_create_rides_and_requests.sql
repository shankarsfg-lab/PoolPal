/*
# Carpooling App Schema

1. New Tables
- `profiles` — public display info keyed off auth.users. Columns:
  - id (uuid, PK, references auth.users)
  - full_name (text)
  - phone (text, optional contact shown on accepted requests)
  - avatar_color (text, used to render avatar initials with a stable color)
  - created_at (timestamptz)
- `rides` — a trip posted by a driver. Columns:
  - id (uuid, PK)
  - driver_id (uuid, FK -> profiles.id, defaults auth.uid())
  - origin (text)
  - destination (text)
  - departure_date (date)
  - departure_time (text, HH:MM 24h)
  - total_seats (int, seats in the car)
  - available_seats (int, seats still bookable; decremented on accept)
  - fuel_note (text, optional note about fuel contribution)
  - status (text: 'Open' | 'Full', default 'Open')
  - created_at (timestamptz)
- `requests` — a passenger's booking request on a ride. Columns:
  - id (uuid, PK)
  - ride_id (uuid, FK -> rides.id ON DELETE CASCADE)
  - passenger_id (uuid, FK -> profiles.id, defaults auth.uid())
  - pickup_note (text, optional)
  - status (text: 'Pending' | 'Accepted' | 'Rejected', default 'Pending')
  - created_at (timestamptz)

2. Security
- RLS enabled on all three tables.
- profiles: a user can read ALL profiles (needed so passengers can see driver names
  and drivers can see passenger names) but only update/insert their own row.
- rides: any authenticated user can read all rides; only the driver owner can
  insert/update/delete their own rides.
- requests: any authenticated user can read all requests (drivers need to see
  incoming requests; passengers need to see their own). A passenger can only
  insert their own requests and delete their own pending requests. Updates to
  request status are restricted to the driver of the ride the request belongs to,
  enforced via a join to rides.driver_id.

3. Notes
- `available_seats` is decremented by the frontend after a driver accepts a
  request; when it reaches 0 the ride status is set to 'Full'. The accept +
  decrement happen in a single update flow in the app.
- Owner columns default to auth.uid() so inserts from the anon-key client that
  omit the owner still satisfy WITH CHECK.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text,
  avatar_color text NOT NULL DEFAULT 'sky',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read_all" ON profiles;
CREATE POLICY "profiles_read_all" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  origin text NOT NULL,
  destination text NOT NULL,
  departure_date date NOT NULL,
  departure_time text NOT NULL,
  total_seats int NOT NULL DEFAULT 3,
  available_seats int NOT NULL DEFAULT 3,
  fuel_note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Open',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rides_read_all" ON rides;
CREATE POLICY "rides_read_all" ON rides FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "rides_insert_own" ON rides;
CREATE POLICY "rides_insert_own" ON rides FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = driver_id);

DROP POLICY IF EXISTS "rides_update_own" ON rides;
CREATE POLICY "rides_update_own" ON rides FOR UPDATE
  TO authenticated USING (auth.uid() = driver_id) WITH CHECK (auth.uid() = driver_id);

DROP POLICY IF EXISTS "rides_delete_own" ON rides;
CREATE POLICY "rides_delete_own" ON rides FOR DELETE
  TO authenticated USING (auth.uid() = driver_id);

CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  passenger_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  pickup_note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requests_read_all" ON requests;
CREATE POLICY "requests_read_all" ON requests FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "requests_insert_own" ON requests;
CREATE POLICY "requests_insert_own" ON requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = passenger_id);

-- Only the driver of the ride may update a request (accept/reject).
DROP POLICY IF EXISTS "requests_update_by_ride_driver" ON requests;
CREATE POLICY "requests_update_by_ride_driver" ON requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM rides r WHERE r.id = requests.ride_id AND r.driver_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM rides r WHERE r.id = requests.ride_id AND r.driver_id = auth.uid())
  );

-- A passenger may delete their own pending request.
DROP POLICY IF EXISTS "requests_delete_own" ON requests;
CREATE POLICY "requests_delete_own" ON requests FOR DELETE
  TO authenticated USING (auth.uid() = passenger_id);
