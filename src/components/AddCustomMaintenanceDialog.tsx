import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AddCustomMaintenanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedComponentCatalogId: string | null;
  onMaintenanceTypeCreated: (maintenanceTypeId: string) => void;
}

export const AddCustomMaintenanceDialog = ({ 
  isOpen, 
  onClose, 
  selectedComponentCatalogId,
  onMaintenanceTypeCreated 
}: AddCustomMaintenanceDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [linkToComponent, setLinkToComponent] = useState(true);
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
      // Insert into maintenance_type_catalog
      const { data: maintenanceTypeData, error: maintenanceTypeError } = await supabase
        .from('maintenance_type_catalog')
        .insert({
          owner_scope: 'user',
          owner_user_id: (await supabase.auth.getUser()).data.user?.id,
          name: name.trim(),
          description: description.trim() || null,
          is_standard: true,
        })
        .select('id')
        .single();

      if (maintenanceTypeError) throw maintenanceTypeError;

      // Link to selected component if checkbox is checked and component is selected
      if (linkToComponent && selectedComponentCatalogId) {
        const { error: linkError } = await supabase
          .from('maintenance_type_components')
          .upsert({
            maintenance_type_id: maintenanceTypeData.id,
            component_catalog_id: selectedComponentCatalogId,
          }, {
            onConflict: 'maintenance_type_id,component_catalog_id',
            ignoreDuplicates: true
          });

        if (linkError) {
          console.error('Error linking maintenance type to component:', linkError);
        }
      }

      toast({
        title: "Erfolg",
        description: "Wartungstyp wurde erfolgreich erstellt.",
      });

      onMaintenanceTypeCreated(maintenanceTypeData.id);
      setName("");
      setDescription("");
      setLinkToComponent(true);
      onClose();
    } catch (error) {
      console.error('Error creating maintenance type:', error);
      toast({
        title: "Fehler",
        description: "Wartungstyp konnte nicht erstellt werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setLinkToComponent(true);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Benutzerdefinierten Wartungstyp hinzufügen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Spezialwartung"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Zusätzliche Details zur Wartung..."
              rows={3}
            />
          </div>

          {selectedComponentCatalogId && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="linkToComponent"
                checked={linkToComponent}
                onCheckedChange={(checked) => setLinkToComponent(checked === true)}
              />
              <Label htmlFor="linkToComponent" className="text-sm">
                Diesen Wartungstyp direkt mit der aktuell ausgewählten Komponente verknüpfen
              </Label>
            </div>
          )}

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
              {loading ? "Erstellen..." : "Wartungstyp erstellen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};