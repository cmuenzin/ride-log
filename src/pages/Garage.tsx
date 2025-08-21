import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Car, Bike, Edit, Trash2, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year?: number;
  current_km: number;
  type: string;
  created_at: string;
}

const Garage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: "Fehler",
        description: "Fahrzeuge konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm('Fahrzeug wirklich löschen? Alle Wartungsdaten gehen verloren.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;

      setVehicles(vehicles.filter(v => v.id !== vehicleId));
      toast({
        title: "Erfolg",
        description: "Fahrzeug wurde gelöscht.",
      });
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast({
        title: "Fehler",
        description: "Fahrzeug konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  const getVehicleIcon = (type: string) => {
    return type === 'motorcycle' ? 
      <Bike className="w-6 h-6 text-primary" /> : 
      <Car className="w-6 h-6 text-primary" />;
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Garage</h1>
          <p className="text-foreground-secondary mt-1">
            Verwalten Sie Ihre Fahrzeuge und deren Wartungsstatus
          </p>
        </div>
        
        <Button 
          onClick={() => navigate('/garage/add')}
          className="bg-primary hover:bg-primary-dark text-primary-foreground font-medium px-6 py-3 interactive"
        >
          <Plus className="w-4 h-4 mr-2" />
          Fahrzeug hinzufügen
        </Button>
      </div>

      {/* Fahrzeuge Grid */}
      {vehicles.length === 0 ? (
        <div className="text-center py-16">
          <Car className="w-20 h-20 text-foreground-tertiary mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Keine Fahrzeuge
          </h2>
          <p className="text-foreground-secondary mb-8 max-w-md mx-auto">
            Fügen Sie Ihr erstes Fahrzeug hinzu, um mit der Wartungsdokumentation zu beginnen.
          </p>
          <Button 
            onClick={() => navigate('/garage/add')}
            className="bg-primary hover:bg-primary-dark text-primary-foreground font-medium px-8 py-4"
          >
            <Plus className="w-5 h-5 mr-2" />
            Erstes Fahrzeug hinzufügen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="card-elevated interactive cursor-pointer group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getVehicleIcon(vehicle.type)}
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">
                        {vehicle.brand}
                      </CardTitle>
                      <p className="text-sm text-foreground-secondary">
                        {vehicle.model}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/garage/edit/${vehicle.id}`);
                      }}
                      className="h-8 w-8 p-0 hover:bg-primary-light"
                    >
                      <Edit className="w-4 h-4 text-primary" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVehicle(vehicle.id);
                      }}
                      className="h-8 w-8 p-0 hover:bg-danger-light"
                    >
                      <Trash2 className="w-4 h-4 text-danger" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground-secondary">Kilometerstand</span>
                    <span className="font-medium text-foreground">
                      {vehicle.current_km.toLocaleString()} km
                    </span>
                  </div>
                  
                  {vehicle.year && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground-secondary">Baujahr</span>
                      <span className="font-medium text-foreground">{vehicle.year}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground-secondary">Hinzugefügt</span>
                    <span className="font-medium text-foreground">
                      {formatDate(vehicle.created_at)}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-foreground-secondary">Nächste Wartung</span>
                      <span className="text-sm text-foreground-secondary">
                        Nicht geplant
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-primary hover:bg-primary-dark"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/maintenance/add', { state: { vehicleId: vehicle.id } });
                        }}
                      >
                        Wartung hinzufügen
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/history', { state: { vehicleId: vehicle.id } });
                        }}
                        className="border-border hover:bg-surface-secondary"
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Garage;