import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";

export const ThemeSettings = () => {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    {
      value: 'light',
      label: 'Light Mode',
      icon: Sun,
      description: 'Clean, bright interface',
      color: 'text-velyar-warm'
    },
    {
      value: 'dark',
      label: 'Dark Mode',
      icon: Moon,
      description: 'Easy on the eyes',
      color: 'text-velyar-earth'
    },
    {
      value: 'system',
      label: 'System Default',
      icon: Monitor,
      description: 'Follows your device',
      color: 'text-muted-foreground'
    }
  ];

  return (
    <Card className="card-enhanced">
      <CardHeader>
        <CardTitle className="text-lg font-display">Appearance</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={theme} onValueChange={setTheme} className="space-y-3">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.value;
            return (
              <div key={option.value}>
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={option.value}
                  className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'border-velyar-warm bg-velyar-soft/30 shadow-md' 
                      : 'border-border/50 hover:border-velyar-warm/30 hover:bg-velyar-soft/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${option.color} ${isSelected ? 'scale-110' : ''}`} />
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
  );
};
