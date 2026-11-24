// Data for the /farmmind showcase. Product wording is FarmMind's own, from farmmind.org (checked 2026-11-23).
// Every image is a self-hosted copy under public/farmmind/; the only outside request the page makes is the
// YouTube iframe after a click. farmmind.test.mjs checks the paths, ids, links and banned words.

const FM = 'https://farmmind.org';

export const SITE = {
  home: `${FM}/`,
  appStore: 'https://apps.apple.com/us/app/farmmind/id6737871963',
  googlePlay: 'https://play.google.com/store/apps/details?id=ai.farmsmart.farmsmart',
  demo: 'https://calendly.com/ai-farm-smart/30min-intro-demo',
  youtube: 'https://www.youtube.com/@FarmMind_platform',
  spotlight: `${FM}/blogs/intern-spotlight-jack-schliewe/`,
  tutorials: `${FM}/tutorials/`,
  logo: '/farmmind/logo-128.png',
};

// Quoted from https://farmmind.org/ (title, meta description and the acreage counter).
export const PITCH = {
  headline: 'Save Time and Money with Agricultural Intelligence',
  description: 'FarmMind helps growers and ag professionals analyze fields, optimize inputs, and make smarter decisions with AI-driven agronomy and geospatial intelligence.',
  stat: '1,153,477 acres actively supported by FarmMind',
  statAsOf: '2026-11-23',
  source: `${FM}/`,
};

// Tour screenshots from each live /feature/ page: laptop 1040x700 (w, h), phone 390x844 (pw, ph).
// Captions are the tour's own step titles (caption) and lines (detail).
const steps = (key, list) => list.map(([caption, detail], i) => ({
  caption, detail,
  laptop: `/farmmind/tours/${key}/${i}-laptop.webp`, w: 1040, h: 700,
  phone: `/farmmind/tours/${key}/${i}-phone.webp`, pw: 390, ph: 844,
}));

const feature = (key, name, headline, line, tutorial, list) =>
  ({ key, name, headline, line, href: `${FM}/feature/${key}/`, tutorial: `${FM}/tutorials/${tutorial}/`, steps: steps(key, list) });

export const FEATURES = [
  feature('maps', 'Field Mapping', 'Every field, one map.',
    'Draw or import your boundaries, tag them however you sort your work, and change hundreds at once.', 'maps', [
      ['Every field on one map', 'Tap a field for its crop, variety, stage, acreage, and records.'],
      ['Color by anything', 'Fill by crop, stage, irrigation type, or task status. Swap the basemap.'],
      ['Draw a boundary', 'Click the corners, or walk it with your phone in your pocket.'],
      ['Select many, change once', 'The Master Field List and batch actions update tags, stages, and notes across fields.'],
    ]),
  feature('chat', 'Virtual Ag Expert', 'Ask. Then open the source.',
    "FarmMind's research assistant answers from extension research, EPA labels, and your own field records, and it cites every source so you can check it yourself.", 'chat', [
      ['Ask it like you’d ask an agronomist', 'It searches the labels and Louisiana sources before it answers.'],
      ['Open the source', 'Every claim carries a tag. Tap one and read the document yourself.'],
      ['Ask about one of your fields', 'Field weather, the soil survey, and your own notes all go into the answer.'],
      ['Hand it a job', 'Change a tag, create a note, add a cost, or jump to a screen.'],
    ]),
  feature('weed-insect-fungus-id', 'Weed, Insect & Fungus ID', 'Snap a photo, find out what it is.',
    'Take a picture, get the name and how sure the assistant is, then ask what to do about it in the same conversation.', 'chat/identifications', [
      ['Start from any chat', 'Tap “Identify a bug, plant, or disease”, or attach a photo to a conversation.'],
      ['Take the photo', 'Pick the shot from your camera roll or take a new one.'],
      ['Read the species card', 'Name, confidence, reasoning, reference photos, and the other possibilities.'],
      ['Ask what to do about it', 'The follow-up is answered with citations, in the same conversation.'],
    ]),
  feature('data-analyzer', 'Data Analyzer', 'From samples to prescriptions.',
    'Drop points on a field, upload a CSV, or open a soil test, and turn it into a heat map, a time series, or a variable-rate map your equipment can drive.', 'data-analyzer', [
      ['Sample points on the field', 'Open the soil test or drop points as you walk. Each one carries its values.'],
      ['A heat map from the points', 'IDW or Kriging fills the gaps, clipped to the field boundary.'],
      ['Zones from every layer', 'K-means groups the field by P and K at once. Each zone gets a rate.'],
      ['Export the prescription', 'A Shapefile zipped as an .RX file for the controller, or a PDF for the grower.'],
    ]),
  feature('automated-documentation', 'Document Management', 'Every record, tied to its field.',
    'Field notes, recommendations, application records, map documents, and soil tests, written once, filed by field, and ready to export when someone asks for them.', 'documents', [
      ['Every record tied to its field', 'Notes, recommendations, application records, map documents, and soil tests in one list.'],
      ['A scouting note from the crew', 'Who wrote it, when, where, and what they counted.'],
      ['A recommendation with rates from the label', 'Products and rates pulled from the label, with REI and PHI to check.'],
      ['Export the application record', 'Weather at the time of application is on it. Out it goes as a PDF.'],
      ['Old paperwork, readable', 'Scan the shop binder. Handwritten pages become searchable notes.'],
    ]),
  feature('field-dashboards', 'Field Dashboards', 'See which fields are doing what.',
    'One field for one season, every field at once, or a leaderboard that ranks them. Yield, weather, growth, soil, and your notes on the same screen.', 'dashboards', [
      ['One field, one season', 'Yield, weather, growth, soil, and notes for a field, on one screen.'],
      ['All your fields at once', 'The same widgets across the whole operation.'],
      ['Rank them', 'The leaderboard sorts fields by yield per acre, target vs. actual, or acres.'],
      ['Pick the window', 'Last 30 days, year to date, last year, or your own range.'],
    ]),
  feature('weather-and-irrigation', 'Weather & Irrigation', 'Conditions at the field, not the county.',
    "Each field is sampled where it sits, so the rain total is that field's, not the airport's forty miles away. Irrigation systems and events live on the same page.", 'weather', [
      ['Weather at the field, not the county', 'Current conditions, hourly, and 15 days out, sampled at the field itself.'],
      ['Soil temperature and moisture', 'At 1, 4, and 10 inches, so you know when ground is ready.'],
      ['Which field got the rain?', 'Compare mode puts your fields side by side on one variable.'],
      ['Irrigation systems and events', 'Pivots, furrow sets, and flood, with every event logged.'],
    ]),
  feature('team-tools', 'Team Tools & API', 'One workspace, your rules.',
    'An organization puts the whole team on the same fields, documents, and dashboards, and the owner decides who can read or write what, per resource and per grower.', 'organizations', [
      ['Share a field with a grower', 'Read and write, set per resource. Nothing is shared by default.'],
      ['Set each member’s access', 'Premium for the people making decisions, Non-Premium for the crew who map and log.'],
      ['See what partners shared', 'Documents from other organizations show up under Partners.'],
      ['Notes from the crew', 'A scout logs the count. You read it before you write the rec.'],
    ]),
];

// Titles and authors from YouTube's oEmbed (2026-11-23). Posters are YouTube's thumbnails, self-hosted.
const video = (id, title, group, author = 'FarmMind') => ({ id, title, author, poster: `/farmmind/yt/${id}.jpg`, group });

export const VIDEOS = [
  video('eFRtjjacYMg', 'New in FarmMind: Live Translate — Voice to Voice Translation That Works Offline', 'translation'),
  video('qJsXR27OKBc', "The LSU Senior Who Built FarmMind's Live Voice Translation", 'translation'),
  video('u3jk7vlvQ8Q', 'No Switch to Flip, Select Mode Is Gone in FarmMind. Just Tap a Field.', 'new'),
  video('n2D-a5lcLxw', 'New in FarmMind: Put Your Field Labels Where You Want Them', 'new'),
  video('V3X8rg069GI', 'New in FarmMind: Use Your Own Acres', 'new'),
  video('-O9mSO-40Ok', 'New in FarmMind: A QR Code for Any Document', 'new'),
  video('X-K5DF217oM', 'New in FarmMind: The Asset Manager, Rebuilt', 'new'),
  video('oY4d4ZVUQcs', 'A Cleaner Map in FarmMind, and Where Everything Went', 'new'),
  video('6B8qKscBpNw', 'New in FarmMind: A Field Filter That Reads Like a Sentence', 'new'),
  video('3_7w8yu5J8s', 'New in FarmMind: Crop Is Now a Tag Like Any Other', 'new'),
  video('3UXPgb7YiZo', 'Put a QR Label on It: One Scan Opens the Asset | New in FarmMind', 'new'),
  video('HKHVHp5vAJA', 'FarmSmarter AI Brings Modern Tech to Louisiana Fields', 'press', 'This Week in Louisiana Agriculture'),
  video('Fi2lz7hYVBk', 'Students behind "FarmSmart" hope to use artificial intelligence as accessible intelligence', 'press', 'LSU Tiger TV'),
];

