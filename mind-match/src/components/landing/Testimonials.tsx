import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Alex Johnson",
    school: "Stanford University",
    image: "A",
    color: "bg-primary",
    quote: "MindMatch helped me find my hackathon team in just 2 hours. We went on to win first place! The AI matching is incredibly accurate.",
    rating: 5,
  },
  {
    name: "Maria Garcia",
    school: "MIT",
    image: "M",
    color: "bg-secondary",
    quote: "I was struggling with system design interviews. Found a senior mentor through MindMatch who helped me land my dream job at Google.",
    rating: 5,
  },
  {
    name: "James Wilson",
    school: "UC Berkeley",
    image: "J",
    color: "bg-accent",
    quote: "The study groups feature is amazing. Our React learning group has grown to 50 members and we do weekly code reviews together.",
    rating: 5,
  },
  {
    name: "Sarah Chen",
    school: "Harvard",
    image: "S",
    color: "bg-gold",
    quote: "As an international student, making study connections was hard. MindMatch changed that completely. Now I have study partners across 3 time zones!",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-24 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, hsl(var(--primary)) 2px, transparent 0)`,
          backgroundSize: "50px 50px"
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Loved by <span className="gradient-text">10,000+</span> Students
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what students from top universities are saying about MindMatch
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="testimonial-card h-full relative">
                {/* Quote Icon */}
                <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-foreground mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${testimonial.color} flex items-center justify-center text-lg font-bold text-white`}>
                    {testimonial.image}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.school}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { value: "10K+", label: "Active Students" },
            { value: "50+", label: "Universities" },
            { value: "98%", label: "Match Rate" },
            { value: "4.9", label: "App Rating" },
          ].map((stat, index) => (
            <div key={index} className="glass-card p-6 text-center">
              <p className="text-3xl md:text-4xl font-bold gradient-text mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
