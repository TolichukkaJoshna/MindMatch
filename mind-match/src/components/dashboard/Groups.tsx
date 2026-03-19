import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Plus,
    Search,
    UserPlus,
    LogOut,
    MessageCircle,
    Loader2,
    Crown,
    Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { CreateGroupDialog } from '@/components/chat/CreateGroupDialog';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface Group {
    _id: string;
    name: string;
    topic: string;
    description?: string;
    creator: {
        _id: string;
        name: string;
        avatar?: string;
    };
    members: Array<{
        userId: {
            _id: string;
            name: string;
            avatar?: string;
        };
        role: 'admin' | 'member';
        joinedAt: Date;
    }>;
    isPublic: boolean;
    tags: string[];
    conversationId: string;
    createdAt: Date;
    updatedAt: Date;
}

const Groups = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [recommendedGroups, setRecommendedGroups] = useState<Group[]>([]);
    const [myGroups, setMyGroups] = useState<Group[]>([]);
    const [isLoadingRecommended, setIsLoadingRecommended] = useState(true);
    const [isLoadingMy, setIsLoadingMy] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
    const [leavingGroupId, setLeavingGroupId] = useState<string | null>(null);

    useEffect(() => {
        fetchRecommendedGroups();
        fetchMyGroups();
    }, []);

    const fetchRecommendedGroups = async () => {
        setIsLoadingRecommended(true);
        try {
            const response = await api.getRecommendedGroups(20);
            setRecommendedGroups(response.data?.groups || []);
        } catch (error) {
            console.error('Failed to fetch recommended groups:', error);
            toast({
                title: 'Error',
                description: 'Failed to load recommended groups',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingRecommended(false);
        }
    };

    const fetchMyGroups = async () => {
        setIsLoadingMy(true);
        try {
            const response = await api.getMyGroups();
            setMyGroups(response.data?.groups || []);
        } catch (error) {
            console.error('Failed to fetch my groups:', error);
            toast({
                title: 'Error',
                description: 'Failed to load your groups',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingMy(false);
        }
    };

    const handleJoinGroup = async (groupId: string) => {
        setJoiningGroupId(groupId);
        try {
            await api.joinGroup(groupId);
            toast({
                title: 'Success',
                description: 'You have joined the group!',
            });
            // Refresh both lists
            await Promise.all([fetchRecommendedGroups(), fetchMyGroups()]);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to join group',
                variant: 'destructive',
            });
        } finally {
            setJoiningGroupId(null);
        }
    };

    const handleLeaveGroup = async (groupId: string) => {
        setLeavingGroupId(groupId);
        try {
            await api.leaveGroup(groupId);
            toast({
                title: 'Success',
                description: 'You have left the group',
            });
            // Refresh both lists
            await Promise.all([fetchRecommendedGroups(), fetchMyGroups()]);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to leave group',
                variant: 'destructive',
            });
        } finally {
            setLeavingGroupId(null);
        }
    };

    const handleOpenGroupChat = (group: Group) => {
        // Navigate to chat with the group's conversation
        navigate('/chat', { state: { conversationId: group.conversationId } });
    };

    const handleGroupCreated = () => {
        fetchMyGroups();
        fetchRecommendedGroups();
    };

    const getInitials = (name: string) =>
        name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const filteredRecommended = recommendedGroups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredMyGroups = myGroups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.topic.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const GroupCard = ({ group, isMember = false }: { group: Group; isMember?: boolean }) => {
        const isCreator = group.members.some(m => m.role === 'admin');
        const isLoading = joiningGroupId === group._id || leavingGroupId === group._id;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                                <Avatar className="w-12 h-12 border-2 border-primary/20">
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                        {getInitials(group.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-lg truncate flex items-center gap-2">
                                        {group.name}
                                        {isCreator && <Crown className="w-4 h-4 text-yellow-500" />}
                                    </CardTitle>
                                    <CardDescription className="truncate">{group.topic}</CardDescription>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {group.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {group.description}
                            </p>
                        )}

                        {group.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {group.tags.slice(0, 3).map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                                {group.tags.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                        +{group.tags.length - 3}
                                    </Badge>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span className="font-medium">{group.members.length} {group.members.length === 1 ? 'member' : 'members'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{formatDistanceToNow(new Date(group.updatedAt), { addSuffix: true })}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {isMember ? (
                                    <>
                                        <Button
                                            size="sm"
                                            onClick={() => handleOpenGroupChat(group)}
                                            className="gap-1"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Chat
                                        </Button>
                                        {!isCreator && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleLeaveGroup(group._id)}
                                                disabled={isLoading}
                                                className="gap-1 text-destructive hover:text-destructive"
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <LogOut className="w-4 h-4" />
                                                )}
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <Button
                                        size="sm"
                                        onClick={() => handleJoinGroup(group._id)}
                                        disabled={isLoading}
                                        className="gap-1"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Joining...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="w-4 h-4" />
                                                Join Group
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Users className="w-8 h-8 text-primary" />
                        Study Groups
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Join communities and collaborate with others
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Group
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search groups by name, topic, or tags..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="my-groups" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="my-groups">
                        My Groups ({myGroups.length})
                    </TabsTrigger>
                    <TabsTrigger value="discover">
                        Discover ({recommendedGroups.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="my-groups" className="space-y-4">
                    {isLoadingMy ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredMyGroups.length === 0 ? (
                        <Card className="p-12">
                            <div className="text-center space-y-3">
                                <Users className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
                                <h3 className="text-xl font-semibold">No groups yet</h3>
                                <p className="text-muted-foreground">
                                    {searchQuery
                                        ? 'No groups match your search'
                                        : 'Create or join a group to get started'}
                                </p>
                                {!searchQuery && (
                                    <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Your First Group
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredMyGroups.map(group => (
                                <GroupCard key={group._id} group={group} isMember />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="discover" className="space-y-4">
                    {isLoadingRecommended ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredRecommended.length === 0 ? (
                        <Card className="p-12">
                            <div className="text-center space-y-3">
                                <Search className="w-16 h-16 mx-auto text-muted-foreground opacity-50" />
                                <h3 className="text-xl font-semibold">No recommendations</h3>
                                <p className="text-muted-foreground">
                                    {searchQuery
                                        ? 'No groups match your search'
                                        : 'No group recommendations available at the moment'}
                                </p>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredRecommended.map(group => (
                                <GroupCard key={group._id} group={group} />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Create Group Dialog */}
            <CreateGroupDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onGroupCreated={handleGroupCreated}
            />
        </div>
    );
};

export default Groups;
