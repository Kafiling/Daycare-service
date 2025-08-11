import React from 'react';
import { GroupEvent } from '@/app/service/group-assignment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface GroupEventsListProps {
  events: GroupEvent[];
  title?: string;
  description?: string;
  showGroup?: boolean;
  emptyMessage?: string;
  maxEvents?: number;
}

export function GroupEventsList({
  events,
  title = 'กิจกรรมที่กำลังจะมาถึง',
  description = 'กิจกรรมที่กำลังจะมาถึงในกลุ่มของคุณ',
  showGroup = true,
  emptyMessage = 'ไม่มีกิจกรรมที่กำลังจะมาถึง',
  maxEvents
}: GroupEventsListProps) {
  const displayEvents = maxEvents ? events.slice(0, maxEvents) : events;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {displayEvents.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">{emptyMessage}</div>
        ) : (
          <div className="space-y-4">
            {displayEvents.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-lg">{event.title}</h3>
                  {showGroup && event.group && (
                    <Badge style={{ backgroundColor: event.group.color || '#888888' }}>
                      {event.group.name}
                    </Badge>
                  )}
                </div>
                {event.description && <p className="text-muted-foreground mb-3">{event.description}</p>}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{format(new Date(event.event_datetime), 'EEEE d MMMM yyyy', { locale: th })}</span>
                  <Clock className="h-4 w-4 ml-4 mr-2" />
                  <span>{format(new Date(event.event_datetime), 'HH:mm น.')}</span>
                </div>
              </div>
            ))}
            {maxEvents && events.length > maxEvents && (
              <div className="text-center text-sm">
                <span className="text-primary hover:underline cursor-pointer">
                  + แสดงทั้งหมด {events.length} กิจกรรม
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
