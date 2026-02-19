"use client";

import { useState, useEffect } from "react";
import Footer from "../../../../components/Footer";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase/client";
import { useAuth } from "../../../../context/auth";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Camera,
  Upload,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// CHRMAA Colors
const COLORS = {
  darkBlue: "#2B4C73",
  gold: "#FF7A00",
  maroon: "#E53E3E",
  lightBlue: "#E8F4FD",
  lightGold: "#FFF4E6",
  lightMaroon: "#FFF0F0",
  white: "#FFFFFF",
  offWhite: "#F7F9FC",
  darkText: "#0B0F1A",
  lightText: "#6D7A8B",
  borderLight: "#E7ECF3",
};

// Kenyan counties array
const KENYAN_COUNTIES = [
  "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita Taveta",
  "Garissa", "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru", "Tharaka Nithi",
  "Embu", "Kitui", "Machakos", "Makueni", "Nyandarua", "Nyeri", "Kirinyaga",
  "Murang'a", "Kiambu", "Turkana", "West Pokot", "Samburu", "Trans Nzoia",
  "Uasin Gishu", "Elgeyo Marakwet", "Nandi", "Baringo", "Laikipia", "Nakuru",
  "Narok", "Kajiado", "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma",
  "Busia", "Siaya", "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi"
];

// Graduation years (last 20 years to current year)
const generateGraduationYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 30; i--) {
    years.push(i);
  }
  return years;
};

const CHRM_COURSES = [
  // Diploma / Higher Diploma Programmes
  "Diploma in Human Resource Management (KNEC)",
  "Diploma in Business Management",
  "Diploma in Banking and Finance",
  "Diploma in Supply Chain Management (KNEC)",
  "Diploma in Information Communication Technology (ICT) – KNEC",
  "Diploma in Computer Science / Computer Programming (TVET CDACC)",
  "Diploma in Cyber Security (TVET CDACC)",
  "Diploma in Criminal Justice (TVET CDACC)",
  "Diploma in Security Management (TVET CDACC)",
  "Diploma in Forensic Investigation (TVET CDACC)",
  "Diploma in Customer Service (ICM)",
  "Diploma in Digital Journalism Level 6",
  "Diploma in Food and Beverage Production (Culinary Arts) Level 6",
  "Diploma in Food and Beverage Sales Management Level 6",
  "Higher Diploma in Human Resource Management",

  // Certificate Courses
  "Certificate in Human Resource Management (KNEC)",
  "Certificate in Business Management (KNEC)",
  "Certificate in Banking and Finance (KNEC)",
  "Certificate in Supply Chain Management (KNEC)",
  "Certificate in Information Communication Technology (ICT) – KNEC",
  "Certificate in Security Management – TVET CDACC Level 5",
  "Certificate in Cyber Security – TVET CDACC Level 5",
  "Certificate in Forensic Investigation – TVET CDACC Level 5",
  "Certificate in Accounting and Management Skills (CAMS – KASNEB)",

  // Artisan & Vocational Courses
  "Artisan in Store-Keeping (KNEC)",
  "Artisan in Salesmanship (KNEC)",

  // Professional & Short-Courses / Specialized Trainings
  "ICT & Computer Application Packages",
  "Digital Marketing & Social Media Courses",
  "Graphic Design & CAD Courses",
  "Leadership & Management Training",
  "HR Consultancy Training",
  "CHRP",
  "HRCi",
  "Other Professional Short Courses",
];

