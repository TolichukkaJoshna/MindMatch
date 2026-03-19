import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Settings, Shield, Award, ArrowLeft, Edit2,
  Briefcase, Code2, GraduationCap, MapPin, Mail, Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { ProfileEdit } from '@/components/profile/ProfileEdit';
import { PrivacySettings } from '@/components/profile/PrivacySettings';
import { VerificationCenter } from '@/components/profile/VerificationCenter';

const EnhancedProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, checkAuth } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const isOwnProfile = !userId || (currentUser && currentUser._id === userId);
  const viewUserId = userId || currentUser?._id;

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await api.getProfile(viewUserId!);
      setProfileData(response.data.profile);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => 
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profileData) {
    return <div className="flex justify-center items-center h-screen">User not found</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 md:p-8 bg-card"
        >
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="w-24 h-24 md:w-32 md:h-32">
              <AvatarFallback className="text-3xl md:text-4xl bg-primary text-primary-foreground">
                {getInitials(profileData.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4 w-full">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    {profileData.name}
                  </h1>
                  {profileData.academicInfo?.degree && (
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                      <GraduationCap className="w-4 h-4" />
                      {profileData.academicInfo.degree} in {profileData.academicInfo.fieldOfStudy}
                    </p>
                  )}
                  {profileData.address?.city && (
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4" />
                      {profileData.address.city}, {profileData.address.country}
                    </p>
                  )}
                </div>

                {isOwnProfile && (
                  <Button onClick={() => setActiveTab('edit')}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>

              {profileData.bio && (
                <p className="text-muted-foreground leading-relaxed">
                  {profileData.bio}
                </p>
              )}

              <div className="flex flex-wrap gap-4 text-sm">
                {profileData.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {profileData.email}
                  </div>
                )}
                {profileData.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {profileData.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="overview">
              <User className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            {isOwnProfile && (
              <>
                <TabsTrigger value="edit">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit
                </TabsTrigger>
                <TabsTrigger value="privacy">
                  <Shield className="w-4 h-4 mr-2" />
                  Privacy
                </TabsTrigger>
                <TabsTrigger value="verification">
                  <Award className="w-4 h-4 mr-2" />
                  Verification
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Skills */}
            {profileData.skills && profileData.skills.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 bg-card"
              >
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-primary" />
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.skills.map((skill: any, index: number) => (
                    <div
                      key={index}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                    >
                      {skill.skillName} {skill.level && `(${skill.level})`}
                      {skill.isVerified && ' ✓'}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Experience */}
            {profileData.experience && profileData.experience.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6 bg-card"
              >
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Experience
                </h3>
                <div className="space-y-4">
                  {profileData.experience.map((exp: any, index: number) => (
                    <div key={index} className="border-l-2 border-primary pl-4">
                      <h4 className="font-semibold">{exp.position}</h4>
                      <p className="text-muted-foreground">{exp.company}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(exp.startDate).getFullYear()} - 
                        {exp.isCurrent ? ' Present' : new Date(exp.endDate).getFullYear()}
                      </p>
                      {exp.description && (
                        <p className="mt-2 text-sm">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Projects */}
            {profileData.projects && profileData.projects.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6 bg-card"
              >
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-primary" />
                  Projects
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profileData.projects.map((project: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h4 className="font-semibold">{project.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {project.description}
                      </p>
                      {project.technologies && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {project.technologies.map((tech: string, i: number) => (
                            <span key={i} className="text-xs px-2 py-1 bg-muted rounded">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </TabsContent>

          {/* Edit Tab */}
          {isOwnProfile && (
            <TabsContent value="edit" className="mt-6">
              <ProfileEdit profileData={profileData} onUpdate={fetchProfile} />
            </TabsContent>
          )}

          {/* Privacy Tab */}
          {isOwnProfile && (
            <TabsContent value="privacy" className="mt-6">
              <PrivacySettings userId={viewUserId!} />
            </TabsContent>
          )}

          {/* Verification Tab */}
          {isOwnProfile && (
            <TabsContent value="verification" className="mt-6">
              <VerificationCenter userId={viewUserId!} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedProfile;
