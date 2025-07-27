
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

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
    <div className="min-h-screen bg-gradient-to-br from-velyar-earth/10 to-velyar-warm/10 flex items-center justify-center p-4">
      {/* Ocean background video effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-velyar-earth/5 to-velyar-warm/5 animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-velyar-earth/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-velyar-warm/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <Card className="w-full max-w-md mx-auto bg-background/90 backdrop-blur-sm shadow-warm border-velyar-earth/20">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="text-4xl">🐙</div>
            <h1 className="text-3xl font-semibold text-velyar-earth font-nunito">velyar</h1>
          </div>
          <CardTitle className="text-xl font-medium text-velyar-earth font-nunito">
            {isLogin ? "welcome back" : "join our global community"}
          </CardTitle>
          <CardDescription className="text-muted-foreground font-quicksand">
            {isLogin ? "share your story with the world" : "start sharing your human experiences"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-velyar-earth font-nunito">full name</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-velyar-earth font-nunito">username</Label>
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
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-velyar-earth font-nunito">email</Label>
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
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-velyar-earth font-nunito">password</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-velyar-earth font-nunito">city</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-velyar-earth font-nunito">country</Label>
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
                
                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-velyar-earth font-nunito">date of birth</Label>
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

            <Button
              type="submit"
              className="w-full bg-velyar-warm hover:bg-velyar-glow text-velyar-earth font-nunito font-medium"
            >
              {isLogin ? "sign in" : "create account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-velyar-earth hover:text-velyar-warm transition-colors font-quicksand"
            >
              {isLogin ? "need an account? sign up" : "already have an account? sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
