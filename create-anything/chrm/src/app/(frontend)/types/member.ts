/** Fields collected by the membership registration form (/payments). */
export interface MembershipFormData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  graduation_year: string;
  course: string;
  country: string;
}

export type STKPushStatus = "idle" | "initiating" | "pending" | "success" | "failed" | "cancelled";

/** Executive committee member, as returned by the officials endpoint. */
export interface Official {
  id: string;
  name: string;
  position: string;
  image_url: string;
  display_order: number;
}
