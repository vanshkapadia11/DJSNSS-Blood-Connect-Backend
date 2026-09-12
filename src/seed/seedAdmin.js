/**
 * One-off script to create the first Admin account.
 * There is intentionally NO public "/auth/admin/register" endpoint -
 * admin accounts must be provisioned server-side, either by running this
 * script or directly by a trusted operator.
 *
 * Usage:  npm run seed:admin
 * Reads SEED_ADMIN_NAME / SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD from .env
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const logger = require('../utils/logger');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const email = process.env.SEED_ADMIN_EMAIL;
  const existing = await Admin.findOne({ email });

  if (existing) {
    logger.info(`Admin with email ${email} already exists. Skipping.`);
  } else {
    await Admin.create({
      name: process.env.SEED_ADMIN_NAME || 'Super Admin',
      email,
      password: process.env.SEED_ADMIN_PASSWORD,
    });
    logger.info(`Admin created successfully: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  logger.error(`Seeding failed: ${err.message}`);
  process.exit(1);
});
