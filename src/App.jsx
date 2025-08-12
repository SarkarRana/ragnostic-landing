import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
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
import ragnosticLogo from "./assets/ragnostic.png"; // Import the logo

// 3D Neural Network Globe Background
const NeuralNetworkBackground = ({ isDarkMode }) => {
  const mountRef = useRef(null);
  const animationRef = useRef(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const mouseWorldPosition = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());
  const mouseVector = useRef(new THREE.Vector2());
  const isMouseMoving = useRef(false);
  const lastMouseMoveTime = useRef(0);
  const globeRef = useRef(null);
  const glowingNodes = useRef([]);

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 30;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    if (mountRef.current) {
      // Clear previous canvas if it exists
      while (mountRef.current.firstChild) {
        mountRef.current.removeChild(mountRef.current.firstChild);
      }
      mountRef.current.appendChild(renderer.domElement);
    }

    // Define globe radius first before using it
    const globeRadius = 24;

    // Create invisible plane for mouse interaction - now through the globe
    const interactionPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    interactionPlane.position.z = 0; // Position at center of scene for better interaction
    scene.add(interactionPlane);

    // Add a transparent sphere for better interaction with the center parts
    const interactionSphere = new THREE.Mesh(
      new THREE.SphereGeometry(globeRadius, 32, 32),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    scene.add(interactionSphere);

    // Create globe structure
    const nodeCount = 1000; // Increased node count for a denser globe
    const nodes = [];
    const nodeGeometry = new THREE.SphereGeometry(0.12, 16, 16); // Smaller nodes

    // Create node materials with different colors based on dark mode
    const nodeMaterial = new THREE.MeshBasicMaterial({
      color: isDarkMode ? 0x9f7aea : 0x7c3aed, // Purple color
      transparent: true,
      opacity: 0.8,
    });

    // Create connections (synapses)
    const connections = [];
    const lineMaterial = new THREE.LineBasicMaterial({
      color: isDarkMode ? 0x9f7aea : 0x7c3aed,
      transparent: true,
      opacity: 0.2, // More subtle connections
    });

    // Helper function to position nodes in globe shape
    const positionOnGlobe = (index) => {
      // Use Fibonacci sphere distribution for even spacing
      const phi = Math.acos(-1 + (2 * index) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;

      const x = globeRadius * Math.sin(phi) * Math.cos(theta);
      const y = globeRadius * Math.sin(phi) * Math.sin(theta);
      const z = globeRadius * Math.cos(phi);

      return new THREE.Vector3(x, y, z);
    };

    // Create globe container to allow unified rotation
    const globe = new THREE.Group();
    globeRef.current = globe;
    scene.add(globe);

    // Distribute nodes in globe shape
    for (let i = 0; i < nodeCount; i++) {
      const node = new THREE.Mesh(
        nodeGeometry,
        // Vary colors slightly for visual interest
        nodeMaterial.clone()
      );

      // Position in globe shape
      const position = positionOnGlobe(i);
      node.position.set(position.x, position.y, position.z);

      // Add velocity and properties for animation
      node.userData = {
        velocity: new THREE.Vector3(0, 0, 0),
        pulseSpeed: 0.5 + Math.random() * 0.8, // Slower pulse for subtlety
        pulsePhase: Math.random() * Math.PI * 2,
        originalPosition: position.clone(),
        mass: 1 + Math.random() * 2, // Increased mass to reduce movement
        influence: 0,
        glowIntensity: 0,
        shouldGlow: Math.random() < 0.1, // 10% of nodes can randomly glow
        nextGlowTime: Date.now() + Math.random() * 10000, // Random glow timing
        // Latitude and longitude to help maintain globe shape
        latitude: Math.acos(position.y / globeRadius),
        longitude: Math.atan2(position.z, position.x),
      };

      // Add color variation based on position
      const hue = 0.75 + (position.y / globeRadius) * 0.1; // Slight hue variation
      node.material.color.setHSL(hue, 0.8, 0.5);

      globe.add(node);
      nodes.push(node);

      // Track nodes that should randomly glow
      if (node.userData.shouldGlow) {
        glowingNodes.current.push(node);
      }
    }

    // Create connections between nodes based on proximity
    const maxConnectionDistance = globeRadius * 0.2; // Even shorter connections for subtlety

    // Function to create connections for a hemisphere
    const createConnections = () => {
      // First pass: create nearest-neighbor connections
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];

        // Find 3-5 closest neighbors
        const neighbors = [];
        for (let j = 0; j < nodes.length; j++) {
          if (i !== j) {
            const nodeB = nodes[j];
            const distance = nodeA.position.distanceTo(nodeB.position);
            if (distance < maxConnectionDistance) {
              neighbors.push({ node: nodeB, distance });
            }
          }
        }

        // Sort by distance and take the closest ones
        neighbors.sort((a, b) => a.distance - b.distance);
        const connectCount = Math.min(5, neighbors.length);

        // Create connections to closest neighbors
        for (let k = 0; k < connectCount; k++) {
          const nodeB = neighbors[k].node;

          // Check if connection already exists
          let connectionExists = false;
          for (const conn of connections) {
            const { node1, node2 } = conn.userData;
            if (
              (node1 === nodeA && node2 === nodeB) ||
              (node1 === nodeB && node2 === nodeA)
            ) {
              connectionExists = true;
              break;
            }
          }

          if (!connectionExists) {
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
              nodeA.position,
              nodeB.position,
            ]);
            const line = new THREE.Line(lineGeometry, lineMaterial.clone());

            // Store connection data
            line.userData = {
              node1: nodeA,
              node2: nodeB,
              originalLength: nodeA.position.distanceTo(nodeB.position),
              opacity: lineMaterial.opacity,
            };

            globe.add(line);
            connections.push(line);
          }
        }
      }
    };

    createConnections();

    // Add some additional cross-connections for visual interest
    for (let i = 0; i < nodeCount * 0.03; i++) {
      const nodeA = nodes[Math.floor(Math.random() * nodes.length)];
      const nodeB = nodes[Math.floor(Math.random() * nodes.length)];

      if (nodeA !== nodeB) {
        const distance = nodeA.position.distanceTo(nodeB.position);
        if (distance < globeRadius * 1.2) {
          const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            nodeA.position,
            nodeB.position,
          ]);
          const line = new THREE.Line(lineGeometry, lineMaterial.clone());

          line.userData = {
            node1: nodeA,
            node2: nodeB,
            originalLength: distance,
            opacity: lineMaterial.opacity * 0.5, // Fainter cross-connections
          };

          globe.add(line);
          connections.push(line);
        }
      }
    }

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add highlight points at key locations
    const highlightCount = 10;
    const highlightColor = 0x4f46e5; // Indigo

    for (let i = 0; i < highlightCount; i++) {
      // Use specific positions for highlights (poles, equator, etc.)
      const phi = (i * Math.PI) / (highlightCount - 1); // 0 to PI
      const theta = (i * 2 * Math.PI) / highlightCount; // 0 to 2PI

      const x = globeRadius * Math.sin(phi) * Math.cos(theta);
      const y = globeRadius * Math.sin(phi) * Math.sin(theta);
      const z = globeRadius * Math.cos(phi);

      // Find closest node to this position
      let closestNode = null;
      let closestDistance = Infinity;

      for (const node of nodes) {
        const dist = node.position.distanceTo(new THREE.Vector3(x, y, z));
        if (dist < closestDistance) {
          closestDistance = dist;
          closestNode = node;
        }
      }

      if (closestNode) {
        closestNode.scale.set(1.8, 1.8, 1.8);
        closestNode.material = new THREE.MeshBasicMaterial({
          color: highlightColor,
          transparent: true,
          opacity: 0.9,
        });
      }
    }

    // Mouse move handler with enhanced tracking
    const handleMouseMove = (event) => {
      // Calculate mouse position in normalized device coordinates (-1 to +1)
      mouseVector.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseVector.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Store actual mouse position for later use
      mousePosition.current = {
        x: event.clientX,
        y: event.clientY,
      };

      // Mark as moving with timestamp for tracking movement activity
      isMouseMoving.current = true;
      lastMouseMoveTime.current = Date.now();
    };

    // Add mouse enter/leave handlers to enhance interaction
    const handleMouseEnter = () => {
      isMouseMoving.current = true;
    };

    const handleMouseLeave = () => {
      isMouseMoving.current = false;
      lastMouseMoveTime.current = 0; // Reset to ensure spinning resumes immediately
    };

    // Add mouse event listeners
    window.addEventListener("mousemove", handleMouseMove);
    mountRef.current.addEventListener("mouseenter", handleMouseEnter);
    mountRef.current.addEventListener("mouseleave", handleMouseLeave);

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Base rotation speed
    const baseRotationSpeed = 0.0005;
    let rotationSpeed = baseRotationSpeed;
    let targetRotationSpeed = baseRotationSpeed;
    const spinupRate = 0.5; // Slower recovery for smoother transition

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      // Check if mouse is active or recently moved
      const mouseIsActive =
        isMouseMoving.current || Date.now() - lastMouseMoveTime.current < 800;

      // Adjust rotation speed based on mouse activity with smooth transition
      if (mouseIsActive) {
        targetRotationSpeed = baseRotationSpeed * 0.3; // Less slowdown for subtlety
      } else {
        targetRotationSpeed = baseRotationSpeed; // Normal speed when not interacting
      }

      // Smoothly transition between rotation speeds
      rotationSpeed += (targetRotationSpeed - rotationSpeed) * spinupRate;

      // Rotate globe
      globe.rotation.y += rotationSpeed;

      // Very slight wobble for subtle effect
      globe.rotation.x = Math.sin(Date.now() * 0.00005) * 0.08;

      // Calculate mouse intersection with the scene - check both plane and sphere
      raycaster.current.setFromCamera(mouseVector.current, camera);

      // Try to intersect with the sphere first for center interactions
      const sphereIntersects =
        raycaster.current.intersectObject(interactionSphere);
      const planeIntersects =
        raycaster.current.intersectObject(interactionPlane);

      // Prioritize sphere intersects for better center interaction
      if (sphereIntersects.length > 0) {
        mouseWorldPosition.current = sphereIntersects[0].point;
      } else if (planeIntersects.length > 0) {
        mouseWorldPosition.current = planeIntersects[0].point;
      }

      // Random glowing nodes effect
      const currentTime = Date.now();
      glowingNodes.current.forEach((node) => {
        if (currentTime > node.userData.nextGlowTime) {
          // Start a new glow cycle
          node.userData.glowIntensity = 1.0;
          node.userData.nextGlowTime =
            currentTime + 3000 + Math.random() * 7000;
        }

        // Fade out the glow
        if (node.userData.glowIntensity > 0) {
          node.userData.glowIntensity *= 0.98;

          // Update color based on glow intensity
          const baseColor = isDarkMode ? 0x9f7aea : 0x7c3aed;
          const glowColor = 0x4f46e5; // Indigo glow

          // Interpolate between base color and glow color
          const c1 = new THREE.Color(baseColor);
          const c2 = new THREE.Color(glowColor);
          const mixed = c1.lerp(c2, node.userData.glowIntensity);

          node.material.color = mixed;
          node.material.opacity = 0.6 + node.userData.glowIntensity * 0.4;

          // Subtle size pulse during glow
          const scale = 1 + node.userData.glowIntensity * 0.3;
          node.scale.set(scale, scale, scale);
        }
      });

      // Animate nodes with fluid dynamics
      const time = Date.now() * 0.001;
      nodes.forEach((node) => {
        // Skip extra animation for nodes that are already glowing randomly
        if (node.userData.glowIntensity > 0.5) return;

        // Convert node position to world space for mouse distance calculation
        const worldPos = node.getWorldPosition(new THREE.Vector3());

        // Calculate distance to mouse position
        const distToMouse = worldPos.distanceTo(mouseWorldPosition.current);
        const interactionRadius = 18; // Reduced interaction radius for subtlety
        const mouseInfluence = mouseIsActive
          ? Math.max(0, 1 - distToMouse / interactionRadius) * 0.9 // Halved influence for subtlety
          : 0;

        // Store influence for connection effects
        node.userData.influence = mouseInfluence;

        // Interactive force based on mouse position
        if (mouseIsActive && distToMouse < interactionRadius) {
          // Direction vector from mouse to node
          const forceDirection = new THREE.Vector3().subVectors(
            worldPos,
            mouseWorldPosition.current
          );

          // Reduced force strength for more subtle movement
          const forceStrength =
            0.015 * Math.pow(1 - distToMouse / interactionRadius, 2);

          // Apply force with adjustments for uniform interaction
          const force = forceDirection
            .normalize()
            .multiplyScalar(forceStrength / node.userData.mass);
          node.userData.velocity.add(force);

          // Subtle visual feedback
          if (node.material.opacity < 0.9) {
            node.material.opacity = 0.6 + 0.2 * mouseInfluence;
          }
        } else {
          // Gradually return to normal opacity
          node.material.opacity = Math.max(0.5, node.material.opacity * 0.99);
        }

        // Apply velocity with reduced effect
        node.position.x += node.userData.velocity.x * 0.8;
        node.position.y += node.userData.velocity.y * 0.8;
        node.position.z += node.userData.velocity.z * 0.8;

        // Stronger damping for less bouncy movement
        const damping = 0.9;
        node.userData.velocity.multiplyScalar(damping);

        // Stronger restoration force for quicker return to globe shape
        const originalPosition = node.userData.originalPosition;
        const toOriginal = new THREE.Vector3().subVectors(
          originalPosition,
          node.position
        );

        // Quicker restoration when further from original position
        const distance = toOriginal.length();
        const restorationFactor = Math.min(0.08, 0.02 + distance * 0.01);
        node.userData.velocity.add(
          toOriginal.multiplyScalar(restorationFactor)
        );

        // Very gentle pulse effect
        if (!node.userData.shouldGlow) {
          // Don't pulse the nodes that glow randomly
          const pulse =
            Math.sin(
              time * node.userData.pulseSpeed + node.userData.pulsePhase
            ) *
              0.05 + // Reduced pulse amplitude
            1;
          node.scale.x = node.scale.y = node.scale.z = pulse;
        }
      });

      // Update connections with more subtle effects
      connections.forEach((line) => {
        const { node1, node2 } = line.userData;
        const points = [node1.position, node2.position];
        line.geometry.setFromPoints(points);

        // Dynamic connection behavior - connections stretch and glow when affected by mouse
        const avgInfluence =
          (node1.userData.influence + node2.userData.influence) / 2;

        // Make lines subtly more visible when affected by mouse
        line.material.opacity = Math.min(
          0.3,
          line.userData.opacity + avgInfluence * 0.1
        );
      });

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      mountRef.current?.removeEventListener("mouseenter", handleMouseEnter);
      mountRef.current?.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationRef.current);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }

      // Dispose resources
      nodeGeometry.dispose();
      nodes.forEach((node) => {
        node.material.dispose();
      });

      connections.forEach((line) => {
        line.geometry.dispose();
        line.material.dispose();
      });
    };
  }, [isDarkMode]); // Re-render if dark mode changes

  return <div ref={mountRef} className="absolute inset-0 w-full h-full z-0" />;
};

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedTier, setSelectedTier] = useState("Pro"); // Track selected pricing tier

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

  // Features data - Enhanced for SEO
  const features = [
    {
      icon: <FiLock className="w-6 h-6" />,
      title: "GDPR-Compliant AI Solutions",
      description: "Built-in privacy controls ensure your enterprise documents remain secure and compliant with European data protection regulations. Zero data exposure to third parties.",
    },
    {
      icon: <FiDollarSign className="w-6 h-6" />,
      title: "Transparent Enterprise Pricing",
      description: "No hidden per-query fees or usage surprises. Predictable, scalable pricing that grows with your business needs. ROI-focused deployment.",
    },
    {
      icon: <FiZap className="w-6 h-6" />,
      title: "High-Performance RAG Engine",
      description: "Sub-second query responses with advanced retrieval algorithms. Optimized for enterprise workloads with intelligent caching and vector indexing.",
    },
    {
      icon: <FiSettings className="w-6 h-6" />,
      title: "Custom AI Models",
      description: "Tailored RAG solutions trained on your specific industry and document types. Seamless integration with existing enterprise systems and workflows.",
    },
    {
      icon: <FiMessageSquare className="w-6 h-6" />,
      title: "Multi-Format Document Support",
      description: "Process PDFs, Word docs, spreadsheets, presentations, and unstructured text. Advanced OCR and document parsing for comprehensive knowledge extraction.",
    },
    {
      icon: <FiCalendar className="w-6 h-6" />,
      title: "Real-Time Knowledge Updates",
      description: "Automatic synchronization with your document repositories. Keep your AI knowledge base current with live updates and version control.",
    },
  ];

  // Pricing tiers - Enhanced for enterprise
  const pricing = [
    {
      name: "Starter",
      price: "$0",
      description: "Perfect for small teams exploring RAG capabilities",
      features: [
        "Basic RAG functionality",
        "Up to 1,000 documents",
        "Community support",
        "Local deployment guide",
        "Standard security features",
      ],
    },
    {
      name: "Professional",
      price: "$299/month",
      description: "For growing businesses with compliance needs",
      features: [
        "Advanced RAG analytics",
        "Unlimited documents",
        "Priority support",
        "GDPR compliance tools",
        "Custom integrations",
        "Advanced security controls",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Tailored solutions for large organizations",
      features: [
        "Dedicated account manager",
        "Custom model training",
        "White-label deployment",
        "24/7 enterprise support",
        "SOC 2 Type II compliance",
        "On-premises installation",
        "Multi-tenant architecture",
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
            ? "py-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-sm"
            : "py-0 bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`${
              scrolled ? "" : "drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
            } -mt-10 -mb-10`}
          >
            <img
              src={ragnosticLogo}
              alt="Ragnostic Logo"
              className={`h-48 w-auto ${darkMode ? "filter invert" : ""}`}
            />
          </motion.div>

          <nav className="flex items-center gap-6">
            <button
              onClick={() => scrollTo("features")}
              className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollTo("pricing")}
              className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollTo("demo")}
              className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer"
            >
              Demo
            </button>
            <motion.a
              href="https://dash.ragnosticai.com"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white/90 text-purple-700 border border-purple-300 px-4 py-2 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors duration-300 flex items-center gap-2"
            >
              Dashboard <FiArrowRight className="w-4 h-4" />
            </motion.a>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 cursor-pointer"
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
        <NeuralNetworkBackground isDarkMode={darkMode} />
        <motion.div className="container mx-auto px-6 text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl font-bold mb-6 text-white flex flex-col"
          >
            <span>Enterprise RAG Solutions</span>
            <span>GDPR-Compliant AI</span>
            <span>Your Data, Your Control</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-xl md:text-2xl mb-10 text-white/90 max-w-4xl mx-auto"
          >
            Transform your enterprise documents into intelligent, searchable knowledge bases with custom RAG solutions. 
            GDPR-compliant, on-premises deployment ensures complete data sovereignty while delivering powerful AI insights 
            from your proprietary documents.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <motion.a
              href="https://dash.ragnosticai.com"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Access Dashboard <FiArrowRight />
            </motion.a>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => scrollTo("demo")}
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-lg hover:bg-white/10 transition-all cursor-pointer"
            >
              Watch Demo
            </motion.button>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-12 text-white/80 text-sm"
          >
            Trusted by enterprises worldwide • GDPR & SOC 2 compliant • 99.9% uptime SLA
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 bg-white dark:bg-gray-800 relative"
      >
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold mb-4 dark:text-white">
              Enterprise-Grade RAG Solutions
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Purpose-built for enterprise security, compliance, and performance. 
              Transform your document workflows with AI that understands your business context.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all dark:bg-gray-700/50 hover:border-purple-300 dark:hover:border-purple-500"
              >
                <div className="text-purple-600 dark:text-purple-400 mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About & Compliance Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900 relative">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold mb-6 dark:text-white">
                Built for Enterprise Trust & Compliance
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                RagnosticAI specializes in creating custom RAG (Retrieval-Augmented Generation) solutions 
                that respect your data sovereignty. We understand that enterprise documents contain your 
                most valuable intellectual property, requiring the highest levels of security and compliance.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Our platform ensures complete GDPR compliance through on-premises deployment, zero data 
                transmission to external services, and granular access controls. Every solution is tailored 
                to your specific industry requirements and regulatory framework.
              </p>
              <motion.a
                href="https://dash.ragnosticai.com"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                Explore Dashboard <FiArrowRight />
              </motion.a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <FiLock className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-semibold dark:text-white">GDPR Compliant</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  Full compliance with European data protection regulations. Your data never leaves your infrastructure.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <FiSettings className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-semibold dark:text-white">Custom Solutions</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  Tailored RAG implementations designed for your specific industry, document types, and workflows.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <FiZap className="w-6 h-6 text-purple-600" />
                  <h3 className="text-xl font-semibold dark:text-white">Enterprise Performance</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  High-throughput processing with intelligent caching. Built to scale with your growing document repositories.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
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
            Simple, Predictable Pricing
          </motion.h2>

          <motion.div
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {pricing.map((tier) => (
              <motion.div
                key={tier.name}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
                className={`p-8 rounded-xl border ${
                  tier.name === selectedTier
                    ? "border-purple-500 dark:border-purple-400 shadow-lg dark:bg-gray-800"
                    : "border-gray-200 dark:border-gray-700 dark:bg-gray-800/50"
                } cursor-pointer`}
                onClick={() => setSelectedTier(tier.name)}
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
                  className={`w-full py-3 rounded-lg font-medium transition-colors duration-300 ${
                    tier.name === selectedTier
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                  } cursor-pointer`}
                  onClick={() => setSelectedTier(tier.name)}
                >
                  {tier.name === selectedTier ? "Selected" : "Select"}
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
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-6 dark:text-white">
              Ready to Transform Your Enterprise Documents?
            </h2>
            <p className="text-xl mb-8 text-gray-600 dark:text-gray-300">
              Schedule a personalized demo to see how RagnosticAI can revolutionize your document workflows. 
              Our experts will show you custom RAG solutions tailored to your industry and compliance requirements.
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
              <span>✓ GDPR Compliant</span>
              <span>✓ On-Premises Deployment</span>
              <span>✓ 30-Day Free Trial</span>
              <span>✓ No Data Transmission</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto"
          >
            <div className="grid md:grid-cols-2">
              {/* Left Side - Form */}
              <div className="p-8">
                <h3 className="text-2xl font-bold mb-6 dark:text-white">
                  Request Enterprise Demo
                </h3>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-gray-800 placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        required
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-gray-800 placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Business Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-gray-800 placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="john.doe@company.com"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="company"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Company *
                    </label>
                    <input
                      type="text"
                      id="company"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-gray-800 placeholder-gray-400 dark:placeholder-gray-500"
                      placeholder="Acme Corporation"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="useCase"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Primary Use Case
                    </label>
                    <select
                      id="useCase"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-gray-800"
                    >
                      <option value="">Select your primary use case</option>
                      <option value="document-search">Document Search & Retrieval</option>
                      <option value="knowledge-base">Knowledge Base Management</option>
                      <option value="legal-compliance">Legal & Compliance</option>
                      <option value="customer-support">Customer Support</option>
                      <option value="research-analysis">Research & Analysis</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all cursor-pointer"
                  >
                    Schedule Demo
                  </motion.button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    By submitting, you agree to our Privacy Policy. No spam, unsubscribe anytime.
                  </p>
                </form>
              </div>

              {/* Right Side - Info */}
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 text-white flex flex-col justify-center">
                <div className="space-y-8">
                  <div>
                    <h4 className="text-2xl font-bold mb-4">What to Expect</h4>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <FiCalendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">45-Minute Deep Dive</h4>
                      <p className="text-sm opacity-90">
                        Comprehensive walkthrough of RagnosticAI capabilities with your specific use cases
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <FiSettings className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Custom Configuration</h4>
                      <p className="text-sm opacity-90">
                        See how we can tailor the solution for your industry compliance and document types
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <FiLock className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Security Review</h4>
                      <p className="text-sm opacity-90">
                        Detailed discussion of GDPR compliance, data sovereignty, and security architecture
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <FiMessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Q&A & Next Steps</h4>
                      <p className="text-sm opacity-90">
                        Technical questions, implementation timeline, and pilot program discussion
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t border-white/20 pt-6">
                    <p className="text-sm opacity-90">
                      <strong>Alternative:</strong> Access our self-service dashboard at{' '}
                      <a 
                        href="https://dash.ragnosticai.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline hover:text-purple-200"
                      >
                        dash.ragnosticai.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img src={ragnosticLogo} alt="RagnosticAI" className="w-8 h-8" />
                <h3 className="text-2xl font-bold">RagnosticAI</h3>
              </div>
              <p className="text-gray-300 mb-6 max-w-md">
                Custom GDPR-compliant RAG solutions for enterprise documents. 
                Transform your proprietary knowledge into intelligent, searchable AI systems 
                while maintaining complete data sovereignty.
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <p>Enterprise AI Solutions</p>
                <p>GDPR & SOC 2 Compliant</p>
                <p>On-Premises Deployment</p>
              </div>
            </div>

            {/* Solutions */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Solutions</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#features" className="hover:text-purple-400 transition-colors">Enterprise RAG</a></li>
                <li><a href="#features" className="hover:text-purple-400 transition-colors">Document Intelligence</a></li>
                <li><a href="#features" className="hover:text-purple-400 transition-colors">Knowledge Management</a></li>
                <li><a href="#features" className="hover:text-purple-400 transition-colors">GDPR Compliance</a></li>
                <li><a href="#pricing" className="hover:text-purple-400 transition-colors">Custom Models</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#demo" className="hover:text-purple-400 transition-colors">Contact Us</a></li>
                <li><a href="https://dash.ragnosticai.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">Dashboard</a></li>
                <li><a href="#demo" className="hover:text-purple-400 transition-colors">Request Demo</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-purple-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-gray-400">
                <p>© {new Date().getFullYear()} RagnosticAI. All rights reserved.</p>
                <div className="flex gap-4">
                  <span>Made with AI for Enterprise</span>
                  <span>•</span>
                  <span>Secure by Design</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <a 
                  href="https://dash.ragnosticai.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Launch Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
