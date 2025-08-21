import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Wrench, Car, Bike, Cog, Gauge, Zap, Fuel, Settings } from "lucide-react";

interface AddCustomComponentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleType: 'car' | 'motorcycle';
  vehicleId: string;
  onComponentCreated: (componentId: string) => void;
}

const iconOptions = [
  { id: "wrench", icon: Wrench, name: "Werkzeug" },
  { id: "car", icon: Car, name: "Auto" },
  { id: "bike", icon: Bike, name: "Motorrad" },
  { id: "cog", icon: Cog, name: "Zahnrad" },
  { id: "gauge", icon: Gauge, name: "Anzeige" },
  { id: "zap", icon: Zap, name: "Elektrik" },
  { id: "fuel", icon: Fuel, name: "Kraftstoff" },
  { id: "settings", icon: Settings, name: "Einstellungen" },
];

export const AddCustomComponentDialog = ({ 
  isOpen, 
  onClose, 
  vehicleType, 
  vehicleId,
  onComponentCreated 
}: AddCustomComponentDialogProps) => {
  const [name, setName] = useState("");
  const [iconId, setIconId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Fehler",
        description: "Name ist erforderlich.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Insert into component_catalog
      const { data: componentData, error: componentError } = await supabase
        .from('component_catalog')
        .insert({
          owner_scope: 'user',
          owner_user_id: (await supabase.auth.getUser()).data.user?.id,
          vehicle_type: vehicleType,
          name: name.trim(),
          icon_id: iconId || null,
          is_active: true,
          sort_order: 999, // Put user components at the end
        })
        .select('id')
        .single();

      if (componentError) throw componentError;

      // Create vehicle_components instance if it doesn't exist
      const { error: vehicleComponentError } = await supabase
        .from('vehicle_components')
        .upsert({
          vehicle_id: vehicleId,
          component_catalog_id: componentData.id,
        }, {
          onConflict: 'vehicle_id,component_catalog_id',
          ignoreDuplicates: true
        });

      if (vehicleComponentError) {
        console.error('Error creating vehicle component:', vehicleComponentError);
      }

      toast({
        title: "Erfolg",
        description: "Komponente wurde erfolgreich erstellt.",
      });

      onComponentCreated(componentData.id);
      setName("");
      setIconId("");
      onClose();
    } catch (error) {
      console.error('Error creating component:', error);
      toast({
        title: "Fehler",
        description: "Komponente konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setIconId("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Benutzerdefinierte Komponente hinzufügen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Spezialfilter"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Symbol (optional)</Label>
            <Select value={iconId} onValueChange={setIconId}>
              <SelectTrigger>
                <SelectValue placeholder="Symbol auswählen" />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        {option.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fahrzeugtyp</Label>
            <div className="flex items-center gap-2 text-sm text-foreground-secondary bg-muted px-3 py-2 rounded-md">
              {vehicleType === 'motorcycle' ? <Bike className="w-4 h-4" /> : <Car className="w-4 h-4" />}
              {vehicleType === 'motorcycle' ? 'Motorrad' : 'Auto'}
            </div>
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
              disabled={loading || !name.trim()}
              className="flex-1"
            >
              {loading ? "Erstellen..." : "Komponente erstellen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};