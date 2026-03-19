import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  X,
  MapPin,
  Briefcase,
  GraduationCap,
  Globe,
  Github,
  Linkedin,
  Calendar,
  Star
} from "lucide-react";

interface UserInfoPanelProps {
  conversation: any;
  onClose: () => void;
}

export const UserInfoPanel = ({ conversation, onClose }: UserInfoPanelProps) => {
  const navigate = useNavigate();
  const isGroup = conversation.isGroup;
  // For DMs, we want the other participant. 
  // Assuming current user is filtered out or handled in parent, 
  // but typically conversation.participants includes everyone. 
  // We'll need the current user ID to filter, or assume parent passes the target user.
  // For now, let's assume the parent passes the relevant user or we find the other one if DM.

  // Actually, keeping it simple: simpler to rely on the parent or just pick the first non-me user if DM.
  // But inside this component we don't know "me". 
  // Let's assume the parent passes "targetUser" if it's a DM, or we just display Group Info.

  // Let's iterate: props should probably be `targetUser` (for DM) or `groupInfo` (for Group).
  // But `conversation` object usually has everything. 

  // Let's try to extract info from `conversation`.
  // Mocking "other user" logic for now: we'll assume the 0-th participant is the one we want to show 
  // (typically the backend populates participants).
  // In a real app we filter `p._id !== currentUserId`.

  const displayImage = isGroup
    ? conversation.groupAvatar || `https://ui-avatars.com/api/?name=${conversation.groupName}`
    : conversation.participants?.[0]?.avatar;

  const displayName = isGroup
    ? conversation.groupName
    : conversation.participants?.[0]?.name;

  const displaySubtitle = isGroup
    ? `${conversation.participants?.length || 0} members`
    : conversation.participants?.[0]?.title || "Student"; // fallback

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-lg">
          {isGroup ? "Group Info" : "User Info"}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            <Avatar className="w-24 h-24">
              <AvatarImage src={displayImage} />
              <AvatarFallback>{displayName?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-bold">{displayName}</h3>
              <p className="text-muted-foreground">{displaySubtitle}</p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 pt-2">
              {!isGroup && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/profile/${conversation.participants?.[0]?._id}`)}
                >
                  View Profile
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Details (DM only for now) */}
          {!isGroup && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Details
              </h4>

              <div className="space-y-3 text-sm">
                {conversation.participants?.[0]?.location?.city && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{conversation.participants[0].location.city}{conversation.participants[0].location.country ? `, ${conversation.participants[0].location.country}` : ''}</span>
                  </div>
                )}
                {conversation.participants?.[0]?.employmentStatus && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span>{conversation.participants[0].employmentStatus.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                  </div>
                )}
                {conversation.participants?.[0]?.collegeName && (
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <span>{conversation.participants[0].collegeName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isGroup && <Separator />}

          {/* Skills (DM only) */}
          {!isGroup && conversation.participants?.[0]?.skills?.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {conversation.participants[0].skills.slice(0, 8).map((skill: any, index: number) => (
                  <Badge key={index} variant="secondary">{skill.skillName}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Shared Files / Media Placeholder */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Shared Media
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted aspect-square rounded-md flex items-center justify-center text-xs text-muted-foreground">Img 1</div>
              <div className="bg-muted aspect-square rounded-md flex items-center justify-center text-xs text-muted-foreground">Img 2</div>
              <div className="bg-muted aspect-square rounded-md flex items-center justify-center text-xs text-muted-foreground">Docs</div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
