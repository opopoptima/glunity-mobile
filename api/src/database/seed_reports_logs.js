'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');

const User = require('./models/user.model');
const Report = require('./models/report.model');
const ModerationLog = require('./models/moderation-log.model');

async function seedReportsAndLogs() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    console.log('Connecting to MongoDB to seed reports & logs...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    // Clear previous reports and logs
    await Report.deleteMany({});
    await ModerationLog.deleteMany({});
    console.log('Cleared existing reports and moderation logs.');

    const users = await User.find({}).lean();
    if (users.length === 0) {
      console.log('No users found in database. Seed full system first.');
      await mongoose.connection.close();
      return;
    }

    const admin = users.find(u => u.profileType === 'admin') || users[0];
    const patients = users.filter(u => u.profileType === 'celiac');
    const sellers = users.filter(u => u.profileType === 'pro_commerce');

    console.log('Seeding Reports...');
    
    // Seed reports for first patient (usually Claire Moreau)
    if (patients.length > 0) {
      const target1 = patients[0];
      const reporter1 = patients[1] || admin;

      await Report.create([
        {
          targetUserId: target1._id,
          reporterId: reporter1._id,
          reporterName: reporter1.fullName,
          category: 'Spam',
          description: 'A posté des liens promotionnels sans rapport avec la maladie cœliaque sur les forums de discussion.',
          evidence: 'Lien promotionnel externe vers "www.sansgluten-miracle.com"',
          status: 'pending',
        },
        {
          targetUserId: target1._id,
          reporterId: reporter1._id,
          reporterName: 'Utilisateur Anonyme',
          category: 'Contenu Inapproprié',
          description: 'A utilisé des termes insultants lors d une discussion sur la contamination croisée.',
          evidence: 'Commentaire ID #920491 : "Vous êtes complètement ignorants..."',
          status: 'resolved',
          resolverId: admin._id,
          resolutionNotes: 'Avertissement officiel adressé par e-mail.',
        }
      ]);

      await ModerationLog.create([
        {
          userId: target1._id,
          action: 'Warning',
          adminId: admin._id,
          adminName: admin.fullName,
          reason: 'Utilisation de langage inapproprié sur les forums.',
          notes: 'Premier avertissement verbal formel.',
        }
      ]);

      console.log(`Seeded reports & warning log for patient: ${target1.fullName}`);
    }

    // Seed reports for first seller
    if (sellers.length > 0) {
      const target2 = sellers[0];
      const reporter2 = patients[0] || admin;

      await Report.create([
        {
          targetUserId: target2._id,
          reporterId: reporter2._id,
          reporterName: reporter2.fullName,
          category: 'Scam',
          description: 'Le vendeur a affiché une certification AFDIAG périmée depuis 2 ans sur son stand virtuel.',
          evidence: 'Document SIRET / AFDIAG périmé en 2024.',
          status: 'pending',
        }
      ]);

      console.log(`Seeded report for seller: ${target2.fullName}`);
    }

    console.log('Seeding reports and moderation logs completed.');
    await mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (err) {
    console.error('Error seeding reports and logs:', err);
  }
}

seedReportsAndLogs();
