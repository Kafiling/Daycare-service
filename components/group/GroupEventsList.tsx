import React from 'react';
import { GroupEvent } from '@/app/service/group-assignment';
import { Calendar, Clock, Repeat, MapPin } from 'lucide-react';
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

  // Function to get human-readable recurrence pattern
  const getRecurrenceText = (event: GroupEvent) => {
    if (!event.is_recurring) return null;
    
    const patternTexts: Record<string, string> = {
      'daily': 'ทุกวัน',
      'weekly': 'ทุกสัปดาห์',
      'biweekly': 'ทุก 2 สัปดาห์',
      'monthly': 'ทุกเดือน',
      'yearly': 'ทุกปี'
    };
    
    const pattern = patternTexts[event.recurrence_pattern || 'weekly'] || 'ทุกสัปดาห์';
    let text = `ทำซ้ำ${pattern}`;
    
    if (event.recurrence_end_date) {
      text += ` จนถึง ${format(new Date(event.recurrence_end_date), 'd MMM yyyy', { locale: th })}`;
    }
    
    return text;
  };

  return (
    <div className="h-full">
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
      )}
      
      {displayEvents.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">{emptyMessage}</div>
      ) : (
        <div className="space-y-4">
          {displayEvents.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-lg flex items-center">
                      {event.title}
                      {event.isRecurringInstance && (
                        <Badge variant="outline" className="ml-2 text-xs">ซ้ำ</Badge>
                      )}
                      {event.is_recurring && !event.isRecurringInstance && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          <Repeat className="h-3 w-3 mr-1" />
                          กิจกรรมประจำ
                        </Badge>
                      )}
                    </h3>
                  </div>
                  {showGroup && event.group && (
                    <Badge style={{ backgroundColor: event.group.color || '#888888' }}>
                      {event.group.name}
                    </Badge>
                  )}
                </div>
                {event.description && <p className="text-muted-foreground mb-3">{event.description}</p>}
                <div className="flex flex-col space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{format(new Date(event.event_datetime), 'EEEE d MMMM yyyy', { locale: th })}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{format(new Date(event.event_datetime), 'HH:mm น.')}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.is_recurring && !event.isRecurringInstance && (
                    <div className="flex items-center mt-1">
                      <Repeat className="h-4 w-4 mr-2" />
                      <span>{getRecurrenceText(event)}</span>
                    </div>
                  )}
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
    </div>
  );
}
