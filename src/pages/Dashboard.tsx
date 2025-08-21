import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Car, Bike, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  current_km: number;
  type: string;
}

interface MaintenanceEvent {
  id: string;
  performed_at: string;
  km_at_service: number;
  custom_name?: string;
  maintenance_type_catalog?: {
    name: string;
  };
  vehicle_components?: {
    component_catalog?: {
      name: string;
    };
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [recentMaintenances, setRecentMaintenances] = useState<MaintenanceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (selectedVehicle) {
      fetchRecentMaintenances();
    }
  }, [selectedVehicle]);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setVehicles(data);
        setSelectedVehicle(data[0]); // Select first vehicle by default
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentMaintenances = async () => {
    if (!selectedVehicle) return;

    try {
      const { data, error } = await supabase
        .from('maintenance_events')
        .select(`
          *,
          maintenance_type_catalog (name),
          vehicle_components (
            component_catalog (name)
          )
        `)
        .eq('vehicle_id', selectedVehicle.id)
        .order('performed_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentMaintenances(data || []);
    } catch (error) {
      console.error('Error fetching maintenance events:', error);
    }
  };

  const getVehicleStatusIcon = () => {
    // Simplified status - in real app, calculate based on maintenance intervals
    return <CheckCircle className="w-5 h-5 text-success" />;
  };

  const getVehicleIcon = (vehicleType: string) => {
    return vehicleType === 'motorcycle' ? 
      <Bike className="w-16 h-16 text-foreground-tertiary" /> : 
      <Car className="w-16 h-16 text-foreground-tertiary" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center py-12">
          <div className="mx-auto mb-4">{getVehicleIcon('car')}</div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Willkommen bei Ride-Log
          </h2>
          <p className="text-foreground-secondary mb-6">
            Fügen Sie Ihr erstes Fahrzeug hinzu, um mit der Wartungsdokumentation zu beginnen.
          </p>
          <Button onClick={() => navigate('/garage')} className="bg-primary hover:bg-primary-dark">
            <Plus className="w-4 h-4 mr-2" />
            Fahrzeug hinzufügen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header mit Fahrzeugauswahl und Primary Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <select 
            className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground font-medium focus:ring-2 focus:ring-primary focus:border-transparent"
            value={selectedVehicle?.id || ''}
            onChange={(e) => {
              const vehicle = vehicles.find(v => v.id === e.target.value);
              setSelectedVehicle(vehicle || null);
            }}
          >
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.brand} {vehicle.model} ({vehicle.current_km.toLocaleString()} km)
              </option>
            ))}
          </select>
        </div>
        
        <Button 
          onClick={() => navigate('/maintenance/add')}
          className="bg-primary hover:bg-primary-dark text-primary-foreground font-medium px-6 py-3 interactive"
        >
          <Plus className="w-4 h-4 mr-2" />
          Wartung
        </Button>
      </div>

      {selectedVehicle && (
        <>
          {/* Fahrzeugstatus */}
          <Card className="card-apple">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-foreground">
                  {selectedVehicle.brand} {selectedVehicle.model}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getVehicleStatusIcon()}
                  <span className="status-success">Alles OK</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {selectedVehicle.current_km.toLocaleString()}
                  </div>
                  <div className="text-sm text-foreground-secondary">Kilometer</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success mb-1">
                    {recentMaintenances.length}
                  </div>
                  <div className="text-sm text-foreground-secondary">Wartungen</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">0</div>
                  <div className="text-sm text-foreground-secondary">Fällige Wartungen</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Letzte Wartungen */}
          <Card className="card-apple">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Letzte Wartungen
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/history')}
                  className="text-primary hover:bg-primary-light"
                >
                  Alle anzeigen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentMaintenances.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-foreground-tertiary mx-auto mb-3" />
                  <p className="text-foreground-secondary">
                    Noch keine Wartungen dokumentiert
                  </p>
                  <Button 
                    variant="ghost"
                    onClick={() => navigate('/maintenance/add')}
                    className="mt-3 text-primary hover:bg-primary-light"
                  >
                    Erste Wartung hinzufügen
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentMaintenances.map((maintenance) => (
                    <div 
                      key={maintenance.id}
                      className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg interactive cursor-pointer"
                    >
                      <div>
                        <h4 className="font-medium text-foreground">
                          {maintenance.custom_name || 
                           maintenance.maintenance_type_catalog?.name || 
                           'Wartung'}
                        </h4>
                        <p className="text-sm text-foreground-secondary">
                          {maintenance.vehicle_components?.component_catalog?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">
                          {formatDate(maintenance.performed_at)}
                        </div>
                        <div className="text-sm text-foreground-secondary">
                          {maintenance.km_at_service.toLocaleString()} km
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;