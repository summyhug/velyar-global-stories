
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate, Link } from "react-router-dom";
import { VelyarLogo } from "@/components/VelyarLogo";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    city: "",
    country: "",
    dob: ""
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle authentication logic here
    console.log("Form submitted:", formData);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-velyar-earth/10 to-velyar-warm/10 flex items-center justify-center p-4 overflow-auto">
      {/* Enhanced animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-velyar-earth/5 to-velyar-warm/5">
          <div className="absolute inset-0 bg-gradient-to-tl from-velyar-teal/5 to-transparent animate-pulse"></div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-velyar-earth/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-velyar-warm/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-velyar-teal/8 rounded-full blur-2xl animate-pulse"></div>
        
        {/* Animated bubbles */}
        <div className="absolute top-20 left-1/2 w-4 h-4 bg-velyar-warm/20 rounded-full animate-bounce"></div>
        <div className="absolute top-40 left-1/3 w-3 h-3 bg-velyar-earth/20 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-60 right-1/4 w-2 h-2 bg-velyar-teal/20 rounded-full animate-bounce" style={{ animationDelay: '2s' }}></div>
        
        {/* Flowing tentacle-like shapes */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/2 left-0 w-32 h-1 bg-gradient-to-r from-velyar-earth/10 to-transparent transform -rotate-45 animate-pulse"></div>
          <div className="absolute bottom-1/3 right-0 w-40 h-1 bg-gradient-to-l from-velyar-warm/10 to-transparent transform rotate-45 animate-pulse"></div>
        </div>
      </div>

      <Card className="w-full max-w-md mx-auto bg-background/95 backdrop-blur-md shadow-warm border-velyar-earth/20 relative z-10 max-h-[90vh] flex flex-col">
        <CardHeader className="text-center pb-4 flex-shrink-0">
          <div className="flex items-center justify-center gap-2 mb-4">
            <VelyarLogo size={56} className="text-velyar-earth" />
            <h1 className="text-3xl font-semibold text-velyar-earth font-nunito">velyar</h1>
          </div>
          <CardTitle className="text-xl font-medium text-velyar-earth font-nunito">
            {isLogin ? "welcome back" : "join our global community"}
          </CardTitle>
          <CardDescription className="text-muted-foreground font-quicksand text-sm">
            {isLogin ? "share your voice with the world" : "start sharing your human experiences"}
          </CardDescription>
          {!isLogin && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsLogin(true)}
              className="text-xs text-velyar-earth hover:text-velyar-warm font-quicksand mt-2 h-auto p-1"
            >
              Already have an account? Sign in
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-velyar-earth font-nunito text-sm">full name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className="border-velyar-earth/20 focus:border-velyar-earth"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="username" className="text-velyar-earth font-nunito text-sm">username</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className="border-velyar-earth/20 focus:border-velyar-earth"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-1">
              <Label htmlFor="email" className="text-velyar-earth font-nunito text-sm">email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="border-velyar-earth/20 focus:border-velyar-earth"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="password" className="text-velyar-earth font-nunito text-sm">password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="border-velyar-earth/20 focus:border-velyar-earth"
              />
            </div>

            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="city" className="text-velyar-earth font-nunito text-sm">city</Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      value={formData.city}
                      onChange={handleInputChange}
                      required={!isLogin}
                      className="border-velyar-earth/20 focus:border-velyar-earth"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="country" className="text-velyar-earth font-nunito text-sm">country</Label>
                    <Input
                      id="country"
                      name="country"
                      type="text"
                      value={formData.country}
                      onChange={handleInputChange}
                      required={!isLogin}
                      className="border-velyar-earth/20 focus:border-velyar-earth"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="dob" className="text-velyar-earth font-nunito text-sm">date of birth</Label>
                  <Input
                    id="dob"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleInputChange}
                    required={!isLogin}
                    className="border-velyar-earth/20 focus:border-velyar-earth"
                  />
                </div>
              </>
            )}

            {!isLogin && (
              <div className="space-y-2 pt-2 border-t border-velyar-earth/10">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    className="border-velyar-earth/40"
                  />
                  <Label htmlFor="terms" className="text-xs text-muted-foreground leading-tight">
                    I agree to the <Link to="/terms" className="text-velyar-earth hover:text-velyar-warm underline">Terms of Service</Link>
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacy" 
                    checked={acceptedPrivacy}
                    onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                    className="border-velyar-earth/40"
                  />
                  <Label htmlFor="privacy" className="text-xs text-muted-foreground leading-tight">
                    I acknowledge the <Link to="/privacy" className="text-velyar-earth hover:text-velyar-warm underline">Privacy Policy</Link> and consent to data processing
                  </Label>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={!isLogin && (!acceptedTerms || !acceptedPrivacy)}
              className="w-full bg-velyar-warm hover:bg-velyar-glow text-velyar-earth font-nunito font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLogin ? "sign in" : "create account"}
            </Button>
          </form>

          {isLogin && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className="text-velyar-earth hover:text-velyar-warm transition-colors font-quicksand text-sm"
              >
                need an account? sign up
              </button>
            </div>
          )}

          {/* Legal footer for EU compliance */}
          <div className="mt-4 pt-3 border-t border-velyar-earth/10 text-center">
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <Link to="/terms" className="hover:text-velyar-earth transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-velyar-earth transition-colors">Privacy</Link>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              By using Velyar, you agree to our terms and acknowledge our privacy practices.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
