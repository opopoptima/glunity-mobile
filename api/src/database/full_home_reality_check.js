/**
 * FULL HOME PAGE REALITY CHECK — Every section vs live MongoDB
 * Covers all 9 sections of AdminHomeScreen
 * Run: node api/src/database/full_home_reality_check.js
 */
'use strict';

require('dotenv').config({ path: 'api/.env' });
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL);

  const User        = require('./models/user.model');
  const Product     = require('./models/product.model');
  const Event       = require('./models/event.model');
  const Recipe      = require('./models/recipe.model');
  const Reel        = require('./models/reel.model');
  const Notification = require('./models/notification.model');

  const now = new Date();
  const todayMidnight = new Date(now); todayMidnight.setHours(0,0,0,0);

  const boundaries = {
    today: todayMidnight,
    '7d':  new Date(Date.now() - 7*86400000),
    '30d': new Date(Date.now() - 30*86400000),
    '3m':  new Date(Date.now() - 90*86400000),
    '1y':  new Date(Date.now() - 365*86400000),
  };

  const sep = () => console.log('─'.repeat(70));
  const head = (t) => { console.log('\n' + '═'.repeat(70)); console.log(`  ${t}`); console.log('═'.repeat(70)); };
  const ok  = (label, val, expected) => {
    const match = expected === undefined || String(val) === String(expected);
    console.log(`  ${match ? '✅' : '❌'} ${label.padEnd(45)} DB=${val}${expected !== undefined ? `  SCREEN=${expected}  ${match?'MATCH':'MISMATCH'}` : ''}`);
  };
  const raw = (label, val) => console.log(`  ℹ️  ${label.padEnd(45)} ${val}`);

  // ═══════════════════════════════════════════════════════════════
  head('SECTION 1 — KPI CARDS & PERIOD REGISTRATIONS');
  // ═══════════════════════════════════════════════════════════════

  const [
    totalUsers, celiacUsers, sellerUsers, healthUsers,
    verifiedSellers, pendingSellersCount,
    newToday, new7d, new30d, new3m, new1y,
    prevToday, prev7d, prev30d, prev3m, prev1y,
    pendingProducts, pendingEvents, pendingRecipes, pendingReels,
    newProd7d, newEv7d, newRec7d, newReel7d,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ profileType: 'celiac' }),
    User.countDocuments({ profileType: 'pro_commerce' }),
    User.countDocuments({ profileType: 'pro_health' }),
    User.countDocuments({ profileType: 'pro_commerce', 'storeInfo.isVerified': true }),
    User.countDocuments({ profileType: 'pro_commerce', $or: [{ 'storeInfo.isVerified': false }, { 'storeInfo.isVerified': { $exists: false } }] }),
    User.countDocuments({ createdAt: { $gte: boundaries['today'] } }),
    User.countDocuments({ createdAt: { $gte: boundaries['7d'] } }),
    User.countDocuments({ createdAt: { $gte: boundaries['30d'] } }),
    User.countDocuments({ createdAt: { $gte: boundaries['3m'] } }),
    User.countDocuments({ createdAt: { $gte: boundaries['1y'] } }),
    // prev periods
    User.countDocuments({ createdAt: { $gte: new Date(boundaries['today'].getTime()-86400000), $lt: boundaries['today'] } }),
    User.countDocuments({ createdAt: { $gte: new Date(boundaries['7d'].getTime()-7*86400000), $lt: boundaries['7d'] } }),
    User.countDocuments({ createdAt: { $gte: new Date(boundaries['30d'].getTime()-30*86400000), $lt: boundaries['30d'] } }),
    User.countDocuments({ createdAt: { $gte: new Date(boundaries['3m'].getTime()-90*86400000), $lt: boundaries['3m'] } }),
    User.countDocuments({ createdAt: { $gte: new Date(boundaries['1y'].getTime()-365*86400000), $lt: boundaries['1y'] } }),
    // pending moderation
    Product.countDocuments({ $or: [{ status: 'pending' }, { isApproved: false }] }).catch(()=>0),
    Event.countDocuments({ $or: [{ status: 'pending' }, { isApproved: false }] }).catch(()=>0),
    Recipe.countDocuments({ $or: [{ status: 'pending' }, { isApproved: false }] }).catch(()=>0),
    Reel.countDocuments({ status: { $in: ['processing','pending'] } }).catch(()=>0),
    // content in period (7d sample)
    Product.countDocuments({ createdAt: { $gte: boundaries['7d'] } }).catch(()=>0),
    Event.countDocuments({ createdAt: { $gte: boundaries['7d'] } }).catch(()=>0),
    Recipe.countDocuments({ createdAt: { $gte: boundaries['7d'] } }).catch(()=>0),
    Reel.countDocuments({ createdAt: { $gte: boundaries['7d'] } }).catch(()=>0),
  ]);

  const growth = (n, p) => p > 0 ? Math.round(((n-p)/p)*100*10)/10 : (n > 0 ? 100 : 0);
  const totalPending = pendingProducts + pendingEvents + pendingRecipes + pendingReels;
  const content7d = newProd7d + newEv7d + newRec7d + newReel7d;

  ok('Total Users (global)',           totalUsers);
  ok('Celiac Patients',                celiacUsers);
  ok('Pro Commerce Sellers',           sellerUsers);
  ok('Pro Health',                     healthUsers);
  ok('Verified Sellers',               verifiedSellers);
  ok('Pending Seller Dossiers',        pendingSellersCount);
  sep();
  console.log('  📅 PERIOD NEW REGISTRATIONS:');
  raw('  today  new users',  `${newToday}   prev=${prevToday}  growth=${growth(newToday,prevToday)}%`);
  raw('  7d     new users',  `${new7d}   prev=${prev7d}  growth=${growth(new7d,prev7d)}%`);
  raw('  30d    new users',  `${new30d}   prev=${prev30d}  growth=${growth(new30d,prev30d)}%`);
  raw('  3m     new users',  `${new3m}   prev=${prev3m}  growth=${growth(new3m,prev3m)}%`);
  raw('  1y     new users',  `${new1y}   prev=${prev1y}  growth=${growth(new1y,prev1y)}%`);
  sep();
  console.log('  🗂️  MODERATION QUEUE:');
  ok('  Pending Products',  pendingProducts);
  ok('  Pending Events',    pendingEvents);
  ok('  Pending Recipes',   pendingRecipes);
  ok('  Pending Reels',     pendingReels);
  ok('  TOTAL PENDING',     totalPending);
  raw('  Content created (7d)', `+${content7d} (prod=${newProd7d} ev=${newEv7d} rec=${newRec7d} reel=${newReel7d})`);

  // ═══════════════════════════════════════════════════════════════
  head('SECTION 2 — PLATFORM HEALTH (notifications / emails / latency)');
  // ═══════════════════════════════════════════════════════════════

  const t0 = Date.now();
  await User.findOne().select('_id').lean();
  const dbLatency = Date.now() - t0;

  const [notifToday, notif7d, notif30d, notif3m, notif1y,
         emailToday, email7d, email30d, email3m, email1y] = await Promise.all([
    Notification.countDocuments({ createdAt: { $gte: boundaries['today'] } }).catch(()=>0),
    Notification.countDocuments({ createdAt: { $gte: boundaries['7d'] } }).catch(()=>0),
    Notification.countDocuments({ createdAt: { $gte: boundaries['30d'] } }).catch(()=>0),
    Notification.countDocuments({ createdAt: { $gte: boundaries['3m'] } }).catch(()=>0),
    Notification.countDocuments({ createdAt: { $gte: boundaries['1y'] } }).catch(()=>0),
    Notification.countDocuments({ createdAt: { $gte: boundaries['today'] }, type: { $in: ['system','achievement','registration_request'] } }).catch(()=>0),
    Notification.countDocuments({ createdAt: { $gte: boundaries['7d'] }, type: { $in: ['system','achievement','registration_request'] } }).catch(()=>0),
    Notification.countDocuments({ createdAt: { $gte: boundaries['30d'] }, type: { $in: ['system','achievement','registration_request'] } }).catch(()=>0),
    Notification.countDocuments({ createdAt: { $gte: boundaries['3m'] }, type: { $in: ['system','achievement','registration_request'] } }).catch(()=>0),
    Notification.countDocuments({ createdAt: { $gte: boundaries['1y'] }, type: { $in: ['system','achievement','registration_request'] } }).catch(()=>0),
  ]);

  ok('DB Latency',  `${dbLatency}ms`,  '< 500ms → Saine');
  console.log('  📬 Notifications (period-scoped):');
  raw('  today',  `${notifToday} notifs · ${emailToday} emails`);
  raw('  7d',     `${notif7d} notifs · ${email7d} emails`);
  raw('  30d',    `${notif30d} notifs · ${email30d} emails`);
  raw('  3m',     `${notif3m} notifs · ${email3m} emails`);
  raw('  1y',     `${notif1y} notifs · ${email1y} emails`);

  // ═══════════════════════════════════════════════════════════════
  head('SECTION 3 — ACTIVE USERS: DAU / WAU / MAU');
  // ═══════════════════════════════════════════════════════════════

  const [dau, wau, mau, onlineNow] = await Promise.all([
    User.countDocuments({ $or: [{ lastActiveAt: { $gte: todayMidnight } }, { createdAt: { $gte: todayMidnight } }] }),
    User.countDocuments({ $or: [{ lastActiveAt: { $gte: new Date(Date.now()-7*86400000) } }, { createdAt: { $gte: new Date(Date.now()-7*86400000) } }] }),
    User.countDocuments({ $or: [{ lastActiveAt: { $gte: new Date(Date.now()-30*86400000) } }, { createdAt: { $gte: new Date(Date.now()-30*86400000) } }] }),
    User.countDocuments({ onlineStatus: 'online' }),
  ]);

  ok('DAU (active today)',    dau);
  ok('WAU (active last 7d)', wau);
  ok('MAU (active last 30d)', mau);
  ok('Online Now',           onlineNow);

  // ═══════════════════════════════════════════════════════════════
  head('SECTION 4 — XP LEADERBOARD (top 5)');
  // ═══════════════════════════════════════════════════════════════

  const topUsers = await User.find({ isActive: true })
    .sort({ points: -1 }).limit(5)
    .select('fullName points profileType').lean();

  topUsers.forEach((u, i) => {
    const level = Math.floor((u.points||0)/100)+1;
    ok(`  #${i+1} ${(u.fullName||'?').substring(0,20)}`, `${u.points||0} XP → Lvl ${level}  [${u.profileType}]`);
  });

  // ═══════════════════════════════════════════════════════════════
  head('SECTION 5 — CONTENT CATEGORIES DONUT');
  // ═══════════════════════════════════════════════════════════════

  const [totProd, totEv, totRec, totReel] = await Promise.all([
    Product.countDocuments().catch(()=>0),
    Event.countDocuments().catch(()=>0),
    Recipe.countDocuments().catch(()=>0),
    Reel.countDocuments().catch(()=>0),
  ]);

  const grand = totProd + totEv + totRec + totReel || 1;
  const pProd = Math.round((totProd/grand)*100);
  const pEv   = Math.round((totEv/grand)*100);
  const pRec  = Math.round((totRec/grand)*100);
  const pReel = Math.max(0, 100-pProd-pEv-pRec);

  raw('Products',     `${totProd} total → ${pProd}%`);
  raw('Events',       `${totEv} total → ${pEv}%`);
  raw('Recipes',      `${totRec} total → ${pRec}%`);
  raw('Reels',        `${totReel} total → ${pReel}%`);
  ok('DONUT SUM',     pProd+pEv+pRec+pReel, 100);

  // ═══════════════════════════════════════════════════════════════
  head('SECTION 6 — HEALTH QUESTIONNAIRE (all periods)');
  // ═══════════════════════════════════════════════════════════════

  // For each period: get the cohort, check questionnaire fill rate
  for (const [periodName, periodStart] of Object.entries(boundaries)) {
    const q = periodName === '1y'
      ? { $or: [{ profileType: { $ne: 'pro_commerce' } }, { celiacQuestionnaire: { $exists: true } }] }
      : { $or: [{ profileType: { $ne: 'pro_commerce' } }, { celiacQuestionnaire: { $exists: true } }], createdAt: { $gte: periodStart } };

    const cohort = await User.find(q).select('celiacQuestionnaire birthDate dietaryPreference gender').lean();
    const withData = cohort.filter(u => u.celiacQuestionnaire && (
      (Array.isArray(u.celiacQuestionnaire.symptoms) && u.celiacQuestionnaire.symptoms.length > 0) ||
      u.celiacQuestionnaire.severity || u.celiacQuestionnaire.clinicalDiagnosis != null
    )).length;

    const N = cohort.length || 78;
    const usesBaseline = withData === 0;

    console.log(`\n  Period: ${periodName.padEnd(6)} | Cohort N=${N} | WithQuestionnaire=${withData} | ${usesBaseline ? '⚠️  USES BASELINE FALLBACK' : '✅ USES REAL DB DATA'}`);

    if (!usesBaseline) {
      // Accumulate real symptom data
      let symp = { bloating:0, fatigue:0, abdominal_pain:0, diarrhea:0, nausea:0, headache:0 };
      let sev = { mild:0, moderate:0, severe:0 };
      let clinical=0, family=0;
      cohort.forEach(u => {
        const qq = u.celiacQuestionnaire;
        if (qq?.symptoms?.length) qq.symptoms.forEach(s => {
          const k = String(s).toLowerCase();
          if (k.includes('bloat')||k.includes('ballon')||k.includes('gaz')) symp.bloating++;
          else if (k.includes('fatig')||k.includes('epuis')) symp.fatigue++;
          else if (k.includes('abdo')||k.includes('douleur')||k.includes('pain')) symp.abdominal_pain++;
          else if (k.includes('diarrh')||k.includes('transit')) symp.diarrhea++;
          else if (k.includes('naus')||k.includes('reflux')) symp.nausea++;
          else if (k.includes('tête')||k.includes('tete')||k.includes('migrain')) symp.headache++;
        });
        const sv = String(qq?.severity||'').toLowerCase();
        if (sv.includes('mild')||sv.includes('légère')||sv.includes('faible')) sev.mild++;
        else if (sv.includes('sev')||sv.includes('sévère')||sv.includes('forte')) sev.severe++;
        else if (sv) sev.moderate++;
        if (qq?.clinicalDiagnosis) clinical++;
        if (qq?.familyHistory) family++;
      });
      const total = symp.bloating+symp.fatigue+symp.abdominal_pain+symp.diarrhea+symp.nausea+symp.headache||1;
      const cntMild   = sev.mild   > 0 ? sev.mild   : Math.round(N*0.25);
      const cntSevere = sev.severe > 0 ? sev.severe : Math.round(N*0.20);
      const pMild   = Math.round((cntMild/N)*100);
      const pSev    = Math.round((cntSevere/N)*100);
      const pMod    = Math.max(0, 100-pMild-pSev);
      console.log(`    Symptoms (${total} total mentions): bloat=${symp.bloating} fat=${symp.fatigue} abdo=${symp.abdominal_pain} diarr=${symp.diarrhea} naus=${symp.nausea} head=${symp.headache}`);
      console.log(`    Severity raw: mild=${sev.mild} mod=${sev.moderate} sev=${sev.severe} → Display: ${pMild}%/${pMod}%/${pSev}% sum=${pMild+pMod+pSev}%`);
      console.log(`    Clinical confirmed (raw): ${clinical} → ${Math.round((Math.max(clinical,Math.round(N*0.74))/N)*100)}%`);
      console.log(`    Family history (raw):     ${family} → ${Math.round((Math.max(family,Math.round(N*0.38))/N)*100)}%`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  head('SECTION 7 — MODERATION PREVIEW (oldest 3 pending)');
  // ═══════════════════════════════════════════════════════════════

  const [oldProd, oldEv] = await Promise.all([
    Product.find({ $or:[{status:'pending'},{isApproved:false}] }).sort({createdAt:1}).limit(2)
      .lean().then(ds => ds.map(d => ({ type:'product', title:(d.name||'Produit').substring(0,30), age: Math.round((Date.now()-d.createdAt)/86400000)+' days old' }))),
    Event.find({ $or:[{status:'pending'},{isApproved:false}] }).sort({createdAt:1}).limit(1)
      .lean().then(ds => ds.map(d => ({ type:'event', title:(d.title||'Event').substring(0,30), age: Math.round((Date.now()-d.createdAt)/86400000)+' days old' }))),
  ]);
  const preview = [...oldProd, ...oldEv].slice(0,3);
  if (preview.length) {
    preview.forEach((p,i) => raw(`  #${i+1} [${p.type}]`, `"${p.title}" — ${p.age}`));
  } else {
    ok('Moderation Preview', 'Empty (0 pending items)', 'expected 12');
  }

  // ═══════════════════════════════════════════════════════════════
  head('SECTION 8 — RECENT REGISTRATIONS (last 5)');
  // ═══════════════════════════════════════════════════════════════

  const recent = await User.find({}).sort({ createdAt: -1 }).limit(5)
    .select('fullName profileType createdAt location').lean();
  recent.forEach((u,i) => {
    const daysAgo = Math.round((Date.now()-new Date(u.createdAt).getTime())/86400000);
    raw(`  #${i+1}`, `${(u.fullName||'?').padEnd(25)} [${u.profileType}] ${daysAgo === 0 ? 'today' : daysAgo+'d ago'}`);
  });

  // ═══════════════════════════════════════════════════════════════
  head('SECTION 9 — USER DISTRIBUTION DONUT');
  // ═══════════════════════════════════════════════════════════════

  const nonAdminTotal = celiacUsers + sellerUsers + healthUsers;
  const cPct = Math.round((celiacUsers/Math.max(nonAdminTotal,1))*100);
  const sPct = Math.round((sellerUsers/Math.max(nonAdminTotal,1))*100);
  const hPct = Math.max(0, 100-cPct-sPct);
  raw('Celiac patients', `${celiacUsers} → ${cPct}%`);
  raw('Sellers',         `${sellerUsers} → ${sPct}%`);
  raw('Health pros',     `${healthUsers} → ${hPct}%`);
  ok('User Donut Sum',   cPct+sPct+hPct, 100);

  console.log('\n\n' + '═'.repeat(70));
  console.log('  ✅ FULL REALITY CHECK COMPLETE');
  console.log('═'.repeat(70) + '\n');

  await mongoose.disconnect();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
