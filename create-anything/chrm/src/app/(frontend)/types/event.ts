/** Row shape of the Supabase `events` table as used by the public site. */
export interface AlumniEvent {
  id: string;
  name: string;
  description: string;
  event_date: string;
  location: string;
  price: number;
  member_discount: number;
  max_attendees: number | null;
  current_attendees: number;
  status: string;
  is_active: boolean;
  image_url?: string | null;
  created_at?: string;
}

export type EventTab = "upcoming" | "past";
