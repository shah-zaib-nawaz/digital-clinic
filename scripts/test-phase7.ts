import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { connectDB } from '../src/lib/db';
import { Doctor } from '../src/models/Doctor';
import { Patient } from '../src/models/Patient';
import { Appointment } from '../src/models/Appointment';
import { Review } from '../src/models/Review';
import {
  createReviewSchemaCompiled,
  moderateReviewSchemaCompiled,
} from '../src/lib/validations/review';
import {
  recalculateDoctorRating,
  getDoctorReviewsAction,
} from '../src/actions/review.actions';

async function runPhase7Tests() {
  console.log('⭐ Starting Phase 7 Patient Reviews, Moderation & Reputation Harness...\n');

  try {
    await connectDB();
    console.log('✅ Connected to MongoDB Atlas Replica Set.');

    // 1. Locate Doctor and Patient
    const doctor = await Doctor.findOne().populate('userId');
    const patient = await Patient.findOne().populate('userId');

    if (!doctor || !patient) {
      throw new Error('Doctor or Patient not found in seeded database. Run seed first.');
    }
    console.log(`👨‍⚕️ Clinician: Dr. ${(doctor.userId as any)?.name} (${doctor._id})`);
    console.log(`👤 Patient: ${(patient.userId as any)?.name} (${patient._id})`);

    // 2. Locate or create a completed appointment
    let appointment = await Appointment.findOne({
      doctorId: doctor._id,
      patientId: patient._id,
      status: 'completed',
    });

    if (!appointment) {
      appointment = await Appointment.create({
        patientId: patient._id,
        doctorId: doctor._id,
        departmentId: doctor.departmentId,
        date: new Date(),
        startTime: '14:00',
        endTime: '14:30',
        status: 'completed',
        chiefComplaint: 'Post-consultation follow-up and prescription review',
        attachmentUrls: [],
        consultationFeeSnapshot: doctor.consultationFee || 150,
      });
      console.log(`📅 Created fresh completed appointment encounter: ${appointment._id}`);
    } else {
      console.log(`📅 Using existing completed encounter: ${appointment._id}`);
    }

    // 3. Test Zod 4 Schema Validation with z.compile
    console.log('\n--- Test 1: Zod 4 Schema Validation with z.compile ---');
    const validPayload = {
      appointmentId: appointment._id.toString(),
      rating: 5,
      waitDurationRating: 4,
      bedsideMannerRating: 5,
      comment: 'Exceptional bedside manner! Dr. Vance thoroughly explained my lab results and answered all my questions with empathy.',
    };

    const parseResult = createReviewSchemaCompiled.safeParse(validPayload);
    if (!parseResult.success) {
      throw new Error(`Valid review failed validation: ${JSON.stringify(parseResult.error)}`);
    }
    console.log('✅ Valid review payload successfully parsed by compiled Zod 4 schema.');

    const invalidRatingPayload = { ...validPayload, rating: 6 };
    const invalidRatingResult = createReviewSchemaCompiled.safeParse(invalidRatingPayload);
    if (invalidRatingResult.success) {
      throw new Error('Expected schema to reject rating > 5, but it passed.');
    }
    console.log('✅ Schema correctly rejected out-of-range rating (6 stars).');

    const invalidCommentPayload = { ...validPayload, comment: 'Hi' };
    const invalidCommentResult = createReviewSchemaCompiled.safeParse(invalidCommentPayload);
    if (invalidCommentResult.success) {
      throw new Error('Expected schema to reject comment < 5 chars, but it passed.');
    }
    console.log('✅ Schema correctly rejected short comment (< 5 characters).');

    // Test moderateReviewSchemaCompiled
    const modParse = moderateReviewSchemaCompiled.safeParse({
      reviewId: '507f1f77bcf86cd799439011',
      status: 'approved',
    });
    if (!modParse.success) {
      throw new Error('moderateReviewSchemaCompiled failed to parse valid payload');
    }
    console.log('✅ moderateReviewSchemaCompiled parsed valid moderation payload.');

    // 4. Clean prior reviews for this appointment & create a pending review
    console.log('\n--- Test 2: Review Persistence & Initial Pending State ---');
    await Review.deleteMany({ appointmentId: appointment._id });

    const review = await Review.create({
      appointmentId: appointment._id,
      patientId: patient._id,
      doctorId: doctor._id,
      rating: parseResult.data.rating,
      waitDurationRating: parseResult.data.waitDurationRating,
      bedsideMannerRating: parseResult.data.bedsideMannerRating,
      comment: parseResult.data.comment,
      status: 'pending',
    });

    console.log(`✅ Review created with ID: ${review._id} | Status: ${review.status}`);
    if (review.status !== 'pending') {
      throw new Error(`Expected review status to be 'pending', got ${review.status}`);
    }

    // 5. Test Compound Unique Index: Prevent Duplicate Reviews for Same Appointment
    console.log('\n--- Test 3: Compound Unique Constraint (One Review per Appointment) ---');
    let duplicateRejected = false;
    try {
      await Review.create({
        appointmentId: appointment._id,
        patientId: patient._id,
        doctorId: doctor._id,
        rating: 4,
        comment: 'Attempting duplicate review for same appointment encounter',
        status: 'pending',
      });
    } catch (dupErr: any) {
      duplicateRejected = true;
      console.log('✅ Duplicate review caught and rejected by unique index (E11000):', dupErr.message.slice(0, 70));
    }

    if (!duplicateRejected) {
      throw new Error('Expected duplicate review creation to fail, but it succeeded.');
    }

    // 6. Test Admin Moderation Approval & Dynamic Reputation Recalculation
    console.log('\n--- Test 4: Admin Moderation Approval & Doctor Rating Recalculation ---');
    const initialDoctor = await Doctor.findById(doctor._id);
    const prevReviewCount = initialDoctor?.reviewCount || 0;
    console.log(`📊 Prior Doctor Metrics: Avg Rating = ${initialDoctor?.averageRating || 0}, Reviews = ${prevReviewCount}`);

    // Moderate review to approved
    review.status = 'approved';
    review.moderatedAt = new Date();
    await review.save();

    // Recalculate doctor rating dynamically
    const recalculated = await recalculateDoctorRating(doctor._id);
    console.log(`📊 Recalculated Doctor Metrics: Avg Rating = ${recalculated.averageRating} ★, Reviews = ${recalculated.reviewCount}`);

    const updatedDoctor = await Doctor.findById(doctor._id);
    if (!updatedDoctor || updatedDoctor.reviewCount !== recalculated.reviewCount) {
      throw new Error('Doctor document reviewCount did not update to match recalculated count');
    }
    if (updatedDoctor.averageRating !== recalculated.averageRating) {
      throw new Error('Doctor document averageRating did not update to match recalculated avg');
    }
    console.log('✅ Doctor document successfully updated in MongoDB with new aggregate rating.');

    // 7. Test Doctor Reviews Action & Breakdown Distribution
    console.log('\n--- Test 5: Rating Breakdown & Distribution Aggregation ---');
    const doctorReviewsRes = await getDoctorReviewsAction(doctor._id.toString(), false);
    if (!doctorReviewsRes.success || !doctorReviewsRes.data) {
      throw new Error('getDoctorReviewsAction failed');
    }

    const { reviews: pubReviews, stats: pubStats } = doctorReviewsRes.data;
    console.log(`✅ Approved Reviews Retrieved: ${pubReviews.length}`);
    console.log(`✅ Distribution Breakdown: 5★: ${pubStats.distribution[5]}, 4★: ${pubStats.distribution[4]}, 3★: ${pubStats.distribution[3]}`);

    if (pubStats.distribution[5] < 1) {
      throw new Error('Expected at least one 5-star review in distribution breakdown');
    }

    // 8. Test Soft Delete on Reviews
    console.log('\n--- Test 6: Mongoose 9.11 Soft Delete on Reviews ---');
    const reviewDoc = await Review.findById(review._id);
    if (!reviewDoc) throw new Error('Review not found for soft delete test');

    await reviewDoc.softDelete();
    const hiddenCheck = await Review.findById(review._id);
    if (hiddenCheck !== null) {
      throw new Error('Soft-deleted review was not filtered out from standard queries');
    }
    console.log('✅ Soft-deleted review is filtered out from standard queries.');

    await reviewDoc.restore();
    const restoredCheck = await Review.findById(review._id);
    if (!restoredCheck || restoredCheck.isDeleted) {
      throw new Error('Restore failed to bring review back to active queries');
    }
    console.log('✅ Review successfully restored (isDeleted: false).');

    console.log('\n🎉 ALL PHASE 7 PATIENT REVIEWS & REPUTATION TESTS PASSED CLEANLY!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Phase 7 Verification Test Failed:', err);
    process.exit(1);
  }
}

runPhase7Tests();
