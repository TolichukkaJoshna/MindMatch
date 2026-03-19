import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface CreateGroupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGroupCreated?: () => void;
}

interface GroupFormData {
    name: string;
    topic: string;
    description?: string;
    isPublic: boolean;
    tags: string[];
}

export const CreateGroupDialog = ({ open, onOpenChange, onGroupCreated }: CreateGroupDialogProps) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
        setValue,
    } = useForm<GroupFormData>({
        defaultValues: {
            name: '',
            topic: '',
            description: '',
            isPublic: true,
            tags: [],
        },
    });

    const isPublic = watch('isPublic');

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (tags.length < 5 && !tags.includes(tagInput.trim())) {
                const newTags = [...tags, tagInput.trim()];
                setTags(newTags);
                setValue('tags', newTags);
                setTagInput('');
            } else if (tags.length >= 5) {
                toast({
                    title: 'Maximum tags reached',
                    description: 'You can add up to 5 tags only',
                    variant: 'destructive',
                });
            }
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        const newTags = tags.filter(tag => tag !== tagToRemove);
        setTags(newTags);
        setValue('tags', newTags);
    };

    const onSubmit = async (data: GroupFormData) => {
        setIsLoading(true);
        try {
            await api.createGroup({
                name: data.name,
                topic: data.topic,
                description: data.description,
                isPublic: data.isPublic,
                tags: tags,
            });

            toast({
                title: 'Success',
                description: 'Group created successfully!',
            });

            // Reset form
            reset();
            setTags([]);
            setTagInput('');
            onOpenChange(false);

            // Notify parent to refresh
            onGroupCreated?.();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create group',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            reset();
            setTags([]);
            setTagInput('');
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Create New Group
                    </DialogTitle>
                    <DialogDescription>
                        Create a study group to collaborate with others on shared topics
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Group Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Group Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            placeholder="e.g., React Study Group"
                            {...register('name', {
                                required: 'Group name is required',
                                maxLength: {
                                    value: 100,
                                    message: 'Name must be less than 100 characters',
                                },
                            })}
                            disabled={isLoading}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Topic */}
                    <div className="space-y-2">
                        <Label htmlFor="topic">
                            Topic <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="topic"
                            placeholder="e.g., Web Development"
                            {...register('topic', {
                                required: 'Topic is required',
                            })}
                            disabled={isLoading}
                        />
                        {errors.topic && (
                            <p className="text-sm text-destructive">{errors.topic.message}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe what this group is about..."
                            rows={3}
                            {...register('description', {
                                maxLength: {
                                    value: 1000,
                                    message: 'Description must be less than 1000 characters',
                                },
                            })}
                            disabled={isLoading}
                        />
                        {errors.description && (
                            <p className="text-sm text-destructive">{errors.description.message}</p>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label htmlFor="tags">Tags (Optional, max 5)</Label>
                        <Input
                            id="tags"
                            placeholder="Press Enter to add tags..."
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleAddTag}
                            disabled={isLoading || tags.length >= 5}
                        />
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {tags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="px-2 py-1 flex items-center gap-1"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(tag)}
                                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                            disabled={isLoading}
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Public/Private Toggle */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                        <div className="space-y-0.5">
                            <Label htmlFor="isPublic" className="text-base font-medium">
                                Public Group
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                {isPublic
                                    ? 'Anyone can discover and join this group'
                                    : 'Only invited members can join this group'}
                            </p>
                        </div>
                        <Switch
                            id="isPublic"
                            checked={isPublic}
                            onCheckedChange={(checked) => setValue('isPublic', checked)}
                            disabled={isLoading}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Group'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
