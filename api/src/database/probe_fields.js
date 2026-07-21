'use strict';
require('dotenv').config({ path: 'api/.env' });
const mongoose = require('mongoose');
const User = require('./models/user.model');

mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI).then(async () => {
  console.log('\n🔬 DB FIELD REALITY PROBE\n');

  const total = await User.countDocuments();

  // Auth methods
  const withGoogle   = await User.countDocuments({ googleId:   { $exists: true, $ne: null } });
  const withFacebook = await User.countDocuments({ facebookId: { $exists: true, $ne: null } });
  const normal = total - withGoogle - withFacebook;
  console.log('AUTH METHODS:', { total, google: withGoogle, facebook: withFacebook, normal_email: normal });

  // Real symptom data
  const withSymptoms = await User.find({ 'celiacQuestionnaire.symptoms.0': { $exists: true } })
    .select('fullName celiacQuestionnaire profileType').lean();
  console.log('\nUSERS WITH symptoms array filled:', withSymptoms.length, '/', total);
  withSymptoms.forEach(u => {
    console.log(' -', (u.fullName||'?').substring(0,25), '| symp:', JSON.stringify(u.celiacQuestionnaire?.symptoms), '| sev:', u.celiacQuestionnaire?.severity);
  });

  // Severity real
  const withSeverity = await User.find({ 'celiacQuestionnaire.severity': { $exists: true, $ne: '' } })
    .select('celiacQuestionnaire.severity').lean();
  const sevCounts = { mild:0, moderate:0, severe:0 };
  withSeverity.forEach(u => {
    const s = String(u.celiacQuestionnaire?.severity||'').toLowerCase();
    if (s.includes('mild')||s.includes('légère')||s.includes('faible')) sevCounts.mild++;
    else if (s.includes('sev')||s.includes('sévère')||s.includes('forte')) sevCounts.severe++;
    else sevCounts.moderate++;
  });
  console.log('\nSEVERITY real counts:', sevCounts, '| total with severity:', withSeverity.length);

  // Clinical / Family
  const clinic = await User.countDocuments({ 'celiacQuestionnaire.clinicalDiagnosis': true });
  const family = await User.countDocuments({ 'celiacQuestionnaire.familyHistory': true });
  console.log('Clinical confirmed:', clinic, '| Family history:', family);

  // Dietary
  const strict  = await User.countDocuments({ dietaryPreference: 'strict_gluten_free' });
  const reduced = await User.countDocuments({ dietaryPreference: 'gluten_reduced' });
  const seeking = await User.countDocuments({ dietaryPreference: 'seeking_diagnosis' });
  const blankD  = total - strict - reduced - seeking;
  console.log('\nDIET:', { strict, reduced, seeking, blank: blankD });

  // Gender
  const female  = await User.countDocuments({ gender: 'female' });
  const male    = await User.countDocuments({ gender: 'male' });
  const other   = await User.countDocuments({ gender: 'other' });
  const blankG  = total - female - male - other;
  console.log('GENDER:', { female, male, other, blank: blankG });

  // Age
  const usersWithBirth = await User.find({ birthDate: { $ne: null, $exists: true } }).select('birthDate').lean();
  const ages = { '18-25':0, '26-35':0, '36-50':0, '50+':0 };
  const yr = new Date().getFullYear();
  usersWithBirth.forEach(u => {
    const age = yr - new Date(u.birthDate).getFullYear();
    if (age <= 25) ages['18-25']++;
    else if (age <= 35) ages['26-35']++;
    else if (age <= 50) ages['36-50']++;
    else ages['50+']++;
  });
  console.log('AGES (users with birthDate):', ages, '| total with birthdate:', usersWithBirth.length, '| missing:', total - usersWithBirth.length);

  await mongoose.disconnect();
  console.log('\n✅ Done');
}).catch(e => { console.error('ERR', e.message); process.exit(1); });
