const VENUE_CITY: Record<string, string> = {
  'Estadio Azteca':          'Mexico City',
  'Estadio Akron':           'Zapopan',
  'Estadio BBVA':            'Guadalupe',
  'BMO Field':               'Toronto',
  "Levi's Stadium":          'Santa Clara',
  'SoFi Stadium':            'Inglewood',
  'BC Place':                'Vancouver',
  'Lumen Field':             'Seattle',
  'MetLife Stadium':         'East Rutherford',
  'Gillette Stadium':        'Foxborough',
  'Lincoln Financial Field': 'Philadelphia',
  'Hard Rock Stadium':       'Miami Gardens',
  'NRG Stadium':             'Houston',
  'AT&T Stadium':            'Arlington',
  'Arrowhead Stadium':       'Kansas City',
  'Mercedes-Benz Stadium':   'Atlanta',
};

// Aliases keyed in post-normalization form (lowercase, no diacritics/special chars, single spaces)
const TEAM_ALIASES: Record<string, string> = {
  'cote d ivoire':                    'ivory coast',   // Côte d'Ivoire
  'bosnia herzegovina':               'bosnia and herzegovina', // Bosnia & Herzegovina / Bosnia-Herzegovina
  'congo dr':                         'dr congo',
  'democratic republic of the congo': 'dr congo',
  'democratic republic of congo':     'dr congo',
  'czechia':                          'czech republic',
  'cabo verde':                       'cape verde',
  'cape verde islands':               'cape verde',
  'usa':                              'united states',
  'united states of america':         'united states',
  'korea republic':                   'south korea',
  'republic of korea':                'south korea',
};

function normalizeTeamKey(name: string): string {
  const lower = name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics (Curaçao → curacao)
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return TEAM_ALIASES[lower] ?? lower;
}

