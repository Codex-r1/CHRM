"use client";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Users, Calendar, ShoppingBag, Award, ArrowRight, Target, Handshake, GraduationCap, Sparkles, Network } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

// Animation Variants
const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
    },
  },
};

const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const floatAnimation = {
  y: [0, -15, 0],
  transition: {
    duration: 3,
    repeat: Infinity as number,
    ease: "easeInOut" as const
  }
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity as number,
    ease: "easeInOut" as const
  }
};

const glowAnimation = {
  boxShadow: [
    "0 0 0px rgba(43, 76, 115, 0)",
    "0 0 25px rgba(43, 76, 115, 0.4)",
    "0 0 0px rgba(43, 76, 115, 0)"
  ],
  transition: {
    duration: 2.5,
    repeat: Infinity as number,
    ease: "easeInOut" as const
  }
};

// Hover effects
const iconHover = {
  scale: 1.15,
  rotate: 5,
  transition: {
    type: "spring" as const,
    stiffness: 400,
    damping: 10,
  },
};

const cardHover = {
  scale: 1.05,
  y: -12,
  boxShadow: "0 25px 50px rgba(43, 76, 115, 0.1)",
  borderColor: "#FF7A00",
  transition: {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
  },
};

const buttonHover = {
  scale: 1.05,
  y: -3,
  boxShadow: "0 12px 30px rgba(255, 122, 0, 0.25)",
  transition: {
    type: "spring" as const,
    stiffness: 400,
    damping: 15,
  },
};

const buttonTap = {
  scale: 0.95,
};

