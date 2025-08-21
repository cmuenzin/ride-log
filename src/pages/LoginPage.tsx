import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Mail, Lock, User, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-vehicles.jpg";

const LoginPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast({
          title: "Willkommen zurück!",
          description: "Sie wurden erfolgreich angemeldet.",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email.split('@')[0]
            }
          }
        });
        
        if (error) throw error;
        
        toast({
          title: "Konto erstellt!",
          description: "Prüfen Sie Ihre E-Mail für die Bestätigung.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Ein Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: CheckCircle,
      title: "Wartungsübersicht",
      description: "Behalten Sie den Überblick über alle Wartungen"
    },
    {
      icon: Car,
      title: "Mehrere Fahrzeuge",
      description: "Verwalten Sie Motorräder und Autos zentral"
    },
    {
      icon: CheckCircle,
      title: "Intervall-Tracking",
      description: "Verpassen Sie keine wichtigen Wartungstermine"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-foreground">
                Ride-Log
              </h1>
              <h2 className="text-2xl font-semibold text-primary">
                Wartungsdokumentation neu gedacht
              </h2>
              <p className="text-lg text-foreground-secondary leading-relaxed">
                Minimalistisch, elegant und funktional. Behalten Sie den Überblick 
                über Wartungsintervalle und den Status Ihrer Fahrzeuge.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start gap-4">
                    <div className="bg-primary-light p-3 rounded-xl">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-foreground-secondary">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hero Image */}
            <div className="hidden lg:block">
              <img 
                src={heroImage}
                alt="Motorrad und Auto - Wartungsdokumentation"
                className="w-full h-64 object-cover rounded-2xl shadow-elevated"
              />
            </div>
          </div>

          {/* Auth Form */}
          <div className="w-full max-w-md mx-auto">
            <Card className="card-elevated">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl font-bold text-center text-foreground">
                  {isLogin ? 'Anmelden' : 'Konto erstellen'}
                </CardTitle>
                <p className="text-center text-foreground-secondary">
                  {isLogin 
                    ? 'Melden Sie sich mit Ihrem Konto an' 
                    : 'Erstellen Sie Ihr kostenloses Konto'
                  }
                </p>
              </CardHeader>
              
              <CardContent>
                <Tabs value={isLogin ? 'login' : 'register'} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger 
                      value="login" 
                      onClick={() => setIsLogin(true)}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      Anmelden
                    </TabsTrigger>
                    <TabsTrigger 
                      value="register" 
                      onClick={() => setIsLogin(false)}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      Registrieren
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4">
                    <form onSubmit={handleAuth} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          E-Mail
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="ihre@email.com"
                          className="bg-surface border-border"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Passwort
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="bg-surface border-border"
                          required
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary-dark mt-6"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                            Anmelden...
                          </div>
                        ) : (
                          'Anmelden'
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="register" className="space-y-4">
                    <form onSubmit={handleAuth} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName" className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Anzeigename (optional)
                        </Label>
                        <Input
                          id="displayName"
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Max Mustermann"
                          className="bg-surface border-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          E-Mail
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="ihre@email.com"
                          className="bg-surface border-border"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Passwort
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="bg-surface border-border"
                          required
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary-dark mt-6"
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                            Konto erstellen...
                          </div>
                        ) : (
                          'Konto erstellen'
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;