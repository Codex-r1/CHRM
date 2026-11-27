"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../../(backend)/lib/supabase/client";
import { useAuth } from "../../../../../(backend)/context/auth";
import SiteShell from "../../../../components/site/SiteShell";
import { AutoGrid, Notice, Section } from "../../../../components/site/primitives";
import { Button, ButtonLink, Field, Input, NativeSelect, Spinner } from "../../../../components/ui";
import { COUNTRIES, ROUTES } from "../../../../content/site";

const KENYAN_COUNTIES = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet", "Embu", "Garissa", "Homa Bay", "Isiolo", "Kajiado", "Kakamega",
  "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni",
  "Mandera", "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira",
  "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita Taveta", "Tana River", "Tharaka Nithi", "Trans Nzoia", "Turkana",
  "Uasin Gishu", "Vihiga", "Wajir", "West Pokot",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1935 + 1 }, (_, i) => String(CURRENT_YEAR - i));
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

type ProfileForm = {
  full_name: string;
  phone_number: string;
  graduation_year: string;
  course: string;
  country: string;
  county: string;
};

const EMPTY: ProfileForm = { full_name: "", phone_number: "", graduation_year: "", course: "", country: "", county: "" };

/** Accepts Kenyan local formats (07…, 01…) and international numbers (+44…, 254…). */
const isValidPhone = (raw: string) => /^(\+?\d{9,15}|0\d{9})$/.test(raw.replace(/[\s()-]/g, ""));

