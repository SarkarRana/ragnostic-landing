import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMoon,
  FiSun,
  FiArrowRight,
  FiLock,
  FiZap,
  FiDollarSign,
  FiMessageSquare,
  FiSettings,
  FiCalendar,
} from "react-icons/fi";

const CobaltBackground = ({ className = "" }) => (
  <svg
    className={`absolute inset-0 w-full h-full opacity-10 dark:opacity-20 pointer-events-none overflow-hidden z-0 ${className}`}
    preserveAspectRatio="none"
    viewBox="0 0 1200 800"
    xmlns="http://www.w3.org/2000/svg"
    style={{ color: "#FFFFFF" }}
  >
    <defs>
      {/* Animated grid pattern */}
      <pattern
        id="grid-pattern"
        width="120"
        height="120"
        patternUnits="userSpaceOnUse"
      >
        <rect width="120" height="120" fill="transparent" />
        <path
          d="M 0 60 L 120 60 M 60 0 L 60 120"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeOpacity="0.5"
        >
          <animate
            attributeName="stroke-dasharray"
            values="0,500;500,0;0,500"
            dur="30s"
            repeatCount="indefinite"
          />
        </path>
      </pattern>

      {/* Animated diagonal pattern */}
      <pattern
        id="diagonal-pattern"
        width="40"
        height="40"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="40"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.4"
        >
          <animate
            attributeName="y2"
            values="40;20;40"
            dur="8s"
            repeatCount="indefinite"
          />
        </line>
      </pattern>

      {/* Glow effect for floating elements */}
      <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Animated background layers */}
    <rect width="100%" height="100%" fill="url(#grid-pattern)">
      <animateTransform
        attributeName="patternTransform"
        type="translate"
        from="0 0"
        to="20 20"
        dur="40s"
        repeatCount="indefinite"
      />
    </rect>

    <rect
      width="100%"
      height="100%"
      fill="url(#diagonal-pattern)"
      fillOpacity="0.4"
    >
      <animateTransform
        attributeName="patternTransform"
        type="translate"
        from="0 0"
        to="15 15"
        dur="25s"
        repeatCount="indefinite"
      />
    </rect>

    {/* Floating animated elements */}
    <g filter="url(#glow)">
      <circle cx="15%" cy="20%" r="5" fill="currentColor" opacity="0.7">
        <animate
          attributeName="r"
          values="5;8;5"
          dur="8s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="cx"
          values="15%;18%;15%"
          dur="15s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="85%" cy="70%" r="4" fill="currentColor" opacity="0.7">
        <animate
          attributeName="r"
          values="4;6;4"
          dur="6s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="cy"
          values="70%;65%;70%"
          dur="12s"
          repeatCount="indefinite"
        />
      </circle>
    </g>

    {/* Subtle pulse animation overlay */}
    <rect width="100%" height="100%" fill="transparent">
      <animate
        attributeName="opacity"
        values="0;0.03;0"
        dur="20s"
        repeatCount="indefinite"
      />
    </rect>
  </svg>
);
export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Apply dark mode class to HTML element
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Smooth scroll handler
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Scroll listener for navbar effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Features data
  const features = [
    {
      icon: <FiLock className="w-6 h-6" />,
      title: "Private by Design",
      description: "Your data never leaves your infrastructure",
    },
    {
      icon: <FiDollarSign className="w-6 h-6" />,
      title: "Cost Efficient",
      description: "No per-query fees, predictable pricing",
    },
    {
      icon: <FiZap className="w-6 h-6" />,
      title: "Blazing Fast",
      description: "Optimized for low-latency retrieval",
    },
  ];

  // Pricing tiers
  const pricing = [
    {
      name: "Starter",
      price: "$0",
      description: "For individuals and small projects",
      features: [
        "Basic RAG functionality",
        "Community support",
        "Local deployment",
      ],
    },
    {
      name: "Pro",
      price: "$99",
      description: "For growing businesses",
      features: [
        "Advanced analytics",
        "Priority support",
        "Slack/Notion integration",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: [
        "Dedicated support",
        "Custom integrations",
        "On-prem deployment",
      ],
    },
  ];

  return (
    <div
      className={`min-h-screen font-sans ${
        darkMode ? "dark bg-gray-900" : "bg-gray-50"
      }`}
      style={{ transform: "translate3d(0,0,0)" }}
    >
      {/* Metadata - Update public/index.html for permanent tags */}
      <title>RAGnostic | Self-Hosted AI Knowledge</title>
      <meta name="description" content="Private RAG framework for businesses" />

      {/* Header */}
      <header
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled
            ? "py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm"
            : "py-4 bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`text-2xl font-bold ${
              scrolled
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent"
                : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
            }`}
          >
            RAGnostic
          </motion.div>

          <nav className="flex items-center gap-6">
            <button
              onClick={() => scrollTo("features")}
              className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollTo("pricing")}
              className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Pricing
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollTo("features")}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg"
            >
              Get Started
            </motion.button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              {darkMode ? (
                <FiSun className="w-5 h-5" />
              ) : (
                <FiMoon className="w-5 h-5" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-700 to-indigo-800 z-0" />

        {/* <div className="absolute inset-0 opacity-10 dark:opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2Utb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMCAwaDQwNDAiLz48L3N2Zz4=')] bg-cover z-0" /> */}
        <CobaltBackground className="opacity-30 dark:opacity-40" />
        <motion.div className="container mx-auto px-6 text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            <motion.span
              className="inline-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Your Documents.
            </motion.span>
            <br />
            <motion.span
              className="inline-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Your AI.
            </motion.span>
            <br />
            <motion.span
              className="inline-block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Your Control.
            </motion.span>
          </h1>

          <motion.p
            className="text-xl mb-8 max-w-2xl mx-auto text-white/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Deploy a private RAG AI in minutes—no cloud leaks, no per-query
            fees.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollTo("features")}
              className="bg-white text-purple-700 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
            >
              Get Started <FiArrowRight />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollTo("demo")}
              className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg text-lg hover:bg-white/10 transition-all"
            >
              Watch Demo
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 bg-white dark:bg-gray-800 relative"
      >
        <div className="container mx-auto px-6">
          <motion.h2
            className="text-3xl font-bold text-center mb-12 dark:text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Enterprise-Grade, Without the Complexity
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all dark:bg-gray-700/50"
              >
                <div className="text-purple-600 dark:text-purple-400 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-20 bg-gray-50 dark:bg-gray-900 relative"
      >
        <div className="container mx-auto px-6">
          <motion.h2
            className="text-3xl font-bold text-center mb-12 dark:text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Simple, Predictable Pricing
          </motion.h2>

          <motion.div
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {pricing.map((tier, index) => (
              <motion.div
                key={tier.name}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
                className={`p-8 rounded-xl border ${
                  tier.name === "Pro"
                    ? "border-purple-500 dark:border-purple-400 shadow-lg dark:bg-gray-800"
                    : "border-gray-200 dark:border-gray-700 dark:bg-gray-800/50"
                }`}
              >
                <h3 className="text-xl font-bold mb-2 dark:text-white">
                  {tier.name}
                </h3>
                <p className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {tier.price}
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {tier.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center text-gray-700 dark:text-gray-300"
                    >
                      <svg
                        className="w-5 h-5 mr-2 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-lg font-medium ${
                    tier.name === "Pro"
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
                  }`}
                >
                  Get Started
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact/Demo Section */}
      <section
        id="demo"
        className="py-20 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 relative overflow-hidden"
      >
        <CobaltBackground className="opacity-20 dark:opacity-30" />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold mb-4 dark:text-white">
              See It in Action
            </h2>
            <p className="text-xl mb-8 text-gray-600 dark:text-gray-300">
              Book a personalized demo to see how RAGnostic can transform your
              workflows.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden max-w-3xl mx-auto"
          >
            <div className="grid md:grid-cols-2">
              {/* Left Side - Form */}
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-6 dark:text-white">
                  Get in Touch
                </h3>
                <form className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="company"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Company name"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-medium mt-4"
                  >
                    Request Demo
                  </motion.button>
                </form>
              </div>

              {/* Right Side - Info */}
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 text-white flex flex-col justify-center">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <FiCalendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold">30-minute demo</h4>
                      <p className="text-sm opacity-90">
                        We'll show you exactly how it works
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <FiSettings className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold">Customized for you</h4>
                      <p className="text-sm opacity-90">
                        See your own use cases in action
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <FiMessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold">Q&A included</h4>
                      <p className="text-sm opacity-90">
                        Get all your questions answered
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            © {new Date().getFullYear()} RAGnostic. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
