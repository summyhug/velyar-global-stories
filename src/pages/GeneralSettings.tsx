import React from "react";
import { ArrowLeft, Globe, Palette, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { PageLayout } from "@/components/PageLayout";

const GeneralSettings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // Header component
  const header = (
    <div className="pt-safe-header px-4">
      <div className="max-w-md mx-auto py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" className="p-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-display text-foreground">General Settings</h1>
      </div>
    </div>
  );

  const themeOptions = [
    {
      value: 'light',
      label: 'Light Mode',
      icon: '☀️',
      description: 'Clean, bright interface'
    },
    {
      value: 'dark',
      label: 'Dark Mode',
      icon: '🌙',
      description: 'Easy on the eyes'
    },
    {
      value: 'system',
      label: 'System Default',
      icon: '🖥️',
      description: 'Follows your device'
    }
  ];

  const languageOptions = [
    {
      value: 'en',
      label: 'English',
      flag: '🇺🇸',
      description: 'English (US)'
    },
    {
      value: 'es',
      label: 'Español',
      flag: '🇪🇸',
      description: 'Spanish'
    },
    {
      value: 'fr',
      label: 'Français',
      flag: '🇫🇷',
      description: 'French'
    },
    {
      value: 'de',
      label: 'Deutsch',
      flag: '🇩🇪',
      description: 'German'
    }
  ];

  return (
    <PageLayout header={header}>
      <div className="px-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Appearance Settings */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Palette className="w-5 h-5 text-velyar-warm" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={theme} onValueChange={setTheme} className="space-y-3">
                {themeOptions.map((option) => {
                  const isSelected = theme === option.value;
                  return (
                    <div key={option.value}>
                      <RadioGroupItem
                        value={option.value}
                        id={`theme-${option.value}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`theme-${option.value}`}
                        className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-velyar-warm bg-velyar-soft/30 shadow-md' 
                            : 'border-border/50 hover:border-velyar-warm/30 hover:bg-velyar-soft/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{option.icon}</span>
                          <div>
                            <div className={`font-medium ${isSelected ? 'text-velyar-earth' : 'text-foreground'}`}>
                              {option.label}
                            </div>
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          isSelected 
                            ? 'border-velyar-warm bg-velyar-warm' 
                            : 'border-border'
                        }`}>
                          <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                            isSelected 
                              ? 'bg-velyar-earth' 
                              : 'bg-transparent'
                          }`} />
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Languages className="w-5 h-5 text-velyar-earth" />
                Language
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value="en" className="space-y-3">
                {languageOptions.map((option) => {
                  const isSelected = option.value === 'en'; // Default to English for now
                  return (
                    <div key={option.value}>
                      <RadioGroupItem
                        value={option.value}
                        id={`lang-${option.value}`}
                        className="peer sr-only"
                        disabled={option.value !== 'en'} // Only English enabled for now
                      />
                      <Label
                        htmlFor={`lang-${option.value}`}
                        className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-velyar-warm bg-velyar-soft/30 shadow-md' 
                            : 'border-border/50 hover:border-velyar-warm/30 hover:bg-velyar-soft/20'
                        } ${option.value !== 'en' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{option.flag}</span>
                          <div>
                            <div className={`font-medium ${isSelected ? 'text-velyar-earth' : 'text-foreground'}`}>
                              {option.label}
                            </div>
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          isSelected 
                            ? 'border-velyar-warm bg-velyar-warm' 
                            : 'border-border'
                        }`}>
                          <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                            isSelected 
                              ? 'bg-velyar-earth' 
                              : 'bg-transparent'
                          }`} />
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
              <p className="text-xs text-muted-foreground mt-3">
                More languages coming soon! 🌍
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default GeneralSettings;
