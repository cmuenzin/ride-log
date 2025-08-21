import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AddVehicle = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    type: 'motorcycle',
    current_km: '',
    first_registration: '',
    vin: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.brand || !formData.model || !formData.current_km) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Benutzer nicht authentifiziert');
      }

      const vehicleData = {
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        year: formData.year ? parseInt(formData.year) : null,
        type: formData.type as 'motorcycle' | 'car',
        current_km: parseInt(formData.current_km),
        first_registration: formData.first_registration || null,
        vin: formData.vin.trim() || null,
        user_id: user.id
      };

      const { error } = await supabase
        .from('vehicles')
        .insert(vehicleData);

      if (error) throw error;

      toast({
        title: "Erfolg",
        description: "Fahrzeug wurde erfolgreich hinzugefügt.",
      });

      navigate('/garage');
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast({
        title: "Fehler",
        description: "Fahrzeug konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/garage')}
          className="hover:bg-surface-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fahrzeug hinzufügen</h1>
          <p className="text-foreground-secondary mt-1">
            Fügen Sie ein neues Fahrzeug zu Ihrer Garage hinzu
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="card-apple">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            Fahrzeugdaten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basis-Informationen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand" className="text-foreground font-medium">
                  Marke *
                </Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  placeholder="z.B. BMW, Honda, Audi"
                  className="bg-surface border-border focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model" className="text-foreground font-medium">
                  Modell *
                </Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="z.B. R1250GS, Civic, A4"
                  className="bg-surface border-border focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-foreground font-medium">
                  Fahrzeugtyp
                </Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger className="bg-surface border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="motorcycle">Motorrad</SelectItem>
                    <SelectItem value="car">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year" className="text-foreground font-medium">
                  Baujahr
                </Label>
                <Input
                  id="year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  placeholder={new Date().getFullYear().toString()}
                  className="bg-surface border-border focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_km" className="text-foreground font-medium">
                  Aktueller Kilometerstand *
                </Label>
                <Input
                  id="current_km"
                  type="number"
                  min="0"
                  value={formData.current_km}
                  onChange={(e) => handleInputChange('current_km', e.target.value)}
                  placeholder="50000"
                  className="bg-surface border-border focus:ring-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="first_registration" className="text-foreground font-medium">
                  Erstzulassung
                </Label>
                <Input
                  id="first_registration"
                  type="date"
                  value={formData.first_registration}
                  onChange={(e) => handleInputChange('first_registration', e.target.value)}
                  className="bg-surface border-border focus:ring-primary"
                />
              </div>
            </div>

            {/* Zusätzliche Informationen */}
            <div className="space-y-2">
              <Label htmlFor="vin" className="text-foreground font-medium">
                Fahrgestellnummer (VIN/FIN)
              </Label>
              <Input
                id="vin"
                value={formData.vin}
                onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
                placeholder="WBA12345678901234"
                className="bg-surface border-border focus:ring-primary font-mono"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/garage')}
                className="flex-1 border-border hover:bg-surface-secondary"
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary-dark text-primary-foreground"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                    Speichern...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Fahrzeug hinzufügen
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddVehicle;