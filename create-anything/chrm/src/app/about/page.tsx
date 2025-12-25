import Header from "../components/Header";
import Footer from "../components/Footer";
import { Target, Eye, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col font-inter">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[#f8fafc] mb-4 font-poppins">
              About CHRMAA
            </h1>
            <p className="text-xl text-[#cbd5e1] max-w-3xl mx-auto">
              The CHRM Alumni Association is dedicated to building a strong
              community of HR professionals who support, inspire, and empower
              each other.
            </p>
          </div>

          {/* Mission, Vision, Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Mission */}
            <div className="bg-[#1e293b] p-8 rounded-lg border border-[#334155]">
              <div className="bg-[#d69e2e] w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Target className="text-[#0f172a]" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-[#f8fafc] mb-4 font-poppins">
                Our Mission
              </h2>
              <p className="text-[#cbd5e1]">
                To create a vibrant network of CHRM graduates, fostering
                professional growth, collaboration, and lifelong connections in
                the field of Human Resource Management.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-[#1e293b] p-8 rounded-lg border border-[#334155]">
              <div className="bg-[#2563eb] w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Eye className="text-white" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-[#f8fafc] mb-4 font-poppins">
                Our Vision
              </h2>
              <p className="text-[#cbd5e1]">
                To be the leading alumni association for HR professionals,
                recognized for excellence in networking, mentorship, and career
                development support.
              </p>
            </div>

            {/* Values */}
            <div className="bg-[#1e293b] p-8 rounded-lg border border-[#334155]">
              <div className="bg-[#d69e2e] w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Heart className="text-[#0f172a]" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-[#f8fafc] mb-4 font-poppins">
                Our Values
              </h2>
              <p className="text-[#cbd5e1]">
                Integrity, collaboration, excellence, innovation, and commitment
                to the continuous development of our members and the HR
                profession.
              </p>
            </div>
          </div>

          {/* What We Do */}
          <div className="bg-[#1e293b] p-8 rounded-lg border border-[#334155] mb-12">
            <h2 className="text-3xl font-bold text-[#f8fafc] mb-6 font-poppins">
              What We Do
            </h2>
            <div className="space-y-4 text-[#cbd5e1]">
              <p>
                <strong className="text-[#d69e2e]">
                  Professional Networking:
                </strong>{" "}
                We organize regular meetups, conferences, and networking events
                to help alumni connect and collaborate.
              </p>
              <p>
                <strong className="text-[#d69e2e]">Career Development:</strong>{" "}
                Access workshops, training sessions, and mentorship programs
                designed to advance your HR career.
              </p>
              <p>
                <strong className="text-[#d69e2e]">Knowledge Sharing:</strong>{" "}
                Stay updated with the latest HR trends, best practices, and
                industry insights through our events and resources.
              </p>
              <p>
                <strong className="text-[#d69e2e]">Community Support:</strong>{" "}
                Be part of a supportive community that celebrates achievements
                and provides assistance during challenges.
              </p>
            </div>
          </div>

          {/* Membership Benefits */}
          <div className="bg-gradient-to-br from-[#d69e2e] to-[#b8832a] p-8 rounded-lg">
            <h2 className="text-3xl font-bold text-[#0f172a] mb-6 font-poppins">
              Membership Benefits
            </h2>
            <ul className="space-y-3 text-[#1e293b]">
              <li className="flex items-start">
                <span className="text-[#0f172a] mr-2">✓</span>
                <span>Exclusive access to alumni events and workshops</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0f172a] mr-2">✓</span>
                <span>5% discount on all event registrations</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0f172a] mr-2">✓</span>
                <span>Access to job opportunities and career resources</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0f172a] mr-2">✓</span>
                <span>Official CHRMAA membership certificate</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0f172a] mr-2">✓</span>
                <span>Exclusive merchandise and branded items</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#0f172a] mr-2">✓</span>
                <span>Networking with HR professionals across industries</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}