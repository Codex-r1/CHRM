"use client";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  Users,
  Award,
  Target,
  Network,
  DollarSign,
  TrendingUp,
  Handshake,
} from "lucide-react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const iconAnimation: Variants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -90 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 200, damping: 15 },
  },
  hover: {
    scale: 1.1,
    rotate: 10,
    transition: { type: "spring", stiffness: 400, damping: 10 },
  },
};

const statAnimation: Variants = {
  hidden: { scale: 0 },
  visible: {
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

type Official = {
  id: string;
  name: string;
  position: string;
  image_url: string;
  display_order: number;
};

export default function AboutPage() {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOfficials = async () => {
      try {
        const res = await fetch('/api/public/officials');
        const data = await res.json();
        setOfficials(data.officials || []);
      } catch (error) {
        console.error('Failed to fetch officials:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOfficials();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#F7F9FC] light:bg-[#fff] transition-colors duration-200"
    >
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        {/* Mission & Vision Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeIn}
          className="bg-white light:bg-[#fff] p-8 md:p-12 transition-colors duration-200"
        >
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeUp}
              className="font-poppins font-bold text-3xl md:text-4xl text-[#000] dark:text-[#000] mb-6 transition-colors duration-200"
            >
              About CHRM Alumni Association
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={{ delay: 0.1 }}
              className="font-poppins text-lg text-[#000] dark:text-[#000] leading-relaxed max-w-4xl mx-auto transition-colors duration-200"
            >
              CHRMAA was established to provide the Alumni/graduates a platform for
              networking and mentorship as well as promote the growth of the college.
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-3 gap-8"
          >
            <motion.div
              variants={scaleIn}
              whileHover="hover"
              className="text-center p-6 bg-[#E8F4FD] dark:bg-[#1A2F42] rounded-lg transition-colors duration-200"
            >
              <motion.div
                variants={iconAnimation}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover="hover"
                className="w-16 h-16 bg-[#2B4C73] text-white rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Target size={24} />
              </motion.div>
              <motion.h3
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="font-poppins font-bold text-xl text-[#0B0F1A] dark:text-[#E5E7EB] mb-4 transition-colors duration-200"
              >
                Our Mission
              </motion.h3>
              <motion.p
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="font-poppins text-[#6D7A8B] dark:text-[#9CA3AF] transition-colors duration-200"
              >
                "To establish and enhance mutually beneficial and enduring
                relationship between the alumni, students and college fraternity."
              </motion.p>
            </motion.div>

            <motion.div
              variants={scaleIn}
              whileHover="hover"
              className="text-center p-6 bg-[#FFF4E6] dark:bg-[#3D2B1A] rounded-lg transition-colors duration-200"
            >
              <motion.div
                variants={iconAnimation}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover="hover"
                className="w-16 h-16 bg-[#FF7A00] text-white rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Award size={24} />
              </motion.div>
              <motion.h3
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="font-poppins font-bold text-xl text-[#0B0F1A] dark:text-[#E5E7EB] mb-4 transition-colors duration-200"
              >
                Our Vision
              </motion.h3>
              <motion.p
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="font-poppins text-[#6D7A8B] dark:text-[#9CA3AF] transition-colors duration-200"
              >
                "Be the model alumni association in the region."
              </motion.p>
            </motion.div>

            <motion.div
              variants={scaleIn}
              whileHover="hover"
              className="text-center p-6 bg-[#FFF0F0] dark:bg-[#3D1A1A] rounded-lg transition-colors duration-200"
            >
              <motion.div
                variants={iconAnimation}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                whileHover="hover"
                className="w-16 h-16 bg-[#E53E3E] text-white rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Users size={24} />
              </motion.div>
              <motion.h3
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="font-poppins font-bold text-xl text-[#0B0F1A] dark:text-[#E5E7EB] mb-4 transition-colors duration-200"
              >
                Key Functions
              </motion.h3>
              <motion.p
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="font-poppins text-[#6D7A8B] dark:text-[#9CA3AF] transition-colors duration-200"
              >
                Advising college management, linking students to employment,
                providing mentorship, facilitating networking, and supporting
                community service.
              </motion.p>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Strategic Goals Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeIn}
          className="bg-white light:bg-[#fff] p-8 md:p-12 transition-colors duration-200"
        >
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeUp}
              className="font-poppins font-bold text-3xl md:text-4xl text-[#000] dark:text-[#000] mb-6 transition-colors duration-200"
            >
              Our Strategic Goals
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={{ delay: 0.1 }}
              className="font-poppins text-lg text-[#000] dark:text-[#000] max-w-4xl mx-auto transition-colors duration-200"
            >
              Four key pillars that guide our association's growth and impact
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              {
                icon: Users,
                title: "Grow Membership",
                description: "Active & engaged paid up members",
                bgColor: "bg-[#E8F4FD] dark:bg-[#1A2F42]",
                iconColor: "bg-[#2B4C73]"
              },
              {
                icon: DollarSign,
                title: "Generate Revenue",
                description: "Financial Stability & Sustainability",
                bgColor: "bg-[#FFF4E6] dark:bg-[#3D2B1A]",
                iconColor: "bg-[#FF7A00]"
              },
              {
                icon: TrendingUp,
                title: "Leadership Development",
                description: "Strong Alumni Leadership",
                bgColor: "bg-[#FFF0F0] dark:bg-[#3D1A1A]",
                iconColor: "bg-[#E53E3E]"
              },
              {
                icon: Handshake,
                title: "Engage & Build Relationships",
                description: "Strong Partnerships & Collaborations with Stakeholders",
                bgColor: "bg-[#E8F4FD] dark:bg-[#1A2F42]",
                iconColor: "bg-[#2B4C73]"
              }
            ].map((goal, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover="hover"
                className={`text-center p-6 ${goal.bgColor} rounded-lg transition-colors duration-200`}
              >
                <motion.div
                  variants={iconAnimation}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover="hover"
                  className={`w-16 h-16 ${goal.iconColor} text-white rounded-full flex items-center justify-center mx-auto mb-4`}
                >
                  <goal.icon size={24} />
                </motion.div>
                <motion.h3
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="font-poppins font-bold text-lg text-[#0B0F1A] dark:text-[#E5E7EB] mb-3 transition-colors duration-200"
                >
                  {goal.title}
                </motion.h3>
                <motion.p
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="font-poppins text-sm text-[#6D7A8B] dark:text-[#9CA3AF] transition-colors duration-200"
                >
                  {goal.description}
                </motion.p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* Core Values Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeIn}
          className="bg-white light:bg-[#fff] p-8 md:p-12 transition-colors duration-200"
        >
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeUp}
              className="font-poppins font-bold text-3xl md:text-4xl text-[#000] dark:text-[#000] mb-6 transition-colors duration-200"
            >
              Our Core Values
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={{ delay: 0.1 }}
              className="font-poppins text-lg text-[#000] dark:text-[#000] transition-colors duration-200"
            >
              These principles guide all CHRMAA operations and reflect our
              aspiration to be the Alumni Association of choice in the region.
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              {
                icon: Users,
                title: "Relational",
                description: "Building and maintaining strong relationships with students, staff, alumni, and stakeholders.",
                bgColor: "bg-[#E8F4FD] dark:bg-[#1A2F42]",
                iconColor: "bg-[#2B4C73]"
              },
              {
                icon: Award,
                title: "Empower",
                description: "Providing opportunities for skill development, mentorship, and leadership growth.",
                bgColor: "bg-[#FFF4E6] dark:bg-[#3D2B1A]",
                iconColor: "bg-[#FF7A00]"
              },
              {
                icon: Target,
                title: "Professionalism",
                description: "Promoting ethical conduct, accountability, and high standards.",
                bgColor: "bg-[#FFF0F0] dark:bg-[#3D1A1A]",
                iconColor: "bg-[#E53E3E]"
              },
              {
                icon: Network,
                title: "Create Value",
                description: "Focusing on innovation, creativity, and research that benefits society.",
                bgColor: "bg-[#E8F4FD] dark:bg-[#1A2F42]",
                iconColor: "bg-[#2B4C73]"
              }
            ].map((value, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover="hover"
                className={`text-center p-6 ${value.bgColor} rounded-lg transition-colors duration-200`}
              >
                <motion.div
                  variants={iconAnimation}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover="hover"
                  className={`w-16 h-16 ${value.iconColor} text-white rounded-full flex items-center justify-center mx-auto mb-4`}
                >
                  <value.icon size={24} />
                </motion.div>
                <motion.h3
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="font-poppins font-bold text-lg text-[#0B0F1A] dark:text-[#E5E7EB] mb-3 transition-colors duration-200"
                >
                  {value.title}
                </motion.h3>
                <motion.p
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="font-poppins text-sm text-[#6D7A8B] dark:text-[#9CA3AF] transition-colors duration-200"
                >
                  {value.description}
                </motion.p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* Officials Section - Now fetching from database */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeIn}
          className="bg-white light:bg-[#fff] p-8 md:p-12 transition-colors duration-200"
        >
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeUp}
              className="font-poppins font-bold text-3xl md:text-4xl text-[#000] dark:text-[#000] mb-6 transition-colors duration-200"
            >
              Officials of CHRMAA
            </motion.h2>
            <motion.p
              variants={fadeUp}
              transition={{ delay: 0.1 }}
              className="font-poppins text-lg text-[#000] dark:text-[#000] transition-colors duration-200"
            >
              Meet the dedicated professionals who lead our alumni association
            </motion.p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2B4C73]"></div>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {officials.map((official) => (
                <motion.div
                  key={official.id}
                  variants={scaleIn}
                  whileHover={{ scale: 1.03 }}
                  className="flex flex-col items-center"
                >
                  {/* Image Card */}
                  <div className="relative w-full h-[320px] rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={official.image_url}
                      alt={official.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Photo+Not+Found';
                      }}
                    />
                  </div>

                  {/* Name + Position BELOW image */}
                  <div className="mt-4 text-center">
                    <h3 className="font-poppins font-bold text-lg text-[#0B0F1A]">
                      {official.name}
                    </h3>
                    <p className="font-poppins text-sm text-[#2B4C73] font-semibold mt-1">
                      {official.position}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {!loading && officials.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto text-[#E7ECF3] mb-4" size={48} />
              <p className="text-[#6D7A8B]">No officials found</p>
            </div>
          )}
        </motion.section>

        {/* Journey Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeIn}
          className="bg-gradient-to-r from-[#fff] to-[#FFF] rounded-xl p-8 md:p-12 transition-colors duration-200"
        >
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeUp}
              className="font-poppins font-bold text-3xl md:text-4xl text-[#000] dark:text-[#000] mb-6 transition-colors duration-200"
            >
              Our Journey
            </motion.h2>
          </motion.div>

          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="font-poppins text-lg text-[#000] dark:text-[#000] mb-6 leading-relaxed transition-colors duration-200"
            >
              Since our establishment, the CHRM Alumni Association has grown
              from a small group of passionate HR professionals to a thriving
              network of over 1,000 members across the country. Our alumni have
              gone on to lead major organizations, start successful
              consultancies, and drive positive change in workplaces across
              various industries.
            </motion.p>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-poppins text-lg text-[#000] dark:text-[#000] mb-8 leading-relaxed transition-colors duration-200"
            >
              Through our events, workshops, and networking opportunities, we
              continue to strengthen the bonds between our members and provide
              valuable resources for career advancement and professional
              development. Our commitment to excellence in human resource
              management remains unwavering as we look toward the future.
            </motion.p>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid md:grid-cols-4 gap-6 text-center"
            >
              {[
                { value: "1,000+", label: "Alumni Members", color: "text-[#2B4C73]" },
                { value: "10+", label: "Programs Offered", color: "text-[#FF7A00]" },
                { value: "10+", label: "Years of Excellence", color: "text-[#E53E3E]" },
                { value: "95%", label: "Career Growth", color: "text-[#2B4C73]" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="bg-white/50 dark:bg-black/20 p-6 rounded-lg"
                >
                  <motion.div
                    variants={statAnimation}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className={`font-poppins font-bold text-3xl ${stat.color} transition-colors duration-200`}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="font-poppins text-sm text-[#6D7A8B] dark:text-[#9CA3AF] transition-colors duration-200">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.section>

        <Footer />
      </main>

      {/* Global styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }
        
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </motion.div>
  );
}