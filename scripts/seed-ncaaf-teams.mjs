/**
 * Seed NCAAF FBS teams into Supabase teams + team_aliases tables
 * Run: node --env-file=.env.local scripts/seed-ncaaf-teams.mjs
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates',
};

const NCAAF_TEAMS = [
    // ACC
    { name: 'Boston College Eagles', city: 'Boston College', mascot: 'Eagles', espnAbbr: 'BC' },
    { name: 'Clemson Tigers', city: 'Clemson', mascot: 'Tigers', espnAbbr: 'CLEM' },
    { name: 'Duke Blue Devils', city: 'Duke', mascot: 'Blue Devils', espnAbbr: 'DUKE' },
    { name: 'Florida State Seminoles', city: 'Florida State', mascot: 'Seminoles', espnAbbr: 'FSU' },
    { name: 'Georgia Tech Yellow Jackets', city: 'Georgia Tech', mascot: 'Yellow Jackets', espnAbbr: 'GT' },
    { name: 'Louisville Cardinals', city: 'Louisville', mascot: 'Cardinals', espnAbbr: 'LOU' },
    { name: 'Miami Hurricanes', city: 'Miami', mascot: 'Hurricanes', espnAbbr: 'MIA' },
    { name: 'North Carolina Tar Heels', city: 'North Carolina', mascot: 'Tar Heels', espnAbbr: 'UNC' },
    { name: 'NC State Wolfpack', city: 'NC State', mascot: 'Wolfpack', espnAbbr: 'NCST' },
    { name: 'Notre Dame Fighting Irish', city: 'Notre Dame', mascot: 'Fighting Irish', espnAbbr: 'ND' },
    { name: 'Pittsburgh Panthers', city: 'Pittsburgh', mascot: 'Panthers', espnAbbr: 'PITT' },
    { name: 'Syracuse Orange', city: 'Syracuse', mascot: 'Orange', espnAbbr: 'SYR' },
    { name: 'Virginia Cavaliers', city: 'Virginia', mascot: 'Cavaliers', espnAbbr: 'UVA' },
    { name: 'Virginia Tech Hokies', city: 'Virginia Tech', mascot: 'Hokies', espnAbbr: 'VT' },
    { name: 'Wake Forest Demon Deacons', city: 'Wake Forest', mascot: 'Demon Deacons', espnAbbr: 'WAKE' },
    { name: 'California Golden Bears', city: 'California', mascot: 'Golden Bears', espnAbbr: 'CAL' },
    { name: 'Stanford Cardinal', city: 'Stanford', mascot: 'Cardinal', espnAbbr: 'STAN' },
    { name: 'SMU Mustangs', city: 'SMU', mascot: 'Mustangs', espnAbbr: 'SMU' },
    // Big Ten
    { name: 'Illinois Fighting Illini', city: 'Illinois', mascot: 'Fighting Illini', espnAbbr: 'ILL' },
    { name: 'Indiana Hoosiers', city: 'Indiana', mascot: 'Hoosiers', espnAbbr: 'IND' },
    { name: 'Iowa Hawkeyes', city: 'Iowa', mascot: 'Hawkeyes', espnAbbr: 'IOWA' },
    { name: 'Maryland Terrapins', city: 'Maryland', mascot: 'Terrapins', espnAbbr: 'MD' },
    { name: 'Michigan Wolverines', city: 'Michigan', mascot: 'Wolverines', espnAbbr: 'MICH' },
    { name: 'Michigan State Spartans', city: 'Michigan State', mascot: 'Spartans', espnAbbr: 'MSU' },
    { name: 'Minnesota Golden Gophers', city: 'Minnesota', mascot: 'Golden Gophers', espnAbbr: 'MINN' },
    { name: 'Nebraska Cornhuskers', city: 'Nebraska', mascot: 'Cornhuskers', espnAbbr: 'NEB' },
    { name: 'Northwestern Wildcats', city: 'Northwestern', mascot: 'Wildcats', espnAbbr: 'NW' },
    { name: 'Ohio State Buckeyes', city: 'Ohio State', mascot: 'Buckeyes', espnAbbr: 'OSU' },
    { name: 'Penn State Nittany Lions', city: 'Penn State', mascot: 'Nittany Lions', espnAbbr: 'PSU' },
    { name: 'Purdue Boilermakers', city: 'Purdue', mascot: 'Boilermakers', espnAbbr: 'PUR' },
    { name: 'Rutgers Scarlet Knights', city: 'Rutgers', mascot: 'Scarlet Knights', espnAbbr: 'RUTG' },
    { name: 'UCLA Bruins', city: 'UCLA', mascot: 'Bruins', espnAbbr: 'UCLA' },
    { name: 'USC Trojans', city: 'USC', mascot: 'Trojans', espnAbbr: 'USC' },
    { name: 'Washington Huskies', city: 'Washington', mascot: 'Huskies', espnAbbr: 'WASH' },
    { name: 'Wisconsin Badgers', city: 'Wisconsin', mascot: 'Badgers', espnAbbr: 'WIS' },
    { name: 'Oregon Ducks', city: 'Oregon', mascot: 'Ducks', espnAbbr: 'ORE' },
    // Big 12
    { name: 'Arizona Wildcats', city: 'Arizona', mascot: 'Wildcats', espnAbbr: 'ARIZ' },
    { name: 'Arizona State Sun Devils', city: 'Arizona State', mascot: 'Sun Devils', espnAbbr: 'ASU' },
    { name: 'Baylor Bears', city: 'Baylor', mascot: 'Bears', espnAbbr: 'BAY' },
    { name: 'BYU Cougars', city: 'BYU', mascot: 'Cougars', espnAbbr: 'BYU' },
    { name: 'Cincinnati Bearcats', city: 'Cincinnati', mascot: 'Bearcats', espnAbbr: 'CIN' },
    { name: 'Colorado Buffaloes', city: 'Colorado', mascot: 'Buffaloes', espnAbbr: 'COLO' },
    { name: 'Houston Cougars', city: 'Houston', mascot: 'Cougars', espnAbbr: 'HOU' },
    { name: 'Iowa State Cyclones', city: 'Iowa State', mascot: 'Cyclones', espnAbbr: 'ISU' },
    { name: 'Kansas Jayhawks', city: 'Kansas', mascot: 'Jayhawks', espnAbbr: 'KU' },
    { name: 'Kansas State Wildcats', city: 'Kansas State', mascot: 'Wildcats', espnAbbr: 'KSU' },
    { name: 'Oklahoma State Cowboys', city: 'Oklahoma State', mascot: 'Cowboys', espnAbbr: 'OKST' },
    { name: 'TCU Horned Frogs', city: 'TCU', mascot: 'Horned Frogs', espnAbbr: 'TCU' },
    { name: 'Texas Tech Red Raiders', city: 'Texas Tech', mascot: 'Red Raiders', espnAbbr: 'TTU' },
    { name: 'UCF Knights', city: 'UCF', mascot: 'Knights', espnAbbr: 'UCF' },
    { name: 'Utah Utes', city: 'Utah', mascot: 'Utes', espnAbbr: 'UTAH' },
    { name: 'West Virginia Mountaineers', city: 'West Virginia', mascot: 'Mountaineers', espnAbbr: 'WVU' },
    // SEC
    { name: 'Alabama Crimson Tide', city: 'Alabama', mascot: 'Crimson Tide', espnAbbr: 'ALA' },
    { name: 'Arkansas Razorbacks', city: 'Arkansas', mascot: 'Razorbacks', espnAbbr: 'ARK' },
    { name: 'Auburn Tigers', city: 'Auburn', mascot: 'Tigers', espnAbbr: 'AUB' },
    { name: 'Florida Gators', city: 'Florida', mascot: 'Gators', espnAbbr: 'FLA' },
    { name: 'Georgia Bulldogs', city: 'Georgia', mascot: 'Bulldogs', espnAbbr: 'UGA' },
    { name: 'Kentucky Wildcats', city: 'Kentucky', mascot: 'Wildcats', espnAbbr: 'UK' },
    { name: 'LSU Tigers', city: 'LSU', mascot: 'Tigers', espnAbbr: 'LSU' },
    { name: 'Mississippi State Bulldogs', city: 'Mississippi State', mascot: 'Bulldogs', espnAbbr: 'MSST' },
    { name: 'Missouri Tigers', city: 'Missouri', mascot: 'Tigers', espnAbbr: 'MIZ' },
    { name: 'Ole Miss Rebels', city: 'Ole Miss', mascot: 'Rebels', espnAbbr: 'MISS' },
    { name: 'South Carolina Gamecocks', city: 'South Carolina', mascot: 'Gamecocks', espnAbbr: 'SC' },
    { name: 'Tennessee Volunteers', city: 'Tennessee', mascot: 'Volunteers', espnAbbr: 'TENN' },
    { name: 'Texas A&M Aggies', city: 'Texas A&M', mascot: 'Aggies', espnAbbr: 'TAMU' },
    { name: 'Vanderbilt Commodores', city: 'Vanderbilt', mascot: 'Commodores', espnAbbr: 'VAN' },
    { name: 'Oklahoma Sooners', city: 'Oklahoma', mascot: 'Sooners', espnAbbr: 'OU' },
    { name: 'Texas Longhorns', city: 'Texas', mascot: 'Longhorns', espnAbbr: 'TEX' },
    // American Athletic
    { name: 'Army Black Knights', city: 'Army', mascot: 'Black Knights', espnAbbr: 'ARMY' },
    { name: 'East Carolina Pirates', city: 'East Carolina', mascot: 'Pirates', espnAbbr: 'ECU' },
    { name: 'Florida Atlantic Owls', city: 'Florida Atlantic', mascot: 'Owls', espnAbbr: 'FAU' },
    { name: 'Memphis Tigers', city: 'Memphis', mascot: 'Tigers', espnAbbr: 'MEM' },
    { name: 'Navy Midshipmen', city: 'Navy', mascot: 'Midshipmen', espnAbbr: 'NAVY' },
    { name: 'North Texas Mean Green', city: 'North Texas', mascot: 'Mean Green', espnAbbr: 'UNT' },
    { name: 'South Florida Bulls', city: 'South Florida', mascot: 'Bulls', espnAbbr: 'USF' },
    { name: 'Temple Owls', city: 'Temple', mascot: 'Owls', espnAbbr: 'TEM' },
    { name: 'Tulane Green Wave', city: 'Tulane', mascot: 'Green Wave', espnAbbr: 'TULN' },
    { name: 'Tulsa Golden Hurricane', city: 'Tulsa', mascot: 'Golden Hurricane', espnAbbr: 'TLSA' },
    { name: 'UTSA Roadrunners', city: 'UTSA', mascot: 'Roadrunners', espnAbbr: 'UTSA' },
    // Mountain West
    { name: 'Air Force Falcons', city: 'Air Force', mascot: 'Falcons', espnAbbr: 'AF' },
    { name: 'Boise State Broncos', city: 'Boise State', mascot: 'Broncos', espnAbbr: 'BSU' },
    { name: 'Colorado State Rams', city: 'Colorado State', mascot: 'Rams', espnAbbr: 'CSU' },
    { name: 'Fresno State Bulldogs', city: 'Fresno State', mascot: 'Bulldogs', espnAbbr: 'FRES' },
    { name: 'Hawaii Rainbow Warriors', city: 'Hawaii', mascot: 'Rainbow Warriors', espnAbbr: 'HAW' },
    { name: 'Nevada Wolf Pack', city: 'Nevada', mascot: 'Wolf Pack', espnAbbr: 'NEV' },
    { name: 'New Mexico Lobos', city: 'New Mexico', mascot: 'Lobos', espnAbbr: 'UNM' },
    { name: 'San Diego State Aztecs', city: 'San Diego State', mascot: 'Aztecs', espnAbbr: 'SDSU' },
    { name: 'San Jose State Spartans', city: 'San Jose State', mascot: 'Spartans', espnAbbr: 'SJSU' },
    { name: 'UNLV Rebels', city: 'UNLV', mascot: 'Rebels', espnAbbr: 'UNLV' },
    { name: 'Utah State Aggies', city: 'Utah State', mascot: 'Aggies', espnAbbr: 'USU' },
    { name: 'Wyoming Cowboys', city: 'Wyoming', mascot: 'Cowboys', espnAbbr: 'WYO' },
    // Sun Belt
    { name: 'Appalachian State Mountaineers', city: 'Appalachian State', mascot: 'Mountaineers', espnAbbr: 'APP' },
    { name: 'Arkansas State Red Wolves', city: 'Arkansas State', mascot: 'Red Wolves', espnAbbr: 'ARST' },
    { name: 'Coastal Carolina Chanticleers', city: 'Coastal Carolina', mascot: 'Chanticleers', espnAbbr: 'CCU' },
    { name: 'Georgia Southern Eagles', city: 'Georgia Southern', mascot: 'Eagles', espnAbbr: 'GASO' },
    { name: 'Georgia State Panthers', city: 'Georgia State', mascot: 'Panthers', espnAbbr: 'GAST' },
    { name: 'James Madison Dukes', city: 'James Madison', mascot: 'Dukes', espnAbbr: 'JMU' },
    { name: 'Louisiana Ragin Cajuns', city: 'Louisiana', mascot: 'Ragin Cajuns', espnAbbr: 'ULL' },
    { name: 'Louisiana Monroe Warhawks', city: 'Louisiana Monroe', mascot: 'Warhawks', espnAbbr: 'ULM' },
    { name: 'Marshall Thundering Herd', city: 'Marshall', mascot: 'Thundering Herd', espnAbbr: 'MRSH' },
    { name: 'Old Dominion Monarchs', city: 'Old Dominion', mascot: 'Monarchs', espnAbbr: 'ODU' },
    { name: 'South Alabama Jaguars', city: 'South Alabama', mascot: 'Jaguars', espnAbbr: 'USA' },
    { name: 'Southern Miss Golden Eagles', city: 'Southern Miss', mascot: 'Golden Eagles', espnAbbr: 'USM' },
    { name: 'Texas State Bobcats', city: 'Texas State', mascot: 'Bobcats', espnAbbr: 'TXST' },
    { name: 'Troy Trojans', city: 'Troy', mascot: 'Trojans', espnAbbr: 'TROY' },
    // MAC
    { name: 'Akron Zips', city: 'Akron', mascot: 'Zips', espnAbbr: 'AKR' },
    { name: 'Ball State Cardinals', city: 'Ball State', mascot: 'Cardinals', espnAbbr: 'BST' },
    { name: 'Bowling Green Falcons', city: 'Bowling Green', mascot: 'Falcons', espnAbbr: 'BGSU' },
    { name: 'Buffalo Bulls', city: 'Buffalo', mascot: 'Bulls', espnAbbr: 'BUFF' },
    { name: 'Central Michigan Chippewas', city: 'Central Michigan', mascot: 'Chippewas', espnAbbr: 'CMU' },
    { name: 'Eastern Michigan Eagles', city: 'Eastern Michigan', mascot: 'Eagles', espnAbbr: 'EMU' },
    { name: 'Kent State Golden Flashes', city: 'Kent State', mascot: 'Golden Flashes', espnAbbr: 'KENT' },
    { name: 'Miami Ohio RedHawks', city: 'Miami Ohio', mascot: 'RedHawks', espnAbbr: 'MIOH' },
    { name: 'Northern Illinois Huskies', city: 'Northern Illinois', mascot: 'Huskies', espnAbbr: 'NIU' },
    { name: 'Ohio Bobcats', city: 'Ohio', mascot: 'Bobcats', espnAbbr: 'OHIO' },
    { name: 'Toledo Rockets', city: 'Toledo', mascot: 'Rockets', espnAbbr: 'TOL' },
    { name: 'Western Michigan Broncos', city: 'Western Michigan', mascot: 'Broncos', espnAbbr: 'WMU' },
    // CUSA
    { name: 'Florida International Panthers', city: 'Florida International', mascot: 'Panthers', espnAbbr: 'FIU' },
    { name: 'Jacksonville State Gamecocks', city: 'Jacksonville State', mascot: 'Gamecocks', espnAbbr: 'JVST' },
    { name: 'Kennesaw State Owls', city: 'Kennesaw State', mascot: 'Owls', espnAbbr: 'KENN' },
    { name: 'Liberty Flames', city: 'Liberty', mascot: 'Flames', espnAbbr: 'LIB' },
    { name: 'Louisiana Tech Bulldogs', city: 'Louisiana Tech', mascot: 'Bulldogs', espnAbbr: 'LATC' },
    { name: 'Middle Tennessee Blue Raiders', city: 'Middle Tennessee', mascot: 'Blue Raiders', espnAbbr: 'MTSU' },
    { name: 'New Mexico State Aggies', city: 'New Mexico State', mascot: 'Aggies', espnAbbr: 'NMST' },
    { name: 'Sam Houston Bearkats', city: 'Sam Houston', mascot: 'Bearkats', espnAbbr: 'SHSU' },
    { name: 'UTEP Miners', city: 'UTEP', mascot: 'Miners', espnAbbr: 'UTEP' },
    { name: 'Western Kentucky Hilltoppers', city: 'Western Kentucky', mascot: 'Hilltoppers', espnAbbr: 'WKU' },
];

const NCAAF_ALIASES = [
    { espnAbbr: 'ALA',  aliases: ['bama', 'roll tide', 'alabama'] },
    { espnAbbr: 'OSU',  aliases: ['buckeyes', 'ohio state', 'the ohio state'] },
    { espnAbbr: 'UGA',  aliases: ['dawgs', 'bulldogs', 'georgia'] },
    { espnAbbr: 'MICH', aliases: ['wolverines', 'michigan'] },
    { espnAbbr: 'ND',   aliases: ['irish', 'fighting irish', 'notre dame'] },
    { espnAbbr: 'CLEM', aliases: ['tigers', 'clemson'] },
    { espnAbbr: 'FSU',  aliases: ['seminoles', 'noles', 'florida state'] },
    { espnAbbr: 'LSU',  aliases: ['tigers', 'lsu', 'geaux tigers'] },
    { espnAbbr: 'PSU',  aliases: ['nittany lions', 'lions', 'penn state'] },
    { espnAbbr: 'TEX',  aliases: ['longhorns', 'horns', 'texas'] },
    { espnAbbr: 'OU',   aliases: ['sooners', 'oklahoma', 'ou'] },
    { espnAbbr: 'TAMU', aliases: ['aggies', 'texas am', 'a&m'] },
    { espnAbbr: 'ARK',  aliases: ['razorbacks', 'hogs', 'arkansas'] },
    { espnAbbr: 'TENN', aliases: ['vols', 'volunteers', 'tennessee'] },
    { espnAbbr: 'UNC',  aliases: ['tar heels', 'heels', 'carolina'] },
    { espnAbbr: 'MSU',  aliases: ['spartans', 'michigan state'] },
    { espnAbbr: 'BSU',  aliases: ['broncos', 'boise', 'boise state'] },
    { espnAbbr: 'USC',  aliases: ['trojans', 'usc'] },
    { espnAbbr: 'UCLA', aliases: ['bruins', 'ucla'] },
    { espnAbbr: 'ORE',  aliases: ['ducks', 'oregon'] },
    { espnAbbr: 'WASH', aliases: ['huskies', 'washington', 'uw'] },
    { espnAbbr: 'WVU',  aliases: ['mountaineers', 'wvu', 'west virginia'] },
    { espnAbbr: 'MISS', aliases: ['rebels', 'ole miss', 'hotty toddy'] },
];

async function supabaseRequest(path, method, body) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
        method,
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`${method} ${path} failed: ${text}`);
    return text ? JSON.parse(text) : null;
}

async function run() {
    console.log('Seeding NCAAF teams...');

    const teams = NCAAF_TEAMS.map((t) => ({
        id: `ncaaf-${t.espnAbbr.toLowerCase()}`,
        name: t.name,
        city: t.city,
        mascot: t.mascot,
        league: 'NCAAF',
        sport: 'americanfootball_ncaaf',
        espn_abbr: t.espnAbbr,
    }));

    await supabaseRequest('/teams', 'POST', teams);
    console.log(`Inserted ${teams.length} teams`);

    // Fetch inserted teams to get their IDs for aliases
    const inserted = await fetch(`${SUPABASE_URL}/rest/v1/teams?league=eq.NCAAF&select=id,espn_abbr`, {
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    }).then(r => r.json());

    const idMap = {};
    for (const t of inserted) idMap[t.espn_abbr] = t.id;

    const aliases = [];
    for (const { espnAbbr, aliases: list } of NCAAF_ALIASES) {
        for (const alias of list) {
            aliases.push({ league: 'NCAAF', espn_abbr: espnAbbr, alias });
        }
    }

    if (aliases.length > 0) {
        await supabaseRequest('/team_aliases?on_conflict=league,espn_abbr,alias', 'POST', aliases);
        console.log(`Inserted ${aliases.length} aliases`);
    }

    console.log('Done.');
}

run().catch(console.error);
