// Venue → city lookup, so the listing can show the town without a city field
// on every concert. Unknown venues simply show no city.
const VENUE_CITY: Record<string, string> = {
  'Glenn Miller Café': 'Stockholm',
  Fasching: 'Stockholm',
  Nefertiti: 'Göteborg',
  'Konserthuset Stockholm': 'Stockholm',
  'Vara Konserthus': 'Vara',
  'Skottvångs Grufva': 'Mariefred',
  'Unity Jazz': 'Göteborg',
  'Playhouse Valand': 'Göteborg',
  'Ystad Sweden Jazz Festival': 'Ystad',
  'Umeå Jazzfestival': 'Umeå',
  'Musikens Hus': 'Göteborg',
  'Slagthusets Teater': 'Malmö',
  Parksnäckan: 'Uppsala',
  'Botaniska trädgården': 'Uppsala',
  Mejeriet: 'Lund',
  'Malmö Live': 'Malmö',
  'Göteborgs Konserthus': 'Göteborg',
};

export function cityFor(venue: string): string | undefined {
  return VENUE_CITY[venue];
}
