import { motion } from "framer-motion";
import { Smartphone, Monitor, MessageCircle, Users, Search } from "lucide-react";

const AppPreview = () => {
  return (
    <section className="py-24 hero-bg relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-primary-foreground">
            See <span className="gradient-text-accent">MindMatch</span> in Action
          </h2>
          <p className="text-lg text-primary-foreground/70 max-w-2xl mx-auto">
            A beautifully designed platform that makes finding study partners effortless
          </p>
        </motion.div>

        {/* App Preview Container */}
        <div className="relative max-w-5xl mx-auto">
          {/* Main Screen - Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Browser Frame */}
            <div className="bg-card rounded-2xl shadow-2xl overflow-hidden border border-border/50">
              {/* Browser Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1.5 bg-background rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                    <Monitor className="w-3.5 h-3.5" />
                    mindmatch.app/dashboard
                  </div>
                </div>
              </div>

              {/* App Content Mock */}
              <div className="p-6 bg-background">
                <div className="grid grid-cols-12 gap-6">
                  {/* Sidebar */}
                  <div className="col-span-3 space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold text-white">J</div>
                      <div>
                        <p className="font-semibold text-foreground">Joshua</p>
                        <p className="text-xs text-muted-foreground">Intermediate</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {[
                        { icon: Search, label: "Matches", active: true },
                        { icon: MessageCircle, label: "Chat", active: false },
                        { icon: Users, label: "Groups", active: false },
                      ].map((item) => (
                        <div 
                          key={item.label}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                            item.active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="col-span-9">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-foreground">Recommended Matches</h3>
                      <div className="flex gap-2">
                        <div className="px-3 py-1.5 text-sm bg-muted rounded-lg text-muted-foreground">All Skills</div>
                        <div className="px-3 py-1.5 text-sm bg-muted rounded-lg text-muted-foreground">Any Distance</div>
                      </div>
                    </div>

                    {/* Match Cards */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { name: "Sarah Chen", school: "MIT", skills: ["React", "Node.js"], match: 95, color: "bg-primary" },
                        { name: "David Kim", school: "Harvard", skills: ["Python", "ML"], match: 88, color: "bg-secondary" },
                        { name: "Priya Sharma", school: "IIT Delhi", skills: ["Java", "DSA"], match: 82, color: "bg-accent" },
                      ].map((student) => (
                        <div key={student.name} className="glass-card p-4 text-center hover:-translate-y-1 transition-transform cursor-pointer">
                          <div className="relative inline-block mb-3">
                            <div className={`w-16 h-16 rounded-full ${student.color} flex items-center justify-center text-xl font-bold text-white`}>
                              {student.name.charAt(0)}
                            </div>
                            <div className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-semibold">
                              {student.match}%
                            </div>
                          </div>
                          <h4 className="font-semibold text-foreground">{student.name}</h4>
                          <p className="text-sm text-muted-foreground mb-3">{student.school}</p>
                          <div className="flex justify-center gap-1 flex-wrap">
                            {student.skills.map((skill) => (
                              <span key={skill} className="skill-badge text-xs">{skill}</span>
                            ))}
                          </div>
                          <div className="mt-4 flex gap-2">
                            <button className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                              Connect
                            </button>
                            <button className="flex-1 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating Elements */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="absolute -left-8 top-1/2 -translate-y-1/2 glass-card p-4 shadow-xl hidden lg:block"
          >
            <div className="flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Mobile Ready</p>
                <p className="text-xs text-muted-foreground">Works on all devices</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="absolute -right-8 top-1/3 glass-card p-4 shadow-xl hidden lg:block"
          >
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-secondary" />
              <div>
                <p className="text-sm font-medium text-foreground">Real-time Chat</p>
                <p className="text-xs text-muted-foreground">Instant messaging</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AppPreview;
