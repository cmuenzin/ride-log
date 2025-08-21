import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Wrench } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  current_km: number;
  type: string;
}

interface Component {
  id: string;
  component_catalog_id: string;
  alias?: string;
  component_catalog: {
    name: string;
  };
}

interface MaintenanceType {
  id: string;
  name: string;
  description?: string;
}

const AddMaintenancePage = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedComponentId, setSelectedComponentId] = useState<string>("");
  const [selectedMaintenanceTypeId, setSelectedMaintenanceTypeId] = useState<string>("");
  const [kmAtService, setKmAtService] = useState<string>("");
  const [performedAt, setPerformedAt] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customName, setCustomName] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [intervalKm, setIntervalKm] = useState<string>("");
  const [intervalMonths, setIntervalMonths] = useState<string>("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedVehicleId) {
      fetchComponents();
      // Set default km value to current km
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (vehicle && !kmAtService) {
        setKmAtService(vehicle.current_km.toString());
      }
    }
  }, [selectedVehicleId, vehicles]);

  useEffect(() => {
    if (selectedComponentId) {
      fetchMaintenanceTypes();
    }
  }, [selectedComponentId]);

  const fetchInitialData = async () => {
    try {
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (vehicleError) throw vehicleError;
      setVehicles(vehicleData || []);

      // Auto-select first vehicle if available
      if (vehicleData && vehicleData.length > 0) {
        setSelectedVehicleId(vehicleData[0].id);
        setKmAtService(vehicleData[0].current_km.toString());
      }
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

  const fetchComponents = async () => {
    if (!selectedVehicleId) return;

    try {
      const { data, error } = await supabase
        .from('vehicle_components')
        .select(`
          *,
          component_catalog (name)
        `)
        .eq('vehicle_id', selectedVehicleId);

      if (error) throw error;
      setComponents(data || []);
    } catch (error) {
      console.error('Error fetching components:', error);
    }
  };

  const fetchMaintenanceTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_type_catalog')
        .select('*')
        .order('name');

      if (error) throw error;
      setMaintenanceTypes(data || []);
    } catch (error) {
      console.error('Error fetching maintenance types:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVehicleId || !selectedComponentId || !kmAtService || !performedAt) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const maintenanceData = {
        vehicle_id: selectedVehicleId,
        vehicle_component_id: selectedComponentId,
        maintenance_type_id: selectedMaintenanceTypeId || null,
        performed_at: performedAt,
        km_at_service: parseInt(kmAtService),
        custom_name: customName || null,
        note: note || null,
        interval_km: intervalKm ? parseInt(intervalKm) : null,
        interval_time_months: intervalMonths ? parseInt(intervalMonths) : null,
      };

      const { error } = await supabase
        .from('maintenance_events')
        .insert([maintenanceData]);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Wartung wurde erfolgreich hinzugefügt.",
      });

      navigate('/');
    } catch (error) {
      console.error('Error adding maintenance:', error);
      toast({
        title: "Fehler", 
        description: "Wartung konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Wartung hinzufügen
          </h1>
          <p className="text-foreground-secondary">
            Dokumentieren Sie eine durchgeführte Wartung
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="card-apple">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Wartungsdetails
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fahrzeug */}
            <div className="space-y-2">
              <Label htmlFor="vehicle">Fahrzeug *</Label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Fahrzeug auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} ({vehicle.current_km.toLocaleString()} km)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Komponente */}
            <div className="space-y-2">
              <Label htmlFor="component">Komponente *</Label>
              <Select 
                value={selectedComponentId} 
                onValueChange={setSelectedComponentId}
                disabled={!selectedVehicleId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Komponente auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {components.map((component) => (
                    <SelectItem key={component.id} value={component.id}>
                      {component.alias || component.component_catalog.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Wartungstyp */}
            <div className="space-y-2">
              <Label htmlFor="maintenanceType">Wartungstyp (optional)</Label>
              <Select 
                value={selectedMaintenanceTypeId} 
                onValueChange={setSelectedMaintenanceTypeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wartungstyp auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {maintenanceTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Name */}
            <div className="space-y-2">
              <Label htmlFor="customName">Bezeichnung (optional)</Label>
              <Input
                id="customName"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="z.B. Winterreifen montiert"
              />
            </div>

            {/* KM Stand */}
            <div className="space-y-2">
              <Label htmlFor="km">Kilometerstand *</Label>
              <Input
                id="km"
                type="number"
                value={kmAtService}
                onChange={(e) => setKmAtService(e.target.value)}
                placeholder="z.B. 15000"
                required
              />
            </div>

            {/* Datum */}
            <div className="space-y-2">
              <Label htmlFor="date">Wartungsdatum *</Label>
              <Input
                id="date"
                type="date"
                value={performedAt}
                onChange={(e) => setPerformedAt(e.target.value)}
                required
              />
            </div>

            {/* Intervalle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="intervalKm">Nächste Wartung (km)</Label>
                <Input
                  id="intervalKm"
                  type="number"
                  value={intervalKm}
                  onChange={(e) => setIntervalKm(e.target.value)}
                  placeholder="z.B. 10000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervalMonths">Nächste Wartung (Monate)</Label>
                <Input
                  id="intervalMonths"
                  type="number"
                  value={intervalMonths}
                  onChange={(e) => setIntervalMonths(e.target.value)}
                  placeholder="z.B. 12"
                />
              </div>
            </div>

            {/* Notizen */}
            <div className="space-y-2">
              <Label htmlFor="note">Notizen (optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Zusätzliche Informationen zur Wartung..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-primary hover:bg-primary-dark"
              >
                {submitting ? "Speichern..." : "Wartung speichern"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddMaintenancePage;