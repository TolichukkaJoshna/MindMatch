import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Mail, Phone, MapPin, Calendar, Briefcase, GraduationCap,
  Target, Code, Globe, Linkedin, Github, Twitter, Link as LinkIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface ProfileEditProps {
  profileData: any;
  onUpdate: () => void;
}

export const ProfileEdit = ({ profileData, onUpdate }: ProfileEditProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Info
    name: profileData?.name || '',
    bio: profileData?.bio || '',
    phone: profileData?.phone || '',
    secondaryEmail: profileData?.secondaryEmail || '',
    
    // Personal Info
    dateOfBirth: profileData?.dateOfBirth?.split('T')[0] || '',
    gender: profileData?.gender || '',
    
    // Location
    address: {
      street: profileData?.address?.street || '',
      city: profileData?.address?.city || '',
      state: profileData?.address?.state || '',
      country: profileData?.address?.country || '',
      zipCode: profileData?.address?.zipCode || '',
    },
    timezone: profileData?.timezone || 'UTC',
    willingToRelocate: profileData?.willingToRelocate || false,
    
    // Social Links
    socialLinks: {
      linkedin: profileData?.socialLinks?.linkedin || '',
      github: profileData?.socialLinks?.github || '',
      portfolio: profileData?.socialLinks?.portfolio || '',
      twitter: profileData?.socialLinks?.twitter || '',
      other: profileData?.socialLinks?.other || '',
    },
    
    // Academic Info
    academicInfo: {
      degree: profileData?.academicInfo?.degree || '',
      fieldOfStudy: profileData?.academicInfo?.fieldOfStudy || '',
      graduationYear: profileData?.academicInfo?.graduationYear || '',
      gpa: profileData?.academicInfo?.gpa || '',
      achievements: profileData?.academicInfo?.achievements || [],
    },
    
    // Employment
    employmentStatus: profileData?.employmentStatus || 'student',
    
    // Career Goals
    careerGoals: {
      shortTerm: profileData?.careerGoals?.shortTerm || [],
      longTerm: profileData?.careerGoals?.longTerm || [],
      dreamCompanies: profileData?.careerGoals?.dreamCompanies || [],
      preferredRoles: profileData?.careerGoals?.preferredRoles || [],
      industriesOfInterest: profileData?.careerGoals?.industriesOfInterest || [],
    },
    
    // Languages
    languages: profileData?.languages || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.updateProfileData(formData);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      onUpdate();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: { ...(prev as any)[parent], [field]: value },
    }));
  };

  const addArrayItem = (field: string, value: string) => {
    if (value.trim()) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...(prev as any)[field], value.trim()],
      }));
    }
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev as any)[field].filter((_: any, i: number) => i !== index),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 bg-card"
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          Basic Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          
          <div>
            <Label htmlFor="secondaryEmail">Secondary Email</Label>
            <Input
              id="secondaryEmail"
              type="email"
              value={formData.secondaryEmail}
              onChange={(e) => updateField('secondaryEmail', e.target.value)}
              placeholder="alternate@email.com"
            />
          </div>
          
          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => updateField('dateOfBirth', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select value={formData.gender} onValueChange={(value) => updateField('gender', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="non-binary">Non-binary</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={formData.timezone}
              onChange={(e) => updateField('timezone', e.target.value)}
              placeholder="America/New_York"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => updateField('bio', e.target.value)}
            placeholder="Tell us about yourself..."
            rows={4}
          />
        </div>
      </motion.section>

      {/* Location */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 bg-card"
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-primary" />
          Location
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={formData.address.street}
              onChange={(e) => updateNestedField('address', 'street', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.address.city}
              onChange={(e) => updateNestedField('address', 'city', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              value={formData.address.state}
              onChange={(e) => updateNestedField('address', 'state', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.address.country}
              onChange={(e) => updateNestedField('address', 'country', e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="zipCode">ZIP/Postal Code</Label>
            <Input
              id="zipCode"
              value={formData.address.zipCode}
              onChange={(e) => updateNestedField('address', 'zipCode', e.target.value)}
            />
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="willingToRelocate"
            checked={formData.willingToRelocate}
            onChange={(e) => updateField('willingToRelocate', e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="willingToRelocate" className="cursor-pointer">
            Willing to relocate for opportunities
          </Label>
        </div>
      </motion.section>

      {/* Social Links */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6 bg-card"
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Globe className="w-6 h-6 text-primary" />
          Social Links
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="linkedin" className="flex items-center gap-2">
              <Linkedin className="w-4 h-4" /> LinkedIn
            </Label>
            <Input
              id="linkedin"
              value={formData.socialLinks.linkedin}
              onChange={(e) => updateNestedField('socialLinks', 'linkedin', e.target.value)}
              placeholder="https://linkedin.com/in/username"
            />
          </div>
          
          <div>
            <Label htmlFor="github" className="flex items-center gap-2">
              <Github className="w-4 h-4" /> GitHub
            </Label>
            <Input
              id="github"
              value={formData.socialLinks.github}
              onChange={(e) => updateNestedField('socialLinks', 'github', e.target.value)}
              placeholder="https://github.com/username"
            />
          </div>
          
          <div>
            <Label htmlFor="portfolio" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> Portfolio
            </Label>
            <Input
              id="portfolio"
              value={formData.socialLinks.portfolio}
              onChange={(e) => updateNestedField('socialLinks', 'portfolio', e.target.value)}
              placeholder="https://yourportfolio.com"
            />
          </div>
          
          <div>
            <Label htmlFor="twitter" className="flex items-center gap-2">
              <Twitter className="w-4 h-4" /> Twitter/X
            </Label>
            <Input
              id="twitter"
              value={formData.socialLinks.twitter}
              onChange={(e) => updateNestedField('socialLinks', 'twitter', e.target.value)}
              placeholder="https://twitter.com/username"
            />
          </div>
        </div>
      </motion.section>

      {/* Academic Information */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 bg-card"
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary" />
          Academic Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="degree">Degree</Label>
            <Input
              id="degree"
              value={formData.academicInfo.degree}
              onChange={(e) => updateNestedField('academicInfo', 'degree', e.target.value)}
              placeholder="Bachelor of Science"
            />
          </div>
          
          <div>
            <Label htmlFor="fieldOfStudy">Field of Study</Label>
            <Input
              id="fieldOfStudy"
              value={formData.academicInfo.fieldOfStudy}
              onChange={(e) => updateNestedField('academicInfo', 'fieldOfStudy', e.target.value)}
              placeholder="Computer Science"
            />
          </div>
          
          <div>
            <Label htmlFor="graduationYear">Graduation Year</Label>
            <Input
              id="graduationYear"
              type="number"
              value={formData.academicInfo.graduationYear}
              onChange={(e) => updateNestedField('academicInfo', 'graduationYear', parseInt(e.target.value))}
              placeholder="2025"
            />
          </div>
          
          <div>
            <Label htmlFor="gpa">GPA</Label>
            <Input
              id="gpa"
              type="number"
              step="0.01"
              value={formData.academicInfo.gpa}
              onChange={(e) => updateNestedField('academicInfo', 'gpa', parseFloat(e.target.value))}
              placeholder="3.75"
            />
          </div>
        </div>
      </motion.section>

      {/* Employment Status */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6 bg-card"
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" />
          Employment Status
        </h2>
        
        <Select value={formData.employmentStatus} onValueChange={(value) => updateField('employmentStatus', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select employment status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="employed">Employed</SelectItem>
            <SelectItem value="unemployed">Unemployed</SelectItem>
            <SelectItem value="freelance">Freelance</SelectItem>
            <SelectItem value="internship">Internship</SelectItem>
            <SelectItem value="seeking-opportunities">Seeking Opportunities</SelectItem>
          </SelectContent>
        </Select>
      </motion.section>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isLoading} className="px-8">
          {isLoading ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </form>
  );
};
