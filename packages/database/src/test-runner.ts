import {
  DEMO_BUSINESS,
  DEMO_BRANCHES,
  DEMO_STAFF,
  DEMO_SERVICES,
  getAvailableSlotsForDate,
  createConfirmedBooking,
} from './seed-data';

console.log('==================================================');
console.log('   BESPOKE BOOKINGS — CROWN & BLADE ENGINE TEST   ');
console.log('==================================================\n');

console.log(`✓ Business Loaded: "${DEMO_BUSINESS.name}" (${DEMO_BUSINESS.customDomain})`);
console.log(`✓ Branches (${DEMO_BRANCHES.length}):`, DEMO_BRANCHES.map(b => b.name).join(', '));
console.log(`✓ Staff Roster (${DEMO_STAFF.length}):`, DEMO_STAFF.map(s => s.fullName).join(', '));
console.log(`✓ Menu Items (${DEMO_SERVICES.length}):`, DEMO_SERVICES.map(s => `${s.name} (£${s.priceInPence / 100})`).join(', '));

// 1. Calculate next weekday date for testing
const testDate = new Date();
testDate.setDate(testDate.getDate() + 2); // 2 days in the future
// If it falls on Saturday/Sunday, shift to Monday (Soho is closed Sat/Sun)
if (testDate.getDay() === 6) {
  testDate.setDate(testDate.getDate() + 2);
} else if (testDate.getDay() === 0) {
  testDate.setDate(testDate.getDate() + 1);
}
const dateStr = testDate.toISOString().split('T')[0];

console.log(`\n1. Generating bookable slots for Soho on ${dateStr}...`);
const slots = getAvailableSlotsForDate('soho', dateStr, 'staff-arthur-001', 30);
console.log(`   Generated ${slots.length} bookable 30-min slots for Arthur Pendelton.`);
console.log(`   First slot: ${slots[0].timeString} (${slots[0].startsAt})`);

const chosenSlot = slots[0];

// 2. Create Confirmed Booking
console.log(`\n2. Creating confirmed booking for Arthur Pendelton at ${chosenSlot.timeString}...`);
const confirmation = createConfirmedBooking({
  businessSlug: 'crown-and-blade',
  branchSlug: 'soho',
  serviceId: 'svc-team-leader',
  staffId: 'staff-arthur-001',
  startsAt: chosenSlot.startsAt,
  customerName: 'Marcus Sterling',
  customerEmail: 'marcus.sterling@example.com',
  customerPhone: '07700 900123',
  discountApplied: 'STUDENT_10',
  notes: 'First time client, scissor fade',
});

console.log('   ✓ Booking Created Successfully!');
console.log(`   - Reference Code : ${confirmation.referenceCode}`);
console.log(`   - Service        : ${confirmation.serviceName}`);
console.log(`   - Barber         : ${confirmation.staffName}`);
console.log(`   - Branch         : ${confirmation.branchName} (${confirmation.branchAddress})`);
console.log(`   - Original Price : £${confirmation.priceInPence / 100}`);
console.log(`   - Student Price  : £${confirmation.finalPriceInPence / 100} (10% student discount applied)`);

// 3. Concurrency / Double-Booking Prevention Check (AGENTS.md Invariant 1)
console.log('\n3. Testing Concurrency Exclusion Constraint (simulating conflicting write)...');
try {
  createConfirmedBooking({
    businessSlug: 'crown-and-blade',
    branchSlug: 'soho',
    serviceId: 'svc-skin-fade',
    staffId: 'staff-arthur-001',
    startsAt: chosenSlot.startsAt,
    customerName: 'Second Conflicting Booker',
    customerEmail: 'conflict@example.com',
    customerPhone: '07700 900999',
  });
  console.error('   ❌ ERROR: Double booking was NOT prevented!');
  process.exit(1);
} catch (collisionError: any) {
  console.log(`   ✓ SUCCESS: Conflicting appointment was blocked!`);
  console.log(`   - Rejection Reason: "${collisionError.message}"`);
}

// 4. Verify updated availability
console.log('\n4. Verifying slot availability state after booking...');
const updatedSlots = getAvailableSlotsForDate('soho', dateStr, 'staff-arthur-001', 30);
const checkBookedSlot = updatedSlots.find(s => s.timeString === chosenSlot.timeString);

if (checkBookedSlot && !checkBookedSlot.available) {
  console.log(`   ✓ Slot ${chosenSlot.timeString} is now marked as unavailable.`);
} else {
  console.error('   ❌ ERROR: Slot is still available!');
  process.exit(1);
}

console.log('\n==================================================');
console.log('   ALL INVARIANTS & BOOKING ENGINE TESTS PASSED   ');
console.log('==================================================\n');
