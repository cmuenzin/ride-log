import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
}

interface Component {
  id: string;
  component_catalog_id: string;
  alias?: string;
  component_catalog: {
    id: string;
    name: string;
  };
}

interface MaintenanceType {
  id: string;
  name: string;
  description?: string;
}

interface EditMaintenanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  maintenanceEvent: MaintenanceEvent | null;
  onMaintenanceUpdated: () => void;
}

export const EditMaintenanceDialog = ({ 
  isOpen, 
  onClose, 
  maintenanceEvent,
  onMaintenanceUpdated 
}: EditMaintenanceDialogProps) => {
  const [components, setComponents] = useState<Component[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedComponentId, setSelectedComponentId] = useState<string>("");
  const [selectedMaintenanceTypeId, setSelectedMaintenanceTypeId] = useState<string>("");
  const [kmAtService, setKmAtService] = useState<string>("");
  const [performedAt, setPerformedAt] = useState<string>("");
  const [customName, setCustomName] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [intervalKm, setIntervalKm] = useState<string>("");
  const [intervalMonths, setIntervalMonths] = useState<string>("");

  useEffect(() => {
    if (isOpen && maintenanceEvent) {
      // Initialize form with existing data
      setSelectedComponentId(maintenanceEvent.vehicle_component_id);
      setSelectedMaintenanceTypeId(maintenanceEvent.maintenance_type_id || "");
      setKmAtService(maintenanceEvent.km_at_service.toString());
      setPerformedAt(maintenanceEvent.performed_at);
      setCustomName(maintenanceEvent.custom_name || "");
      setNote(maintenanceEvent.note || "");
      setIntervalKm(maintenanceEvent.interval_km?.toString() || "");
      setIntervalMonths(maintenanceEvent.interval_time_months?.toString() || "");

      // Load components and maintenance types
      fetchComponents();
      fetchMaintenanceTypes();
    }
  }, [isOpen, maintenanceEvent]);

  const fetchComponents = async () => {
    if (!maintenanceEvent) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('vehicle_components')
        .select(`
          id,
          component_catalog_id,
          alias,
          component_catalog!inner (
            id,
            name,
            owner_scope,
            owner_user_id,
            is_active
          )
        `)
        .eq('vehicle_id', maintenanceEvent.vehicle_id);

      if (error) throw error;

      // Filter client-side for RLS
      const filteredData = (data || []).filter(component => {
        const catalog = component.component_catalog;
        return catalog.owner_scope === 'global' || catalog.owner_user_id === user.id;
      });

      setComponents(filteredData);
    } catch (error) {
      console.error('Error fetching components:', error);
    }
  };

  const fetchMaintenanceTypes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('maintenance_type_catalog')
        .select('id, name, description, owner_scope, owner_user_id')
        .or(`owner_scope.eq.global,owner_user_id.eq.${user.id}`)
        .order('name');

      if (error) throw error;
      setMaintenanceTypes(data || []);
    } catch (error) {
      console.error('Error fetching maintenance types:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!maintenanceEvent || !selectedComponentId || !kmAtService || !performedAt) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const updateData = {
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
        .update(updateData)
        .eq('id', maintenanceEvent.id);

      if (error) throw error;

      // Update vehicle mileage if this is higher than current
      const kmService = parseInt(kmAtService);
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ current_km: kmService })
        .eq('id', maintenanceEvent.vehicle_id)
        .lt('current_km', kmService);

      if (vehicleError) {
        console.warn('Could not update vehicle mileage:', vehicleError);
      }

      toast({
        title: "Erfolg",
        description: "Wartung wurde erfolgreich aktualisiert.",
      });

      onMaintenanceUpdated();
      handleClose();
    } catch (error) {
      console.error('Error updating maintenance:', error);
      toast({
        title: "Fehler", 
        description: "Wartung konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedComponentId("");
    setSelectedMaintenanceTypeId("");
    setKmAtService("");
    setPerformedAt("");
    setCustomName("");
    setNote("");
    setIntervalKm("");
    setIntervalMonths("");
    onClose();
  };

  if (!maintenanceEvent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wartung bearbeiten</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Komponente */}
          <div className="space-y-2">
            <Label htmlFor="component">Komponente *</Label>
            <Select value={selectedComponentId} onValueChange={setSelectedComponentId}>
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
            <Select value={selectedMaintenanceTypeId} onValueChange={setSelectedMaintenanceTypeId}>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="intervalKm">Nächste Wartung (km)</Label>
              <Input
                id="intervalKm"
                type="number"
                value={intervalKm}
                onChange={(e) => setIntervalKm(e.target.value)}
                placeholder="10000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="intervalMonths">Nächste Wartung (Monate)</Label>
              <Input
                id="intervalMonths"
                type="number"
                value={intervalMonths}
                onChange={(e) => setIntervalMonths(e.target.value)}
                placeholder="12"
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
              placeholder="Zusätzliche Informationen..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? "Speichern..." : "Wartung aktualisieren"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};