// "What was built": only claims with a public source or already on the site, without numbers.
export const BUILT = [
  {
    key: 'translation',
    title: 'Live Voice Translation and On-Device Speech-to-Text',
    body: "Built FarmMind's Live Voice Translation, which carries a real-time conversation between English and Spanish, and the on-device speech-to-text behind Offline Transcription and Offline Language Packs. Live translation runs over a connection, and the downloadable language packs let the phone transcribe and translate with no signal.",
    links: [{ label: "Read FarmMind's Spotlight", href: SITE.spotlight }],
    videos: ['eFRtjjacYMg', 'qJsXR27OKBc'],
  },
  {
    key: 'autodraw',
    title: 'Field Auto-Draw',
    body: 'Built field Auto-Draw with MobileSAM in the FarmMind web and mobile apps, released in version 3.1.13 as "Auto-Draw fields from satellite imagery". The demo above runs the same kind of model in the browser on public USDA aerial imagery.',
    links: [{ label: 'Try the Demo', href: '#autodraw' }, { label: 'Release Notes', href: SITE.appStore }],
    videos: [],
  },
  {
    key: 'farmer-ai',
    title: 'The Harness Behind Farmer AI',
    body: "Built the harness behind Farmer AI, FarmMind's in-app assistant, with tracing and evals on LangChain, Langfuse and DSPy.",
    links: [{ label: 'Farmer AI Tutorials', href: `${FM}/tutorials/farmer-ai/` }],
    videos: [],
  },
  {
    key: 'support',
    title: 'Remote Support for the App',
    body: 'Built remote support sessions for the FarmMind app, so a user can get help from the FarmMind team without leaving it.',
    links: [],
    videos: [],
  },
  {
    key: 'security',
    title: 'Security Testing',
    body: 'Tests the FarmMind web, iOS and Android apps for security with Burp Suite, ZAP, Invicti and Wapiti.',
    links: [],
    videos: [],
  },
  {
    key: 'flutter',
    title: 'Flutter App Work',
    body: 'Worked on the Flutter app, making local caching faster and keeping map and field state cleaner across the GIS screens.',
    links: [],
    videos: [],
  },
];

// Newest first. Links checked 2026-11-23 (all 200). The Silicon Bayou and Nexus links are the corrected ones;
// FarmMind's own list points the first at the wrong video and the second at a dead page.
const P = (date, title, source, url, slug, video = null) => ({ date, title, source, url, image: `/farmmind/press/${slug}.jpg`, video });

