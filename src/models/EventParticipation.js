const mongoose = require('mongoose');

const PARTICIPATION_STATUS = ['Registered', 'Participated', 'Cancelled', 'NoShow'];

/**
 * Junction table for the many-to-many relationship between Volunteer <-> Event.
 * This single collection replaces both "Volunteer Enrolled" and
 * "Volunteer Participated" list-fields from the original design:
 *   - Who enrolled for event X?     -> filter { event }
 *   - Who actually donated at X?    -> filter { event, status: 'Participated' }
 *   - What events has volunteer Y joined? -> filter { volunteer }
 */
const eventParticipationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Volunteer',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: PARTICIPATION_STATUS,
      default: 'Registered',
    },
    enrolled_at: {
      type: Date,
      default: Date.now,
    },
    participated_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// A volunteer can only have ONE participation record per event
// -> prevents duplicate/double registration at the DB level.
eventParticipationSchema.index({ event: 1, volunteer: 1 }, { unique: true });

module.exports = mongoose.model('EventParticipation', eventParticipationSchema);
module.exports.PARTICIPATION_STATUS = PARTICIPATION_STATUS;