// All 72 group stage fixtures: "home|away" → { venue, city }
const FIXTURE_VENUE: Record<string, { venue: string; city: string }> = {
  // Group A
  'mexico|south africa':              { venue: 'Estadio Azteca',          city: 'Mexico City' },
  'south korea|czech republic':       { venue: 'Estadio Akron',           city: 'Zapopan' },
  'czech republic|south africa':      { venue: 'Mercedes-Benz Stadium',   city: 'Atlanta' },
  'mexico|south korea':               { venue: 'Estadio Akron',           city: 'Zapopan' },
  'czech republic|mexico':            { venue: 'Estadio Azteca',          city: 'Mexico City' },
  'south africa|south korea':         { venue: 'Estadio BBVA',            city: 'Guadalupe' },
  // Group B
  'canada|bosnia and herzegovina':    { venue: 'BMO Field',               city: 'Toronto' },
  'qatar|switzerland':                { venue: "Levi's Stadium",           city: 'Santa Clara' },
  'switzerland|bosnia and herzegovina': { venue: 'SoFi Stadium',          city: 'Inglewood' },
  'canada|qatar':                     { venue: 'BC Place',                city: 'Vancouver' },
  'switzerland|canada':               { venue: 'BC Place',                city: 'Vancouver' },
  'bosnia and herzegovina|qatar':     { venue: 'Lumen Field',             city: 'Seattle' },
  // Group C
  'brazil|morocco':                   { venue: 'MetLife Stadium',         city: 'East Rutherford' },
  'haiti|scotland':                   { venue: 'Gillette Stadium',        city: 'Foxborough' },
  'scotland|morocco':                 { venue: 'Gillette Stadium',        city: 'Foxborough' },
  'brazil|haiti':                     { venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  'scotland|brazil':                  { venue: 'Hard Rock Stadium',       city: 'Miami Gardens' },
  'morocco|haiti':                    { venue: 'Mercedes-Benz Stadium',   city: 'Atlanta' },
  // Group D
  'united states|paraguay':           { venue: 'SoFi Stadium',           city: 'Inglewood' },
  'australia|turkey':                 { venue: 'BC Place',               city: 'Vancouver' },
  'united states|australia':          { venue: 'Lumen Field',            city: 'Seattle' },
  'turkey|paraguay':                  { venue: "Levi's Stadium",          city: 'Santa Clara' },
  'turkey|united states':             { venue: 'SoFi Stadium',           city: 'Inglewood' },
  'paraguay|australia':               { venue: "Levi's Stadium",          city: 'Santa Clara' },
  // Group E
  'germany|curacao':                  { venue: 'NRG Stadium',            city: 'Houston' },
  'ivory coast|ecuador':              { venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  'germany|ivory coast':              { venue: 'BMO Field',              city: 'Toronto' },
  'ecuador|curacao':                  { venue: 'Arrowhead Stadium',      city: 'Kansas City' },
  'curacao|ivory coast':              { venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  'ecuador|germany':                  { venue: 'MetLife Stadium',        city: 'East Rutherford' },
  // Group F
  'netherlands|japan':                { venue: 'AT&T Stadium',           city: 'Arlington' },
  'sweden|tunisia':                   { venue: 'Estadio BBVA',           city: 'Guadalupe' },
  'netherlands|sweden':               { venue: 'NRG Stadium',            city: 'Houston' },
  'tunisia|japan':                    { venue: 'Estadio BBVA',           city: 'Guadalupe' },
  'japan|sweden':                     { venue: 'AT&T Stadium',           city: 'Arlington' },
  'tunisia|netherlands':              { venue: 'Arrowhead Stadium',      city: 'Kansas City' },
  // Group G
  'belgium|egypt':                    { venue: 'Lumen Field',            city: 'Seattle' },
  'iran|new zealand':                 { venue: 'SoFi Stadium',           city: 'Inglewood' },
  'belgium|iran':                     { venue: 'SoFi Stadium',           city: 'Inglewood' },
  'new zealand|egypt':                { venue: 'BC Place',               city: 'Vancouver' },
  'egypt|iran':                       { venue: 'Lumen Field',            city: 'Seattle' },
  'new zealand|belgium':              { venue: 'BC Place',               city: 'Vancouver' },
  // Group H
  'spain|cape verde':                 { venue: 'Mercedes-Benz Stadium',  city: 'Atlanta' },
  'saudi arabia|uruguay':             { venue: 'Hard Rock Stadium',      city: 'Miami Gardens' },
  'spain|saudi arabia':               { venue: 'Mercedes-Benz Stadium',  city: 'Atlanta' },
  'uruguay|cape verde':               { venue: 'Hard Rock Stadium',      city: 'Miami Gardens' },
  'cape verde|saudi arabia':          { venue: 'NRG Stadium',            city: 'Houston' },
  'uruguay|spain':                    { venue: 'Estadio Akron',          city: 'Zapopan' },
  // Group I
  'france|senegal':                   { venue: 'MetLife Stadium',        city: 'East Rutherford' },
  'iraq|norway':                      { venue: 'Gillette Stadium',       city: 'Foxborough' },
  'france|iraq':                      { venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  'norway|senegal':                   { venue: 'MetLife Stadium',        city: 'East Rutherford' },
  'norway|france':                    { venue: 'Gillette Stadium',       city: 'Foxborough' },
  'senegal|iraq':                     { venue: 'BMO Field',              city: 'Toronto' },
  // Group J
  'argentina|algeria':                { venue: 'Arrowhead Stadium',      city: 'Kansas City' },
  'austria|jordan':                   { venue: "Levi's Stadium",          city: 'Santa Clara' },
  'argentina|austria':                { venue: 'AT&T Stadium',           city: 'Arlington' },
  'jordan|algeria':                   { venue: "Levi's Stadium",          city: 'Santa Clara' },
  'algeria|austria':                  { venue: 'Arrowhead Stadium',      city: 'Kansas City' },
  'jordan|argentina':                 { venue: 'AT&T Stadium',           city: 'Arlington' },
  // Group K
  'portugal|dr congo':                { venue: 'NRG Stadium',            city: 'Houston' },
  'uzbekistan|colombia':              { venue: 'Estadio Azteca',         city: 'Mexico City' },
  'portugal|uzbekistan':              { venue: 'NRG Stadium',            city: 'Houston' },
  'colombia|dr congo':                { venue: 'Estadio Akron',          city: 'Zapopan' },
  'colombia|portugal':                { venue: 'Hard Rock Stadium',      city: 'Miami Gardens' },
  'dr congo|uzbekistan':              { venue: 'Mercedes-Benz Stadium',  city: 'Atlanta' },
  // Group L
  'england|croatia':                  { venue: 'AT&T Stadium',           city: 'Arlington' },
  'ghana|panama':                     { venue: 'BMO Field',              city: 'Toronto' },
  'england|ghana':                    { venue: 'Gillette Stadium',       city: 'Foxborough' },
  'panama|croatia':                   { venue: 'BMO Field',              city: 'Toronto' },
  'panama|england':                   { venue: 'MetLife Stadium',        city: 'East Rutherford' },
  'croatia|ghana':                    { venue: 'Lincoln Financial Field', city: 'Philadelphia' },
};

export function venueCity(venue: string | null): string | null {
  if (!venue) return null;
  return VENUE_CITY[venue] ?? null;
}

export function fixtureVenue(homeTeam: string, awayTeam: string): { venue: string; city: string } | null {
  const key = `${normalizeTeamKey(homeTeam)}|${normalizeTeamKey(awayTeam)}`;
  return FIXTURE_VENUE[key] ?? null;
}
