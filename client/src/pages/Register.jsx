import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { showSuccess } from "../utils/toast";
import Loader from "../components/Loader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import ColorBends from "../components/ColorBends";

export const Register = () => {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedSurname = surname.trim();
    const nameRegex = /^[A-Za-zÀ-ÿ' -]+$/;

    if (trimmedName.length < 2) {
      setError("Il nome deve contenere almeno 2 caratteri");
      return;
    }
    if (!nameRegex.test(trimmedName)) {
      setError("Il nome può contenere solo lettere, spazi, apostrofi e trattini");
      return;
    }
    if (trimmedSurname.length < 2) {
      setError("Il cognome deve contenere almeno 2 caratteri");
      return;
    }
    if (!nameRegex.test(trimmedSurname)) {
      setError("Il cognome può contenere solo lettere, spazi, apostrofi e trattini");
      return;
    }

    setLoading(true);

    const res = await register({ email: email, password: password, repeatPassword: confirmPassword, isAdmin: isAdmin, name: trimmedName, surname: trimmedSurname });
    if (res.ok) {
      showSuccess("Registrazione avvenuta con successo");
      setLoading(false);
      navigate("/dashboard");
    } else {
      setLoading(false);
      setError(res.message);
      console.error("Registration error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-muted/30 px-4 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <ColorBends
          colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
          rotation={90}
          speed={0.2}
          scale={1}
          frequency={1}
          warpStrength={1}
          mouseInfluence={1}
          noise={0.15}
          parallax={0.5}
          iterations={1}
          intensity={1.5}
          bandWidth={6}
          transparent
        />
      </div>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Rimborso Spese Aziendali</h1>
          <p className="text-sm text-muted-foreground">Registrati al gestionale</p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="Mario"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="surname">Cognome</Label>
              <Input
                id="surname"
                type="text"
                placeholder="Rossi"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@esempio.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Conferma Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isAdmin"
                checked={isAdmin}
                onCheckedChange={(checked) => setIsAdmin(checked === true)}
              />
              <Label htmlFor="isAdmin">Amministratore</Label>
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}

            <Button type="submit" className="w-full">
              Registrati
            </Button>
          </form>
        </div>

        <div className="text-center">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};
