"use client";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { Users, Calendar, ShoppingBag, Award, ArrowRight } from "lucide-react";
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
  y: [0, -10, 0],
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
    "0 0 0px rgba(214, 158, 46, 0)",
    "0 0 20px rgba(214, 158, 46, 0.4)",
    "0 0 0px rgba(214, 158, 46, 0)"
  ],
  transition: {
    duration: 2,
    repeat: Infinity as number,
    ease: "easeInOut" as const
  }
};

// Separate hover objects (not Variants)
const iconHover = {
  scale: 1.1,
  rotate: 5,
  transition: {
    type: "spring" as const,
    stiffness: 400,
    damping: 10,
  },
};

const cardHover = {
  scale: 1.05,
  y: -10,
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
  borderColor: "#d69e2e",
  transition: {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
  },
};

const buttonHover = {
  scale: 1.05,
  y: -3,
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
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
      iconColor: "bg-[#d69e2e]",
      iconTextColor: "text-[#0f172a]"
    },
    {
      icon: Calendar,
      title: "Events",
      description: "Attend exclusive alumni events, workshops, and professional development sessions.",
      iconColor: "bg-[#2563eb]",
      iconTextColor: "text-white"
    },
    {
      icon: ShoppingBag,
      title: "Merchandise",
      description: "Get exclusive CHRMAA branded merchandise to show your alumni pride.",
      iconColor: "bg-[#d69e2e]",
      iconTextColor: "text-[#0f172a]"
    },
    {
      icon: Award,
      title: "Benefits",
      description: "Enjoy member discounts on events, resources, and exclusive opportunities.",
      iconColor: "bg-[#2563eb]",
      iconTextColor: "text-white"
    }
  ];

  const stats = [
    { value: "1,000+", label: "Active Members", color: "text-[#d69e2e]" },
    { value: "50+", label: "Events Yearly", color: "text-[#60a5fa]" },
    { value: "10+", label: "Years Strong", color: "text-[#d69e2e]" },
    { value: "98%", label: "Satisfaction", color: "text-[#60a5fa]" }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-white flex flex-col font-inter overflow-hidden"
    >
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#FFF] to-[#FFF] py-20 px-4 overflow-hidden">
          {/* Animated Background Elements */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-[#d69e2e]/10 to-[#2563eb]/10 rounded-full blur-xl"
          />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-[#2563eb]/10 to-[#d69e2e]/10 rounded-full blur-xl"
          />
          
         
          
          <div className="max-w-7xl mx-auto text-center relative z-10">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                animate={pulseAnimation}
                className="inline-flex items-center gap-2 bg-[#d69e2e]/10 px-4 py-2 rounded-full mb-6"
              >
                
                <span className="text-[#d69e2e] font-medium">Welcome Alumni</span>
          
              </motion.div>
              
              <motion.h1
                variants={fadeUp}
                className="text-4xl md:text-6xl font-bold text-[#0f172a] mb-6 font-poppins leading-tight"
              >
                Welcome to{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">CHRM Alumni</span>
                  <motion.span
                    animate={glowAnimation}
                    className="absolute inset-0 bg-gradient-to-r from-[#d69e2e] to-[#b8832a] opacity-20 blur-lg"
                  />
                </span>
                <br />
                Association
              </motion.h1>
              
              <motion.p
                variants={fadeUp}
                transition={{ delay: 0.1 }}
                className="text-xl text-[#475569] mb-8 max-w-3xl mx-auto leading-relaxed"
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
                    href="/payments
"
                    className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#d69e2e] to-[#b8832a] text-[#0f172a] font-bold rounded-lg hover:shadow-xl transition-all duration-300 text-lg"
                  >
                    Join the Association
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </Link>
                </motion.div>
                <motion.div
                  variants={fadeUp}
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  <Link
                    href="/payments"
                    className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#d69e2e] to-[#b8832a] text-[#0f172a] font-bold rounded-lg hover:shadow-xl transition-all duration-300 text-lg text-[#0B0F1A] dark:text-[#E5E7EB]"
                  >
                    Renew Membership
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
                    className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white font-bold rounded-lg hover:shadow-xl transition-all duration-300 text-lg"
                  >
                    Learn More
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <motion.div
              variants={scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 bg-[#2563eb]/10 px-4 py-2 rounded-full mb-4"
              >
                <div className="w-2 h-2 bg-[#2563eb] rounded-full animate-pulse" />
                <span className="text-[#2563eb] font-medium">Our Benefits</span>
              </motion.div>
              
              <motion.h2
                variants={fadeUp}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl font-bold text-[#0f172a] font-poppins mb-4"
              >
                What We Offer
              </motion.h2>
              <motion.p
                variants={fadeUp}
                transition={{ delay: 0.2 }}
                className="text-lg text-[#64748b] max-w-2xl mx-auto"
              >
                Discover the exclusive benefits of joining our thriving alumni community
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
                  className="group bg-[#1e293b] p-8 rounded-xl border border-[#334155] hover:border-[#d69e2e] transition-all duration-300 relative overflow-hidden"
                >
                  {/* Background Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#d69e2e]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Feature Icon */}
                  <motion.div
                    whileHover={iconHover}
                    className={`${feature.iconColor} w-16 h-16 rounded-full flex items-center justify-center mb-6 relative z-10`}
                  >
                    <feature.icon className={feature.iconTextColor} size={32} />
                  </motion.div>
                  
                  {/* Content */}
                  <motion.h3
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="text-xl font-bold text-white mb-3 font-poppins relative z-10"
                  >
                    {feature.title}
                  </motion.h3>
                  <motion.p
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-[#cbd5e1] relative z-10"
                  >
                    {feature.description}
                  </motion.p>
                  
                  {/* Hover Indicator */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileHover={{ scale: 1 }}
                    className="absolute bottom-4 right-4 w-8 h-8 bg-[#d69e2e] rounded-full flex items-center justify-center"
                  >
                    <ArrowRight size={16} className="text-[#0f172a]" />
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
          className="py-12 bg-gradient-to-r from-[#0f172a] to-[#1e293b]"
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    className={`text-4xl font-bold ${stat.color} mb-2 font-poppins`}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          {/* Animated Background */}
          <motion.div
            animate={pulseAnimation}
            className="absolute inset-0 bg-gradient-to-r from-[#d69e2e] to-[#b8832a]"
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
                className="text-3xl md:text-4xl font-bold text-[#0f172a] mb-6 font-poppins"
              >
                Ready to Join?
              </motion.h2>
              
              <motion.p
                variants={fadeUp}
                transition={{ delay: 0.1 }}
                className="text-lg text-[#1e293b] mb-8 max-w-2xl mx-auto"
              >
                Register today and become part of a thriving community of HR
                professionals. Your journey starts here.
              </motion.p>
              
              <motion.div
                variants={fadeUp}
                transition={{ delay: 0.2 }}
                whileHover={"hover"}
                whileTap={buttonTap}
                className="inline-block"
              >
                <Link
                  href="/payments
"
                  className="group inline-flex items-center gap-2 px-10 py-5 bg-black text-white font-bold rounded-xl hover:shadow-2xl transition-all duration-300 text-lg"
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