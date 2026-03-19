import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const SUGGESTED_SKILLS = [
  "React", "Node.js", "Python", "Java", "C++", 
  "Data Structures", "Machine Learning", "UI/UX Design"
];

const PROFICIENCY_LEVELS = [
  { id: "beginner", label: "Beginner", description: "Just starting out" },
  { id: "intermediate", label: "Intermediate", description: "Comfortable with basics" },
  { id: "advanced", label: "Advanced", description: "Professional experience" },
];

const GOALS = [
  { id: "placement", label: "Placement Preparation" },
  { id: "internship", label: "Internship Hunt" },
  { id: "hackathon", label: "Hackathon Teammates" },
  { id: "project", label: "Project Collaboration" },
  { id: "casual", label: "Casual Learning" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [skillInput, setSkillInput] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [proficiency, setProficiency] = useState("");
  const [goal, setGoal] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const addSkill = (skill: string) => {
    if (skill && !selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skill));
  };

  const handleNext = async () => {
    if (!canProceed()) {
      return;
    }

    setIsLoading(true);
    try {
      if (step < totalSteps) {
        // Move to next step without saving yet
        setStep(step + 1);
      } else {
        // Final step - save everything and complete onboarding
        await completeOnboarding();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    if (!proficiency || selectedSkills.length === 0 || !goal) {
      toast({
        title: "Error",
        description: "Please complete all steps",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Save skills with proficiency level
      const skillsData = selectedSkills.map(skill => ({
        skillName: skill,
        level: proficiency
      }));
      
      await api.updateSkills(skillsData);
      
      // Save goals
      await api.updateGoals([goal]);
      
      // Refresh user data to get updated profile
      await checkAuth();
      
      toast({
        title: "Success!",
        description: "Your profile has been completed. Welcome to MindMatch!",
      });
      
      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete onboarding",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedSkills.length > 0;
      case 2:
        return proficiency !== "";
      case 3:
        return goal !== "";
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-center border-b border-border">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6 text-primary" />
          <span className="text-xl font-semibold text-foreground">Mind Match</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl"
        >
          <div className="glass-card p-8 shadow-lg">
            {/* Progress Bar */}
            <div className="mb-8">
              <Progress value={progress} className="h-2" />
            </div>

            <AnimatePresence mode="wait">
              {/* Step 1: Skills */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-primary mb-2">What are your skills?</h2>
                  <p className="text-muted-foreground mb-6">
                    Add skills you are good at or want to learn
                  </p>

                  {/* Input */}
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Type a skill (e.g. React)..."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill(skillInput);
                        }
                      }}
                      className="flex-1"
                    />
                    <Button onClick={() => addSkill(skillInput)}>Add</Button>
                  </div>

                  {/* Suggested Skills */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {SUGGESTED_SKILLS.filter((s) => !selectedSkills.includes(s)).map((skill) => (
                      <button
                        key={skill}
                        onClick={() => addSkill(skill)}
                        className="px-3 py-1.5 rounded-full border border-border bg-card text-foreground text-sm hover:bg-muted transition-colors flex items-center gap-1"
                      >
                        {skill} <Plus className="w-3 h-3" />
                      </button>
                    ))}
                  </div>

                  {/* Selected Skills */}
                  {selectedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedSkills.map((skill) => (
                        <motion.span
                          key={skill}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2"
                        >
                          {skill}
                          <button onClick={() => removeSkill(skill)} className="hover:bg-white/20 rounded-full p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </motion.span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 2: Proficiency */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-primary mb-2">Your Proficiency Level</h2>
                  <p className="text-muted-foreground mb-6">
                    How would you rate your overall expertise?
                  </p>

                  <div className="space-y-3">
                    {PROFICIENCY_LEVELS.map((level) => (
                      <button
                        key={level.id}
                        onClick={() => setProficiency(level.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          proficiency === level.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="font-semibold text-foreground">{level.label}</div>
                        <div className="text-sm text-muted-foreground">{level.description}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Goals */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-primary mb-2">Set Your Goal</h2>
                  <p className="text-muted-foreground mb-6">
                    What do you want to achieve?
                  </p>

                  <div className="space-y-3">
                    {GOALS.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setGoal(g.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          goal === g.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="font-semibold text-foreground">{g.label}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
              ) : (
                <div />
              )}
              <Button onClick={handleNext} disabled={!canProceed() || isLoading}>
                {isLoading ? "Saving..." : step === totalSteps ? "Complete Profile" : "Next"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Onboarding;
