# 🌍 Multi-Language Content Strategy

## 🎯 **Current Status**
- ✅ **Static UI**: 100% translated (buttons, labels, navigation)
- ✅ **Component Text**: All components now use translations
- 🔄 **Dynamic Content**: Needs implementation (missions, prompts, user content)

## 📋 **Dynamic Content Types**

### **1. Database Content (Missions, Prompts)**
```sql
-- Current structure
missions: {
  title: "Morning Rituals Around the World",
  description: "Share your morning routine..."
}

-- Proposed multi-language structure
missions: {
  title_en: "Morning Rituals Around the World",
  title_es: "Rituales Matutinos Alrededor del Mundo",
  title_fr: "Rituels Matinaux Autour du Monde",
  title_de: "Morgenrituale auf der ganzen Welt",
  description_en: "Share your morning routine...",
  description_es: "Comparte tu rutina matutina...",
  // ... etc
}
```

### **2. AI-Generated Content (Daily Prompts)**
```typescript
// Current API call
const prompt = await generateDailyPrompt();

// Proposed multi-language API call
const prompts = await generateDailyPromptMultiLanguage(['en', 'es', 'fr', 'de']);
// Returns: { en: "...", es: "...", fr: "...", de: "..." }
```

### **3. User-Generated Content**
```typescript
// Captions, locations, comments
// Strategy: Store in user's language, translate on-demand
```

## 🚀 **Implementation Plan**

### **Phase 1: Database Schema Updates**
1. **Add language columns** to missions, prompts tables
2. **Migration script** to populate existing content
3. **API endpoints** to fetch content by language

### **Phase 2: AI Integration**
1. **Update prompt generation** to create multi-language versions
2. **Content moderation** in multiple languages
3. **Quality assurance** for translations

### **Phase 3: User Content**
1. **Translation service** for user-generated content
2. **Language detection** for captions/locations
3. **Fallback strategy** for untranslated content

## 🔧 **Technical Implementation**

### **Database Schema Changes**
```sql
-- Missions table
ALTER TABLE missions ADD COLUMN title_es TEXT;
ALTER TABLE missions ADD COLUMN title_fr TEXT;
ALTER TABLE missions ADD COLUMN title_de TEXT;
ALTER TABLE missions ADD COLUMN description_es TEXT;
ALTER TABLE missions ADD COLUMN description_fr TEXT;
ALTER TABLE missions ADD COLUMN description_de TEXT;

-- Daily prompts table
ALTER TABLE daily_prompts ADD COLUMN message_text_es TEXT;
ALTER TABLE daily_prompts ADD COLUMN message_text_fr TEXT;
ALTER TABLE daily_prompts ADD COLUMN message_text_de TEXT;
```

### **API Integration**
```typescript
// Supabase Edge Function for multi-language prompt generation
export async function generateDailyPromptMultiLanguage() {
  const languages = ['en', 'es', 'fr', 'de'];
  const prompts = {};
  
  for (const lang of languages) {
    const prompt = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Generate a daily prompt in ${lang}. Focus on cultural diversity and global connection.`
        }
      ]
    });
    prompts[lang] = prompt.choices[0].message.content;
  }
  
  return prompts;
}
```

### **Frontend Integration**
```typescript
// Hook for fetching translated content
export const useTranslatedContent = (contentId: string, contentType: 'mission' | 'prompt') => {
  const { currentLanguage } = useLanguage();
  
  return useQuery({
    queryKey: [contentType, contentId, currentLanguage],
    queryFn: () => fetchTranslatedContent(contentId, contentType, currentLanguage)
  });
};
```

## 📊 **Content Workflow**

### **Mission Creation**
1. **Admin creates** mission in English
2. **AI translates** to supported languages
3. **Human review** for cultural accuracy
4. **Publish** in all languages

### **Daily Prompt Generation**
1. **AI generates** prompts in all languages simultaneously
2. **Content moderation** checks each language
3. **Quality check** for cultural appropriateness
4. **Schedule** for daily publication

### **User Content**
1. **User submits** content in their language
2. **Store original** + detected language
3. **Translate on-demand** for other users
4. **Cache translations** for performance

## 🎨 **UI/UX Considerations**

### **Language Indicators**
- Show content language when different from user's preference
- Allow users to see original language version
- Provide translation quality indicators

### **Fallback Strategy**
- Show English if translation unavailable
- Graceful degradation for missing content
- Clear indicators for untranslated content

### **Performance**
- Cache translations in localStorage
- Lazy load translations
- Preload common content

## 🔄 **Migration Strategy**

### **Existing Content**
1. **Backup** current database
2. **Generate translations** for existing missions/prompts
3. **Populate** new language columns
4. **Test** with small user group
5. **Roll out** gradually

### **New Content**
1. **Start immediately** with multi-language generation
2. **Review process** for quality assurance
3. **Monitor** user feedback and engagement

## 📈 **Success Metrics**

### **User Engagement**
- Language preference adoption
- Content consumption by language
- User-generated content language distribution

### **Content Quality**
- Translation accuracy scores
- Cultural appropriateness reviews
- User feedback on translations

### **Technical Performance**
- Translation loading times
- Cache hit rates
- API response times

## 🚨 **Risk Mitigation**

### **Translation Quality**
- Human review for important content
- AI quality scoring
- User feedback loops

### **Cultural Sensitivity**
- Cultural expert review
- Community guidelines by language
- Moderation in all languages

### **Technical Issues**
- Fallback to English
- Graceful error handling
- Performance monitoring
