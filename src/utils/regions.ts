
export interface Region {
  id: string;
  name: string;
  countries: string[];
  priority: 'high' | 'medium' | 'low';
}

export const regions: Region[] = [
  {
    id: 'eastern-europe',
    name: 'Eastern Europe',
    countries: ['Poland', 'Czech Republic', 'Slovakia', 'Hungary', 'Romania', 'Bulgaria', 'Ukraine', 'Belarus'],
    priority: 'high'
  },
  {
    id: 'oceania',
    name: 'Oceania',
    countries: ['Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Solomon Islands'],
    priority: 'high'
  },
  {
    id: 'central-africa',
    name: 'Central Africa',
    countries: ['Chad', 'Central African Republic', 'Cameroon', 'Congo', 'Democratic Republic of Congo'],
    priority: 'medium'
  },
  {
    id: 'south-america',
    name: 'South America',
    countries: ['Brazil', 'Argentina', 'Chile', 'Peru', 'Colombia', 'Venezuela', 'Ecuador', 'Bolivia'],
    priority: 'low'
  },
  {
    id: 'southeast-asia',
    name: 'Southeast Asia',
    countries: ['Thailand', 'Vietnam', 'Cambodia', 'Laos', 'Myanmar', 'Malaysia', 'Indonesia', 'Philippines'],
    priority: 'medium'
  }
];

export const getNeededRegions = (): Region[] => {
  // This would typically check against actual participation data
  // For now, return regions marked as high priority
  return regions.filter(region => region.priority === 'high');
};

export const getRegionByCountry = (country: string): Region | undefined => {
  return regions.find(region => 
    region.countries.some(c => c.toLowerCase() === country.toLowerCase())
  );
};
