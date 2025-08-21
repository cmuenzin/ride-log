import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react";

interface MaintenanceEvent {
  id: string;
  performed_at: string;
  km_at_service: number;
  custom_name?: string;
  maintenance_type_catalog?: {
    name: string;
  };
  vehicles?: {
    brand: string;
    model: string;
  };
}

const CalendarPage = () => {
  const [maintenanceEvents, setMaintenanceEvents] = useState<MaintenanceEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaintenanceEvents();
  }, [currentDate]);

  const fetchMaintenanceEvents = async () => {
    try {
      // Fetch events for current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('maintenance_events')
        .select(`
          *,
          maintenance_type_catalog (name),
          vehicles (brand, model)
        `)
        .gte('performed_at', startOfMonth.toISOString())
        .lte('performed_at', endOfMonth.toISOString())
        .order('performed_at', { ascending: true });

      if (error) throw error;
      setMaintenanceEvents(data || []);
    } catch (error) {
      console.error('Error fetching maintenance events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getEventsForDay = (day: number) => {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return maintenanceEvents.filter(event => {
      const eventDate = new Date(event.performed_at);
      return eventDate.toDateString() === dayDate.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Wartungskalender
          </h1>
          <p className="text-foreground-secondary">
            Übersicht aller durchgeführten Wartungen nach Datum
          </p>
        </div>
      </div>

      {/* Calendar */}
      <Card className="card-apple">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <CalendarIcon className="w-5 h-5" />
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {/* Day headers */}
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-foreground-secondary">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {getDaysInMonth().map((day, index) => {
              if (day === null) {
                return <div key={index} className="p-2 h-20"></div>;
              }
              
              const eventsForDay = getEventsForDay(day);
              const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
              
              return (
                <div 
                  key={day}
                  className={`p-2 h-20 border rounded-lg relative cursor-pointer hover:bg-surface-secondary transition-colors ${
                    isToday ? 'bg-primary-light border-primary' : 'border-border'
                  }`}
                >
                  <span className={`text-sm font-medium ${
                    isToday ? 'text-primary' : 'text-foreground'
                  }`}>
                    {day}
                  </span>
                  
                  {/* Event indicators */}
                  {eventsForDay.length > 0 && (
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="flex gap-1 flex-wrap">
                        {eventsForDay.slice(0, 2).map((event, eventIndex) => (
                          <div 
                            key={event.id}
                            className="w-2 h-2 bg-primary rounded-full"
                            title={event.custom_name || event.maintenance_type_catalog?.name}
                          ></div>
                        ))}
                        {eventsForDay.length > 2 && (
                          <span className="text-xs text-foreground-secondary">+{eventsForDay.length - 2}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Events Summary for current month */}
          {maintenanceEvents.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-medium text-foreground">
                Wartungen in diesem Monat ({maintenanceEvents.length})
              </h3>
              <div className="space-y-2">
                {maintenanceEvents.slice(0, 5).map((event) => (
                  <div 
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-primary" />
                      <div>
                        <span className="font-medium text-foreground">
                          {event.custom_name || event.maintenance_type_catalog?.name || 'Wartung'}
                        </span>
                        {event.vehicles && (
                          <span className="ml-2 text-sm text-foreground-secondary">
                            ({event.vehicles.brand} {event.vehicles.model})
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-foreground-secondary">
                      {new Date(event.performed_at).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                ))}
                {maintenanceEvents.length > 5 && (
                  <div className="text-center text-sm text-foreground-secondary">
                    ... und {maintenanceEvents.length - 5} weitere
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarPage;