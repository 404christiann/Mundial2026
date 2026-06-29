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
  // Round of 32
  'south africa|canada':              { venue: 'SoFi Stadium',           city: 'Inglewood' },
  'brazil|japan':                     { venue: 'NRG Stadium',            city: 'Houston' },
  'germany|paraguay':                 { venue: 'Gillette Stadium',       city: 'Foxborough' },
  'netherlands|morocco':              { venue: 'Estadio BBVA',           city: 'Guadalupe' },
  'ivory coast|norway':               { venue: 'AT&T Stadium',           city: 'Arlington' },
  'france|sweden':                    { venue: 'MetLife Stadium',        city: 'East Rutherford' },
  'mexico|ecuador':                   { venue: 'Estadio Azteca',         city: 'Mexico City' },
  'england|dr congo':                 { venue: 'Mercedes-Benz Stadium',  city: 'Atlanta' },
  'belgium|senegal':                  { venue: 'Lumen Field',            city: 'Seattle' },
  'united states|bosnia and herzegovina': { venue: "Levi's Stadium",    city: 'Santa Clara' },
  'spain|austria':                    { venue: 'SoFi Stadium',           city: 'Inglewood' },
  'portugal|croatia':                 { venue: 'BMO Field',              city: 'Toronto' },
  'switzerland|algeria':              { venue: 'BC Place',               city: 'Vancouver' },
  'australia|egypt':                  { venue: 'AT&T Stadium',           city: 'Arlington' },
  'argentina|cape verde':             { venue: 'Hard Rock Stadium',      city: 'Miami Gardens' },
  'colombia|ghana':                   { venue: 'Arrowhead Stadium',      city: 'Kansas City' },
};

// All knockout fixtures — keyed by football-data.org match ID
const MATCH_ID_VENUE: Record<number, { venue: string; city: string }> = {
  // Round of 32
  537417: { venue: 'SoFi Stadium',            city: 'Inglewood' },
  537423: { venue: 'NRG Stadium',             city: 'Houston' },
  537415: { venue: 'Gillette Stadium',        city: 'Foxborough' },
  537418: { venue: 'Estadio BBVA',            city: 'Guadalupe' },
  537424: { venue: 'AT&T Stadium',            city: 'Arlington' },
  537416: { venue: 'MetLife Stadium',         city: 'East Rutherford' },
  537425: { venue: 'Estadio Azteca',          city: 'Mexico City' },
  537426: { venue: 'Mercedes-Benz Stadium',   city: 'Atlanta' },
  537422: { venue: 'Lumen Field',             city: 'Seattle' },
  537421: { venue: "Levi's Stadium",          city: 'Santa Clara' },
  537420: { venue: 'SoFi Stadium',            city: 'Inglewood' },
  537419: { venue: 'BMO Field',               city: 'Toronto' },
  537429: { venue: 'BC Place',                city: 'Vancouver' },
  537428: { venue: 'AT&T Stadium',            city: 'Arlington' },
  537427: { venue: 'Hard Rock Stadium',       city: 'Miami Gardens' },
  537430: { venue: 'Arrowhead Stadium',       city: 'Kansas City' },
  // Round of 16
  537376: { venue: 'NRG Stadium',             city: 'Houston' },
  537375: { venue: 'Lincoln Financial Field', city: 'Philadelphia' },
  537377: { venue: 'MetLife Stadium',         city: 'East Rutherford' },
  537378: { venue: 'Estadio Azteca',          city: 'Mexico City' },
  537379: { venue: 'AT&T Stadium',            city: 'Arlington' },
  537380: { venue: 'Lumen Field',             city: 'Seattle' },
  537381: { venue: 'Mercedes-Benz Stadium',   city: 'Atlanta' },
  537382: { venue: 'BC Place',                city: 'Vancouver' },
  // Quarter Finals
  537383: { venue: 'Gillette Stadium',        city: 'Foxborough' },
  537384: { venue: 'SoFi Stadium',            city: 'Inglewood' },
  537385: { venue: 'Hard Rock Stadium',       city: 'Miami Gardens' },
  537386: { venue: 'Arrowhead Stadium',       city: 'Kansas City' },
  // Semi Finals
  537387: { venue: 'AT&T Stadium',            city: 'Arlington' },
  537388: { venue: 'Mercedes-Benz Stadium',   city: 'Atlanta' },
  // Third Place
  537389: { venue: 'Hard Rock Stadium',       city: 'Miami Gardens' },
  // Final
  537390: { venue: 'MetLife Stadium',         city: 'East Rutherford' },
};

export function venueCity(venue: string | null): string | null {
  if (!venue) return null;
  return VENUE_CITY[venue] ?? null;
}

export function fixtureVenue(homeTeam: string, awayTeam: string): { venue: string; city: string } | null {
  const key = `${normalizeTeamKey(homeTeam)}|${normalizeTeamKey(awayTeam)}`;
  return FIXTURE_VENUE[key] ?? null;
}

export function matchVenue(id: number): { venue: string; city: string } | null {
  return MATCH_ID_VENUE[id] ?? null;
}
