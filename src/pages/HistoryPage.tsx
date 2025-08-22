import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History, Filter, Calendar, Wrench, Edit } from "lucide-react";
import { EditMaintenanceDialog } from "@/components/EditMaintenanceDialog";
import { Progress } from "@/components/ui/progress";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  current_km: number;
  type: string;
}

interface MaintenanceEvent {
  id: string;
  vehicle_id: string;
  vehicle_component_id: string;
  maintenance_type_id?: string;
  performed_at: string;
  km_at_service: number;
  custom_name?: string;
  note?: string;
  interval_km?: number;
  interval_time_months?: number;
  maintenance_type_catalog?: {
    name: string;
  };
  vehicle_components?: {
    component_catalog?: {
      name: string;
    };
  };
  vehicles?: {
    brand: string;
    model: string;
  };
}

const HistoryPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [maintenanceEvents, setMaintenanceEvents] = useState<MaintenanceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MaintenanceEvent | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (selectedVehicleId) {
      fetchMaintenanceHistory();
    }
  }, [selectedVehicleId]);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setVehicles(data);
        setSelectedVehicleId(data[0].id); // Select first vehicle by default
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenanceHistory = async () => {
    if (!selectedVehicleId) return;
    
    try {
      const { data, error } = await supabase
        .from('maintenance_events')
        .select(`
          *,
          maintenance_type_catalog (name),
          vehicle_components (
            component_catalog (name)
          ),
          vehicles (brand, model)
        `)
        .eq('vehicle_id', selectedVehicleId)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      setMaintenanceEvents(data || []);
    } catch (error) {
      console.error('Error fetching maintenance history:', error);
    }
  };

  const handleEditMaintenance = (event: MaintenanceEvent) => {
    setEditingEvent(event);
    setShowEditDialog(true);
  };

  const handleMaintenanceUpdated = () => {
    fetchMaintenanceHistory();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateProgress = (event: MaintenanceEvent, currentVehicle: Vehicle) => {
    const currentDate = new Date();
    const eventDate = new Date(event.performed_at);
    
    // Calculate mileage-based progress
    if (event.interval_km) {
      const kmSinceService = currentVehicle.current_km - event.km_at_service;
      const progress = Math.min((kmSinceService / event.interval_km) * 100, 100);
      return {
        type: 'km',
        progress: Math.max(0, progress),
        current: kmSinceService,
        target: event.interval_km
      };
    }
    
    // Calculate time-based progress
    if (event.interval_time_months) {
      const monthsSinceService = (currentDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
      const progress = Math.min((monthsSinceService / event.interval_time_months) * 100, 100);
      return {
        type: 'time',
        progress: Math.max(0, progress),
        current: monthsSinceService,
        target: event.interval_time_months
      };
    }
    
    return null;
  };

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
            Wartungshistorie
          </h1>
          <p className="text-foreground-secondary">
            Alle durchgeführten Wartungen im Überblick
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Fahrzeug auswählen" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.brand} {vehicle.model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Wartungsliste */}
      <Card className="card-apple">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <History className="w-5 h-5" />
            Alle Wartungen ({maintenanceEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {maintenanceEvents.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="w-16 h-16 text-foreground-tertiary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Noch keine Wartungen
              </h3>
              <p className="text-foreground-secondary mb-6">
                Fügen Sie Ihre erste Wartung hinzu, um die Historie zu sehen.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {maintenanceEvents.map((event) => {
                const currentVehicle = vehicles.find(v => v.id === selectedVehicleId);
                const progressInfo = currentVehicle ? calculateProgress(event, currentVehicle) : null;
                
                return (
                  <div 
                    key={event.id}
                    className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-foreground">
                          {event.custom_name || 
                           event.maintenance_type_catalog?.name || 
                           'Wartung'}
                        </h4>
                        {event.vehicles && (
                          <span className="text-sm text-foreground-secondary bg-surface px-2 py-1 rounded-full">
                            {event.vehicles.brand} {event.vehicles.model}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground-secondary mb-2">
                        {event.vehicle_components?.component_catalog?.name}
                      </p>
                      {progressInfo && (
                        <div className="mt-2">
                          <Progress 
                            value={progressInfo.progress} 
                            className="w-full h-2 bg-muted"
                          />
                          <p className="text-xs text-foreground-tertiary mt-1">
                            {progressInfo.type === 'km' 
                              ? `${Math.round(progressInfo.current)} / ${progressInfo.target} km`
                              : `${Math.round(progressInfo.current)} / ${progressInfo.target} Monate`
                            }
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1 text-foreground-secondary">
                            <Calendar className="w-4 h-4" />
                            {formatDate(event.performed_at)}
                          </div>
                          <div className="font-medium text-foreground">
                            {event.km_at_service.toLocaleString()} km
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditMaintenance(event)}
                        className="ml-2"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Maintenance Dialog */}
      <EditMaintenanceDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        maintenanceEvent={editingEvent}
        onMaintenanceUpdated={handleMaintenanceUpdated}
      />
    </div>
  );
};

export default HistoryPage;