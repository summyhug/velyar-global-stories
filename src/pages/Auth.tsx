
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, Link } from "react-router-dom";
import { VelyarLogo } from "@/components/VelyarLogo";

  const countries = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria", "Bangladesh", "Belgium", "Brazil", "Canada", "China", "Colombia", "Denmark", "Egypt", "Finland", "France", "Germany", "Ghana", "Greece", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Japan", "Jordan", "Kenya", "South Korea", "Malaysia", "Mexico", "Morocco", "Netherlands", "New Zealand", "Nigeria", "Norway", "Pakistan", "Peru", "Philippines", "Poland", "Portugal", "Russia", "Saudi Arabia", "South Africa", "Spain", "Sweden", "Switzerland", "Taiwan", "Thailand", "Turkey", "Ukraine", "United Kingdom", "United States", "Venezuela", "Vietnam"
];

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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!isLogin) {
      if (!formData.name.trim()) errors.name = "Full name is required";
      if (!formData.username.trim()) errors.username = "Username is required";
      if (formData.username.length < 3) errors.username = "Username must be at least 3 characters";
      if (!formData.city.trim()) errors.city = "City is required";
      if (!formData.country) errors.country = "Country is required";
      if (!formData.dob) errors.dob = "Date of birth is required";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }
    
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = "Password must contain uppercase, lowercase, and number";
    }
    
    setFormErrors(errors);
    
    const basicValid = Object.keys(errors).length === 0;
    const termsValid = isLogin || (acceptedTerms && acceptedPrivacy);
    setIsFormValid(basicValid && termsValid);
  };

  useEffect(() => {
    validateForm();
  }, [formData, acceptedTerms, acceptedPrivacy, isLogin]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleBlur = (fieldName: string) => {
    setTouchedFields({
      ...touchedFields,
      [fieldName]: true
    });
  };

  const handleCountryChange = (value: string) => {
    setFormData({
      ...formData,
      country: value
    });
    setTouchedFields({
      ...touchedFields,
      country: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle authentication logic here
    console.log("Form submitted:", formData);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900/20 via-teal-800/10 to-green-900/20 flex items-center justify-center p-4">
      {/* Ocean-like animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Base ocean gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-teal-700/5 to-green-800/10">
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-800/5 to-transparent animate-pulse"></div>
        </div>
        
        {/* Ocean currents */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-green-600/8 rounded-full blur-2xl animate-pulse"></div>
        
        {/* Floating bubbles like ocean air */}
        <div className="absolute top-20 left-1/2 w-4 h-4 bg-blue-400/20 rounded-full animate-bounce"></div>
        <div className="absolute top-40 left-1/3 w-3 h-3 bg-teal-400/20 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-60 right-1/4 w-2 h-2 bg-green-400/20 rounded-full animate-bounce" style={{ animationDelay: '2s' }}></div>
        
        {/* Ocean wave patterns */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/2 left-0 w-32 h-1 bg-gradient-to-r from-blue-500/10 to-transparent transform -rotate-45 animate-pulse"></div>
          <div className="absolute bottom-1/3 right-0 w-40 h-1 bg-gradient-to-l from-teal-500/10 to-transparent transform rotate-45 animate-pulse"></div>
          <div className="absolute top-3/4 left-1/4 w-24 h-1 bg-gradient-to-r from-green-500/10 to-transparent transform -rotate-12 animate-pulse" style={{ animationDelay: '3s' }}></div>
        </div>
      </div>

      <Card className="w-full max-w-md mx-auto bg-background/95 backdrop-blur-md shadow-warm border-velyar-earth/20 relative z-10">
        <CardHeader className="text-center pb-3 px-6">
          <div className="flex items-center justify-center mb-3">
            <VelyarLogo size={192} className="text-velyar-earth" />
          </div>
          <CardTitle className="text-lg font-medium text-velyar-earth font-nunito mb-1">
            {isLogin ? "welcome back" : "leave the bubble, join the world"}
          </CardTitle>
          <CardDescription className="text-muted-foreground font-quicksand text-sm">
            {isLogin ? "more connects us than separates us" : "share and learn about humanity"}
          </CardDescription>
          {!isLogin && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsLogin(true)}
              className="text-xs text-velyar-earth/70 hover:text-velyar-earth hover:bg-velyar-earth/10 font-quicksand mt-1 h-auto p-1"
            >
              Already have an account? Sign in
            </Button>
          )}
        </CardHeader>
        <CardContent className="px-6 pb-6">
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
                     onBlur={() => handleBlur('name')}
                     required={!isLogin}
                     className="border-velyar-earth/20 focus:border-velyar-earth"
                   />
                   {formErrors.name && touchedFields.name && <p className="text-red-500 text-xs">{formErrors.name}</p>}
                 </div>
                 <div className="space-y-1">
                   <Label htmlFor="username" className="text-velyar-earth font-nunito text-sm">username</Label>
                   <Input
                     id="username"
                     name="username"
                     type="text"
                     value={formData.username}
                     onChange={handleInputChange}
                     onBlur={() => handleBlur('username')}
                     required={!isLogin}
                     className="border-velyar-earth/20 focus:border-velyar-earth"
                     placeholder="Minimum 3 characters"
                   />
                   {formErrors.username && touchedFields.username && <p className="text-red-500 text-xs">{formErrors.username}</p>}
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
                 onBlur={() => handleBlur('email')}
                 required
                 className="border-velyar-earth/20 focus:border-velyar-earth"
               />
               {formErrors.email && touchedFields.email && <p className="text-red-500 text-xs">{formErrors.email}</p>}
             </div>
             
             <div className="space-y-1">
               <Label htmlFor="password" className="text-velyar-earth font-nunito text-sm">password</Label>
               <Input
                 id="password"
                 name="password"
                 type="password"
                 value={formData.password}
                 onChange={handleInputChange}
                 onBlur={() => handleBlur('password')}
                 required
                 className="border-velyar-earth/20 focus:border-velyar-earth"
                 placeholder={!isLogin ? "8+ chars, uppercase, lowercase, number" : ""}
               />
               {formErrors.password && touchedFields.password && <p className="text-red-500 text-xs">{formErrors.password}</p>}
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
                       onBlur={() => handleBlur('city')}
                       required={!isLogin}
                       className="border-velyar-earth/20 focus:border-velyar-earth"
                     />
                     {formErrors.city && touchedFields.city && <p className="text-red-500 text-xs">{formErrors.city}</p>}
                   </div>
                   <div className="space-y-1">
                     <Label htmlFor="country" className="text-velyar-earth font-nunito text-sm">country</Label>
                     <Select value={formData.country} onValueChange={handleCountryChange}>
                       <SelectTrigger className="border-velyar-earth/20 focus:border-velyar-earth">
                         <SelectValue placeholder="Select country" />
                       </SelectTrigger>
                       <SelectContent>
                         {countries.map((country) => (
                           <SelectItem key={country} value={country}>
                             {country}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                     {formErrors.country && touchedFields.country && <p className="text-red-500 text-xs">{formErrors.country}</p>}
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
                     onBlur={() => handleBlur('dob')}
                     required={!isLogin}
                     className="border-velyar-earth/20 focus:border-velyar-earth"
                   />
                   {formErrors.dob && touchedFields.dob && <p className="text-red-500 text-xs">{formErrors.dob}</p>}
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
               disabled={!isFormValid}
               className="w-full bg-velyar-earth hover:bg-velyar-earth/90 text-white font-nunito font-medium disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isLogin ? "sign in" : "create account"}
             </Button>
          </form>

           {isLogin && (
             <div className="mt-3 text-center">
               <button
                 type="button"
                 onClick={() => setIsLogin(false)}
                 className="text-velyar-earth/70 hover:text-velyar-earth hover:bg-velyar-earth/10 transition-colors font-quicksand text-sm p-2 rounded"
               >
                 need an account? sign up
               </button>
             </div>
           )}

           {/* Legal footer for EU compliance - only show for login */}
           {isLogin && (
             <div className="mt-3 pt-3 border-t border-velyar-earth/10 text-center">
               <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                 <Link to="/terms" className="hover:text-velyar-earth transition-colors">Terms</Link>
                 <Link to="/privacy" className="hover:text-velyar-earth transition-colors">Privacy</Link>
               </div>
               <p className="text-xs text-muted-foreground mt-2">
                 By using Velyar, you agree to our terms and acknowledge our privacy practices.
               </p>
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
