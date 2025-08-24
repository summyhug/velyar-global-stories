import React from "react";
import { ArrowLeft, Globe, Palette, Languages, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "react-i18next";
import { PageLayout } from "@/components/PageLayout";

const GeneralSettings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, deleteAccount } = useAuth();
  const { currentLanguage, setLanguage, availableLanguages } = useLanguage();
  const { t } = useTranslation();

  // Header component
  const header = (
    <div className="pt-safe-header px-4">
      <div className="max-w-md mx-auto py-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" className="p-2 text-velyar-earth hover:bg-velyar-soft" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-display text-velyar-earth">{t('settings.generalSettings')}</h1>
      </div>
    </div>
  );

  const themeOptions = [
    {
      value: 'light',
      label: t('settings.lightMode'),
      icon: '☀️',
      description: t('settings.cleanBright')
    },
    {
      value: 'dark',
      label: t('settings.darkMode'),
      icon: '🌙',
      description: t('settings.easyOnEyes')
    },
    {
      value: 'system',
      label: t('settings.systemDefault'),
      icon: '🖥️',
      description: t('settings.followsDevice')
    }
  ];

  const languageOptions = availableLanguages.map(lang => ({
    value: lang.code,
    label: lang.name,
    flag: lang.flag,
    description: lang.name
  }));

  return (
    <PageLayout header={header}>
      <div className="px-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Appearance Settings */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Palette className="w-5 h-5 text-velyar-warm" />
                {t('settings.appearance')}
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
                          <span className="text-2xl">{option.icon}</span>
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
                {t('settings.language')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={currentLanguage} onValueChange={setLanguage} className="space-y-3">
                {languageOptions.map((option) => {
                  const isSelected = currentLanguage === option.value;
                  return (
                    <div key={option.value}>
                      <RadioGroupItem
                        value={option.value}
                        id={`lang-${option.value}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`lang-${option.value}`}
                        className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-velyar-earth bg-velyar-soft/30 shadow-md' 
                            : 'border-border/50 hover:border-velyar-earth/30 hover:bg-velyar-soft/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{option.flag}</span>
                          <div>
                            <div className={`font-medium ${isSelected ? 'text-velyar-earth' : 'text-foreground'}`}>
                              {option.label}
                            </div>
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          isSelected 
                            ? 'border-velyar-earth bg-velyar-earth' 
                            : 'border-border'
                        }`}>
                          <div className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                            isSelected 
                              ? 'bg-white' 
                              : 'bg-transparent'
                          }`} />
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
              <p className="text-xs text-muted-foreground mt-3">
                {t('settings.moreLanguagesComing')}
              </p>
            </CardContent>
          </Card>

          {/* Delete Account Section */}
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                {t('settings.deleteAccount')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {t('settings.deleteAccountWarning')}
              </p>
              <Button
                variant="destructive"
                className="w-full"
                onClick={deleteAccount}
                disabled={!user}
              >
                {user ? (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('settings.deleteAccount')}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {t('settings.signInToDelete')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default GeneralSettings;