export const PRESS = [
  P('2026-09-16', 'Farmers prepare for harvest with new technology, safety training', 'The Daily Iberian',
    'https://thedailyiberian.com/2026/09/16/farmers-prepare-for-harvest-with-new-technology-safety-training/', 'daily-iberian'),
  P('2026-08-13', 'A college class on AI became the foundation for this million-acre Louisiana agtech platform', 'Technical.ly',
    'https://technical.ly/workforce/lsu-spinout-farmmind-scales-ai-for-agriculture-how-i-got-here/', 'technically'),
  P('2026-01-12', 'FarmMind Wins $100K in Ag Innovation Challenge', 'American Farm Bureau Federation',
    'https://www.fb.org/news-release/farmmind-wins-100k-in-ag-innovation-challenge', 'afbf-100k'),
  P('2025-09-19', 'LSU CSE Hosts Inaugural Gala Honoring Technology Leaders', 'LSU College of Engineering',
    'https://www.lsu.edu/eng/news-stories/2025/09/lsu_cse_hosts_inaugural_gala_honoring_technology_leaders.php', 'silicon-bayou'),
  P('2025-09-19', 'FarmSmarter AI Brings Modern Tech to Louisiana Fields', 'This Week in Louisiana Agriculture',
    'https://www.youtube.com/watch?v=HKHVHp5vAJA', 'twila', 'HKHVHp5vAJA'),
  P('2025-08-05', 'Farm Bureau Announces Top 10 in Ag Innovation Challenge', 'American Farm Bureau Federation',
    'https://www.fb.org/news-release/farm-bureau-announces-top-10-in-ag-innovation-challenge', 'afbf-top-10'),
  P('2025-06-19', 'FarmSmarter.AI Wins Top Prize in Nexus Technology Cup College Track Finals', 'Nexus Louisiana',
    'https://www.nexusla.org/articles/farmsmarter-ai-wins-top-prize-in-nexus-technology-cup-college-track-finals', 'nexus-cup'),
  P('2025-05-20', 'Homegrown Team Finds Startup Success Supported by LSU Resources', 'LSU E. J. Ourso College of Business',
    'https://www.lsu.edu/business/news/2025/5/homegrown-team-finds-startup-success-with-lsu-resources-may-2025.php', 'lsu-homegrown'),
  P('2025-04-10', 'ULM hosts Pelican Cup Final: FarmSmarter.AI wins top prize', 'KNOE 8 News',
    'https://www.knoe.com/video/2025/04/10/ulm-hosts-pelican-cup-final-farmsmarterai-wins-top-prize/', 'knoe-pelican-cup'),
  P('2025-04-02', 'This Baton Rouge startup is bringing AI to the farm field', 'Baton Rouge Business Report',
    'https://www.businessreport.com/business/this-baton-rouge-startup-is-bringing-ai-to-the-farm-field/', 'br-business-report'),
  P('2024-11-15', 'Students behind "FarmSmart" hope to use artificial intelligence as accessible intelligence', 'LSU Tiger TV',
    'https://www.youtube.com/watch?v=Fi2lz7hYVBk', 'tiger-tv', 'Fi2lz7hYVBk'),
  P('2024-10-31', 'LSU Students, Alumnus Launch AI App to Simplify Agricultural Research for Farmers', 'Louisiana Farm Bureau News',
    'https://lafarmbureaunews.com/news/2024/10/31/lsu-students-alumnus-launch-ai-app-to-simplify-agricultural-research-for-farmers', 'la-farm-bureau-news'),
  P('2024-10-15', "LSU Student Team's FarmSmart App Helps Farmers Manage Crops, Weeds With AI", 'LSU Media Center',
    'https://www.lsu.edu/mediacenter/news/2024/10/15-farmsmart-ai.php', 'lsu-media-center'),
  P('2024-04-15', 'AI-Powered Platform for Farmers, Gardeners wins 2024 J Terrell Brown Venture Challenge', 'LSU E. J. Ourso College of Business',
    'https://www.lsu.edu/business/news/2024/4/ai-powered-platform-for-farmers-gardeners-wins-2024-j-terrell-brown-venture-challenge-2024.php', 'venture-challenge'),
];

