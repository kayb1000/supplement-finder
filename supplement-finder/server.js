const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Low, JSONFile } = require('lowdb');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Simple lowdb setup for local JSON storage
const dbFile = path.join(__dirname, 'db', 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

async function initDb(){
  await db.read();
  if(!db.data){
    const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'db', 'seed.json')));
    db.data = { ingredients: seed, savedPlans: [] };
    await db.write();
  }
}
initDb();

// GET ingredients
app.get('/api/ingredients', async (req, res) => {
  await db.read();
  res.json({ ingredients: db.data.ingredients });
});

// POST recommend - basic matching logic
app.post('/api/recommend', async (req, res) => {
  const goals = (req.body.goals || '').toLowerCase();
  if(!goals) return res.status(400).json({ error: 'Provide goals in body.goals' });
  await db.read();
  const keywords = goals.split(/[^a-z0-9]+/).filter(Boolean);
  const scored = db.data.ingredients.map(ing => {
    let relevance = 0;
    for(const k of keywords){
      if(ing.name.toLowerCase().includes(k)) relevance += 3;
      if(ing.primaryUses.join(' ').toLowerCase().includes(k)) relevance += 4;
      if(ing.tags.join(' ').toLowerCase().includes(k)) relevance += 2;
    }
    const score = relevance * ing.evidenceRating + (ing.trendScore || 0) * 0.1;
    return {...ing, score};
  });
  scored.sort((a,b) => b.score - a.score);
  const top = scored.slice(0,6).map(r => ({
    id: r.id, name: r.name, dose: r.doseRange, evidenceRating: r.evidenceRating, mechanism: r.mechanism, sideEffects: r.sideEffects, pubmed: r.pubmed, rationale: `${r.name} is commonly used for ${r.primaryUses.join(', ')}.`, confidence: Math.min(95, Math.round(r.score))
  }));
  const names = top.map(t => t.name);
  const stackSuggestions = [];
  if(names.includes('L-Theanine') && names.includes('Caffeine')){
    stackSuggestions.push({ title: 'L-Theanine + Caffeine', reason: 'Smooth energy + reduced jitter', evidence: 4 });
  }
  res.json({ recommendations: top, stackSuggestions, warnings: [] });
});

// POST save-plan (saves to local DB and writes file). In production integrate SendGrid.
app.post('/api/save-plan', async (req, res) => {
  const { userEmail, recommendations, meta } = req.body;
  if(!userEmail || !recommendations) return res.status(400).json({ error: 'userEmail and recommendations required' });
  await db.read();
  const id = 'plan_' + Date.now();
  const item = { id, userEmail, recommendations, meta: meta||{}, createdAt: new Date().toISOString() };
  db.data.savedPlans.push(item);
  await db.write();
  // write a small file for download (simple JSON)
  const outPath = path.join(__dirname, 'db', 'saved', id + '.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(item, null, 2));
  res.json({ success: true, id });
});

// Serve frontend index
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server listening on port', port));
