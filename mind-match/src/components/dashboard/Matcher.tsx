import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Match {
  _id: string;
  name: string;
  avatar?: string;
  collegeName?: string;
  skills: Array<{ skillName: string; level: string }>;
  goals: string[];
  location?: {
    college?: string;
    city?: string;
    country?: string;
  };
  matchScore: number;
  isOnline?: boolean;
}

const Matcher = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [skillFilter, setSkillFilter] = useState("all");
  const [distanceFilter, setDistanceFilter] = useState("any");
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Track connection status for each match
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, { status: string; requestId?: string }>>({});

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const response = await api.getRecommendedMatches(20, 30);
      if (response.success && response.data) {
        const matchesData = response.data.matches || [];
        setMatches(matchesData);

        // Fetch connection status for each match
        const statuses: Record<string, { status: string; requestId?: string }> = {};
        await Promise.all(
          matchesData.map(async (match: Match) => {
            try {
              const statusResponse = await api.getConnectionStatus(match._id);
              if (statusResponse.success && statusResponse.data) {
                statuses[match._id] = {
                  status: statusResponse.data.status,
                  requestId: statusResponse.data.requestId,
                };
              }
            } catch (error) {
              console.error(`Failed to fetch status for ${match._id}:`, error);
            }
          })
        );
        setConnectionStatuses(statuses);
      }
    } catch (error: any) {
      if (error.message?.includes('onboarding')) {
        toast({
          title: "Onboarding Required",
          description: "Please complete your profile setup first.",
          variant: "destructive",
        });
        navigate("/onboarding");
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to load matches",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (userId: string) => {
    try {
      await api.sendStudyRequest(userId);
      // Update connection status for this user
      setConnectionStatuses(prev => ({
        ...prev,
        [userId]: { status: 'pending-sent' }
      }));
      toast({
        title: "Request Sent",
        description: "Your study request has been sent!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send request",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRequest = async (userId: string, requestId: string) => {
    try {
      await api.acceptRequest(requestId);
      toast({
        title: "Request Accepted",
        description: "You can now chat with this user!",
      });
      // Refresh to update status
      fetchMatches();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept request",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUniversity = (match: Match) => {
    if (match.collegeName) return match.collegeName;
    if (match.location?.college) return match.location.college;
    if (match.location?.city) return match.location.city;
    if (match.location?.country) return match.location.country;
    return "MindMatch Student";
  };

  const getSkillNames = (skills: Array<{ skillName: string; level: string }>) => {
    return skills.map((s) => s.skillName);
  };

  const clearFilters = () => {
    setSkillFilter("all");
    setDistanceFilter("any");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">Recommended Matches</h1>
          {(skillFilter !== "all" || distanceFilter !== "any") && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              Remove All Filters
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={skillFilter} onValueChange={setSkillFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Skills" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              <SelectItem value="react">React</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="java">Java</SelectItem>
            </SelectContent>
          </Select>

          <Select value={distanceFilter} onValueChange={setDistanceFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Any Distance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Distance</SelectItem>
              <SelectItem value="same-city">Same City</SelectItem>
              <SelectItem value="same-country">Same Country</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Match Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading matches...</div>
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No matches found yet.</p>
          <Button onClick={fetchMatches} variant="outline">
            Refresh Matches
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match, index) => (
            <motion.div
              key={match._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 relative"
            >
              {/* Match Percentage Badge */}
              <div className="absolute top-4 right-4">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                  {match.matchScore}% Match
                </span>
              </div>

              {/* Avatar */}
              <div className="flex flex-col items-center mb-4">
                <Avatar className="h-20 w-20 mb-3">
                  {match.avatar ? (
                    <img src={match.avatar} alt={match.name} />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                      {getInitials(match.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <h3 className="font-semibold text-lg text-foreground">{match.name}</h3>
                <p className="text-sm text-muted-foreground">{getUniversity(match)}</p>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {getSkillNames(match.skills).slice(0, 3).map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-full text-xs bg-muted text-muted-foreground"
                  >
                    {skill}
                  </span>
                ))}
                {getSkillNames(match.skills).length > 3 && (
                  <span className="px-3 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                    +{getSkillNames(match.skills).length - 3}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {(() => {
                  const status = connectionStatuses[match._id];

                  if (status?.status === 'connected') {
                    return (
                      <Button
                        className="flex-1"
                        onClick={() => navigate('/chat')}
                      >
                        Message
                      </Button>
                    );
                  } else if (status?.status === 'pending-sent') {
                    return (
                      <Button
                        className="flex-1"
                        disabled
                      >
                        Pending
                      </Button>
                    );
                  } else if (status?.status === 'pending-received') {
                    return (
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleAcceptRequest(match._id, status.requestId!)}
                      >
                        Accept Request
                      </Button>
                    );
                  } else {
                    return (
                      <Button
                        className="flex-1"
                        onClick={() => handleConnect(match._id)}
                      >
                        Connect
                      </Button>
                    );
                  }
                })()}
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`/profile/${match._id}`)}
                >
                  View Profile
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Matcher;
