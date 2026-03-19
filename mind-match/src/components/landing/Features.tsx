import { motion } from "framer-motion";
import { 
  Brain, 
  Users, 
  MessageSquare, 
  BarChart3, 
  GraduationCap, 
  Shield,
  Zap,
  Globe
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Smart AI Matching",
    description: "Our AI analyzes skills, personality, and goals to find your perfect study partner with 98% accuracy.",
    gradient: "from-primary to-electric",
  },
  {
    icon: Users,
    title: "Study Groups",
    description: "Create or join topic-based study rooms. Collaborate on projects and prepare for exams together.",
    gradient: "from-secondary to-teal-light",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Chat",
    description: "One-on-one and group messaging with file sharing, voice notes, and emoji reactions.",
    gradient: "from-accent to-coral",
  },
  {
    icon: BarChart3,
    title: "Skill Dashboard",
    description: "Track your progress with visual radar charts. See how your skills grow over time.",
    gradient: "from-gold to-yellow-500",
  },
  {
    icon: GraduationCap,
    title: "Mentor Mode",
    description: "Connect with verified senior students for guidance. Get insights from those who've been there.",
    gradient: "from-mint to-green-500",
  },
  {
    icon: Shield,
    title: "Safe Community",
    description: "Verified students only. Our moderation keeps the community focused and supportive.",
    gradient: "from-primary to-navy",
  },
];

const additionalFeatures = [
  { icon: Zap, text: "Instant Matching" },
  { icon: Globe, text: "Global Community" },
  { icon: BarChart3, text: "Progress Tracking" },
];

const Features = () => {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/30 to-background" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Powerful Features</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Everything You Need to{" "}
            <span className="gradient-text">Learn Better</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From smart matching to real-time collaboration, MindMatch has all the tools 
            to supercharge your learning journey
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="feature-card h-full">
                {/* Icon */}
                <div className={`w-14 h-14 mb-5 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Indicator */}
                <div className="mt-4 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium">Learn more</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Features Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 glass-card p-6 flex flex-wrap justify-center gap-8"
        >
          {additionalFeatures.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium text-foreground">{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
