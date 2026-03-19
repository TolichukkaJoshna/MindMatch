import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Users, Globe, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface PrivacySettingsProps {
  userId: string;
}

export const PrivacySettings = ({ userId }: PrivacySettingsProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [fieldVisibility, setFieldVisibility] = useState<Record<string, string>>({
    email: 'connections',
    phone: 'connections',
    secondaryEmail: 'connections',
    socialLinks: 'public',
    dateOfBirth: 'private',
    gender: 'connections',
    address: 'private',
    academicInfo: 'public',
    employmentStatus: 'public',
    experience: 'public',
    careerGoals: 'public',
    projects: 'public',
    languages: 'public',
  });

  useEffect(() => {
    fetchPrivacySettings();
  }, [userId]);

  const fetchPrivacySettings = async () => {
    try {
      const response = await api.getProfile(userId);
      if (response.data.privacy) {
        setFieldVisibility(response.data.privacy);
      }
    } catch (error) {
      console.error('Failed to fetch privacy settings');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await api.updatePrivacySettings({
        fieldVisibility,
        profileVisibility,
      });
      toast({
        title: 'Success',
        description: 'Privacy settings updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update privacy settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFieldVisibility = (field: string, visibility: string) => {
    setFieldVisibility((prev) => ({ ...prev, [field]: visibility }));
  };

  const visibilityOptions = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can see' },
    { value: 'connections', label: 'Connections', icon: Users, description: 'Only your connections' },
    { value: 'private', label: 'Private', icon: Lock, description: 'Only you' },
  ];

  const profileFields = [
    { key: 'email', label: 'Primary Email' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'secondaryEmail', label: 'Secondary Email' },
    { key: 'socialLinks', label: 'Social Links' },
    { key: 'dateOfBirth', label: 'Date of Birth' },
    { key: 'gender', label: 'Gender' },
    { key: 'address', label: 'Address' },
    { key: 'academicInfo', label: 'Academic Information' },
    { key: 'employmentStatus', label: 'Employment Status' },
    { key: 'experience', label: 'Work Experience' },
    { key: 'careerGoals', label: 'Career Goals' },
    { key: 'projects', label: 'Projects' },
    { key: 'languages', label: 'Languages' },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Profile Visibility */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 bg-card"
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          Profile Visibility
        </h2>
        <p className="text-muted-foreground mb-4">
          Control who can see your profile overall
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {visibilityOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setProfileVisibility(option.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  profileVisibility === option.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Icon className="w-6 h-6 mb-2 mx-auto" />
                <div className="font-semibold">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </button>
            );
          })}
        </div>
      </motion.section>

      {/* Field-Level Privacy */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 bg-card"
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Eye className="w-6 h-6 text-primary" />
          Field-Level Privacy
        </h2>
        <p className="text-muted-foreground mb-6">
          Control who can see specific fields in your profile
        </p>
        
        <div className="space-y-4">
          {profileFields.map((field) => (
            <div key={field.key} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <Label className="font-medium">{field.label}</Label>
              <Select
                value={fieldVisibility[field.key] || 'public'}
                onValueChange={(value) => updateFieldVisibility(field.key, value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Public
                    </div>
                  </SelectItem>
                  <SelectItem value="connections">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Connections
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Private
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Privacy Tips */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 bg-card border-l-4 border-primary"
      >
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Privacy Tips
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• <strong>Public:</strong> Anyone on the platform can see this information</li>
          <li>• <strong>Connections:</strong> Only users you've connected with can see this</li>
          <li>• <strong>Private:</strong> Only you can see this information</li>
          <li>• Your name and avatar are always visible to help others find you</li>
          <li>• Consider keeping contact information limited to connections for safety</li>
        </ul>
      </motion.section>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading} className="px-8">
          {isLoading ? 'Saving...' : 'Save Privacy Settings'}
        </Button>
      </div>
    </div>
  );
};
