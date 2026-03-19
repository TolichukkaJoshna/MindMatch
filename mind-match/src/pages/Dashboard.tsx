import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe, Search, Users, MessageCircle, LogOut,
  Bell
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import Matcher from "@/components/dashboard/Matcher";
import Requests from "@/components/dashboard/Requests";
import Groups from "@/components/dashboard/Groups";
import { NotificationCenter } from "@/components/chat/NotificationCenter";
import api from "@/lib/api";

const SIDEBAR_ITEMS = [
  { id: "matches", label: "Matches", icon: Search },
  { id: "requests", label: "Requests", icon: Bell },
  { id: "groups", label: "Groups", icon: Users },
  { id: "chat", label: "Chat", icon: MessageCircle },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("matches");
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    fetchRequestCount();
  }, []);

  const fetchRequestCount = async () => {
    try {
      const response = await api.getReceivedRequests('pending');
      if (response.success && response.data) {
        // @ts-ignore
        setRequestCount(response.data.requests ? response.data.requests.length : 0);
      }
    } catch (error) {
      console.error("Failed to fetch request count");
    }
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      navigate("/");
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-border flex items-center">
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-primary">Mind Match</span>
          </div>
        </div>

        {/* User Profile */}
        <div
          className="p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate(`/profile/${user?._id}`)}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 bg-primary">
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {user ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-foreground">{user?.name || "User"}</div>
              <div className="text-sm text-muted-foreground">
                {user?.skills?.[0]?.level ? user.skills[0].level.charAt(0).toUpperCase() + user.skills[0].level.slice(1) : "Student"}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {SIDEBAR_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    if (item.id === 'chat') {
                      navigate('/chat');
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-colors ${activeTab === item.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </div>
                  {item.id === 'requests' && requestCount > 0 && (
                    <span className="bg-destructive text-white text-xs font-bold px-2 py-0.5 rounded-full">{requestCount}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 ml-64">
        {activeTab === 'matches' && <Matcher />}
        {activeTab === 'requests' && <Requests />}
        {activeTab === 'groups' && <Groups />}
        {activeTab === 'chat' && (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Chat Coming Soon</h2>
            <p className="text-muted-foreground">Real-time messaging with your connections will be available soon.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
