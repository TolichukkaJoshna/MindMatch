import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MeetingSchedulerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (details: { title: string; date: Date; duration: number }) => void;
}

export const MeetingScheduler = ({ open, onOpenChange, onSchedule }: MeetingSchedulerProps) => {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('10:00');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('30');

  const handleSchedule = () => {
    if (!date || !title || !time) return;
    
    // Combine date and time
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledDate = new Date(date);
    scheduledDate.setHours(hours, minutes);

    onSchedule({
      title,
      date: scheduledDate,
      duration: parseInt(duration)
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule a Meeting</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Meeting Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          
          <div className="flex gap-2">
             <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Input 
                 type="time" 
                 value={time} 
                 onChange={(e) => setTime(e.target.value)}
                 className="w-32" 
              />
          </div>

          <div className="flex items-center gap-2">
             <Clock className="w-4 h-4 text-muted-foreground" />
             <select 
               className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
               value={duration}
               onChange={(e) => setDuration(e.target.value)}
             >
                 <option value="15">15 minutes</option>
                 <option value="30">30 minutes</option>
                 <option value="45">45 minutes</option>
                 <option value="60">1 hour</option>
             </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={!date || !title}>
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
