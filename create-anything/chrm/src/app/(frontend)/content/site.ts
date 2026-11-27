/**
 * Static copy and navigation for the public site.
 * Keeping it here (rather than inline in JSX) lets the society update wording
 * in one place.
 */
import type { ShippingOption, StoreCategory } from "../types/merchandise";

export interface NavItem {
  label: string;
  href: string;
  /** Rendered as a non-interactive label until the page exists. */
  comingSoon?: boolean;
}

export const PUBLIC_NAV: NavItem[] = [
  { label: "Old Turians", href: "/" },
  { label: "Alumni stories", href: "/stories", comingSoon: true },
  { label: "Membership", href: "/payments" },
  { label: "Events", href: "/events" },
  { label: "Merchandise", href: "/merchandise" },
  { label: "About us", href: "/about" },
  { label: "Get in touch", href: "/contact" },
];

/** Inserted after "Membership" for signed-in members. */
export const MEMBER_NAV_ITEM: NavItem = { label: "Find old friends", href: "/member/directory" };

export const ROUTES = {
  home: "/",
  login: "/login",
  membership: "/payments",
  events: "/events",
  store: "/merchandise",
  about: "/about",
  contact: "/contact",
  directory: "/member/directory",
  memberDashboard: "/member/dashboard",
  adminDashboard: "/admin/dashboard",
  profileEdit: "/member/dashboard/profile/edit",
} as const;

export const SOCIETY = {
  name: "The Old Turian Society",
  school: "St Andrew's Turi",
  schoolFull: "St Andrew's School, Turi",
  motto: "Seeking the Highest",
  founded: 1931,
  tagline:
    "Preserving our heritage, fostering lifelong connections across East Africa and globally, and supporting future generations since 1931.",
  address: ["St Andrew's School, Turi", "P.O. Private Bag, Molo 20106", "Kenya"],
  generalEmail: "oldturians@standrewsturi.com",
  timeZone: "Africa/Nairobi",
} as const;

export const HOME_STATS = [
  { value: "4,500+", label: "Global Old Turians" },
  { value: "38", label: "Countries represented" },
  { value: "1931", label: "Year established" },
] as const;

export interface Pillar {
  title: string;
  body: string;
  href: string;
  /** Shown in the image placeholder until official photography arrives. */
  photoNote: string;
}

export const PILLARS: Pillar[] = [
  {
    title: "Global network",
    body: "Connecting Old Turians across East Africa, the UK, North America and worldwide through dedicated regional chapters.",
    href: ROUTES.profileEdit,
    photoNote: "Photo pending: alumni gathering",
  },
  {
    title: "Enduring heritage",
    body: "Preserving ninety-five years of tradition, excellence and the foundational values of St Andrew’s School, Turi.",
    href: ROUTES.about,
    photoNote: "Photo pending: school archive",
  },
  {
    title: "Global events and reunions",
    body: "Annual gatherings, regional dinners and milestone reunions.",
    href: ROUTES.events,
    photoNote: "Photo pending: reunion dinner",
  },
  {
    title: "Official memorabilia",
    body: "Tailored blazers, crest ties and archival publications dispatchable worldwide via DHL international shipping.",
    href: ROUTES.store,
    photoNote: "Photo pending: blazer and crest tie",
  },
];

export const ABOUT_QUICK_LINKS = [
  { label: "Our purpose", href: "#purpose" },
  { label: "Vision, mission and values", href: "#vision" },
  { label: "Our history", href: "#history" },
  { label: "Executive committee", href: "#leadership" },
] as const;

export const PRINCIPLES = [
  {
    title: "Our mission",
    body: "To establish and enhance mutually beneficial and enduring relationships between the alumni, students, and school fraternity.",
  },
  {
    title: "Our vision",
    body: "To stand as the premier alumni network in Sub-Saharan Africa, recognized for global leadership and community impact.",
  },
  {
    title: "Key objectives",
    body: "Advising school management, facilitating student mentorship, connecting alumni professionally, and funding bursaries.",
  },
] as const;

/** Placeholder seats shown until officials are published. */
export const COMMITTEE_PLACEHOLDERS = ["Chair", "Secretary", "Treasurer", "Member"] as const;

export const CONTACT_CHANNELS = [
  {
    title: "Email",
    note: "We respond within 24 hours",
    items: [
      { text: "alumni@turi.ac.ke", href: "mailto:alumni@turi.ac.ke" },
      { text: "oldturians@turi.ac.ke", href: "mailto:oldturians@turi.ac.ke" },
    ],
  },
  {
    title: "Phone",
    note: "Speak with our alumni office",
    items: [
      { text: "+254 700 773 322", href: "tel:+254700773322" },
      { text: "+254 733 883 322", href: "tel:+254733883322" },
    ],
  },
  {
    title: "Location",
    note: "Visit our alumni centre",
    items: [{ text: "St Andrews Turi, Kenya" }, { text: "Nairobi Liaison Office" }],
  },
] as const;

export const OFFICE_HOURS = [
  { day: "Monday to Friday", time: "8:00 AM to 5:00 PM" },
  { day: "Saturday", time: "9:00 AM to 2:00 PM" },
  { day: "Sunday and public holidays", time: "Closed" },
] as const;

export const CONTACT_QUICK_LINKS = [
  { label: "Membership", href: ROUTES.membership },
  { label: "Events", href: ROUTES.events },
  { label: "Merchandise", href: ROUTES.store },
  { label: "About us", href: ROUTES.about },
] as const;

export const STORE_CATEGORIES: ReadonlyArray<{ value: StoreCategory; label: string; keywords: string[] }> = [
  { value: "all", label: "All", keywords: [] },
  { value: "blazers", label: "Blazers", keywords: ["blazer", "jacket"] },
  { value: "ties", label: "Ties", keywords: ["tie"] },
  { value: "publications", label: "Publications", keywords: ["publication", "book", "archive", "magazine"] },
];

export const SHIPPING_METHODS: ShippingOption[] = [
  { id: "dhl_express", label: "DHL Express Worldwide", price: 45, time: "2-4 business days" },
  { id: "dhl_economy", label: "DHL Economy Select", price: 25, time: "5-8 business days" },
  { id: "pickup", label: "Pickup from School", price: 0, time: "Ready in 2-3 days" },
];

export const SHIPPING_COUNTRIES = ["Kenya", "United Kingdom", "United States", "Canada", "Australia", "South Africa", "Other"];

/** Lifetime membership fee in KES. */
export const REGISTRATION_FEE = 1;

export const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia",
  "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium",
  "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad",
  "Chile", "China", "Colombia", "Comoros", "Congo, Democratic Republic of the", "Congo, Republic of the",
  "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica",
  "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini",
  "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada",
  "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India",
  "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya",
  "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya",
  "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
  "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia",
  "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand",
  "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau",
  "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar",
  "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines",
  "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa",
  "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago",
  "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia",
  "Zimbabwe",
];
