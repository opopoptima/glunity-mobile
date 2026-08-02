'use strict';

const User = require('../../../database/models/user.model');
const Product = require('../../../database/models/product.model');
const Event = require('../../../database/models/event.model');
const Recipe = require('../../../database/models/recipe.model');
const Reel = require('../../../database/models/reel.model');
const Notification = require('../../../database/models/notification.model');
const ShopModeration = require('../../../database/models/shop-moderation.model');
const ModerationHistory = require('../../../database/models/moderation-history.model');

class AdminService {
  /**
   * Get real-time dashboard analytics from MongoDB Atlas collections
   * @param {string} period '7d' | '30d' | '3m' | '1y'
   */
  async getDashboardStats(period = '7d') {
    const now = new Date();
    let periodStart, prevPeriodStart, periodLabel;
    
    if (period === 'today') {
      periodStart = new Date(now);
      periodStart.setHours(0, 0, 0, 0);
      
      prevPeriodStart = new Date(periodStart);
      prevPeriodStart.setDate(prevPeriodStart.getDate() - 1);
      
      periodLabel = "aujourd'hui";
    } else {
      const daysOffset = period === '30d' ? 30 : period === '3m' ? 90 : period === '1y' ? 365 : 7;
      periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - daysOffset);

      prevPeriodStart = new Date(periodStart);
      prevPeriodStart.setDate(prevPeriodStart.getDate() - daysOffset);

      const periodLabels = {
        '7d': '7 derniers jours',
        '30d': '30 derniers jours',
        '3m': '3 derniers mois',
        '1y': '12 derniers mois',
      };
      periodLabel = periodLabels[period] || '7 derniers jours';
    }

    // 1. Run all base aggregate counts in parallel
    const [
      totalUsers,
      celiacUsers,
      sellerUsers,
      healthUsers,
      verifiedSellers,
      pendingSellersCount,
      pendingProducts,
      pendingEvents,
      pendingRecipes,
      pendingReels,
      approvedProducts,
      approvedEvents,
      approvedRecipes,
      approvedReels,
      newUsersInPeriod,
      prevUsersInPeriod,
      newProductsInPeriod,
      newEventsInPeriod,
      newRecipesInPeriod,
      newReelsInPeriod,
      totalProductsCount,
      totalEventsCount,
      totalRecipesCount,
      totalReelsCount,
      dau,
      wau,
      mau,
      onlineNow,
      topByXpRaw,
      recentRegistrations,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ profileType: 'celiac' }),
      User.countDocuments({ profileType: 'pro_commerce' }),
      User.countDocuments({ profileType: 'pro_health' }),
      User.countDocuments({ profileType: 'pro_commerce', 'storeInfo.isVerified': true }),
      User.countDocuments({ profileType: 'pro_commerce', $or: [{ 'storeInfo.isVerified': false }, { 'storeInfo.isVerified': { $exists: false } }, { isSellerVerified: false }] }),
      Product.countDocuments({ $or: [{ status: 'pending' }, { isApproved: false }, { isApproved: { $exists: false } }] }).catch(() => 0),
      Event.countDocuments({ $or: [{ status: 'pending' }, { isApproved: false }] }).catch(() => 0),
      Recipe.countDocuments({ $or: [{ status: 'pending' }, { isApproved: false }, { isApproved: { $exists: false } }] }).catch(() => 0),
      Reel.countDocuments({ status: { $in: ['processing', 'pending'] } }).catch(() => 0),
      Product.countDocuments({ $or: [{ status: 'approved' }, { isApproved: true }] }).catch(() => 0),
      Event.countDocuments({ $or: [{ status: 'active' }, { isApproved: true }] }).catch(() => 0),
      Recipe.countDocuments({ isApproved: true }).catch(() => 0),
      Reel.countDocuments({ status: 'ready' }).catch(() => 0),
      User.countDocuments({ createdAt: { $gte: periodStart } }),
      User.countDocuments({ createdAt: { $gte: prevPeriodStart, $lt: periodStart } }),
      Product.countDocuments({ createdAt: { $gte: periodStart } }).catch(() => 0),
      Event.countDocuments({ createdAt: { $gte: periodStart } }).catch(() => 0),
      Recipe.countDocuments({ createdAt: { $gte: periodStart } }).catch(() => 0),
      Reel.countDocuments({ createdAt: { $gte: periodStart } }).catch(() => 0),
      Product.countDocuments().catch(() => 0),
      Event.countDocuments().catch(() => 0),
      Recipe.countDocuments().catch(() => 0),
      Reel.countDocuments().catch(() => 0),
      User.countDocuments({ $or: [{ lastActiveAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } }, { createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } }] }),
      User.countDocuments({ $or: [{ lastActiveAt: { $gte: new Date(Date.now() - 7 * 86400000) } }, { createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } }] }),
      User.countDocuments({ $or: [{ lastActiveAt: { $gte: new Date(Date.now() - 30 * 86400000) } }, { createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } }] }),
      User.countDocuments({ onlineStatus: 'online' }),
      User.find({ isActive: true }).sort({ points: -1 }).limit(5).select('_id fullName points avatar profileType').lean(),
      User.find({}).sort({ createdAt: -1 }).limit(5).select('_id fullName profileType location createdAt avatar').lean(),
    ]);

    const totalPendingModeration = pendingProducts + pendingEvents + pendingRecipes + pendingReels;
    const totalApproved = approvedProducts + approvedEvents + approvedRecipes + approvedReels;
    const totalReviewed = totalApproved + totalPendingModeration;
    const approvalRatePercentage = totalReviewed > 0 ? Math.round((totalApproved / totalReviewed) * 100) : null;

    const usersGrowth = prevUsersInPeriod > 0
      ? Math.round(((newUsersInPeriod - prevUsersInPeriod) / prevUsersInPeriod) * 100 * 10) / 10
      : newUsersInPeriod > 0 ? 100 : 0;

    const contentSubmittedInPeriod = newProductsInPeriod + newEventsInPeriod + newRecipesInPeriod + newReelsInPeriod;

    // 2. Parallel Timeline Generation
    let groupingDays = 1;
    let numPointsAct = 7;
    let isTodayView = period === 'today';

    if (isTodayView) {
      numPointsAct = 8; // 8 blocks of 3 hours
    } else {
      groupingDays = period === '1y' ? 30 : period === '3m' ? 7 : period === '30d' ? 3 : 1;
      numPointsAct = period === '1y' ? 12 : period === '3m' ? 12 : period === '30d' ? 10 : 7;
    }

    const activityTimelinePromises = Array.from({ length: numPointsAct }, async (_, i) => {
      let dayStart, dayEnd, label;

      if (isTodayView) {
        dayStart = new Date(periodStart);
        dayStart.setHours(i * 3, 0, 0, 0);
        dayEnd = new Date(periodStart);
        dayEnd.setHours(i * 3 + 2, 59, 59, 999);
        label = `${i * 3}h`;
      } else {
        const idx = numPointsAct - 1 - i;
        dayStart = new Date(now);
        dayStart.setDate(now.getDate() - (idx * groupingDays) - (groupingDays === 1 ? 0 : groupingDays - 1));
        dayStart.setHours(0, 0, 0, 0);

        dayEnd = new Date(now);
        dayEnd.setDate(now.getDate() - (idx * groupingDays));
        dayEnd.setHours(23, 59, 59, 999);

        if (period === '1y') label = dayEnd.toLocaleDateString('fr-FR', { month: 'short' });
        else if (period === '3m') label = `Sem. ${Math.ceil(dayEnd.getDate()/7)}`;
        else if (period === '30d') label = dayEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' });
        else label = dayEnd.toLocaleDateString('fr-FR', { weekday: 'short' });
      }

      const [patientCount, reelCount, eventCount, prodMod, evMod, recMod, reelMod] = await Promise.all([
        User.countDocuments({ profileType: 'celiac', createdAt: { $gte: dayStart, $lte: dayEnd } }),
        Reel.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }).catch(() => 0),
        Event.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }).catch(() => 0),
        Product.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd }, status: { $in: ['approved', 'rejected'] } }).catch(() => 0),
        Event.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd }, status: { $in: ['active', 'rejected'] } }).catch(() => 0),
        Recipe.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd }, status: { $in: ['published', 'rejected'] } }).catch(() => 0),
        Reel.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd }, status: { $in: ['ready', 'rejected'] } }).catch(() => 0),
      ]);

      return {
        day: label,
        patients: patientCount,
        moderations: prodMod + evMod + recMod + reelMod,
        reels: reelCount,
        events: eventCount,
      };
    });

    const activityTimeline = await Promise.all(activityTimelinePromises);

    // 3. Category distribution — residual absorber on last item guarantees Σ = 100%
    const grandTotalContent = totalProductsCount + totalEventsCount + totalRecipesCount + totalReelsCount || 1;
    const _pctProducts = Math.round((totalProductsCount / grandTotalContent) * 100);
    const _pctEvents   = Math.round((totalEventsCount   / grandTotalContent) * 100);
    const _pctRecipes  = Math.round((totalRecipesCount  / grandTotalContent) * 100);
    const _pctReels    = Math.max(0, 100 - _pctProducts - _pctEvents - _pctRecipes);
    const contentCategories = [
      { name: 'Produits & Épicerie', percentage: _pctProducts, color: '#8BC34A' },
      { name: 'Événements',          percentage: _pctEvents,   color: '#3B82F6' },
      { name: 'Recettes Cœliaques',  percentage: _pctRecipes,  color: '#F59E0B' },
      { name: 'Reels Communauté',    percentage: _pctReels,    color: '#EC4899' },
    ];

    const topByXp = topByXpRaw.map(user => ({
      ...user,
      level: Math.floor((user.points || 0) / 100) + 1
    }));

    // 4. Parallel Registrations over time
    let numPoints = 7;
    if (isTodayView) {
      numPoints = 8;
    } else {
      groupingDays = period === '1y' ? 30 : period === '3m' ? 7 : 1;
      numPoints = period === '1y' ? 12 : period === '3m' ? 12 : period === '30d' ? 30 : 7;
    }

    const registrationsPromises = Array.from({ length: numPoints }, async (_, i) => {
      let dStart, dEnd, dateStr;
      
      if (isTodayView) {
        dStart = new Date(periodStart);
        dStart.setHours(i * 3, 0, 0, 0);
        dEnd = new Date(periodStart);
        dEnd.setHours(i * 3 + 2, 59, 59, 999);
        dateStr = `${i * 3}h`;
      } else {
        const idx = numPoints - 1 - i;
        dStart = new Date(now);
        dStart.setDate(now.getDate() - (idx * groupingDays) - groupingDays);
        dStart.setHours(0, 0, 0, 0);
        
        dEnd = new Date(now);
        dEnd.setDate(now.getDate() - (idx * groupingDays));
        dEnd.setHours(23, 59, 59, 999);
        
        if (period === '1y') dateStr = dEnd.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        else dateStr = dEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' });
      }
      
      const count = await User.countDocuments({ createdAt: { $gte: dStart, $lte: dEnd } });
      return { date: dateStr, count };
    });

    const registrationsByDay = await Promise.all(registrationsPromises);

    // 5. System Health & Latency
    const startDbTimer = Date.now();
    await User.findOne().select('_id').lean();
    const dbLatency = Date.now() - startDbTimer;

    const [notificationCount, emailsSent] = await Promise.all([
      Notification.countDocuments({ createdAt: { $gte: periodStart } }).catch(() => 0),
      Notification.countDocuments({ createdAt: { $gte: periodStart }, type: { $in: ['system', 'achievement', 'registration_request'] } }).catch(() => 0),
    ]);

    const platformHealth = {
      notifications: notificationCount,
      emailsSent: emailsSent,
      apiLatency: `${dbLatency}ms`,
      dbStatus: dbLatency < 500 ? 'Saine' : 'Lente'
    };

    // 6. Moderation Preview
    const allPendingRaw = await Promise.all([
      Product.find({ $or: [{ status: 'pending' }, { isApproved: false }] })
        .sort({ createdAt: 1 }).limit(2).lean()
        .then(docs => docs.map(d => ({ _id: d._id.toString(), type: 'product', title: d.name || 'Produit', authorName: d.brand || 'Inconnu', submittedAt: d.createdAt }))),
      Event.find({ $or: [{ status: 'pending' }, { isApproved: false }] })
        .sort({ createdAt: 1 }).limit(1).lean()
        .then(docs => docs.map(d => ({ _id: d._id.toString(), type: 'event', title: d.title || 'Événement', authorName: d.organizer || 'Inconnu', submittedAt: d.createdAt }))),
    ]).catch(() => [[], []]);

    const moderationPreview = [...allPendingRaw[0], ...allPendingRaw[1]].slice(0, 3);

    // 7. Real Clinical Health Insights — ZERO baselines, 100% real DB data
    // Fetch all users with celiac questionnaire data filled (globally, not period-scoped)
    // because health questionnaire is filled post-registration, not at registration time
    const allCeliacUsers = await User.find({
      $or: [
        { 'celiacQuestionnaire.symptoms.0': { $exists: true } },
        { 'celiacQuestionnaire.severity': { $exists: true, $ne: '' } },
        { 'celiacQuestionnaire.clinicalDiagnosis': true },
        { 'celiacQuestionnaire.familyHistory': true },
      ]
    }).select('birthDate gender dietaryPreference celiacQuestionnaire profileType').lean();

    const surveyedN = allCeliacUsers.length; // real respondents only
    const hasInsufficientData = surveyedN < 5; // honest threshold

    const symptomCounts  = { bloating: 0, fatigue: 0, abdominal_pain: 0, diarrhea: 0, nausea: 0, headache: 0 };
    const severityCounts = { mild: 0, moderate: 0, severe: 0 };
    let clinicalCount = 0;
    let familyHistoryCount = 0;
    const ageGroups    = { '18-25': 0, '26-35': 0, '36-50': 0, '50+': 0 };
    const dietaryCounts = { strict_gluten_free: 0, gluten_reduced: 0, seeking_diagnosis: 0 };
    const genderCounts  = { female: 0, male: 0, other: 0 };

    allCeliacUsers.forEach(u => {
      const q = u.celiacQuestionnaire;

      if (q && Array.isArray(q.symptoms) && q.symptoms.length > 0) {
        q.symptoms.forEach(s => {
          const key = String(s).toLowerCase().trim();
          if (key.includes('bloat') || key.includes('ballon') || key.includes('gaz') || key.includes('aerophag')) symptomCounts.bloating++;
          else if (key.includes('fatig') || key.includes('asthen') || key.includes('epuis')) symptomCounts.fatigue++;
          else if (key.includes('abdo') || key.includes('douleur') || key.includes('crampe') || key.includes('pain')) symptomCounts.abdominal_pain++;
          else if (key.includes('diarrh') || key.includes('transit') || key.includes('bowel')) symptomCounts.diarrhea++;
          else if (key.includes('naus') || key.includes('reflux') || key.includes('vomit')) symptomCounts.nausea++;
          else if (key.includes('tête') || key.includes('tete') || key.includes('headache') || key.includes('migrain')) symptomCounts.headache++;
        });
      }

      const sev = String(q?.severity || '').toLowerCase().trim();
      if (sev) {
        if (sev.includes('mild') || sev.includes('légère') || sev.includes('legere') || sev.includes('faible')) severityCounts.mild++;
        else if (sev.includes('sev') || sev.includes('sévère') || sev.includes('severe') || sev.includes('aigue') || sev.includes('forte')) severityCounts.severe++;
        else severityCounts.moderate++;
      }

      if (q?.clinicalDiagnosis === true) clinicalCount++;
      if (q?.familyHistory === true) familyHistoryCount++;

      if (u.birthDate) {
        const age = new Date().getFullYear() - new Date(u.birthDate).getFullYear();
        if (age <= 25) ageGroups['18-25']++;
        else if (age <= 35) ageGroups['26-35']++;
        else if (age <= 50) ageGroups['36-50']++;
        else ageGroups['50+']++;
      }

      const diet = String(u.dietaryPreference || '').toLowerCase();
      if (diet === 'gluten_reduced') dietaryCounts.gluten_reduced++;
      else if (diet === 'seeking_diagnosis') dietaryCounts.seeking_diagnosis++;
      else if (diet === 'strict_gluten_free') dietaryCounts.strict_gluten_free++;

      const g = String(u.gender || '').toLowerCase();
      if (g === 'female') genderCounts.female++;
      else if (g === 'male') genderCounts.male++;
      else if (g === 'other') genderCounts.other++;
    });

    // Compute symptom distribution — real counts only, Σ = 100% via residual absorber
    const totalSymptomMentions = symptomCounts.bloating + symptomCounts.fatigue + symptomCounts.abdominal_pain +
      symptomCounts.diarrhea + symptomCounts.nausea + symptomCounts.headache || 1;

    const safeN = surveyedN || 1;

    const pctBloating  = Math.round((symptomCounts.bloating       / totalSymptomMentions) * 100);
    const pctFatigue   = Math.round((symptomCounts.fatigue         / totalSymptomMentions) * 100);
    const pctAbdominal = Math.round((symptomCounts.abdominal_pain  / totalSymptomMentions) * 100);
    const pctDiarrhea  = Math.round((symptomCounts.diarrhea        / totalSymptomMentions) * 100);
    const pctNausea    = Math.round((symptomCounts.nausea          / totalSymptomMentions) * 100);
    const pctHeadache  = Math.max(0, 100 - pctBloating - pctFatigue - pctAbdominal - pctDiarrhea - pctNausea);

    // Severity Σ = 100% via residual absorber on moderate
    const totalSev = severityCounts.mild + severityCounts.moderate + severityCounts.severe || 1;
    const pctMild     = Math.round((severityCounts.mild   / totalSev) * 100);
    const pctSevere   = Math.round((severityCounts.severe / totalSev) * 100);
    const pctModerate = Math.max(0, 100 - pctMild - pctSevere);

    // Age groups — only users with birthDate count, others shown as "non renseigné"
    const totalWithAge = ageGroups['18-25'] + ageGroups['26-35'] + ageGroups['36-50'] + ageGroups['50+'] || 1;
    const pA1 = Math.round((ageGroups['18-25'] / totalWithAge) * 100);
    const pA3 = Math.round((ageGroups['36-50'] / totalWithAge) * 100);
    const pA4 = Math.round((ageGroups['50+']   / totalWithAge) * 100);
    const pA2 = Math.max(0, 100 - pA1 - pA3 - pA4);

    // Diet — only filled responses count
    const totalDiet = dietaryCounts.strict_gluten_free + dietaryCounts.gluten_reduced + dietaryCounts.seeking_diagnosis || 1;
    const pDS = Math.round((dietaryCounts.strict_gluten_free / totalDiet) * 100);
    const pDR = Math.round((dietaryCounts.gluten_reduced     / totalDiet) * 100);
    const pDK = Math.max(0, 100 - pDS - pDR);

    // Clinical / Family: real percentages out of respondents
    const pctClinical = Math.round((clinicalCount     / safeN) * 100);
    const pctFamily   = Math.round((familyHistoryCount / safeN) * 100);

    const questionnaireStats = {
      totalSurveyed: surveyedN,
      hasInsufficientData,
      isGlobalFallback: false,
      dataSourceLabel: hasInsufficientData
        ? `Données insuffisantes — ${surveyedN} répondant(s) sur ${totalUsers} utilisateurs`
        : `${surveyedN} répondants (données réelles)`,
      symptoms: hasInsufficientData ? [] : [
        { id: 'bloating',      label: 'Ballonnements & Gaz',           count: symptomCounts.bloating,       pct: pctBloating,  prevalencePct: Math.min(100, Math.round((symptomCounts.bloating      / safeN) * 100)), color: '#EF4444' },
        { id: 'fatigue',       label: 'Fatigue Chronique',             count: symptomCounts.fatigue,        pct: pctFatigue,   prevalencePct: Math.min(100, Math.round((symptomCounts.fatigue       / safeN) * 100)), color: '#F59E0B' },
        { id: 'abdominal_pain',label: 'Douleurs Abdominales',          count: symptomCounts.abdominal_pain, pct: pctAbdominal, prevalencePct: Math.min(100, Math.round((symptomCounts.abdominal_pain / safeN) * 100)), color: '#EC4899' },
        { id: 'diarrhea',      label: 'Troubles Transit / Diarrhée',   count: symptomCounts.diarrhea,       pct: pctDiarrhea,  prevalencePct: Math.min(100, Math.round((symptomCounts.diarrhea      / safeN) * 100)), color: '#8B5CF6' },
        { id: 'nausea',        label: 'Nausées & Reflux',              count: symptomCounts.nausea,         pct: pctNausea,    prevalencePct: Math.min(100, Math.round((symptomCounts.nausea        / safeN) * 100)), color: '#3B82F6' },
        { id: 'headache',      label: 'Maux de Tête & Migraines',      count: symptomCounts.headache,       pct: pctHeadache,  prevalencePct: Math.min(100, Math.round((symptomCounts.headache      / safeN) * 100)), color: '#10B981' },
      ],
      severity: {
        mild:     { count: severityCounts.mild,     pct: pctMild },
        moderate: { count: severityCounts.moderate, pct: pctModerate },
        severe:   { count: severityCounts.severe,   pct: pctSevere },
        hasData: totalSev > 1,
      },
      clinicalDiagnosisPct: pctClinical,
      clinicalDiagnosisCount: clinicalCount,
      familyHistoryPct: pctFamily,
      familyHistoryCount,
      ageGroups: [
        { label: '18-25 ans', count: ageGroups['18-25'], pct: pA1 },
        { label: '26-35 ans', count: ageGroups['26-35'], pct: pA2 },
        { label: '36-50 ans', count: ageGroups['36-50'], pct: pA3 },
        { label: '50+ ans',   count: ageGroups['50+'],   pct: pA4 },
      ],
      ageGroupsHasData: (ageGroups['18-25'] + ageGroups['26-35'] + ageGroups['36-50'] + ageGroups['50+']) > 0,
      dietaryPreferences: [
        { id: 'strict_gluten_free', label: 'Régime Sans Gluten Strict',      count: dietaryCounts.strict_gluten_free, pct: pDS },
        { id: 'gluten_reduced',     label: 'Sans Gluten Partiel / Réduit',   count: dietaryCounts.gluten_reduced,     pct: pDR },
        { id: 'seeking_diagnosis',  label: 'En Quête de Diagnostic',         count: dietaryCounts.seeking_diagnosis,  pct: pDK },
      ],
      dietaryHasData: totalDiet > 1,
      gender: {
        female: { count: genderCounts.female, pct: Math.round((genderCounts.female / Math.max(genderCounts.female + genderCounts.male + genderCounts.other, 1)) * 100) },
        male:   { count: genderCounts.male,   pct: Math.round((genderCounts.male   / Math.max(genderCounts.female + genderCounts.male + genderCounts.other, 1)) * 100) },
        other:  { count: genderCounts.other,  pct: Math.max(0, 100 - Math.round((genderCounts.female / Math.max(genderCounts.female + genderCounts.male + genderCounts.other, 1)) * 100) - Math.round((genderCounts.male / Math.max(genderCounts.female + genderCounts.male + genderCounts.other, 1)) * 100)) },
      },
    };

    // 8. Auth Method Breakdown — Google / Facebook / Email (real counts)
    const [googleCount, facebookCount] = await Promise.all([
      User.countDocuments({ googleId:   { $exists: true, $ne: null } }),
      User.countDocuments({ facebookId: { $exists: true, $ne: null } }),
    ]);
    const emailCount = totalUsers - googleCount - facebookCount;
    const authTotal  = totalUsers || 1;
    const pGoogle   = Math.round((googleCount   / authTotal) * 100);
    const pFacebook = Math.round((facebookCount / authTotal) * 100);
    const pEmail    = Math.max(0, 100 - pGoogle - pFacebook);

    const authMethodStats = {
      total: totalUsers,
      email:    { count: emailCount,    pct: pEmail },
      google:   { count: googleCount,   pct: pGoogle },
      facebook: { count: facebookCount, pct: pFacebook },
    };


    return {
      period,
      periodLabel,
      totalUsers,
      newUsersInPeriod,
      contentSubmittedInPeriod,
      usersGrowth,
      verifiedSellers,
      pendingSellersCount,
      approvalRatePercentage,
      pendingModeration: {
        total: totalPendingModeration,
        products: pendingProducts,
        events: pendingEvents,
        recipes: pendingRecipes,
        reels: pendingReels,
      },
      userDistribution: {
        celiac: celiacUsers,
        seller: sellerUsers,
        health: healthUsers,
      },
      activityTimeline,
      contentCategories,
      registrationsByDay,
      activeUsers: { dau, wau, mau },
      onlineNow,
      topByXp,
      recentRegistrations,
      platformHealth,
      moderationPreview,
      questionnaireStats,
      authMethodStats,
    };
  }

  // --- MODERATION ---
  async getModerationItems(type = 'all') {
    let results = [];
    const queries = [];
    
    if (type === 'all' || type === 'products') {
      queries.push(Product.find({ $or: [{ status: 'pending' }, { isApproved: false }, { isApproved: { $exists: false } }] }).lean().then(docs => docs.map(d => ({
        id: d._id.toString(), title: d.name || 'Produit Sans Titre', type: 'product', authorOrSeller: d.brand || 'Inconnu', date: d.createdAt, price: d.price ? `${d.price} €` : undefined
      }))));
    }
    if (type === 'all' || type === 'events') {
      queries.push(Event.find({ $or: [{ status: 'pending' }, { isApproved: false }] }).lean().then(docs => docs.map(d => ({
        id: d._id.toString(), title: d.title || 'Événement', type: 'event', authorOrSeller: d.organizer || 'Inconnu', date: d.createdAt, eventDate: d.date ? d.date.toString() : undefined, location: d.location
      }))));
    }
    if (type === 'all' || type === 'recipes') {
      queries.push(Recipe.find({ $or: [{ status: 'pending' }, { isApproved: false }, { isApproved: { $exists: false } }] }).lean().then(docs => docs.map(d => ({
        id: d._id.toString(), title: d.title || 'Recette', type: 'recipe', authorOrSeller: d.authorName || 'Inconnu', date: d.createdAt
      }))));
    }
    if (type === 'all' || type === 'reels') {
      queries.push(Reel.find({ status: { $in: ['processing', 'pending'] } }).populate('user', 'fullName').lean().then(docs => docs.map(d => ({
        id: d._id.toString(), title: d.caption || 'Reel', type: 'reel', authorOrSeller: d.user?.fullName || 'Inconnu', date: d.createdAt
      }))));
    }

    const arrays = await Promise.all(queries);
    arrays.forEach(arr => { results = results.concat(arr); });
    return results.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  async moderateItem(id, type, action, reason) {
    let model;
    let update = {};
    if (type === 'product') { model = Product; update = action === 'approve' ? { status: 'approved', isApproved: true } : { status: 'rejected' }; }
    else if (type === 'event') { model = Event; update = action === 'approve' ? { status: 'active', isApproved: true } : { status: 'rejected' }; }
    else if (type === 'recipe') { model = Recipe; update = action === 'approve' ? { status: 'published', isApproved: true } : { status: 'rejected' }; }
    else if (type === 'reel') { model = Reel; update = action === 'approve' ? { status: 'ready' } : { status: 'rejected' }; }
    
    if (!model) throw new Error('Type inconnu');
    const item = await model.findByIdAndUpdate(id, update, { new: true });
    
    // Create In-App Notification (Simulate email dispatching as requested in the plan)
    if (item && (item.author || item.user)) {
      const targetUserId = item.author || item.user;
      const msg = action === 'approve'
        ? 'Votre contenu a été approuvé par la modération.'
        : `Votre contenu a été refusé. Motif: ${reason || 'Non conforme'}`;
      await Notification.create({
        recipientId: targetUserId,
        userId: targetUserId,
        type: 'system',
        title: action === 'approve' ? 'Publication validée' : 'Publication refusée',
        body: msg,
        message: msg,
      }).catch(err => console.warn('Failed to dispatch moderation notification:', err.message));
    }
    return item;
  }

  // --- USERS ---
  async getUsers(filter = 'all', search = '') {
    const query = {};
    if (filter === 'suspended') { query.isActive = false; }
    else if (filter !== 'all') { query.profileType = filter; }
    if (search) { query.fullName = { $regex: search, $options: 'i' }; }
    
    const users = await User.find(query).sort({ createdAt: -1 }).lean();
    return users.map(u => ({
      id: u._id.toString(),
      fullName: u.fullName || 'Utilisateur',
      email: u.email,
      profileType: u.profileType,
      status: u.isActive !== false ? 'active' : 'suspended',
      joinedDate: u.createdAt,
      city: u.location || 'Non spécifié',
      points: u.points || 0,
      streakDays: u.streakDays || 0
    }));
  }

  async toggleUserStatus(id, status) {
    const isActive = status === 'active';
    const user = await User.findByIdAndUpdate(id, { isActive }, { new: true });
    
    if (user) {
      const msg = isActive ? 'Votre compte a été réactivé par un administrateur.' : 'Votre compte a été suspendu suite à une infraction aux règles.';
      await Notification.create({
        recipientId: user._id,
        userId: user._id,
        type: 'system',
        title: isActive ? 'Compte Réactivé' : 'Compte Suspendu',
        body: msg,
        message: msg,
      }).catch(err => console.warn('Failed to dispatch notification:', err.message));
    }
    return user;
  }

  // --- SELLERS ---
  async getSellerVerifications() {
    const sellers = await User.find({
      profileType: 'pro_commerce',
      $or: [{ 'storeInfo.isVerified': false }, { 'storeInfo.isVerified': { $exists: false } }, { isSellerVerified: false }],
    }).lean();

    return sellers.map(s => ({
      id: s._id.toString(),
      storeName: s.storeInfo?.name || s.fullName,
      ownerName: s.fullName,
      email: s.email,
      phone: s.phone || 'Non renseigné',
      siret: s.storeInfo?.siret || 'Non renseigné',
      address: s.location || 'Non renseigné',
      certifications: s.storeInfo?.certifications?.join(', ') || 'Aucune',
      documents: s.storeInfo?.documents || [],
      submittedDate: s.createdAt,
    }));
  }

  async processSellerBadge(id, action, remarks) {
    const isVerified = action === 'approve';
    const update = { 'storeInfo.isVerified': isVerified, isSellerVerified: isVerified };
    const user = await User.findByIdAndUpdate(id, update, { new: true });

    if (user) {
      const msg = isVerified ? 'Félicitations, votre badge Vendeur Vérifié a été accordé!' : `Votre demande a été refusée. ${remarks || ''}`;
      await Notification.create({
        recipientId: user._id,
        userId: user._id,
        type: 'system',
        title: isVerified ? 'Badge Vendeur Vérifié' : 'Vérification Vendeur Refusée',
        body: msg,
        message: msg,
      }).catch(err => console.warn('Failed to dispatch notification:', err.message));
    }
    return user;
  }

  // --- PATIENT RESOURCES MANAGEMENT & ANALYTICS ---
  async getPatientResources(filters = {}) {
    const PatientResource = require('../../../database/models/patient-resource.model');
    const { ResourceVideo } = require('../../../database/models/patient-resource.model');

    const query = {};
    if (filters.category) query.category = filters.category;
    if (filters.type) query.type = filters.type;
    if (filters.status === 'Published') query.isPublished = true;
    if (filters.status === 'Draft') query.isPublished = false;

    const [articles, videos] = await Promise.all([
      PatientResource.find(query).sort({ createdAt: -1 }).lean(),
      filters.type && filters.type !== 'video' ? Promise.resolve([]) : ResourceVideo.find({}).sort({ createdAt: -1 }).lean(),
    ]);

    const mappedArticles = articles.map(d => ({
      id: d._id.toString(),
      type: d.type || (d.videoUrl ? 'video' : d.fileUrl ? 'document' : 'article'),
      title: d.title,
      excerpt: d.excerpt || '',
      body: d.body || '',
      fileUrl: d.fileUrl || null,
      videoUrl: d.videoUrl || null,
      category: d.category,
      author: d.authorName || 'Équipe Médicale Glu10',
      viewsCount: d.viewsCount || 0,
      clicksCount: d.clicksCount || 0,
      status: d.isPublished ? 'Published' : 'Draft',
      isPublished: d.isPublished !== undefined ? d.isPublished : true,
      isFeatured: d.isFeatured || false,
      readMinutes: d.readMinutes || 5,
      coverImageUrl: d.coverImageUrl || null,
      date: d.createdAt || new Date().toISOString(),
    }));

    const mappedVideos = videos.map(v => ({
      id: v._id.toString(),
      type: 'video',
      title: v.title,
      excerpt: v.presenter ? `Présenté par ${v.presenter}` : '',
      body: '',
      fileUrl: null,
      videoUrl: v.videoUrl,
      category: v.category,
      author: v.presenter || 'Intervenant Vidéo',
      viewsCount: v.viewsCount || 0,
      clicksCount: v.clicksCount || 0,
      status: v.isPublished ? 'Published' : 'Draft',
      isPublished: v.isPublished !== undefined ? v.isPublished : true,
      isFeatured: false,
      readMinutes: v.durationMinutes || 10,
      coverImageUrl: v.thumbnailUrl || null,
      date: v.createdAt || new Date().toISOString(),
    }));

    return [...mappedArticles, ...mappedVideos];
  }

  sanitizeCategory(cat) {
    const valid = ['celiac-disease', 'diet-basics', 'safe-foods', 'lifestyle-tips'];
    if (valid.includes(cat)) return cat;
    const lower = String(cat || '').toLowerCase();
    if (lower.includes('guide') || lower.includes('régime') || lower.includes('base')) return 'diet-basics';
    if (lower.includes('fiche') || lower.includes('aliment') || lower.includes('recette') || lower.includes('produit')) return 'safe-foods';
    if (lower.includes('conseil') || lower.includes('vie') || lower.includes('quotidien')) return 'lifestyle-tips';
    return 'celiac-disease';
  }

  async createPatientResource(data) {
    const PatientResource = require('../../../database/models/patient-resource.model');
    const payload = {
      type: data.type || 'article',
      title: data.title,
      excerpt: data.excerpt || (data.title ? `${data.title.substring(0, 150)}...` : 'Extrait ressource'),
      body: data.body || data.content || '',
      fileUrl: data.fileUrl || null,
      videoUrl: data.videoUrl || null,
      category: this.sanitizeCategory(data.category),
      authorName: data.author || data.authorName || 'Équipe Médicale Glu10',
      readMinutes: Number(data.readMinutes) || 5,
      isFeatured: Boolean(data.isFeatured),
      isPublished: data.status ? data.status === 'Published' : (data.isPublished !== undefined ? Boolean(data.isPublished) : true),
      coverImageUrl: data.coverImageUrl || null,
    };
    const created = await PatientResource.create(payload);
    const d = created.toObject();
    return {
      id: d._id.toString(),
      type: d.type,
      title: d.title,
      excerpt: d.excerpt,
      body: d.body,
      fileUrl: d.fileUrl,
      videoUrl: d.videoUrl,
      category: d.category,
      author: d.authorName,
      viewsCount: d.viewsCount || 0,
      clicksCount: d.clicksCount || 0,
      status: d.isPublished ? 'Published' : 'Draft',
      isPublished: d.isPublished,
      isFeatured: d.isFeatured,
      readMinutes: d.readMinutes,
      coverImageUrl: d.coverImageUrl,
      date: d.createdAt,
    };
  }

  async updatePatientResource(id, data) {
    const PatientResource = require('../../../database/models/patient-resource.model');
    const updateData = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.body !== undefined || data.content !== undefined) updateData.body = data.body || data.content;
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl;
    if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;
    if (data.category !== undefined) updateData.category = this.sanitizeCategory(data.category);
    if (data.author !== undefined || data.authorName !== undefined) updateData.authorName = data.author || data.authorName;
    if (data.readMinutes !== undefined) updateData.readMinutes = Number(data.readMinutes);
    if (data.isFeatured !== undefined) updateData.isFeatured = Boolean(data.isFeatured);
    if (data.status !== undefined) updateData.isPublished = data.status === 'Published';
    if (data.isPublished !== undefined) updateData.isPublished = Boolean(data.isPublished);
    if (data.coverImageUrl !== undefined) updateData.coverImageUrl = data.coverImageUrl;

    const updated = await PatientResource.findByIdAndUpdate(id, updateData, { new: true }).lean();
    if (!updated) return null;

    return {
      id: updated._id.toString(),
      type: updated.type,
      title: updated.title,
      excerpt: updated.excerpt,
      body: updated.body,
      fileUrl: updated.fileUrl,
      videoUrl: updated.videoUrl,
      category: updated.category,
      author: updated.authorName,
      viewsCount: updated.viewsCount || 0,
      clicksCount: updated.clicksCount || 0,
      status: updated.isPublished ? 'Published' : 'Draft',
      isPublished: updated.isPublished,
      isFeatured: updated.isFeatured,
      readMinutes: updated.readMinutes,
      coverImageUrl: updated.coverImageUrl,
      date: updated.createdAt,
    };
  }

  async deletePatientResource(id) {
    const PatientResource = require('../../../database/models/patient-resource.model');
    const { ResourceVideo } = require('../../../database/models/patient-resource.model');
    
    await PatientResource.findByIdAndDelete(id);
    await ResourceVideo.findByIdAndDelete(id).catch(() => {});
    return true;
  }

  async getPatientResourceAnalytics() {
    const PatientResource = require('../../../database/models/patient-resource.model');
    const { ResourceVideo } = require('../../../database/models/patient-resource.model');

    const [resources, videos] = await Promise.all([
      PatientResource.find().lean(),
      ResourceVideo.find().lean(),
    ]);

    const articlesCount = resources.filter(r => (r.type || 'article') === 'article').length;
    const documentsCount = resources.filter(r => r.type === 'document').length;
    const videosCount = videos.length + resources.filter(r => r.type === 'video').length;

    let totalViews = 0;
    let totalClicks = 0;

    for (const r of resources) {
      totalViews += (r.viewsCount || 0);
      totalClicks += (r.clicksCount || 0);
    }
    for (const v of videos) {
      totalViews += (v.viewsCount || 0);
      totalClicks += (v.clicksCount || 0);
    }

    return {
      totalResources: resources.length + videos.length,
      articlesCount,
      documentsCount,
      videosCount,
      totalViews,
      totalClicks,
    };
  }

  // --- MODERATION STATS ---

  async getModerationStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      pendingProducts,
      pendingRecipes,
      pendingReels,
      pendingSellerVerifications,
      pendingShopUpdates,
      approvedToday,
      rejectedToday,
      revisionRequests,
      verifiedSellers,
    ] = await Promise.all([
      Product.countDocuments({ moderationStatus: 'pending' }).catch(() => 0),
      Recipe.countDocuments({ moderationStatus: 'pending' }).catch(() => 0),
      Reel.countDocuments({ status: { $in: ['processing', 'pending'] } }).catch(() => 0),
      User.countDocuments({ profileType: 'pro_commerce', sellerVerificationStatus: 'pending' }),
      ShopModeration.countDocuments({ moderationStatus: 'pending' }).catch(() => 0),
      ModerationHistory.countDocuments({ action: 'approved', createdAt: { $gte: today } }).catch(() => 0),
      ModerationHistory.countDocuments({ action: 'rejected', createdAt: { $gte: today } }).catch(() => 0),
      Product.countDocuments({ moderationStatus: 'revision_requested' }).catch(() => 0),
      User.countDocuments({ profileType: 'pro_commerce', isVerifiedSeller: true }),
    ]);

    const totalPending = pendingProducts + pendingRecipes + pendingReels + pendingSellerVerifications + pendingShopUpdates;

    return {
      pendingProducts,
      pendingRecipes,
      pendingReels,
      pendingSellerVerifications,
      pendingShopUpdates,
      totalPending,
      approvedToday,
      rejectedToday,
      revisionRequests,
      verifiedSellers,
    };
  }

  // --- MODERATION QUEUE ---

  async getModerationItems(type = 'all', status = 'pending', page = 1, limit = 20, search = '') {
    let results = [];
    const skip = (Number(page) - 1) * Number(limit);
    const lim = Number(limit);
    const statusFilter = status === 'all' ? {} : { moderationStatus: status };

    if (type === 'all' || type === 'products') {
      const productFilter = { ...statusFilter };
      if (search) productFilter.name = { $regex: search, $options: 'i' };
      const docs = await Product.find(productFilter)
        .populate('sellerId', 'fullName email storeInfo')
        .populate('approvedBy', 'fullName')
        .populate('moderatedBy', 'fullName')
        .sort({ createdAt: -1 })
        .skip(type === 'products' ? skip : 0)
        .limit(type === 'products' ? lim : 10)
        .lean();
      const mapped = docs.map(d => ({
        id: d._id.toString(), type: 'product',
        title: d.name || 'Produit Sans Titre',
        images: d.images || [], category: d.category,
        ingredients: d.ingredients || [],
        price: d.price != null ? `${d.price} €` : undefined,
        isGlutenFree: d.isGlutenFree, certifiedGF: d.certifiedGF,
        sellerName: d.sellerId?.fullName || 'Inconnu',
        sellerEmail: d.sellerId?.email || '',
        shopName: d.sellerId?.storeInfo?.storeName || '',
        moderationStatus: d.moderationStatus || 'pending',
        moderationReason: d.moderationReason || '',
        moderationNotes: d.moderationNotes || '',
        approvedAt: d.approvedAt, approvedByName: d.approvedBy?.fullName || '',
        moderatedAt: d.moderatedAt, moderatedByName: d.moderatedBy?.fullName || '',
        date: d.createdAt, updatedAt: d.updatedAt,
      }));
      results = results.concat(mapped);
    }

    if (type === 'all' || type === 'recipes') {
      const recipeFilter = { ...statusFilter };
      if (search) recipeFilter.title = { $regex: search, $options: 'i' };
      const docs = await Recipe.find(recipeFilter)
        .populate('authorId', 'fullName email avatar')
        .populate('approvedBy', 'fullName')
        .populate('moderatedBy', 'fullName')
        .sort({ createdAt: -1 })
        .skip(type === 'recipes' ? skip : 0)
        .limit(type === 'recipes' ? lim : 10)
        .lean();
      const mapped = docs.map(d => ({
        id: d._id.toString(), type: 'recipe',
        title: d.title || 'Recette',
        photos: d.photos || [], description: d.description || '',
        ingredients: d.ingredients || [], steps: d.steps || [],
        category: d.category, nutritionInfo: d.nutritionInfo,
        authorName: d.authorId?.fullName || 'Inconnu',
        authorEmail: d.authorId?.email || '',
        moderationStatus: d.moderationStatus || 'pending',
        moderationReason: d.moderationReason || '',
        moderationNotes: d.moderationNotes || '',
        approvedAt: d.approvedAt, approvedByName: d.approvedBy?.fullName || '',
        moderatedAt: d.moderatedAt, moderatedByName: d.moderatedBy?.fullName || '',
        date: d.createdAt, updatedAt: d.updatedAt,
      }));
      results = results.concat(mapped);
    }

    if (type === 'all' || type === 'events') {
      const eventFilter = status === 'all' ? {}
        : status === 'pending' ? { $or: [{ status: 'pending' }, { status: { $exists: false } }] }
        : status === 'approved' ? { status: 'active' }
        : { status };
      if (search) eventFilter.title = { $regex: search, $options: 'i' };
      const docs = await Event.find(eventFilter).sort({ createdAt: -1 }).limit(type === 'events' ? lim : 10).lean();
      const mapped = docs.map(d => ({
        id: d._id.toString(), type: 'event',
        title: d.title || 'Événement',
        authorOrSeller: d.organizer || 'Inconnu',
        moderationStatus: d.status === 'active' ? 'approved' : (d.status || 'pending'),
        date: d.createdAt, eventDate: d.date, location: d.location,
      }));
      results = results.concat(mapped);
    }

    if (type === 'all' || type === 'reels') {
      const reelFilter = status === 'all' ? {}
        : status === 'pending' ? { status: { $in: ['processing', 'pending'] } }
        : status === 'approved' ? { status: 'ready' }
        : { status };
      if (search) reelFilter.caption = { $regex: search, $options: 'i' };
      const docs = await Reel.find(reelFilter).populate('user', 'fullName').sort({ createdAt: -1 }).limit(type === 'reels' ? lim : 10).lean();
      const mapped = docs.map(d => ({
        id: d._id.toString(), type: 'reel',
        title: d.caption || 'Reel',
        authorOrSeller: d.user?.fullName || 'Inconnu',
        moderationStatus: d.status === 'ready' ? 'approved' : (d.status || 'pending'),
        date: d.createdAt,
      }));
      results = results.concat(mapped);
    }

    return results.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  async getModerationItemById(type, id) {
    if (type === 'product') {
      const doc = await Product.findById(id)
        .populate('sellerId', 'fullName email avatar storeInfo')
        .populate('approvedBy', 'fullName')
        .populate('moderatedBy', 'fullName')
        .lean();
      if (!doc) return null;
      return { ...doc, type: 'product', title: doc.name };
    }
    if (type === 'recipe') {
      const doc = await Recipe.findById(id)
        .populate('authorId', 'fullName email avatar')
        .populate('approvedBy', 'fullName')
        .populate('moderatedBy', 'fullName')
        .lean();
      if (!doc) return null;
      return { ...doc, type: 'recipe' };
    }
    return null;
  }

  async moderateItem(adminId, id, type, action, reason, notes) {
    if (!['approve', 'reject', 'revision'].includes(action)) throw new Error(`Unknown action: ${action}`);
    if ((action === 'reject' || action === 'revision') && !reason && !notes) {
      throw new Error('reason or notes is required for reject/revision');
    }

    const admin = await User.findById(adminId).select('fullName').lean();
    const adminName = admin?.fullName || 'Admin';

    let EntityModel;
    if (type === 'product') EntityModel = Product;
    else if (type === 'recipe') EntityModel = Recipe;
    else if (type === 'event') EntityModel = Event;
    else if (type === 'reel') EntityModel = Reel;
    else throw new Error(`Unknown type: ${type}`);

    const previousDoc = await EntityModel.findById(id).lean();
    if (!previousDoc) throw new Error('Item not found');

    const previousStatus = previousDoc.moderationStatus || previousDoc.status || 'pending';
    const now = new Date();

    let update = {};
    let newStatus = '';
    let historyAction = '';
    let ownerId = null;
    let notifTitle = '', notifBody = '';

    if (action === 'approve') {
      newStatus = 'approved';
      historyAction = 'approved';
      if (type === 'product') {
        update = { moderationStatus: 'approved', isApproved: true, isPublic: true, approvedAt: now, approvedBy: adminId };
        ownerId = previousDoc.sellerId;
        notifTitle = 'Produit approuvé ✅';
        notifBody = `Votre produit "${previousDoc.name}" a été approuvé.`;
      } else if (type === 'recipe') {
        update = { moderationStatus: 'approved', isApproved: true, isPublic: true, approvedAt: now, approvedBy: adminId };
        ownerId = previousDoc.authorId;
        notifTitle = 'Recette approuvée ✅';
        notifBody = `Votre recette "${previousDoc.title}" a été approuvée.`;
      } else if (type === 'event') {
        update = { status: 'active', isApproved: true };
        ownerId = previousDoc.createdBy || previousDoc.userId;
        notifTitle = 'Événement approuvé ✅';
        notifBody = `Votre événement "${previousDoc.title}" a été approuvé.`;
      } else if (type === 'reel') {
        update = { status: 'ready' };
        ownerId = previousDoc.user;
        notifTitle = 'Reel approuvé ✅';
        notifBody = 'Votre reel a été approuvé.';
      }
    } else if (action === 'reject') {
      newStatus = 'rejected';
      historyAction = 'rejected';
      const rejectionReason = reason || notes || 'Non conforme';
      if (type === 'product') {
        update = { moderationStatus: 'rejected', moderationReason: rejectionReason, isPublic: false, moderatedAt: now, moderatedBy: adminId };
        ownerId = previousDoc.sellerId;
        notifTitle = 'Produit refusé';
        notifBody = `Votre produit "${previousDoc.name}" a été refusé. Motif : ${rejectionReason}`;
      } else if (type === 'recipe') {
        update = { moderationStatus: 'rejected', moderationReason: rejectionReason, isPublic: false, moderatedAt: now, moderatedBy: adminId };
        ownerId = previousDoc.authorId;
        notifTitle = 'Recette refusée';
        notifBody = `Votre recette "${previousDoc.title}" a été refusée. Motif : ${rejectionReason}`;
      } else if (type === 'event') {
        update = { status: 'rejected' };
        ownerId = previousDoc.createdBy || previousDoc.userId;
        notifTitle = 'Événement refusé';
        notifBody = `Votre événement "${previousDoc.title}" a été refusé. Motif : ${rejectionReason}`;
      } else if (type === 'reel') {
        update = { status: 'rejected' };
        ownerId = previousDoc.user;
        notifTitle = 'Reel refusé';
        notifBody = `Votre reel a été refusé. Motif : ${rejectionReason}`;
      }
    } else if (action === 'revision') {
      newStatus = 'revision_requested';
      historyAction = 'revision_requested';
      const revNotes = notes || reason || '';
      if (type === 'product') {
        update = { moderationStatus: 'revision_requested', moderationNotes: revNotes, moderatedAt: now, moderatedBy: adminId };
        ownerId = previousDoc.sellerId;
        notifTitle = 'Révision demandée';
        notifBody = `Des modifications sont requises pour votre produit "${previousDoc.name}". ${revNotes}`;
      } else if (type === 'recipe') {
        update = { moderationStatus: 'revision_requested', moderationNotes: revNotes, moderatedAt: now, moderatedBy: adminId };
        ownerId = previousDoc.authorId;
        notifTitle = 'Révision demandée';
        notifBody = `Des modifications sont requises pour votre recette "${previousDoc.title}". ${revNotes}`;
      }
    }

    const updatedDoc = await EntityModel.findByIdAndUpdate(id, update, { new: true });

    if (ownerId) {
      await Promise.all([
        ModerationHistory.create({
          entityType: type,
          entityId: id,
          entityTitle: previousDoc.name || previousDoc.title || previousDoc.caption || id.toString(),
          action: historyAction,
          previousStatus,
          newStatus,
          adminId,
          adminName,
          ownerId,
          reason: reason || '',
          notes: notes || '',
        }).catch(err => console.warn('[moderation-history] failed:', err.message)),
        Notification.create({
          recipientId: ownerId,
          userId: ownerId,
          type: 'system',
          title: notifTitle,
          body: notifBody,
          message: notifBody,
        }).catch(err => console.warn('[moderation-notif] failed:', err.message)),
      ]);
    }

    return { success: true, newStatus, item: updatedDoc };
  }

  // --- SELLERS ---

  async getSellerVerifications(status = 'pending', page = 1, search = '') {
    const limit = 20;
    const skip = (Number(page) - 1) * limit;
    const filter = { profileType: 'pro_commerce' };
    if (status !== 'all') filter.sellerVerificationStatus = status;
    if (search) filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    const [sellers, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    const items = sellers.map(s => ({
      id: s._id.toString(),
      storeName: s.storeInfo?.storeName || s.fullName,
      ownerName: s.fullName,
      email: s.email,
      phone: s.phone || s.storeInfo?.phone || 'Non renseigné',
      siret: s.storeInfo?.siret || 'Non renseigné',
      address: s.storeInfo?.address || s.location || 'Non renseigné',
      certifications: s.storeInfo?.certifications?.join(', ') || 'Aucune',
      documents: s.sellerVerificationDocuments || s.storeInfo?.documents || [],
      submittedDate: s.createdAt,
      sellerVerificationStatus: s.sellerVerificationStatus || 'draft',
      sellerVerificationReason: s.sellerVerificationReason || '',
      sellerVerificationNotes: s.sellerVerificationNotes || '',
      sellerBadge: s.sellerBadge || 'none',
      isVerifiedSeller: s.isVerifiedSeller || false,
      verifiedAt: s.verifiedAt || null,
      storeInfo: s.storeInfo || {},
    }));
    return { items, total, page: Number(page), limit };
  }

  async processSellerBadge(adminId, sellerId, action, reason) {
    if (!['approve', 'reject', 'revision', 'revoke'].includes(action)) throw new Error(`Unknown action: ${action}`);
    if (action !== 'approve' && !reason) throw new Error('reason is required for reject, revision and revoke actions');

    const admin = await User.findById(adminId).select('fullName').lean();
    const adminName = admin?.fullName || 'Admin';
    const seller = await User.findById(sellerId).lean();
    if (!seller) throw new Error('Seller not found');

    const previousStatus = seller.sellerVerificationStatus || 'draft';
    const now = new Date();

    let update = {};
    let newStatus = '';
    let historyAction = '';
    let notifTitle = '', notifBody = '';

    if (action === 'approve') {
      newStatus = 'approved'; historyAction = 'badge_assigned';
      update = {
        sellerVerificationStatus: 'approved', sellerBadge: 'verified',
        isVerifiedSeller: true, verifiedAt: now, verifiedBy: adminId,
        'storeInfo.isVerified': true,
      };
      notifTitle = 'Badge Vendeur Vérifié 🏅';
      notifBody = 'Félicitations ! Votre dossier a été approuvé et votre badge Vendeur Vérifié est maintenant actif.';
    } else if (action === 'reject') {
      newStatus = 'rejected'; historyAction = 'rejected';
      update = {
        sellerVerificationStatus: 'rejected', sellerVerificationReason: reason,
        sellerBadge: 'none', isVerifiedSeller: false, 'storeInfo.isVerified': false,
      };
      notifTitle = 'Vérification Vendeur Refusée ❌';
      notifBody = `Votre dossier a été refusé. Motif : ${reason}`;
    } else if (action === 'revision') {
      newStatus = 'revision_requested'; historyAction = 'revision_requested';
      update = { sellerVerificationStatus: 'revision_requested', sellerVerificationNotes: reason };
      notifTitle = 'Documents complémentaires requis';
      notifBody = `Des corrections sont requises pour votre dossier. ${reason}`;
    } else if (action === 'revoke') {
      newStatus = 'rejected'; historyAction = 'badge_revoked';
      update = {
        sellerVerificationStatus: 'rejected', sellerBadge: 'none',
        isVerifiedSeller: false, sellerVerificationReason: reason, 'storeInfo.isVerified': false,
      };
      notifTitle = 'Badge Vendeur Révoqué';
      notifBody = `Votre badge vendeur a été révoqué. Motif : ${reason}`;
    }

    await Promise.all([
      User.findByIdAndUpdate(sellerId, update),
      ModerationHistory.create({
        entityType: 'seller',
        entityId: sellerId,
        entityTitle: seller.storeInfo?.storeName || seller.fullName || 'Vendeur',
        action: historyAction,
        previousStatus,
        newStatus,
        adminId,
        adminName,
        ownerId: sellerId,
        ownerName: seller.fullName || '',
        reason: reason || '',
      }).catch(err => console.warn('[seller-history] failed:', err.message)),
      Notification.create({
        recipientId: sellerId,
        userId: sellerId,
        type: 'system',
        title: notifTitle,
        body: notifBody,
        message: notifBody,
      }).catch(err => console.warn('[seller-notif] failed:', err.message)),
    ]);

    const updatedSeller = await User.findById(sellerId).lean();
    return updatedSeller;
  }

  // --- SHOP MODERATION ---

  async getShopModerations(status = 'pending', page = 1) {
    const limit = 20;
    const skip = (Number(page) - 1) * limit;
    const filter = status !== 'all' ? { moderationStatus: status } : {};

    const [items, total] = await Promise.all([
      ShopModeration.find(filter)
        .populate('sellerId', 'fullName email storeInfo')
        .populate('moderatedBy', 'fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ShopModeration.countDocuments(filter),
    ]);

    return {
      items: items.map(d => ({
        id: d._id.toString(),
        sellerId: d.sellerId?._id?.toString(),
        sellerName: d.sellerId?.fullName || '',
        sellerEmail: d.sellerId?.email || '',
        currentStoreName: d.sellerId?.storeInfo?.storeName || '',
        currentData: d.currentData,
        proposedData: d.proposedData,
        changedFields: d.changedFields || [],
        moderationStatus: d.moderationStatus,
        reason: d.reason || '',
        notes: d.notes || '',
        moderatedAt: d.moderatedAt,
        moderatedByName: d.moderatedBy?.fullName || '',
        submittedAt: d.createdAt,
      })),
      total,
      page: Number(page),
      limit,
    };
  }

  async processShopUpdate(adminId, submissionId, action, reason) {
    if (!['approve', 'reject'].includes(action)) throw new Error(`Unknown action: ${action}`);
    if (action === 'reject' && !reason) throw new Error('reason is required for rejection');

    const admin = await User.findById(adminId).select('fullName').lean();
    const adminName = admin?.fullName || 'Admin';

    const submission = await ShopModeration.findById(submissionId).lean();
    if (!submission) throw new Error('Shop moderation submission not found');

    const seller = await User.findById(submission.sellerId).lean();
    const now = new Date();

    let newStatus, notifTitle, notifBody;
    if (action === 'approve') {
      newStatus = 'approved';
      const storeUpdate = {};
      Object.entries(submission.proposedData || {}).forEach(([key, val]) => {
        storeUpdate[`storeInfo.${key}`] = val;
      });
      if (Object.keys(storeUpdate).length > 0) {
        await User.findByIdAndUpdate(submission.sellerId, storeUpdate);
      }
      // Mark the linked Establishment as verified and public
      const Establishment = require('../../../database/models/establishment.model');
      const estFilter = submission.establishmentId
        ? { _id: submission.establishmentId, owner: submission.sellerId }
        : { owner: submission.sellerId };
      await Establishment.findOneAndUpdate(
        estFilter,
        { $set: { verified: true, isPublic: true, moderationStatus: 'approved' } },
        { sort: { createdAt: -1 } }
      ).catch(err => console.warn('[establishment-approve] failed:', err.message));
      notifTitle = 'Mise à jour boutique approuvée ✅';
      notifBody = 'Vos modifications de boutique ont été approuvées et sont maintenant visibles sur la carte.';
    } else {
      newStatus = 'rejected';
      notifTitle = 'Mise à jour boutique refusée ❌';
      notifBody = `Votre demande de modification a été refusée. Motif : ${reason}`;
      // Mark the linked Establishment as rejected
      const Establishment = require('../../../database/models/establishment.model');
      const estFilter = submission.establishmentId
        ? { _id: submission.establishmentId, owner: submission.sellerId }
        : { owner: submission.sellerId };
      await Establishment.findOneAndUpdate(
        estFilter,
        { $set: { verified: false, isPublic: false, moderationStatus: 'rejected' } },
        { sort: { createdAt: -1 } }
      ).catch(err => console.warn('[establishment-reject] failed:', err.message));
    }

    await Promise.all([
      ShopModeration.findByIdAndUpdate(submissionId, {
        moderationStatus: newStatus,
        reason: reason || '',
        moderatedAt: now,
        moderatedBy: adminId,
        adminName,
      }),
      ModerationHistory.create({
        entityType: 'shop',
        entityId: submissionId,
        entityTitle: seller?.storeInfo?.storeName || seller?.fullName || 'Boutique',
        action: action === 'approve' ? 'shop_update_approved' : 'shop_update_rejected',
        previousStatus: submission.moderationStatus,
        newStatus,
        adminId,
        adminName,
        ownerId: submission.sellerId,
        ownerName: seller?.fullName || '',
        shopId: submission.sellerId,
        shopName: seller?.storeInfo?.storeName || '',
        reason: reason || '',
        changedFields: submission.changedFields || [],
      }).catch(err => console.warn('[shop-history] failed:', err.message)),
      Notification.create({
        recipientId: submission.sellerId,
        userId: submission.sellerId,
        type: 'system',
        title: notifTitle,
        body: notifBody,
        message: notifBody,
      }).catch(err => console.warn('[shop-notif] failed:', err.message)),
    ]);

    return { success: true, newStatus };
  }

  // --- MODERATION HISTORY ---

  async getModerationHistory(filters = {}, page = 1, limit = 20) {
    const skip = (Number(page) - 1) * Number(limit);
    const query = {};
    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.action)     query.action     = filters.action;
    if (filters.adminId)    query.adminId    = filters.adminId;
    if (filters.ownerId)    query.ownerId    = filters.ownerId;
    if (filters.from || filters.to) {
      query.createdAt = {};
      if (filters.from) query.createdAt.$gte = new Date(filters.from);
      if (filters.to)   query.createdAt.$lte = new Date(filters.to);
    }
    const [histItems, histTotal] = await Promise.all([
      ModerationHistory.find(query)
        .populate('adminId', 'fullName avatar')
        .populate('ownerId', 'fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ModerationHistory.countDocuments(query),
    ]);
    return {
      items: histItems.map(h => ({
        id: h._id.toString(),
        entityType: h.entityType,
        entityId: h.entityId?.toString(),
        entityTitle: h.entityTitle,
        action: h.action,
        previousStatus: h.previousStatus,
        newStatus: h.newStatus,
        adminId: h.adminId?._id?.toString() || h.adminId?.toString(),
        adminName: h.adminId?.fullName || h.adminName,
        adminAvatar: h.adminId?.avatar,
        ownerId: h.ownerId?._id?.toString() || h.ownerId?.toString(),
        ownerName: h.ownerId?.fullName || h.ownerName,
        shopName: h.shopName,
        reason: h.reason,
        notes: h.notes,
        changedFields: h.changedFields,
        createdAt: h.createdAt,
      })),
      total: histTotal,
      page: Number(page),
      limit: Number(limit),
    };
  }

  async getModerationHistoryById(id) {
    const h = await ModerationHistory.findById(id)
      .populate('adminId', 'fullName avatar')
      .populate('ownerId', 'fullName avatar')
      .lean();
    if (!h) return null;
    return {
      id: h._id.toString(),
      entityType: h.entityType,
      entityId: h.entityId?.toString(),
      entityTitle: h.entityTitle,
      action: h.action,
      previousStatus: h.previousStatus,
      newStatus: h.newStatus,
      adminId: h.adminId?._id?.toString() || h.adminId?.toString(),
      adminName: h.adminId?.fullName || h.adminName,
      adminAvatar: h.adminId?.avatar,
      ownerId: h.ownerId?._id?.toString() || h.ownerId?.toString(),
      ownerName: h.ownerId?.fullName || h.ownerName,
      shopName: h.shopName,
      reason: h.reason,
      notes: h.notes,
      changedFields: h.changedFields,
      snapshot: h.snapshot,
      createdAt: h.createdAt,
    };
  }
}

module.exports = new AdminService();
