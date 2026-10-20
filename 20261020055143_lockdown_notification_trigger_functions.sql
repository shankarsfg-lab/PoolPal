/*
# Lock down notification trigger functions

1. Changes
- Revoke EXECUTE on the two SECURITY DEFINER trigger functions
  (`notify_passenger_on_booking_status`, `notify_driver_on_new_booking`)
  from the `anon` and `authenticated` roles so they cannot be invoked
  directly via the PostgREST API.
- These functions are only meant to run as trigger callbacks fired by
  INSERT/UPDATE on the `bookings` table. Triggers execute with the table
  owner's privileges regardless of the caller, so revoking EXECUTE does
  not affect trigger behavior.

2. Security
- Closes the advisor warnings about publicly callable SECURITY DEFINER
  functions. The functions still run correctly as trigger callbacks.
*/

REVOKE EXECUTE ON FUNCTION public.notify_passenger_on_booking_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_driver_on_new_booking() FROM anon, authenticated;
