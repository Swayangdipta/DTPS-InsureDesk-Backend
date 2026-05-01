require('dotenv').config();
const mongoose    = require('mongoose');
const User        = require('../models/User');
const Category    = require('../models/Category');
const BrokerHouse = require('../models/BrokerHouse');
const Company     = require('../models/Company');
const logger      = require('./logger');

// ── Seed data ─────────────────────────────────────────────
const CATEGORIES = [
  { name: 'LIC',    colorCode: '#6366f1', description: 'Life Insurance Corporation' },
  { name: 'GIC',    colorCode: '#0ea5e9', description: 'General Insurance Corporation' },
  { name: 'LICI',   colorCode: '#8b5cf6', description: 'Life Insurance Corporation of India' },
  { name: 'Health', colorCode: '#10b981', description: 'Health Insurance Policies' },
  { name: 'Term',   colorCode: '#f59e0b', description: 'Term Life Insurance' },
];

const BROKER_HOUSES = [
  { name: 'HDFC Life'      },
  { name: 'ICICI Prudential'},
  { name: 'SBI Life'       },
  { name: 'Max Life'       },
  { name: 'Bajaj Allianz'  },
];

// Companies are seeded after broker houses so we can use real IDs
const COMPANIES_BY_BROKER = {
  'HDFC Life':       ['HDFC Standard Life', 'HDFC Ergo'],
  'ICICI Prudential':['ICICI Lombard', 'ICICI Pru Life'],
  'SBI Life':        ['SBI General', 'SBI Life Insurance'],
  'Max Life':        ['Max Bupa', 'Max Financial'],
  'Bajaj Allianz':   ['Bajaj Allianz Life', 'Bajaj Allianz General'],
};

// ── Main seeder ───────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Connected to MongoDB for seeding...');

    // ── Admin user ────────────────────────────────────────
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        password: 'admin123',
        fullName: 'System Admin',
        role:     'admin',
      });
      logger.info('✅  Admin user created  (username: admin / password: admin123)');
    } else {
      logger.info('⚠️   Admin user already exists — skipping');
    }

    // ── Categories ────────────────────────────────────────
    for (const cat of CATEGORIES) {
      await Category.findOneAndUpdate(
        { name: cat.name },
        cat,
        { upsert: true, new: true }
      );
    }
    logger.info(`✅  ${CATEGORIES.length} categories seeded`);

    // ── Broker houses ─────────────────────────────────────
    const brokerMap = {};
    for (const bh of BROKER_HOUSES) {
      const doc = await BrokerHouse.findOneAndUpdate(
        { name: bh.name },
        bh,
        { upsert: true, new: true }
      );
      brokerMap[bh.name] = doc._id;
    }
    logger.info(`✅  ${BROKER_HOUSES.length} broker houses seeded`);

    // ── Companies ─────────────────────────────────────────
    let companyCount = 0;
    for (const [brokerName, companies] of Object.entries(COMPANIES_BY_BROKER)) {
      const brokerId = brokerMap[brokerName];
      for (const companyName of companies) {
        await Company.findOneAndUpdate(
          { name: companyName, brokerHouse: brokerId },
          { name: companyName, brokerHouse: brokerId },
          { upsert: true, new: true }
        );
        companyCount++;
      }
    }
    logger.info(`✅  ${companyCount} companies seeded`);

    logger.info('🌱  Seeding complete!');
    process.exit(0);
  } catch (err) {
    logger.error(`❌  Seeding failed: ${err.message}`);
    process.exit(1);
  }
};

seed();
