/**
 * Seed script – run with:  npm run seed
 *
 * Populates:
 *  - 1 demo front-desk user (frontdesk@infragardstl.org / Demo@123)
 *  - 8 sample attendees with INFRA-XXXX codes
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const FrontdeskUser = require('../models/FrontdeskUser');
const Attendee = require('../models/Attendee');
const ScanLog = require('../models/ScanLog');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/infragard_qr_demo';

// ─── Demo front-desk users ────────────────────────────────────────────────────
const FRONTDESK_USERS = [
  {
    name: 'Front Desk Demo',
    email: 'frontdesk@infragardstl.org',
    password: 'Demo@123',
    role: 'frontdesk',
  },
];

// ─── Sample attendees ─────────────────────────────────────────────────────────
const ATTENDEES = [
  { firstName: 'John',     lastName: 'Doe',       email: 'john.doe@example.com',       code: 'INFRA-1001' },
  { firstName: 'Jane',     lastName: 'Smith',     email: 'jane.smith@example.com',     code: 'INFRA-1002' },
  { firstName: 'Robert',   lastName: 'Johnson',   email: 'r.johnson@example.com',      code: 'INFRA-1003' },
  { firstName: 'Emily',    lastName: 'Davis',     email: 'emily.davis@example.com',    code: 'INFRA-1004' },
  { firstName: 'Michael',  lastName: 'Brown',     email: 'm.brown@example.com',        code: 'INFRA-1005' },
  { firstName: 'Sarah',    lastName: 'Wilson',    email: 'sarah.wilson@example.com',   code: 'INFRA-1006' },
  { firstName: 'David',    lastName: 'Martinez',  email: 'd.martinez@example.com',     code: 'INFRA-1007' },
  { firstName: 'Ashley',   lastName: 'Anderson',  email: 'a.anderson@example.com',     code: 'INFRA-1008' },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB:', MONGO_URI);

    // Clear existing data so the seed is idempotent
    await FrontdeskUser.deleteMany({});
    await Attendee.deleteMany({});
    await ScanLog.deleteMany({});
    console.log('Cleared existing collections.');

    // ── Front-desk users ──────────────────────────────────────────────────────
    for (const u of FRONTDESK_USERS) {
      const passwordHash = await bcrypt.hash(u.password, 12);
      await FrontdeskUser.create({ name: u.name, email: u.email, passwordHash, role: u.role });
    }
    console.log(`Seeded ${FRONTDESK_USERS.length} front-desk user(s).`);

    // ── Attendees ─────────────────────────────────────────────────────────────
    await Attendee.insertMany(ATTENDEES);
    console.log(`Seeded ${ATTENDEES.length} attendee(s).`);

    console.log('\n✅  Seed complete.');
    console.log('   Login: frontdesk@infragardstl.org  /  Demo@123');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