// All 109 farmmind.org tutorials by section. An empty slug is the section's index page.
const T = {
  'getting-started': ['', 'Getting Started with FarmMind', 'account-setup', 'Account Setup', 'mobile-vs-desktop', 'Mobile vs Desktop', 'next-steps', 'Where to Go Next', 'quickstart', 'The 5-Minute Quickstart'],
  maps: ['', 'Maps - Field Management', 'address-search', 'Address Search', 'asset-markers', 'Asset Markers', 'basemaps-and-overlays', 'Basemaps & Overlays', 'batch-updates', 'Multi Select & Batch Updates', 'coloring', 'Coloring Fields', 'document-markers', 'Document Markers', 'drawing-fields', 'Drawing Fields', 'exporting', 'Exporting Maps & Fields', 'field-details-panel', 'Field Details Panel', 'field-history', 'Field History', 'filtering', 'Filtering Fields', 'home-bases', 'Home Bases', 'importing-fields', 'Importing Fields', 'managing-tags', 'Managing Tags', 'map-markups', 'Map Markups', 'master-field-list', 'Master Field List', 'measurement', 'Measurement', 'settings', 'Map Settings', 'sharing', 'Sharing Fields', 'soil-test-grids', 'Soil Test Grids', 'zones', 'Zones'],
  chat: ['', 'Research & Chat', 'attachments', 'Attaching Documents & Photos', 'chat-history', 'Chat History in Research & Chat', 'citations', 'Citations in Research & Chat', 'data-context', 'How Research & Chat Understands Your Data', 'export', 'Exporting a Chat', 'fields-and-locations', 'Fields & Locations in Research & Chat', 'identifications', 'Inline Identifications', 'memory', 'Memory in Research & Chat'],
  'farmer-ai': ['', 'Farmer AI', 'actions', 'Farmer AI Actions', 'knowledge', 'Farmer AI Knowledge'],
  'data-analyzer': ['', 'Data Analyzer', 'creating-a-visualization', 'Home & Starting a Visualization', 'equation-builder', 'Equation Builder', 'exports-and-sharing', 'Exports & Sharing', 'layers', 'Layers, Color Ranges & Legends', 'sample-points-and-heat-maps', 'Sample Points & Heat Maps', 'snapshots-and-timeline', 'Snapshots & Timeline', 'variable-rate-fertilizer', 'VR Fertilizer', 'variable-rate-maps', 'VR Zones'],
  documents: ['', 'Documents Management', 'batch-export', 'Batch Export Mode', 'batch-export/blocks', 'Block Reference (Batch Export)', 'batch-export/documents-mode', 'Documents Mode (Batch Export)', 'batch-export/report-mode', 'Report Mode (Batch Export)', 'batch-export/table-mode', 'Table Mode (List Export)', 'creating-a-document', 'Creating a Document', 'custom-documents', 'Custom Documents', 'custom-documents/designing-templates', 'Designing Custom Document Templates', 'custom-documents/using-templates', 'Using Custom Document Templates', 'exporting', 'Individual Export', 'field-notes', 'Field Notes', 'field-notes/creating-field-notes', 'Creating Field Notes', 'field-notes/export', 'Exporting Field Notes', 'field-notes/importing-from-anything', 'Importing Field Notes From Anything', 'field-notes/templates', 'Field Note Templates', 'folder-trees', 'Folder Trees', 'map-documents', 'Map Documents', 'map-documents/creating-a-map-document', 'Creating a Map Document', 'map-documents/re-exporting', 'Re-Exporting a Map Document', 'pesticide-application-reports', 'Pesticide Application Reports', 'pesticide-application-reports/rate-lookup-tool', 'Rate Lookup Tool', 'pesticide-application-reports/report-creation', 'Creating a Pesticide Application Report', 'reading-vs-editing', 'Reading vs Editing', 'recommendations', 'Recommendations', 'recommendations/creating-recommendations', 'Creating Recommendations', 'recommendations/rate-lookup-tool', 'Rate Lookup Tool', 'searching-documents', 'Searching Documents', 'sharing', 'Sharing Documents', 'smart-folders', 'Smart Folders', 'soil-tests', 'Soil Tests'],
  dashboards: ['', 'Dashboards', 'creating-dashboards', 'Creating Dashboards', 'season-dashboards', 'Filters & Date Ranges', 'sharing-dashboards', 'Sharing Dashboards', 'widgets', 'Tile Reference'],
  weather: ['', 'Weather', 'field-weather-comparison', 'Compare Mode', 'seeing-weather', 'Conditions Mode', 'trends-and-calendar', 'Trends & Calendar'],
  irrigation: ['', 'Irrigation Management', 'adding-irrigation-events', 'Adding Irrigation Events', 'creating-an-irrigation-system', 'Creating an Irrigation System', 'favorites-and-filters', 'Favorites & Filters', 'mapping-irrigation-networks', 'Mapping Irrigation Networks'],
  organizations: ['', 'Organizations & Team Collaboration', 'creating-an-organization', 'Creating an Organization', 'inviting-members', 'Inviting Members', 'organization-vs-private-mode', 'Organization vs Private Mode', 'sharing-resources', 'Sharing Resources'],
  calendar: ['', 'Calendar & Tasks', 'adding-tasks', 'Adding Tasks', 'board-view', 'Board View', 'filters-and-views', 'Filters & Views'],
  'asset-inventory': ['', 'Asset Inventory', 'adding-assets', 'Adding Assets', 'barcode-scanning', 'Barcode Scanning', 'import-export', 'Import & Export', 'inventory-management', 'Inventory Management', 'livestock', 'Livestock'],
  'farm-finances': ['', 'Farm Finances'],
};

// { section: { title, url, items: [{ title, url }] } }; items include the index page, so they total 109.
export const TUTORIALS = Object.fromEntries(Object.entries(T).map(([section, flat]) => {
  const items = [];
  for (let i = 0; i < flat.length; i += 2) items.push({ title: flat[i + 1], url: `${FM}/tutorials/${section}/${flat[i] ? `${flat[i]}/` : ''}` });
  return [section, { title: items[0].title, url: items[0].url, items }];
}));
