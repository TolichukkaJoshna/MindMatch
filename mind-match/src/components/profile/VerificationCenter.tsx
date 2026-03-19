import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, CheckCircle, XCircle, Clock, Upload, Mail, 
  GraduationCap, Code, Briefcase, Award, AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface VerificationCenterProps {
  userId: string;
}

export const VerificationCenter = ({ userId }: VerificationCenterProps) => {
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // College verification form
  const [collegeMethod, setCollegeMethod] = useState('edu-email');
  const [eduEmail, setEduEmail] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  
  // Skill verification form
  const [selectedSkill, setSelectedSkill] = useState('');
  const [skillMethod, setSkillMethod] = useState('test');
  const [skillData, setSkillData] = useState('');

  useEffect(() => {
    fetchVerificationStatus();
  }, [userId]);

  const fetchVerificationStatus = async () => {
    setIsLoading(true);
    try {
      const response = await api.getVerificationStatus();
      setVerificationStatus(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load verification status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollegeVerification = async () => {
    try {
      await api.submitCollegeVerification({
        method: collegeMethod,
        eduEmail: collegeMethod === 'edu-email' ? eduEmail : undefined,
        documentUrl: collegeMethod === 'document' ? documentUrl : undefined,
      });
      
      toast({
        title: 'Success',
        description: 'College verification submitted successfully',
      });
      
      fetchVerificationStatus();
      setEduEmail('');
      setDocumentUrl('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit college verification',
        variant: 'destructive',
      });
    }
  };

  const handleSkillVerification = async () => {
    if (!selectedSkill) {
      toast({
        title: 'Error',
        description: 'Please select a skill to verify',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.submitSkillVerification({
        skillName: selectedSkill,
        method: skillMethod,
        verificationData: skillData,
      });
      
      toast({
        title: 'Success',
        description: 'Skill verification submitted successfully',
      });
      
      fetchVerificationStatus();
      setSelectedSkill('');
      setSkillData('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit skill verification',
        variant: 'destructive',
      });
    }
  };

  const getVerificationIcon = (verified: boolean, pending?: boolean) => {
    if (verified) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (pending) return <Clock className="w-5 h-5 text-yellow-500" />;
    return <XCircle className="w-5 h-5 text-muted-foreground" />;
  };

  const getBadgeColor = (badge: string) => {
    const colors: Record<string, string> = {
      'verified-email': 'bg-blue-500',
      'verified-college': 'bg-purple-500',
      'verified-skills': 'bg-green-500',
      'verified-experience': 'bg-orange-500',
    };
    return colors[badge] || 'bg-gray-500';
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading verification status...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Verification Score */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 bg-card"
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Verification Score
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-primary">
              {verificationStatus?.verificationScore || 0}%
            </span>
            <span className="text-muted-foreground">Complete</span>
          </div>
          
          <Progress value={verificationStatus?.verificationScore || 0} className="h-3" />
          
          <p className="text-sm text-muted-foreground">
            Verified profiles get more visibility and trust from other users
          </p>
        </div>
      </motion.section>

      {/* Earned Badges */}
      {verificationStatus?.badges && verificationStatus.badges.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 bg-card"
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Earned Badges
          </h3>
          
          <div className="flex flex-wrap gap-3">
            {verificationStatus.badges.map((badge: string) => (
              <div
                key={badge}
                className={`px-4 py-2 rounded-full text-white font-medium ${getBadgeColor(badge)}`}
              >
                {badge.replace('verified-', '').replace('-', ' ').toUpperCase()}
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Email Verification */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 bg-card"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Email Verification
          </h3>
          {getVerificationIcon(verificationStatus?.emailVerified)}
        </div>
        
        {verificationStatus?.emailVerified ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span>Your email is verified</span>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Email verification is automatic when you sign up
            </p>
            <Button variant="outline" size="sm">
              Resend Verification Email
            </Button>
          </div>
        )}
      </motion.section>

      {/* College Verification */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 bg-card"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            College Verification
          </h3>
          {getVerificationIcon(verificationStatus?.collegeVerified)}
        </div>
        
        {verificationStatus?.collegeVerified ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span>Your college is verified</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Verification Method</Label>
              <Select value={collegeMethod} onValueChange={setCollegeMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edu-email">.edu Email</SelectItem>
                  <SelectItem value="document">Upload Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {collegeMethod === 'edu-email' ? (
              <div>
                <Label htmlFor="eduEmail">College Email (.edu)</Label>
                <Input
                  id="eduEmail"
                  type="email"
                  value={eduEmail}
                  onChange={(e) => setEduEmail(e.target.value)}
                  placeholder="you@university.edu"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  We'll send a verification link to this email
                </p>
              </div>
            ) : (
              <div>
                <Label htmlFor="documentUrl">Document URL</Label>
                <Input
                  id="documentUrl"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload your student ID or enrollment letter
                </p>
              </div>
            )}
            
            <Button onClick={handleCollegeVerification}>
              <Upload className="w-4 h-4 mr-2" />
              Submit Verification
            </Button>
          </div>
        )}
      </motion.section>

      {/* Skill Verifications */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6 bg-card"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            Skill Verifications
          </h3>
        </div>
        
        {verificationStatus?.skillVerifications && verificationStatus.skillVerifications.length > 0 ? (
          <div className="space-y-2 mb-4">
            {verificationStatus.skillVerifications.map((skill: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">{skill.skillName}</span>
                {getVerificationIcon(skill.verified)}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground mb-4">No skills verified yet</p>
        )}
        
        <div className="space-y-4 border-t pt-4">
          <h4 className="font-semibold">Verify a New Skill</h4>
          
          <div>
            <Label htmlFor="skillName">Skill Name</Label>
            <Input
              id="skillName"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              placeholder="e.g., React, Python, Machine Learning"
            />
          </div>
          
          <div>
            <Label>Verification Method</Label>
            <Select value={skillMethod} onValueChange={setSkillMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Take a Test</SelectItem>
                <SelectItem value="project">Link a Project</SelectItem>
                <SelectItem value="certificate">Upload Certificate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="skillData">
              {skillMethod === 'project' ? 'Project URL' : 
               skillMethod === 'certificate' ? 'Certificate URL' : 
               'Test Score/Details'}
            </Label>
            <Input
              id="skillData"
              value={skillData}
              onChange={(e) => setSkillData(e.target.value)}
              placeholder={
                skillMethod === 'project' ? 'https://github.com/...' :
                skillMethod === 'certificate' ? 'https://...' :
                'Enter details'
              }
            />
          </div>
          
          <Button onClick={handleSkillVerification}>
            <Upload className="w-4 h-4 mr-2" />
            Submit Skill Verification
          </Button>
        </div>
      </motion.section>

      {/* Experience Verification */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6 bg-card"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" />
            Experience Verification
          </h3>
          {getVerificationIcon(verificationStatus?.experienceVerified)}
        </div>
        
        {verificationStatus?.experienceVerified ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span>Your experience is verified</span>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Connect your LinkedIn or upload employment documents to verify your work experience
            </p>
            <Button variant="outline" size="sm">
              <Briefcase className="w-4 h-4 mr-2" />
              Verify Experience
            </Button>
          </div>
        )}
      </motion.section>

      {/* Info Box */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-6 bg-card border-l-4 border-blue-500"
      >
        <h4 className="font-bold mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-500" />
          Why Verify?
        </h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Increase your profile visibility in search results</li>
          <li>• Build trust with potential study partners</li>
          <li>• Get priority in matching algorithms</li>
          <li>• Unlock premium features and badges</li>
          <li>• Stand out from other users</li>
        </ul>
      </motion.section>
    </div>
  );
};
