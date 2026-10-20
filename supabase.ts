import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type RideStatus = 'Open' | 'Full';
export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_color: string;
  created_at: string;
}

export interface Ride {
  id: string;
  driver_id: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  total_seats: number;
  available_seats: number;
  fuel_note: string;
  status: RideStatus;
  created_at: string;
}

export interface RideWithDriver extends Ride {
  driver: Profile | null;
}

export interface Booking {
  id: string;
  ride_id: string;
  passenger_id: string;
  pickup_note: string;
  status: BookingStatus;
  created_at: string;
}

export interface BookingWithDetails extends Booking {
  passenger: Profile | null;
  ride: Ride | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