export default function EditProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    graduation_year: "",
    course: "",
    county: "",
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        fetchProfileData();
      }
    }
  }, [user, authLoading, router]);

  const fetchProfileData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to load profile data");
      } else if (data) {
        setFormData({
          full_name: data.full_name || "",
          phone_number: data.phone_number || "",
          graduation_year: data.graduation_year?.toString() || "",
          course: data.course || "",
          county: data.county || "",
        });
        setAvatarUrl(data.avatar_url || null);
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return avatarUrl;

    try {
      setUploadingAvatar(true);

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      throw new Error('Failed to upload avatar: ' + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.full_name.trim()) {
      errors.push("Full name is required");
    }

    if (!formData.phone_number.trim()) {
      errors.push("Phone number is required");
    } else if (!/^(07|7|\+254|254)\d{8}$/.test(formData.phone_number.replace(/\s/g, ''))) {
      errors.push("Please enter a valid Kenyan phone number (e.g., 0712345678)");
    }

    if (!formData.graduation_year) {
      errors.push("Graduation year is required");
    }

    if (!formData.course.trim()) {
      errors.push("Course is required");
    }

    if (!formData.county.trim()) {
      errors.push("County is required");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(". "));
      setSaving(false);
      return;
    }

    if (!user) {
      setError("User not authenticated");
      setSaving(false);
      return;
    }

    try {
      // Upload avatar first if changed
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar();
      } else if (avatarPreview === null && avatarUrl) {
        // User removed avatar - we'll set it to null
        newAvatarUrl = null;
        
        // Delete from storage
        const oldPath = avatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Prepare update data
      const updateData: any = {
        full_name: formData.full_name.trim(),
        phone_number: formData.phone_number.trim(),
        graduation_year: parseInt(formData.graduation_year),
        course: formData.course.trim(),
        county: formData.county.trim(),
        updated_at: new Date().toISOString(),
      };

      // Only update avatar_url if it changed
      if (newAvatarUrl !== avatarUrl) {
        updateData.avatar_url = newAvatarUrl;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (updateError) {
        console.error("Update error:", updateError);
        
        if (updateError.message.includes("duplicate key")) {
          if (updateError.message.includes("phone_number")) {
            setError("This phone number is already registered. Please use a different number.");
          }
        } else {
          setError(`Failed to update profile: ${updateError.message}`);
        }
      } else {
        setSuccess(true);
        
        setTimeout(() => {
          router.push("/member/dashboard");
        }, 2000);
      }
    } catch (error: any) {
      console.error("Unexpected error:", error);
      setError(error.message || "An unexpected error occurred while updating your profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#2B4C73] animate-spin" />
          <div className="text-[#2B4C73] font-poppins">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-poppins">
      {/* Header */}
      <header className="bg-white border-b border-[#E7ECF3] sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/member/dashboard"
                className="p-2 hover:bg-[#F7F9FC] rounded-lg transition"
              >
                <ArrowLeft className="text-[#6D7A8B]" size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-[#0B0F1A]">
                  Edit Profile
                </h1>
                <p className="text-[#6D7A8B] text-sm">Update your personal information</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/member/dashboard"
                className="px-4 py-2 text-[#6D7A8B] hover:text-[#0B0F1A] transition font-medium"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={20} />
              <div>
                <p className="text-green-800 font-medium">Profile updated successfully!</p>
                <p className="text-green-600 text-sm">Redirecting to dashboard...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <XCircle className="text-red-600 mt-0.5" size={20} />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-[#E7ECF3] p-6 shadow-sm">
          {/* Avatar Section */}
          <div className="mb-8 pb-8 border-b border-[#E7ECF3]">
            <h2 className="text-lg font-semibold text-[#0B0F1A] mb-4">Profile Photo</h2>
            <div className="flex items-start gap-6">
              {/* Avatar Preview */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-[#F7F9FC] border-2 border-[#E7ECF3]">
                  {(avatarPreview || avatarUrl) ? (
                    <img
                      src={avatarPreview || avatarUrl || ''}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2B4C73] to-[#1E3A5F]">
                      <User className="text-white" size={32} />
                    </div>
                  )}
                </div>
                {(avatarPreview || avatarUrl) && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-1 -right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow-md"
                    title="Remove avatar"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="relative cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="px-4 py-2 bg-[#F7F9FC] border border-[#E7ECF3] rounded-lg hover:bg-[#E8F4FD] hover:border-[#2B4C73] transition flex items-center gap-2 text-[#0B0F1A]">
                      <Upload size={18} />
                      {avatarFile ? 'Change Photo' : 'Upload Photo'}
                    </div>
                  </label>
                  {avatarFile && (
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="px-4 py-2 bg-[#FFF0F0] border border-[#E53E3E]/20 rounded-lg hover:bg-[#FFE5E5] transition text-[#E53E3E] flex items-center gap-2"
                    >
                      <XCircle size={18} />
                      Cancel
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#6D7A8B] mt-3">
                  Recommended: Square image, at least 200x200px. Max size: 5MB (JPG, PNG, GIF)
                </p>
                {avatarFile && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle size={12} />
                    New photo selected: {avatarFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-[#6D7A8B] mb-2">
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    Full Name *
                  </div>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#F7F9FC] border border-[#E7ECF3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B4C73] focus:border-transparent transition"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-[#6D7A8B] mb-2">
                  <div className="flex items-center gap-2">
                    <Phone size={16} />
                    Phone Number *
                  </div>
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#F7F9FC] border border-[#E7ECF3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B4C73] focus:border-transparent transition"
                  placeholder="0712345678"
                  required
                />
                <p className="text-xs text-[#6D7A8B] mt-2">
                  Format: 07XX XXX XXX, 7XX XXX XXX, +2547XX XXX XXX, or 2547XX XXX XXX
                </p>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-[#6D7A8B] mb-2">
                  <div className="flex items-center gap-2">
                    <Mail size={16} />
                    Email Address
                  </div>
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  className="w-full px-4 py-3 bg-gray-50 border border-[#E7ECF3] rounded-lg text-[#6D7A8B]"
                  readOnly
                  disabled
                />
                <p className="text-xs text-[#6D7A8B] mt-2">
                  Email cannot be changed
                </p>
              </div>

              {/* Graduation Year */}
              <div>
                <label className="block text-sm font-medium text-[#6D7A8B] mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    Graduation Year *
                  </div>
                </label>
                <select
                  name="graduation_year"
                  value={formData.graduation_year}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#F7F9FC] border border-[#E7ECF3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B4C73] focus:border-transparent transition appearance-none"
                  required
                >
                  <option value="">Select graduation year</option>
                  {generateGraduationYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Course */}
              <div>
                <label className="block text-sm font-medium text-[#6D7A8B] mb-2">
                  <div className="flex items-center gap-2">
                    <Award size={16} />
                    Course *
                  </div>
                </label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#F7F9FC] border border-[#E7ECF3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B4C73] focus:border-transparent transition appearance-none"
                  required
                >
                  <option value="">Select your course</option>
                  {CHRM_COURSES.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>

              {/* County */}
              <div>
                <label className="block text-sm font-medium text-[#6D7A8B] mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    County *
                  </div>
                </label>
                <select
                  name="county"
                  value={formData.county}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#F7F9FC] border border-[#E7ECF3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B4C73] focus:border-transparent transition appearance-none"
                  required
                >
                  <option value="">Select your county</option>
                  {KENYAN_COUNTIES.map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-[#E7ECF3]">
              <button
                type="submit"
                disabled={saving || uploadingAvatar}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#2B4C73] to-[#1E3A5F] text-white font-semibold rounded-lg hover:opacity-90 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {(saving || uploadingAvatar) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {uploadingAvatar ? 'Uploading...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
              
              <Link
                href="/member/dashboard"
                className="px-6 py-3 bg-white border border-[#E7ECF3] text-[#6D7A8B] font-medium rounded-lg hover:bg-[#F7F9FC] transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Important Notes */}
        <div className="mt-8 p-6 bg-[#FFF4E6] border border-[#FF7A00]/20 rounded-xl">
          <h3 className="text-lg font-semibold text-[#0B0F1A] mb-3">Important Information</h3>
          <ul className="space-y-2 text-sm text-[#6D7A8B]">
            <li className="flex items-start gap-2">
              <CheckCircle className="text-[#FF7A00] mt-0.5" size={16} />
              <span>Fields marked with * are required</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-[#FF7A00] mt-0.5" size={16} />
              <span>Your email address cannot be changed as it's your primary login</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-[#FF7A00] mt-0.5" size={16} />
              <span>Profile photo must be less than 5MB in size</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-[#FF7A00] mt-0.5" size={16} />
              <span>Supported image formats: JPG, PNG, GIF</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="text-[#FF7A00] mt-0.5" size={16} />
              <span>Ensure your phone number is correct for payment and notification purposes</span>
            </li>
          </ul>
        </div>
      </main>

      {/* Global Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }
        
        select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236D7A8B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 1.5em 1.5em;
          padding-right: 2.5rem;
        }
        
        select:focus {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%232B4C73'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
        }
      `}</style>
      <Footer />
    </div>
  );
}