import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Wrench, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AddCustomComponentDialog } from "@/components/AddCustomComponentDialog";
import { AddCustomMaintenanceDialog } from "@/components/AddCustomMaintenanceDialog";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  current_km: number;
  type: 'car' | 'motorcycle';
}

interface Component {
  id: string;
  component_catalog_id: string;
  alias?: string;
  component_catalog: {
    id: string;
    name: string;
    icon_id?: string;
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
  const [unmappedMaintenanceTypes, setUnmappedMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Dialog states
  const [showComponentDialog, setShowComponentDialog] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);

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
    } else {
      setMaintenanceTypes([]);
      setUnmappedMaintenanceTypes([]);
      setSelectedMaintenanceTypeId("");
    }
  }, [selectedComponentId, components]);

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
      // Get current vehicle to determine type
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (!vehicle) return;

      // Get current user for RLS filtering
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Fehler",
          description: "Benutzer nicht authentifiziert.",
          variant: "destructive",
        });
        return;
      }

      // Query vehicle components with proper RLS handling
      const { data, error } = await supabase
        .from('vehicle_components')
        .select(`
          id,
          component_catalog_id,
          alias,
          component_catalog!inner (
            id,
            name,
            icon_id,
            owner_scope,
            owner_user_id,
            vehicle_type,
            is_active
          )
        `)
        .eq('vehicle_id', selectedVehicleId)
        .eq('component_catalog.vehicle_type', vehicle.type)
        .eq('component_catalog.is_active', true);

      if (error) throw error;

      // Filter client-side for RLS (global OR user-owned)
      const filteredData = (data || []).filter(component => {
        const catalog = component.component_catalog;
        return catalog.owner_scope === 'global' || catalog.owner_user_id === user.id;
      });

      setComponents(filteredData);
    } catch (error) {
      console.error('Error fetching components:', error);
      toast({
        title: "Fehler",
        description: "Komponenten konnten nicht geladen werden.",
        variant: "destructive",
      });
    }
  };

  const fetchMaintenanceTypes = async () => {
    if (!selectedComponentId) {
      setMaintenanceTypes([]);
      setUnmappedMaintenanceTypes([]);
      return;
    }

    try {
      // Get the component_catalog_id for the selected vehicle component
      const componentData = components.find(c => c.id === selectedComponentId);
      if (!componentData) {
        setMaintenanceTypes([]);
        setUnmappedMaintenanceTypes([]);
        return;
      }

      const componentCatalogId = componentData.component_catalog_id;

      // Get current user for RLS filtering
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Fehler",
          description: "Benutzer nicht authentifiziert.",
          variant: "destructive",
        });
        return;
      }

      // Get maintenance types that are mapped to this component
      const { data: mappedTypes, error: mappedError } = await supabase
        .from('maintenance_type_catalog')
        .select(`
          id,
          name,
          description,
          owner_scope,
          owner_user_id,
          maintenance_type_components!inner (
            component_catalog_id
          )
        `)
        .eq('maintenance_type_components.component_catalog_id', componentCatalogId)
        .or(`owner_scope.eq.global,owner_user_id.eq.${user.id}`)
        .order('name');

      if (mappedError) throw mappedError;

      // Get maintenance types that are NOT mapped to this component (but still respect RLS)
      const mappedTypeIds = (mappedTypes || []).map(mt => mt.id);
      
      const { data: allTypes, error: allTypesError } = await supabase
        .from('maintenance_type_catalog')
        .select('id, name, description, owner_scope, owner_user_id')
        .or(`owner_scope.eq.global,owner_user_id.eq.${user.id}`)
        .order('name');

      if (allTypesError) throw allTypesError;

      // Filter out mapped types to get unmapped ones
      const unmappedTypes = (allTypes || []).filter(type => !mappedTypeIds.includes(type.id));

      setMaintenanceTypes(mappedTypes || []);
      setUnmappedMaintenanceTypes(unmappedTypes || []);
    } catch (error) {
      console.error('Error fetching maintenance types:', error);
      toast({
        title: "Fehler", 
        description: "Wartungstypen konnten nicht geladen werden.",
        variant: "destructive",
      });
      setMaintenanceTypes([]);
      setUnmappedMaintenanceTypes([]);
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

  const handleComponentCreated = async (componentCatalogId: string) => {
    // Refresh components list
    await fetchComponents();
    
    // Find the newly created component and select it
    setTimeout(() => {
      const newComponent = components.find(c => c.component_catalog_id === componentCatalogId);
      if (newComponent) {
        setSelectedComponentId(newComponent.id);
      }
    }, 200);
  };

  const handleMaintenanceTypeCreated = async (maintenanceTypeId: string) => {
    // Refresh maintenance types
    await fetchMaintenanceTypes();
    // Select the newly created maintenance type
    setTimeout(() => {
      setSelectedMaintenanceTypeId(maintenanceTypeId);
    }, 100);
  };

  const getSelectedComponentCatalogId = () => {
    const component = components.find(c => c.id === selectedComponentId);
    return component?.component_catalog_id || null;
  };

  const getCurrentVehicle = () => {
    return vehicles.find(v => v.id === selectedVehicleId);
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
                onValueChange={(value) => {
                  if (value === '__add_custom__') {
                    setShowComponentDialog(true);
                  } else {
                    setSelectedComponentId(value);
                  }
                }}
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
                  {components.length > 0 && <Separator />}
                  <SelectItem value="__add_custom__" className="text-primary">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Benutzerdefinierte Komponente hinzufügen...
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Wartungstyp */}
            <div className="space-y-2">
              <Label htmlFor="maintenanceType">Wartungstyp (optional)</Label>
              <Select 
                value={selectedMaintenanceTypeId} 
                onValueChange={(value) => {
                  if (value === '__add_custom__') {
                    setShowMaintenanceDialog(true);
                  } else {
                    setSelectedMaintenanceTypeId(value);
                  }
                }}
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
                  {unmappedMaintenanceTypes.length > 0 && (
                    <>
                      <Separator />
                      <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
                        Weitere (nicht zugeordnet)
                      </div>
                      {unmappedMaintenanceTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                  <Separator />
                  <SelectItem value="__add_custom__" className="text-primary">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Benutzerdefinierten Wartungstyp hinzufügen...
                    </div>
                  </SelectItem>
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

      {/* Custom Component Dialog */}
      <AddCustomComponentDialog
        isOpen={showComponentDialog}
        onClose={() => setShowComponentDialog(false)}
        vehicleType={getCurrentVehicle()?.type || 'motorcycle'}
        vehicleId={selectedVehicleId}
        onComponentCreated={handleComponentCreated}
      />

      {/* Custom Maintenance Type Dialog */}
      <AddCustomMaintenanceDialog
        isOpen={showMaintenanceDialog}
        onClose={() => setShowMaintenanceDialog(false)}
        selectedComponentCatalogId={getSelectedComponentCatalogId()}
        onMaintenanceTypeCreated={handleMaintenanceTypeCreated}
      />
    </div>
  );
};

export default AddMaintenancePage;