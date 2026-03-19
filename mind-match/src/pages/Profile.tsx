import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    User, MapPin, Book, Target, Briefcase, Globe,
    Edit2, Save, X, ArrowLeft, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, checkAuth } = useAuth();
    const { toast } = useToast();
    const [profileUser, setProfileUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Edit Form State
    const [editForm, setEditForm] = useState({
        name: "",
        collegeName: "",
        bio: "",
        skills: [] as Array<{ skillName: string; level: string }>,
        goals: [] as string[],
    });

    // New skill/goal input states
    const [newSkillName, setNewSkillName] = useState("");
    const [newSkillLevel, setNewSkillLevel] = useState("intermediate");
    const [newGoal, setNewGoal] = useState("");

    const isOwnProfile = !userId || (currentUser && currentUser._id === userId);

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            let data;
            if (isOwnProfile) {
                // If checking own profile but we have currentUser, we can use that for initial render?
                // Better to fetch fresh to be sure.
                const response = await api.getUserProfile();
                data = response.data.user || response.data;
            } else {
                if (userId) {
                    const response = await api.getUserById(userId);
                    data = response.data.user || response.data;
                }
            }

            if (data) {
                setProfileUser(data);
                // Initialize edit form
                setEditForm({
                    name: data.name || "",
                    collegeName: data.collegeName || "",
                    bio: data.bio || "",
                    skills: data.skills?.map((s: any) => ({ skillName: s.skillName, level: s.level })) || [],
                    goals: data.goals || [],
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load profile",
                variant: "destructive",
            });
            navigate("/dashboard");
        } finally {
            setIsLoading(false);
        }
    };


    const handleSave = async () => {
        try {
            // Update basic profile info
            await api.updateUserProfile({
                name: editForm.name,
                collegeName: editForm.collegeName,
                bio: editForm.bio,
            });

            // Update skills
            await api.updateSkills(editForm.skills);

            // Update goals
            await api.updateGoals(editForm.goals);

            toast({ title: "Success", description: "Profile updated successfully" });
            setIsEditing(false);
            fetchProfile(); // Refresh
            if (isOwnProfile) checkAuth(); // Update global auth context
        } catch (error) {
            toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
        }
    };

    const handleAddSkill = () => {
        if (!newSkillName.trim()) {
            toast({ title: "Error", description: "Please enter a skill name", variant: "destructive" });
            return;
        }

        // Check for duplicate skills (case-insensitive)
        const skillExists = editForm.skills.some(
            skill => skill.skillName.toLowerCase() === newSkillName.trim().toLowerCase()
        );

        if (skillExists) {
            toast({ title: "Error", description: "This skill has already been added", variant: "destructive" });
            return;
        }

        setEditForm({
            ...editForm,
            skills: [...editForm.skills, { skillName: newSkillName.trim(), level: newSkillLevel }]
        });
        setNewSkillName("");
        setNewSkillLevel("intermediate");
    };

    const handleRemoveSkill = (index: number) => {
        setEditForm({
            ...editForm,
            skills: editForm.skills.filter((_, i) => i !== index)
        });
    };

    const handleAddGoal = () => {
        if (!newGoal) {
            toast({ title: "Error", description: "Please select a goal", variant: "destructive" });
            return;
        }
        if (editForm.goals.includes(newGoal)) {
            toast({ title: "Error", description: "Goal already added", variant: "destructive" });
            return;
        }
        setEditForm({
            ...editForm,
            goals: [...editForm.goals, newGoal]
        });
        setNewGoal("");
    };

    const handleRemoveGoal = (index: number) => {
        setEditForm({
            ...editForm,
            goals: editForm.goals.filter((_, i) => i !== index)
        });
    };


    const getInitials = (name: string) => name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U";

    if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
    if (!profileUser) return <div className="flex justify-center items-center h-screen">User not found</div>;

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <Button variant="ghost" className="mb-4" onClick={() => navigate("/dashboard")}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>

                {/* Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-8 flex flex-col md:flex-row gap-8 items-start relative bg-card"
                >
                    <Avatar className="w-32 h-32">
                        <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                            {getInitials(profileUser.name)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-4 w-full">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                {isEditing ? (
                                    <Input
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="text-2xl font-bold h-auto p-1"
                                    />
                                ) : (
                                    <h1 className="text-3xl font-bold text-foreground">{profileUser.name}</h1>
                                )}

                                <div className="flex items-center text-muted-foreground">
                                    <Globe className="w-4 h-4 mr-2" />
                                    {isEditing ? (
                                        <Input
                                            value={editForm.collegeName}
                                            onChange={(e) => setEditForm({ ...editForm, collegeName: e.target.value })}
                                            placeholder="College Name"
                                            className="h-8"
                                        />
                                    ) : (
                                        <span>{profileUser.collegeName || "No college specified"}</span>
                                    )}
                                </div>
                            </div>

                            {isOwnProfile && (
                                <div className="flex gap-2">
                                    {isEditing ? (
                                        <>
                                            <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all duration-200 px-6">
                                                <Save className="w-4 h-4 mr-2" /> Save
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="hover:bg-destructive/5 hover:text-destructive shadow-sm hover:shadow-md transition-all duration-200 px-4">
                                                <X className="w-4 h-4 mr-2" /> Cancel
                                            </Button>
                                        </>
                                    ) : (
                                        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                                            <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bio */}
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <User className="w-4 h-4" /> Bio
                            </h3>
                            {isEditing ? (
                                <Textarea
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    placeholder="Tell us about yourself..."
                                    className="min-h-[120px] rounded-xl border-2 border-primary/20 focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 bg-white/50 backdrop-blur-sm resize-none transition-all duration-300 p-4 text-base shadow-sm hover:shadow-md"
                                />
                            ) : (
                                <p className="text-muted-foreground leading-relaxed">
                                    {profileUser.bio || "No bio added yet."}
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Skills & Goals Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Skills */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-6 bg-card"
                    >
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Book className="w-5 h-5 text-primary" /> Skills
                        </h3>

                        {isEditing ? (
                            <div className="space-y-4">
                                {/* Existing Skills */}
                                <div className="flex flex-wrap gap-2">
                                    {editForm.skills.map((skill, index) => (
                                        <div key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2">
                                            {skill.skillName} <span className="text-xs opacity-70">({skill.level})</span>
                                            <button
                                                onClick={() => handleRemoveSkill(index)}
                                                className="hover:bg-primary/20 rounded-full p-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {editForm.skills.length === 0 && <span className="text-muted-foreground text-sm">No skills added yet.</span>}
                                </div>

                                {/* Add New Skill */}
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Skill name (e.g., React)"
                                            value={newSkillName}
                                            onChange={(e) => setNewSkillName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                                        />
                                    </div>
                                    <div className="w-40">
                                        <Select value={newSkillLevel} onValueChange={setNewSkillLevel}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="beginner">Beginner</SelectItem>
                                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                                <SelectItem value="advanced">Advanced</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button size="sm" onClick={handleAddSkill}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {profileUser.skills?.map((skill: any, index: number) => (
                                    <div key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                        {skill.skillName} <span className="text-xs opacity-70">({skill.level})</span>
                                    </div>
                                ))}
                                {profileUser.skills?.length === 0 && <span className="text-muted-foreground">No skills added.</span>}
                            </div>
                        )}
                    </motion.div>

                    {/* Goals */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-6 bg-card"
                    >
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" /> Learning Goals
                        </h3>

                        {isEditing ? (
                            <div className="space-y-4">
                                {/* Existing Goals */}
                                <ul className="space-y-2">
                                    {editForm.goals.map((goal: string, index: number) => (
                                        <li key={index} className="flex items-start gap-2 text-muted-foreground group">
                                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                            <span className="flex-1">{goal}</span>
                                            <button
                                                onClick={() => handleRemoveGoal(index)}
                                                className="opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded-full p-1 transition-opacity"
                                            >
                                                <X className="w-3 h-3 text-destructive" />
                                            </button>
                                        </li>
                                    ))}
                                    {editForm.goals.length === 0 && <span className="text-muted-foreground text-sm">No goals added yet.</span>}
                                </ul>

                                {/* Add New Goal */}
                                <div className="flex gap-2">
                                    <Select value={newGoal} onValueChange={setNewGoal}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Select a learning goal" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="internship">Internship</SelectItem>
                                            <SelectItem value="placement">Placement</SelectItem>
                                            <SelectItem value="hackathon">Hackathon</SelectItem>
                                            <SelectItem value="project">Project</SelectItem>
                                            <SelectItem value="casual">Casual Learning</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button size="sm" onClick={handleAddGoal}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {profileUser.goals?.map((goal: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2 text-muted-foreground">
                                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                        {goal}
                                    </li>
                                ))}
                                {profileUser.goals?.length === 0 && <span className="text-muted-foreground">No goals added.</span>}
                            </ul>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
