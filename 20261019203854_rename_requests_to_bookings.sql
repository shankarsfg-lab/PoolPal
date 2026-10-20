/*
# Rename requests table to bookings

1. Changes
- Rename `public.requests` to `public.bookings`.
- All columns, constraints, and RLS policies carry over unchanged with the rename.
- The bookings table stores passenger seat requests on a ride, with status
  Pending / Accepted / Rejected.

2. Security
- RLS remains enabled (policies follow the table during rename).
- Existing ownership policies remain in effect:
  - any authenticated user can read all bookings (drivers need to see incoming
    requests; passengers need to see their own)
  - a passenger can insert/delete only their own bookings
  - only the driver of the ride may update a booking (accept/reject)

3. Notes
- Table was empty (0 rows) at migration time, so no data is affected.
- This rename aligns the table name with the app's "bookings" terminology.
*/

ALTER TABLE IF EXISTS public.requests RENAME TO bookings;
