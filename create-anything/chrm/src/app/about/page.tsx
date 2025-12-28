"use client";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  Users,
  Award,
  Target,
  Network,
} from "lucide-react";

export default function AboutPage() {
  const navigateHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  // Updated officials data based on the provided information
  const officials = [
    {
      name: "Rev. Canon Stephine Opiyo Obong'o",
      position: "Chair",
    },
    {
      name: "Ms. Vivian Perose",
      position: "Vice Chair",
    },
    {
      name: "Mrs. Roselyn Mugavana",
      position: "Honorary Secretary",
    },
    {
      name: "Mr. Jeshurun Baraka",
      position: "Member",
    },
    {
      name: "Ms. Brenda Abwavo",
      position: "Member",
    },
    {
      name: "Ms. Loise Mugure",
      position: "Member",
    },
    {
      name: "Mr. Moses Maina",
      position: "CHRM Head of Business Development",
    },
  ];

  const administrator = {
    name: "MS Mercy Wambui",
    position: "CHRMAA Administrator",
    email: "alumni@chrm.or.ke",
    phone: ["0700773322", "0733883322"],
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-[#121212] transition-colors duration-200">
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        {/* Mission & Vision Section */}
        <section className="bg-white dark:bg-[#1E1E1E] border border-[#E7ECF3] dark:border-[#2A2A2A] rounded-xl p-8 md:p-12 transition-colors duration-200">
          <div className="text-center mb-12">
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-[#0B0F1A] dark:text-[#E5E7EB] mb-6 transition-colors duration-200">
              About CHRM Alumni Association
            </h2>
            <p className="font-inter text-lg text-[#6D7A8B] dark:text-[#9CA3AF] leading-relaxed max-w-4xl mx-auto transition-colors duration-200">
              CHRMAA was established to provide its Alumni with a platform for
              networking, mentorship, and to promote the growth of the college
              through marketing, advising management on areas of improvement,
              linking students to the job market, mentoring students,
              facilitating networking, and supporting community service.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-[#E8F4FD] dark:bg-[#1A2F42] rounded-lg transition-colors duration-200">
              <div className="w-16 h-16 bg-[#2B4C73] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Target size={24} />
              </div>
              <h3 className="font-montserrat font-bold text-xl text-[#0B0F1A] dark:text-[#E5E7EB] mb-4 transition-colors duration-200">
                Our Mission
              </h3>
              <p className="font-inter text-[#6D7A8B] dark:text-[#9CA3AF] transition-colors duration-200">
                To establish and enhance mutually beneficial and enduring
                relationships between the alumni, students, and the college
                fraternity.
              </p>
            </div>

            <div className="text-center p-6 bg-[#FFF4E6] dark:bg-[#3D2B1A] rounded-lg transition-colors duration-200">
              <div className="w-16 h-16 bg-[#FF7A00] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Award size={24} />
              </div>
              <h3 className="font-montserrat font-bold text-xl text-[#0B0F1A] dark:text-[#E5E7EB] mb-4 transition-colors duration-200">
                Our Vision
              </h3>
              <p className="font-inter text-[#6D7A8B] dark:text-[#9CA3AF] transition-colors duration-200">
                Be the model alumni association in the region.
              </p>
            </div>

            <div className="text-center p-6 bg-[#FFF0F0] dark:bg-[#3D1A1A] rounded-lg transition-colors duration-200">
              <div className="w-16 h-16 bg-[#E53E3E] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={24} />
              </div>
              <h3 className="font-montserrat font-bold text-xl text-[#0B0F1A] dark:text-[#E5E7EB] mb-4 transition-colors duration-200">
                Key Functions
              </h3>
              <p className="font-inter text-[#6D7A8B] dark:text-[#9CA3AF] transition-colors duration-200">
                Advising college management, linking students to employment,
                providing mentorship, facilitating networking, and supporting
                community service.
              </p>
            </div>
          </div>
        </section>
{/* Core Values Section */}
        <section className="bg-white dark:bg-[#1E1E1E] border border-[#E7ECF3] dark:border-[#2A2A2A] rounded-xl p-8 md:p-12 transition-colors duration-200">
          <div className="text-center mb-12">
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-[#0B0F1A] dark:text-[#E5E7EB] mb-6 transition-colors duration-200">
              Our Core Values
            </h2>
            <p className="font-inter text-lg text-[#6D7A8B] dark:text-[#9CA3AF] transition-colors duration-200">
              These principles guide all CHRMAA operations and reflect our
              aspiration to be the Alumni Association of choice in the region.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-[#E8F4FD] dark:bg-[#1A2F42] rounded-lg transition-colors duration-200">
              <div className="w-16 h-16 bg-[#2B4C73] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={24} />
              </div>
              <h3 className="font-montserrat font-bold text-lg text-[#0B0F1A] dark:text-[#E5E7EB] mb-3 transition-colors duration-200">
                Relational
              </h3>
              <p className="font-inter text-sm text-[#6D7A8B] dark:text-[#9CA3AF] transition-colors duration-200">
                Building and maintaining strong relationships with students,
                staff, alumni, and stakeholders.
              </p>
            </div>

            <div className="text-center p-6 bg-[#FFF4E6] dark:bg-[#3D2B1A] rounded-lg transition-colors duration-200">
              <div className="w-16 h-16 bg-[#FF7A00] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Award size={24} />
              </div>
              <h3 className="font-montserrat font-bold text-lg text-[#0B0F1A] dark:text-[#E5E7EB] mb-3 transition-colors duration-200">
                Empower
              </h3>
              <p className="font-inter text-sm text-[#6D7A8B] dark:text-[#9CA3AF] transition-colors duration-200">
                Providing opportunities for skill development, mentorship, and
                leadership growth.
              </p>
            </div>

            <div className="text-center p-6 bg-[#FFF0F0] dark:bg-[#3D1A1A] rounded-lg transition-colors duration-200">
              <div className="w-16 h-16 bg-[#E53E3E] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Target size={24} />
              </div>
              <h3 className="font-montserrat font-bold text-lg text-[#0B0F1A] dark:text-[#E5E7EB] mb-3 transition-colors duration-200">
                Professionalism
              </h3>
              <p className="font-inter text-sm text-[#6D7A8B] dark:text-[#9CA3AF] transition-colors duration-200">
                Promoting ethical conduct, accountability, and high standards.
              </p>
            </div>

            <div className="text-center p-6 bg-[#E8F4FD] dark:bg-[#1A2F42] rounded-lg transition-colors duration-200">
              <div className="w-16 h-16 bg-[#2B4C73] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Network size={24} />
              </div>
              <h3 className="font-montserrat font-bold text-lg text-[#0B0F1A] dark:text-[#E5E7EB] mb-3 transition-colors duration-200">
                Create Value
              </h3>
              <p className="font-inter text-sm text-[#6D7A8B] dark:text-[#9CA3AF] transition-colors duration-200">
                Focusing on innovation, creativity, and research that benefits
                society.
              </p>
            </div>
          </div>
        </section>
        {/* Officials Section - ADDED */}
        <section className="bg-white dark:bg-[#1E1E1E] border border-[#E7ECF3] dark:border-[#2A2A2A] rounded-xl p-8 md:p-12 transition-colors duration-200">
          <div className="text-center mb-12">
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-[#0B0F1A] dark:text-[#E5E7EB] mb-6 transition-colors duration-200">
              Officials of CHRMAA
            </h2>
            <p className="font-inter text-lg text-[#6D7A8B] dark:text-[#9CA3AF] transition-colors duration-200">
              Meet the dedicated professionals who lead our alumni association
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {officials.map((official, index) => (
              <div
                key={index}
                className="bg-[#F8FAFC] dark:bg-[#2A2A2A] border border-[#E7ECF3] dark:border-[#3A3A3A] rounded-xl p-6 text-center transition-colors duration-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-[#2B4C73] to-[#FF7A00] rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  <User size={28} />
                </div>
                <h3 className="font-montserrat font-bold text-lg text-[#0B0F1A] dark:text-[#E5E7EB] mb-2 transition-colors duration-200">
                  {official.name}
                </h3>
                <p className="font-inter font-semibold text-sm text-[#2B4C73] dark:text-[#4A6B8A] transition-colors duration-200">
                  {official.position}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Administrator Section - ADDED */}
        <section className="bg-white dark:bg-[#1E1E1E] border border-[#E7ECF3] dark:border-[#2A2A2A] rounded-xl p-8 md:p-12 transition-colors duration-200">
          <div className="text-center mb-12">
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-[#0B0F1A] dark:text-[#E5E7EB] mb-6 transition-colors duration-200">
              Administrator
            </h2>
          </div>

          <div className="flex flex-col md:flex-row items-center max-w-4xl mx-auto gap-12">
            <div className="flex-shrink-0">
              <div className="w-40 h-40 bg-gradient-to-br from-[#2B4C73] to-[#FF7A00] rounded-full flex items-center justify-center text-white">
                <User size={48} />
              </div>
            </div>

            <div className="text-center md:text-left flex-1">
              <h3 className="font-montserrat font-bold text-2xl text-[#0B0F1A] dark:text-[#E5E7EB] mb-3 transition-colors duration-200">
                {administrator.name}
              </h3>
              <p className="font-inter font-semibold text-lg text-[#2B4C73] dark:text-[#4A6B8A] mb-6 transition-colors duration-200">
                {administrator.position}
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-center md:justify-start">
                  <Mail size={20} className="text-[#2B4C73] dark:text-[#4A6B8A] mr-3" />
                  <a
                    href={`mailto:${administrator.email}`}
                    className="font-inter text-lg text-[#2B4C73] dark:text-[#4A6B8A] hover:text-[#1E3A5F] dark:hover:text-[#2B4C73] transition-colors duration-200"
                  >
                    {administrator.email}
                  </a>
                </div>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <div className="flex items-center">
                    <Phone size={20} className="text-[#2B4C73] dark:text-[#4A6B8A] mr-3" />
                    <span className="font-inter text-lg text-[#6D7A8B] dark:text-[#9CA3AF]">
                      Phone Numbers:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    {administrator.phone.map((phone, index) => (
                      <a
                        key={index}
                        href={`tel:+254${phone.substring(1)}`}
                        className="font-inter text-lg text-[#2B4C73] dark:text-[#4A6B8A] hover:text-[#1E3A5F] dark:hover:text-[#2B4C73] transition-colors duration-200"
                      >
                        {phone}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Journey Section - ADDED */}
        <section className="bg-gradient-to-r from-[#E8F4FD] to-[#FFF4E6] dark:from-[#1A2F42] dark:to-[#3D2B1A] rounded-xl p-8 md:p-12 transition-colors duration-200">
          <div className="text-center mb-12">
            <h2 className="font-poppins font-bold text-3xl md:text-4xl text-[#0B0F1A] dark:text-[#E5E7EB] mb-6 transition-colors duration-200">
              Our Journey
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <p className="font-inter text-lg text-[#6D7A8B] dark:text-[#9CA3AF] mb-6 leading-relaxed transition-colors duration-200">
              Since our establishment, the CHRM Alumni Association has grown
              from a small group of passionate HR professionals to a thriving
              network of over 1,000 members across the country. Our alumni have
              gone on to lead major organizations, start successful
              consultancies, and drive positive change in workplaces across
              various industries.
            </p>

            <p className="font-inter text-lg text-[#6D7A8B] dark:text-[#9CA3AF] mb-8 leading-relaxed transition-colors duration-200">
              Through our events, workshops, and networking opportunities, we
              continue to strengthen the bonds between our members and provide
              valuable resources for career advancement and professional
              development. Our commitment to excellence in human resource
              management remains unwavering as we look toward the future.
            </p>

            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div className="bg-white/50 dark:bg-black/20 p-6 rounded-lg">
                <div className="font-poppins font-bold text-3xl text-[#2B4C73] dark:text-[#4A6B8A] transition-colors duration-200">
                  1,000+
                </div>
                <div className="font-inter text-sm text-[#6D7A8B] dark:text-[#9CA3AF] transition-colors duration-200">
                  Alumni Members
                </div>
              </div>
              <div className="bg-white/50 dark:bg-black/20 p-6 rounded-lg">
                <div className="font-poppins font-bold text-3xl text-[#FF7A00] dark:text-[#FF9533] transition-colors duration-200">
                  10+
                </div>
                <div className="font-inter text-sm text-[#6D7A8B] dark:text-[#9CA3AF] transition-colors duration-200">
                  Programs Offered
                </div>
              </div>
              <div className="bg-white/50 dark:bg-black/20 p-6 rounded-lg">
                <div className="font-poppins font-bold text-3xl text-[#E53E3E] dark:text-[#FC8181] transition-colors duration-200">
                  10+
                </div>
                <div className="font-inter text-sm text-[#6D7A8B] dark:text-[#9CA3AF] transition-colors duration-200">
                  Years of Excellence
                </div>
              </div>
              <div className="bg-white/50 dark:bg-black/20 p-6 rounded-lg">
                <div className="font-poppins font-bold text-3xl text-[#2B4C73] dark:text-[#4A6B8A] transition-colors duration-200">
                  95%
                </div>
                <div className="font-inter text-sm text-[#6D7A8B] dark:text-[#9CA3AF] transition-colors duration-200">
                  Career Growth
                </div>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </main>

      {/* Global styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
        
        .font-montserrat {
          font-family: 'Montserrat', sans-serif;
        }
        
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }
        
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}