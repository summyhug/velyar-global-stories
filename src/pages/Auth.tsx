import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { VelyarLogo } from '@/components/VelyarLogo';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import type { User, Session } from '@supabase/supabase-js';
import { verifyAge, calculateAge } from "@/utils/contentModeration";

const countries = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria", "Bangladesh", "Belgium", "Brazil", "Canada", "China", "Colombia", "Denmark", "Egypt", "Finland", "France", "Germany", "Ghana", "Greece", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Japan", "Jordan", "Kenya", "South Korea", "Malaysia", "Mexico", "Morocco", "Netherlands", "New Zealand", "Nigeria", "Norway", "Pakistan", "Peru", "Philippines", "Poland", "Portugal", "Russia", "Saudi Arabia", "South Africa", "Spain", "Sweden", "Switzerland", "Taiwan", "Thailand", "Turkey", "Ukraine", "United Kingdom", "United States", "Venezuela", "Vietnam"
];

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location.state]);

  // Prevent body scrolling on auth page and clean up any keyboard-related classes
  useEffect(() => {
    // Reset any keyboard-related classes that might persist
    document.body.classList.remove('keyboard-open');
    
    // Set body overflow to hidden for auth page
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Clean up body styles when component unmounts
      document.body.style.overflow = 'auto';
      document.body.classList.remove('keyboard-open');
    };
  }, []);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!isLogin) {
      if (!formData.name.trim()) errors.name = t("auth.nameRequired");
      if (!formData.username.trim()) errors.username = t("auth.usernameRequired");
      if (formData.username.length < 3) errors.username = t("auth.usernameMinLength");
      if (!formData.city.trim()) errors.city = t("auth.cityRequired");
      if (!formData.country) errors.country = t("auth.countryRequired");
      if (!formData.dob) {
        errors.dob = t("auth.dobRequired");
      } else {
        const ageVerification = verifyAge(formData.dob);
        if (!ageVerification.isValid) {
          errors.dob = ageVerification.reason;
        } else if (ageVerification.accountType === 'restricted') {
          // We'll show a warning but allow signup
          console.log('User will have restricted account:', ageVerification.reason);
        }
      }
    }
    
    if (!formData.email.trim()) {
      errors.email = t("auth.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = t("auth.emailInvalid");
    }
    
    if (!formData.password) {
      errors.password = t("auth.passwordRequired");
    } else if (formData.password.length < 8) {
      errors.password = t("auth.passwordMinLength");
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = t("auth.passwordUpperLowerNumber");
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

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    if (!username) return false;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking username:', error);
        return false;
      }
      
      return !data; // Available if no data found
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid || submitting) {
      return;
    }

    setSubmitting(true);

    try {
      if (isLogin) {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          toast({
            title: t("errors.signInFailed"),
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        if (data.user) {
          toast({
            title: t("errors.welcomeBack"),
            description: t("errors.signInSuccess"),
          });
          // Navigation handled by onAuthStateChange
        }
      } else {
        // Check username availability first
        const isUsernameAvailable = await checkUsernameAvailability(formData.username);
        if (!isUsernameAvailable) {
          toast({
            title: t("errors.usernameTaken"),
            description: t("errors.usernameTaken"),
            variant: "destructive",
          });
          return;
        }

        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username: formData.username,
              display_name: formData.name,
              city: formData.city,
              country: formData.country,
              date_of_birth: formData.dob,
            }
          }
        });

        if (error) {
          toast({
            title: t("errors.signUpFailed"),
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        if (data.user) {
          // Create user consent record
          const ageVerification = verifyAge(formData.dob);
          await (supabase as any)
            .from('user_consent')
            .insert({
              user_id: data.user.id,
              content_moderation: true,
              data_processing: true,
              community_guidelines: acceptedTerms,
              age_verification: ageVerification.isValid,
              marketing_emails: false
            });

          if (data.user.email_confirmed_at) {
            toast({
              title: t("errors.accountCreated"),
              description: t("errors.welcomeToVelyar"),
            });
            // Navigation handled by onAuthStateChange
          } else {
            toast({
              title: t("errors.checkEmail"),
              description: t("errors.emailConfirmationSent"),
            });
            // Switch back to login mode after showing the toast
            setTimeout(() => {
              setIsLogin(true);
            }, 2000); // Wait 2 seconds for user to read the toast
          }
        }
      }
    } catch (error: any) {
      toast({
        title: t("errors.anErrorOccurred"),
        description: error.message || t("errors.tryAgainLater"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div 
      key={`auth-${isLogin ? 'login' : 'signup'}-${user ? 'authenticated' : 'unauthenticated'}`}
      className="fixed inset-0 bg-gradient-to-br from-blue-900/20 via-teal-800/10 to-green-900/20 flex items-center justify-center p-4 pt-safe-header pb-safe overflow-hidden"
    >
      {/* Ocean-like animated background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Base ocean gradient - covers entire viewport */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-teal-800/10 to-green-900/20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-teal-700/5 to-green-800/10">
            <div className="absolute inset-0 bg-gradient-to-tl from-blue-800/5 to-transparent animate-pulse"></div>
          </div>
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

      <Card className="w-full max-w-md mx-auto bg-background/95 backdrop-blur-md shadow-warm border-velyar-earth/20 relative z-10 max-h-[80vh] overflow-hidden">
        <CardHeader className="text-center pb-3 px-6">
          <div className="flex items-center justify-center mb-4">
            <VelyarLogo size={120} className="text-velyar-earth" />
          </div>
          <CardTitle className="text-lg font-medium text-velyar-earth font-nunito mb-1">
            {isLogin ? t("auth.welcomeBack") : t("auth.leaveBubble")}
          </CardTitle>
          <CardDescription className="text-muted-foreground font-quicksand text-sm">
            {isLogin ? t("auth.moreConnectsUs") : t("auth.shareAndLearn")}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6 overflow-y-auto max-h-[60vh]">
          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <>
                 <div className="space-y-1">
                   <Label htmlFor="name" className="text-velyar-earth font-nunito text-sm">{t("auth.fullName")}</Label>
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
                   <Label htmlFor="username" className="text-velyar-earth font-nunito text-sm">{t("auth.username")}</Label>
                   <Input
                     id="username"
                     name="username"
                     type="text"
                     value={formData.username}
                     onChange={handleInputChange}
                     onBlur={() => handleBlur('username')}
                     required={!isLogin}
                     className="border-velyar-earth/20 focus:border-velyar-earth"
                     placeholder={t("auth.usernameMinLength")}
                   />
                   {formErrors.username && touchedFields.username && <p className="text-red-500 text-xs">{formErrors.username}</p>}
                 </div>
              </>
            )}
            
             <div className="space-y-1">
               <Label htmlFor="email" className="text-velyar-earth font-nunito text-sm">{t("auth.email")}</Label>
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
                <Label htmlFor="password" className="text-velyar-earth font-nunito text-sm">{t("auth.password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('password')}
                    required
                    className="border-velyar-earth/20 focus:border-velyar-earth pr-10"
                    placeholder={!isLogin ? t("auth.passwordRequirements") : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-velyar-earth" />
                    ) : (
                      <Eye className="h-4 w-4 text-velyar-earth" />
                    )}
                  </Button>
                </div>
                {formErrors.password && touchedFields.password && <p className="text-red-500 text-xs">{formErrors.password}</p>}
              </div>

            {!isLogin && (
              <>
                 <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-1">
                     <Label htmlFor="city" className="text-velyar-earth font-nunito text-sm">{t("auth.city")}</Label>
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
                     <Label htmlFor="country" className="text-velyar-earth font-nunito text-sm">{t("auth.country")}</Label>
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
                   <Label htmlFor="dob" className="text-velyar-earth font-nunito text-sm">{t("auth.dateOfBirth")}</Label>
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
                   {formData.dob && !formErrors.dob && verifyAge(formData.dob).accountType === 'restricted' && (
                     <p className="text-orange-600 text-xs mt-1">
                       {t("ageRestriction.under16Warning")}
                     </p>
                   )}
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
                    {t("auth.termsAgreement")}
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
                    {t("auth.privacyAgreement")}
                  </Label>
                </div>
              </div>
            )}

             <Button
               type="submit"
               disabled={!isFormValid || submitting}
               className="w-full bg-velyar-earth hover:bg-velyar-earth/90 text-white font-nunito font-medium disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {submitting ? t("auth.processing") : isLogin ? t("auth.signIn") : t("auth.createAccount")}
             </Button>
          </form>

          {!isLogin && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="text-velyar-earth/70 hover:text-velyar-earth hover:bg-velyar-earth/10 transition-colors font-quicksand text-sm p-2 rounded"
              >
                {t("auth.alreadyHaveAccount")}
              </button>
            </div>
          )}

                     {isLogin && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className="text-velyar-earth/70 hover:text-velyar-earth hover:bg-velyar-earth/10 transition-colors font-quicksand text-sm p-2 rounded"
              >
                {t("auth.needAccount")}
              </button>
            </div>
          )}

           {/* Legal footer for EU compliance - only show for login */}
           {isLogin && (
             <div className="mt-3 pt-3 border-t border-velyar-earth/10 text-center">
               <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                 <Link to="/terms" className="hover:text-velyar-earth transition-colors">{t("auth.terms")}</Link>
                 <Link to="/privacy" className="hover:text-velyar-earth transition-colors">{t("auth.privacy")}</Link>
               </div>
               <p className="text-xs text-muted-foreground mt-2">
                 {t("auth.byUsingVelyar")}
               </p>
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;