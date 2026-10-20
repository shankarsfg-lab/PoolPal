/*
# Normalize booking statuses to lowercase

1. Changes
- Change the default value of `bookings.status` from `'Pending'` to `'pending'`
  so new bookings match the lowercase values the application now writes.
- Add a CHECK constraint enforcing the allowed status set:
  'pending', 'accepted', 'rejected', 'cancelled'.
- Backfill any existing rows to lowercase (no-op when table is empty).
- The `cancelled` value is added to the allowed set so passengers can cancel a
  pending request in future.

2. Security
- No RLS policy changes. Existing policies on `bookings` remain in effect.

3. Notes
- The table had 0 rows at migration time, so no data is affected.
- Safe to re-run: the UPDATE is a no-op once values are lowercase, and the
  CHECK constraint is dropped before re-creation.
*/

UPDATE bookings
  SET status = lower(status)
  WHERE status IS DISTINCT FROM lower(status);

ALTER TABLE bookings
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled'));