export default function HomePage() {
  const features = [
    {
      icon: Users,
      title: "Networking",
      description: "Connect with fellow HR professionals and expand your network across industries.",
      iconColor: "bg-gradient-to-br from-[#2B4C73] to-[#1A3557]",
      iconTextColor: "text-white",
      bgColor: "bg-[#E8F4FD]",
      textColor: "text-[#2B4C73]"
    },
    {
      icon: Handshake,
      title: "Mentorship",
      description: "Access experienced mentors for career guidance and professional growth.",
      iconColor: "bg-gradient-to-br from-[#FF7A00] to-[#E56B00]",
      iconTextColor: "text-white",
      bgColor: "bg-[#FFF4E6]",
      textColor: "text-[#FF7A00]"
    },
    {
      icon: GraduationCap,
      title: "Career Growth",
      description: "Exclusive job opportunities and career advancement resources.",
      iconColor: "bg-gradient-to-br from-[#E53E3E] to-[#CC3636]",
      iconTextColor: "text-white",
      bgColor: "bg-[#FFF0F0]",
      textColor: "text-[#E53E3E]"
    },
    {
      icon: Calendar,
      title: "Events",
      description: "Attend exclusive alumni events, workshops, and professional sessions.",
      iconColor: "bg-gradient-to-br from-[#2B4C73] to-[#1A3557]",
      iconTextColor: "text-white",
      bgColor: "bg-[#E8F4FD]",
      textColor: "text-[#2B4C73]"
    }
  ];

  const stats = [
    { value: "1,000+", label: "Active Members", icon: Users, color: "text-[#2B4C73]" },
    { value: "50+", label: "Events Yearly", icon: Calendar, color: "text-[#FF7A00]" },
    { value: "10+", label: "Years Strong", icon: Target, color: "text-[#E53E3E]" },
    { value: "98%", label: "Satisfaction", icon: Award, color: "text-[#2B4C73]" }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-white flex flex-col font-poppins overflow-hidden"
    >
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-white via-[#F7F9FC] to-[#E8F4FD] py-20 px-4 overflow-hidden">
          {/* Background Elements */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-[#2B4C73]/10 to-[#FF7A00]/10 rounded-full blur-xl"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-[#E53E3E]/10 to-[#2B4C73]/10 rounded-full blur-xl"
          />
          
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
          
              <motion.h1
                variants={fadeUp}
                className="text-4xl md:text-6xl font-bold text-[#0B0F1A] mb-6 font-poppins leading-tight"
              >
                Welcome to the{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">CHRM Alumni</span>
                  <motion.span
                    animate={glowAnimation}
                    className="absolute inset-0 bg-gradient-to-r from-[#2B4C73] to-[#1A3557] opacity-20 blur-lg"
                  />
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#2B4C73] via-[#FF7A00] to-[#E53E3E] bg-clip-text text-transparent">
                  Association
                </span>
              </motion.h1>
              
              <motion.p
                variants={fadeUp}
                transition={{ delay: 0.1 }}
                className="text-xl text-[#6D7A8B] mb-8 max-w-3xl mx-auto leading-relaxed"
              >
                Connecting HR professionals, fostering growth, and building
                lasting relationships among CHRM College graduates.
              </motion.p>
              
              <motion.div
                variants={staggerContainer}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <motion.div
                  variants={fadeUp}
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  <Link
                    href="/payments"
                    className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#2B4C73] to-[#1A3557] text-white font-bold rounded-lg hover:shadow-xl transition-all duration-300 text-lg"
                  >
                    Join the Association
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </Link>
                </motion.div>
                <motion.div
                  variants={fadeUp}
                  transition={{ delay: 0.1 }}
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  <Link
                    href="/about"
                    className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#FF7A00] to-[#E56B00] text-white font-bold rounded-lg hover:shadow-xl transition-all duration-300 text-lg"
                  >
                    Learn More
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-[#0B0F1A] to-[#1A1F2E] relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid md:grid-cols-2 gap-8"
            >
              <motion.div
                variants={fadeUp}
                className="bg-gradient-to-br from-[#2B4C73]/20 to-transparent p-8 rounded-2xl border border-[#2B4C73]/30"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-br from-[#2B4C73] to-[#1A3557] rounded-xl">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Our Mission</h3>
                </div>
                <blockquote className="text-lg text-gray-300 italic border-l-4 border-[#2B4C73] pl-6 py-2">
                  "To establish and enhance mutually beneficial and enduring relationships between the alumni, students and college fraternity."
                </blockquote>
              </motion.div>
              
              <motion.div
                variants={fadeUp}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-[#FF7A00]/20 to-transparent p-8 rounded-2xl border border-[#FF7A00]/30"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-br from-[#FF7A00] to-[#E56B00] rounded-xl">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Our Vision</h3>
                </div>
                <blockquote className="text-lg text-gray-300 italic border-l-4 border-[#FF7A00] pl-6 py-2">
                  "Be the model alumni association in the region."
                </blockquote>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <motion.div
              variants={scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2B4C73]/10 to-[#FF7A00]/10 px-6 py-3 rounded-full mb-6"
              >
                <div className="w-4 h-4 bg-[#2B4C73] rounded-full animate-pulse" />
                <span className="text-[#2B4C73] font-semibold">Our Benefits</span>
              </motion.div>
              
              <motion.h2
                variants={fadeUp}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl font-bold text-[#0B0F1A] font-poppins mb-6"
              >
                What We Offer
              </motion.h2>
              <motion.p
                variants={fadeUp}
                transition={{ delay: 0.2 }}
                className="text-lg text-[#6D7A8B] max-w-2xl mx-auto"
              >
                Discover the exclusive benefits of joining our alumni community
              </motion.p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  custom={index}
                  whileHover={cardHover}
                  className={`group ${feature.bgColor} p-8 rounded-xl border border-gray-200 hover:border-[#FF7A00] transition-all duration-300 relative overflow-hidden`}
                >
                  {/* Feature Icon */}
                  <motion.div
                    whileHover={iconHover}
                    className={`${feature.iconColor} w-16 h-16 rounded-full flex items-center justify-center mb-6 relative z-10 shadow-lg`}
                  >
                    <feature.icon className={feature.iconTextColor} size={32} />
                  </motion.div>
                  
                  {/* Content */}
                  <motion.h3
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className={`text-xl font-bold mb-3 font-poppins ${feature.textColor}`}
                  >
                    {feature.title}
                  </motion.h3>
                  <motion.p
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-[#6D7A8B] relative z-10"
                  >
                    {feature.description}
                  </motion.p>
                  
                  {/* Hover Arrow */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    whileHover={{ x: 0, opacity: 1 }}
                    className="absolute bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-[#2B4C73] to-[#1A3557] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <ArrowRight size={20} className="text-white" />
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="py-16 bg-gradient-to-r from-[#0B0F1A] to-[#1A1F2E]"
        >
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <motion.div
              variants={fadeUp}
              className="text-center mb-12"
            >
              <h3 className="text-3xl font-bold text-white mb-4">Our Community in Numbers</h3>
              <p className="text-gray-400">Join thousands of successful HR professionals</p>
            </motion.div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  whileHover={{ y: -10 }}
                  className="text-center p-8 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className={`inline-flex items-center justify-center w-16 h-16 ${
                      stat.color === "text-[#2B4C73]" ? "bg-[#2B4C73]/20" :
                      stat.color === "text-[#FF7A00]" ? "bg-[#FF7A00]/20" :
                      "bg-[#E53E3E]/20"
                    } rounded-full mb-6`}
                  >
                    <stat.icon className={stat.color} size={28} />
                  </motion.div>
                  <div className={`text-4xl font-bold ${stat.color} mb-3 font-poppins`}>
                    {stat.value}
                  </div>
                  <div className="text-gray-300 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          {/* Background */}
          <motion.div
            animate={pulseAnimation}
            className="absolute inset-0 bg-gradient-to-r from-[#2B4C73] to-[#E53E3E]"
          />
          
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.h2
                variants={fadeUp}
                className="text-3xl md:text-4xl font-bold text-white mb-8 font-poppins"
              >
                Ready to Join Our Network?
              </motion.h2>
              
              <motion.p
                variants={fadeUp}
                transition={{ delay: 0.1 }}
                className="text-xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed"
              >
                Register today and become part of a thriving community of HR
                professionals. Your journey starts here.
              </motion.p>
              
              <motion.div
                variants={fadeUp}
                transition={{ delay: 0.2 }}
                whileHover={buttonHover}
                whileTap={buttonTap}
                className="inline-block"
              >
                <Link
                  href="/payments"
                  className="group relative inline-flex items-center gap-3 px-10 py-5 bg-black text-white font-bold rounded-xl hover:shadow-2xl transition-all duration-300 text-lg"
                >
                  <span>Register Now</span>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight size={20} />
                  </motion.div>
                </Link>
              </motion.div>                        
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </motion.div>
  );
}