export default function EditProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<ProfileForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Avatar: the saved URL, a newly picked file (+ preview), and an explicit "remove" flag.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error: fetchError } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (fetchError) {
        setError("We couldn't load your profile. Please refresh the page.");
      } else if (data) {
        setForm({
          full_name: data.full_name || "",
          phone_number: data.phone_number || "",
          graduation_year: data.graduation_year?.toString() || "",
          course: data.course || "",
          country: data.country || "",
          county: data.county || "",
        });
        setAvatarUrl(data.avatar_url || null);
      }
    } catch {
      setError("An unexpected error occurred while loading your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.push(`${ROUTES.login}?redirect=${encodeURIComponent(ROUTES.profileEdit)}`);
    else fetchProfile(user.id);
  }, [user, authLoading, router, fetchProfile]);

  const update = (key: keyof ProfileForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (error) setError(null);
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file (JPG, PNG or GIF).");
    if (file.size > MAX_AVATAR_BYTES) return setError("Photos must be smaller than 5MB.");
    setAvatarFile(file);
    setAvatarRemoved(false);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearPickedAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const removeAvatar = () => {
    clearPickedAvatar();
    setAvatarRemoved(true);
  };

  const deleteStoredAvatar = async (userId: string, url: string) => {
    const name = url.split("/").pop();
    if (name) await supabase.storage.from("avatars").remove([`${userId}/${name}`]);
  };

  const uploadAvatar = async (userId: string): Promise<string> => {
    setUploadingAvatar(true);
    try {
      if (avatarUrl) await deleteStoredAvatar(userId, avatarUrl);
      const ext = avatarFile!.name.split(".").pop();
      const filePath = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatarFile!, { cacheControl: "3600", upsert: true });
      if (uploadError) throw new Error("Your photo couldn't be uploaded. Please try a different image.");
      return supabase.storage.from("avatars").getPublicUrl(filePath).data.publicUrl;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const validate = (): string | null => {
    if (!form.full_name.trim()) return "Please enter your full name.";
    if (!form.phone_number.trim()) return "Please enter your phone number.";
    if (!isValidPhone(form.phone_number)) return "Please enter a valid phone number, e.g. 0712 345 678 or +44 7700 900123.";
    if (!form.graduation_year) return "Please choose your graduation year.";
    if (!form.country) return "Please choose your country of residence.";
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);

    try {
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(user.id);
      } else if (avatarRemoved && avatarUrl) {
        await deleteStoredAvatar(user.id, avatarUrl);
        newAvatarUrl = null;
      }

      const updateData: Record<string, unknown> = {
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
        graduation_year: parseInt(form.graduation_year, 10),
        course: form.course.trim() || null,
        country: form.country,
        county: form.country === "Kenya" ? form.county || null : null,
        updated_at: new Date().toISOString(),
      };
      if (newAvatarUrl !== avatarUrl) updateData.avatar_url = newAvatarUrl;

      const { error: updateError } = await supabase.from("profiles").update(updateData).eq("id", user.id);
      if (updateError) {
        setError(
          updateError.message.includes("duplicate key") && updateError.message.includes("phone")
            ? "This phone number is already registered to another member."
            : "Your profile couldn't be saved. Please try again.",
        );
        return;
      }

      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);
      setAvatarRemoved(false);
      setSuccess(true);
      setTimeout(() => router.push(`${ROUTES.memberDashboard}?tab=profile`), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <SiteShell>
        <Section spacing="last" style={{ paddingTop: "var(--space-24)", display: "flex", justifyContent: "center", color: "var(--brand)" }}>
          <Spinner size={32} label="Loading profile" />
        </Section>
      </SiteShell>
    );
  }

  const shownAvatar = avatarPreview || (avatarRemoved ? null : avatarUrl);
  const initials = form.full_name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join("") || "OT";

  return (
    <SiteShell>
      <Section spacing="intro" style={{ paddingTop: "var(--space-10)" }}>
        <nav className="ot-breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: "var(--space-6)" }}>
          <Link href={ROUTES.memberDashboard}>Dashboard</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Edit profile</span>
        </nav>
        <div className="ot-intro" style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <div className="ot-stack" style={{ gap: "var(--space-3)" }}>
            <span className="ot-caption">Members&rsquo; area</span>
            <h1 className="ot-hero">Your details</h1>
          </div>
          <p className="ot-lede" style={{ maxWidth: 480 }}>
            Keep your details current so classmates can find you and we can reach you about reunions and events.
          </p>
        </div>
      </Section>

      <Section spacing="last">
        <AutoGrid min={340} gap="var(--space-12)" style={{ alignItems: "start" }}>
          <form id="profile-form" onSubmit={handleSubmit} className="ot-stack ot-span-2" style={{ gap: "var(--space-12)", minWidth: 0 }} noValidate>
            {success && <Notice tone="success">Profile saved. Taking you back to your dashboard&hellip;</Notice>}
            {error && <Notice tone="danger">{error}</Notice>}

            {/* 01 Photo */}
            <AutoGrid min={200} gap="var(--space-6)" className="ot-rule-top">
              <div className="ot-stack" style={{ gap: "var(--space-1)" }}>
                <span className="ot-caption">01</span>
                <h2 className="ot-h3">Photo</h2>
              </div>
              <div className="ot-span-2" style={{ display: "flex", gap: "var(--space-6)", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ width: 96, height: 96, borderRadius: 999, overflow: "hidden", background: "var(--brand-deep)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 28, flex: "none" }}>
                  {shownAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={shownAvatar} alt="Your profile photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span aria-hidden="true">{initials}</span>
                  )}
                </div>
                <div className="ot-stack" style={{ gap: "var(--space-3)" }}>
                  <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                    <label className="ui-btn ui-btn--outline" style={{ cursor: "pointer" }}>
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="ot-sr-only" />
                      {shownAvatar ? "Change photo" : "Upload photo"}
                    </label>
                    {avatarFile ? (
                      <Button variant="ghost" onClick={clearPickedAvatar}>
                        Undo
                      </Button>
                    ) : (
                      shownAvatar && (
                        <Button variant="ghost" onClick={removeAvatar}>
                          Remove
                        </Button>
                      )
                    )}
                  </div>
                  <span className="ot-caption">
                    {avatarFile ? `Selected: ${avatarFile.name}. Saved when you press Save changes.` : avatarRemoved ? "Photo will be removed when you save." : "Square image, at least 200×200px. JPG, PNG or GIF, up to 5MB."}
                  </span>
                </div>
              </div>
            </AutoGrid>

            {/* 02 Personal */}
            <AutoGrid min={200} gap="var(--space-6)" className="ot-rule-top">
              <div className="ot-stack" style={{ gap: "var(--space-1)" }}>
                <span className="ot-caption">02</span>
                <h2 className="ot-h3">Personal details</h2>
              </div>
              <div className="ot-stack ot-span-2" style={{ gap: "var(--space-4)", minWidth: 0 }}>
                <Field label="Full name" htmlFor="p-name" required>
                  <Input id="p-name" autoComplete="name" value={form.full_name} onChange={update("full_name")} />
                </Field>
                <Field label="Email address" htmlFor="p-email" description="Your email is your login and can't be changed here. Contact the alumni office if it needs updating.">
                  <Input id="p-email" type="email" value={user?.email || ""} readOnly disabled />
                </Field>
                <Field label="Phone number" htmlFor="p-phone" required description="Used for M-PESA payments and event reminders.">
                  <Input id="p-phone" type="tel" autoComplete="tel" placeholder="0712 345 678 or +44 7700 900123" value={form.phone_number} onChange={update("phone_number")} />
                </Field>
              </div>
            </AutoGrid>

            {/* 03 School + location */}
            <AutoGrid min={200} gap="var(--space-6)" className="ot-rule-top">
              <div className="ot-stack" style={{ gap: "var(--space-1)" }}>
                <span className="ot-caption">03</span>
                <h2 className="ot-h3">Turi and today</h2>
              </div>
              <div className="ot-stack ot-span-2" style={{ gap: "var(--space-4)", minWidth: 0 }}>
                <AutoGrid min={180} gap="var(--space-4)">
                  <Field label="Graduation year" htmlFor="p-year" required>
                    <NativeSelect id="p-year" options={YEARS} placeholder="Select year" value={form.graduation_year} onChange={update("graduation_year")} />
                  </Field>
                  <Field label="Course (optional)" htmlFor="p-course">
                    <Input id="p-course" value={form.course} onChange={update("course")} />
                  </Field>
                </AutoGrid>
                <AutoGrid min={180} gap="var(--space-4)">
                  <Field label="Country of residence" htmlFor="p-country" required>
                    <NativeSelect id="p-country" options={COUNTRIES} placeholder="Select country" value={form.country} onChange={update("country")} />
                  </Field>
                  {form.country === "Kenya" && (
                    <Field label="County (optional)" htmlFor="p-county">
                      <NativeSelect id="p-county" options={KENYAN_COUNTIES} placeholder="Select county" value={form.county} onChange={update("county")} />
                    </Field>
                  )}
                </AutoGrid>
              </div>
            </AutoGrid>
          </form>

          <aside className="ot-panel ot-panel--lg ot-sticky">
            <h2 className="ot-title">Save your changes</h2>
            <p className="ot-dense ot-muted">Your name, class year, course and country appear in the alumni directory.</p>
            <Button type="submit" form="profile-form" size="lg" block loading={saving || uploadingAvatar} disabled={success}>
              {uploadingAvatar ? "Uploading photo" : saving ? "Saving" : "Save changes"}
            </Button>
            <ButtonLink href={ROUTES.memberDashboard} variant="ghost" block>
              Cancel
            </ButtonLink>
          </aside>
        </AutoGrid>
      </Section>
    </SiteShell>
  );
}
