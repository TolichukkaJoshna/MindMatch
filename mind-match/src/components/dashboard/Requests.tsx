import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Request {
    _id: string;
    fromUser?: {
        _id: string;
        name: string;
        avatar?: string;
        location?: { college?: string; city?: string };
    };
    toUser?: {
        _id: string;
        name: string;
        avatar?: string;
        location?: { college?: string; city?: string };
    };
    status: string;
    createdAt: string;
    message?: string;
}

const Requests = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">("incoming");
    const [incomingRequests, setIncomingRequests] = useState<Request[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<Request[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, [activeTab]);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            if (activeTab === "incoming") {
                const response = await api.getReceivedRequests();
                if (response.success && response.data) {
                    const data: any = response.data;
                    setIncomingRequests(Array.isArray(data) ? data : data.requests || []);
                }
            } else {
                const response = await api.getSentRequests();
                if (response.success && response.data) {
                    const data: any = response.data;
                    setOutgoingRequests(Array.isArray(data) ? data : data.requests || []);
                }
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to load requests",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async (requestId: string) => {
        try {
            const response = await api.acceptRequest(requestId);
            setIncomingRequests(prev => prev.filter(r => r._id !== requestId));
            
            // Extract conversation from response
            const data = response.data as any;
            const conversation = data?.conversation;
            
            toast({ 
                title: "Success", 
                description: "Request accepted! Opening chat..." 
            });
            
            // Navigate to chat with conversation ID
            if (conversation?._id) {
                navigate('/chat', { 
                    state: { conversationId: conversation._id } 
                });
            } else {
                // Fallback: just navigate to chat
                navigate('/chat');
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to accept request", variant: "destructive" });
        }
    };

    const handleReject = async (requestId: string) => {
        try {
            await api.rejectRequest(requestId);
            setIncomingRequests(prev => prev.filter(r => r._id !== requestId));
            toast({ title: "Success", description: "Request rejected" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to reject request", variant: "destructive" });
        }
    };

    const handleCancel = async (requestId: string) => {
        try {
            await api.cancelRequest(requestId);
            setOutgoingRequests(prev => prev.filter(r => r._id !== requestId));
            toast({ title: "Success", description: "Request cancelled" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to cancel request", variant: "destructive" });
        }
    };

    const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-foreground">Connection Requests</h1>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-border">
                <button
                    onClick={() => setActiveTab("incoming")}
                    className={`pb-2 px-1 ${activeTab === "incoming" ? "border-b-2 border-primary text-primary font-medium" : "text-muted-foreground"}`}
                >
                    Incoming ({incomingRequests.length})
                </button>
                <button
                    onClick={() => setActiveTab("outgoing")}
                    className={`pb-2 px-1 ${activeTab === "outgoing" ? "border-b-2 border-primary text-primary font-medium" : "text-muted-foreground"}`}
                >
                    Outgoing ({outgoingRequests.length})
                </button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
                <div className="space-y-4">
                    {activeTab === "incoming" ? (
                        incomingRequests.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No incoming requests</div>
                        ) : (
                            incomingRequests.map((req) => (
                                <motion.div key={req._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarFallback>{getInitials(req.fromUser?.name || "?")}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-semibold">{req.fromUser?.name}</div>
                                            <div className="text-sm text-muted-foreground">{req.fromUser?.location?.college || "No college info"}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleAccept(req._id)} className="bg-green-600 hover:bg-green-700">
                                            <Check className="w-4 h-4 mr-1" /> Accept
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleReject(req._id)} className="text-destructive hover:bg-destructive/10 border-destructive/20">
                                            <X className="w-4 h-4 mr-1" /> Reject
                                        </Button>
                                    </div>
                                </motion.div>
                            ))
                        )
                    ) : (
                        outgoingRequests.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No outgoing requests</div>
                        ) : (
                            outgoingRequests.map((req) => (
                                <motion.div key={req._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarFallback>{getInitials(req.toUser?.name || "?")}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-semibold">{req.toUser?.name}</div>
                                            <div className="text-sm text-muted-foreground">{req.toUser?.location?.college || "No college info"}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-yellow-500 flex items-center gap-1">
                                            <Clock className="w-4 h-4" /> Pending
                                        </span>
                                        <Button size="sm" variant="ghost" onClick={() => handleCancel(req._id)} className="text-muted-foreground hover:text-destructive">
                                            Cancel
                                        </Button>
                                    </div>
                                </motion.div>
                            ))
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default Requests;
