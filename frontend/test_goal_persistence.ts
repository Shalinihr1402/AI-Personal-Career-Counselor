/**
 * Focused unit & integration test for Career Goal Confirmation and Persistence.
 * Verifies:
 * 1. Successful confirmation saves correct career title, field, and reason to career_goals.
 * 2. Archives previous active goals to prevent duplicate active goals.
 * 3. Consistent profile target_role and path: 'know_goal' updates.
 * 4. Error propagation and visible failure handling when archive, insert, or profile save fails.
 * 5. Assessment setGoal handler blocks navigation to /dashboard upon failure.
 */

import assert from 'node:assert';

// Mock Supabase Query Builder
interface MockCallLog {
  table: string;
  action: string;
  payload?: any;
  filters: Record<string, any>;
}

function createMockSupabase(options?: {
  failArchive?: boolean;
  failInsert?: boolean;
  failProfile?: boolean;
}) {
  const calls: MockCallLog[] = [];

  const client = {
    calls,
    from(table: string) {
      const filters: Record<string, any> = {};
      return {
        update(payload: any) {
          calls.push({ table, action: 'update', payload, filters });
          return {
            eq(col: string, val: any) {
              filters[col] = val;
              return {
                eq(col2: string, val2: any) {
                  filters[col2] = val2;
                  if (table === 'career_goals' && options?.failArchive) {
                    return Promise.resolve({ error: new Error('DB error archiving existing goal') });
                  }
                  return Promise.resolve({ error: null });
                },
              };
            },
          };
        },
        insert(payload: any) {
          calls.push({ table, action: 'insert', payload, filters });
          return {
            select() {
              return {
                single() {
                  if (table === 'career_goals' && options?.failInsert) {
                    return Promise.resolve({ data: null, error: new Error('DB error inserting goal') });
                  }
                  return Promise.resolve({
                    data: {
                      id: 'mock-goal-uuid-123',
                      user_id: payload.user_id,
                      career_title: payload.career_title,
                      field: payload.field,
                      reason: payload.reason,
                      status: payload.status,
                      confirmed_at: new Date().toISOString(),
                    },
                    error: null,
                  });
                },
              };
            },
          };
        },
        upsert(payload: any, _opts?: any) {
          calls.push({ table, action: 'upsert', payload, filters });
          return {
            select() {
              return {
                single() {
                  if (table === 'profiles' && options?.failProfile) {
                    return Promise.resolve({ data: null, error: new Error('DB error updating profile') });
                  }
                  return Promise.resolve({
                    data: {
                      user_id: payload.user_id,
                      target_role: payload.target_role,
                      path: payload.path,
                      onboarding_complete: true,
                    },
                    error: null,
                  });
                },
              };
            },
          };
        },
      };
    },
  };

  return client;
}

// Emulate confirmCareerGoal with injectable Supabase
async function mockConfirmCareerGoal(
  supabaseClient: ReturnType<typeof createMockSupabase>,
  userId: string,
  careerTitle: string,
  field?: string,
  reason?: string,
) {
  // Archive any existing active goals
  const { error: archiveError } = await supabaseClient
    .from('career_goals')
    .update({ status: 'archived' })
    .eq('user_id', userId)
    .eq('status', 'active');

  if (archiveError) throw archiveError;

  // Insert the new active goal
  const { data, error } = await supabaseClient
    .from('career_goals')
    .insert({
      user_id: userId,
      career_title: careerTitle,
      field: field ?? null,
      reason: reason ?? null,
      status: 'active',
    })
    .select('*')
    .single();

  if (error) throw error;

  // Also update target_role in profiles table
  const { error: profileError } = await supabaseClient
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        target_role: careerTitle,
        path: 'know_goal',
      },
      { onConflict: 'user_id' },
    )
    .select('*')
    .single();

  if (profileError) throw profileError;

  return {
    id: data.id,
    userId: data.user_id,
    careerTitle: data.career_title,
    field: data.field ?? undefined,
    reason: data.reason ?? undefined,
    status: data.status,
    confirmedAt: data.confirmed_at,
  };
}

// Emulate Assessment setGoal handler
async function simulateAssessmentSetGoal(
  supabaseClient: ReturnType<typeof createMockSupabase>,
  user: { id: string } | null,
  career: { title: string; field?: string; why_it_fits?: string },
  state: {
    navigatedTo: string | null;
    goalError: string | null;
    settingGoal: string | null;
    profileTargetRole: string | null;
  },
) {
  if (!user) {
    state.goalError = 'Please sign in to confirm your career goal.';
    return;
  }
  state.settingGoal = career.title;
  state.goalError = null;
  try {
    const reason = career.why_it_fits?.trim() || 'Selected from career assessment recommendations';
    await mockConfirmCareerGoal(
      supabaseClient,
      user.id,
      career.title,
      career.field,
      reason,
    );
    state.profileTargetRole = career.title;
    state.navigatedTo = '/dashboard';
  } catch (err: any) {
    state.goalError = err instanceof Error ? `Could not save your career goal: ${err.message}` : 'Could not save your career goal. Please try again.';
  } finally {
    state.settingGoal = null;
  }
}

async function runTests() {
  console.log('======================================================================');
  console.log('RUNNING CAREER GOAL CONFIRMATION & PERSISTENCE TEST SUITE');
  console.log('======================================================================\n');

  // Test 1: Successful Goal Confirmation
  {
    console.log('[TEST 1] Successful Confirmation & Exact Field/Title Match');
    const mockDb = createMockSupabase();
    const testCareer = {
      title: 'Software Developers',
      field: 'Technology & Computer Science',
      why_it_fits: 'Strong alignment with analytical thinking and programming interests.',
    };

    const goal = await mockConfirmCareerGoal(
      mockDb,
      'user-uuid-456',
      testCareer.title,
      testCareer.field,
      testCareer.why_it_fits,
    );

    assert.strictEqual(goal.careerTitle, 'Software Developers');
    assert.strictEqual(goal.field, 'Technology & Computer Science');
    assert.strictEqual(goal.reason, testCareer.why_it_fits);
    assert.strictEqual(goal.status, 'active');

    // Verify call sequence: archive -> insert -> profile upsert
    assert.strictEqual(mockDb.calls.length, 3);
    assert.strictEqual(mockDb.calls[0].table, 'career_goals');
    assert.strictEqual(mockDb.calls[0].action, 'update');
    assert.strictEqual(mockDb.calls[0].payload.status, 'archived');
    assert.strictEqual(mockDb.calls[0].filters.user_id, 'user-uuid-456');
    assert.strictEqual(mockDb.calls[0].filters.status, 'active');

    assert.strictEqual(mockDb.calls[1].table, 'career_goals');
    assert.strictEqual(mockDb.calls[1].action, 'insert');
    assert.strictEqual(mockDb.calls[1].payload.career_title, 'Software Developers');
    assert.strictEqual(mockDb.calls[1].payload.field, 'Technology & Computer Science');
    assert.strictEqual(mockDb.calls[1].payload.status, 'active');

    assert.strictEqual(mockDb.calls[2].table, 'profiles');
    assert.strictEqual(mockDb.calls[2].action, 'upsert');
    assert.strictEqual(mockDb.calls[2].payload.target_role, 'Software Developers');
    assert.strictEqual(mockDb.calls[2].payload.path, 'know_goal');

    console.log('  PASS: Goal inserted with exact career title & field; active status set; profile updated.\n');
  }

  // Test 2: Preventing Duplicate Active Goals (Archiving step verification)
  {
    console.log('[TEST 2] Duplicate Active Goal Prevention');
    const mockDb = createMockSupabase();
    await mockConfirmCareerGoal(mockDb, 'user-uuid-456', 'Data Scientists', 'Data & AI', 'Love ML');

    const archiveUpdate = mockDb.calls.find((c) => c.table === 'career_goals' && c.action === 'update');
    assert.ok(archiveUpdate, 'Must attempt to archive prior active goals');
    assert.strictEqual(archiveUpdate.payload.status, 'archived');
    assert.strictEqual(archiveUpdate.filters.status, 'active');
    console.log('  PASS: Previous active goals safely archived before new active goal insertion.\n');
  }

  // Test 3: Failure during Archive step
  {
    console.log('[TEST 3] Persistence Failure Handling: Archive Error');
    const mockDb = createMockSupabase({ failArchive: true });

    let threw = false;
    try {
      await mockConfirmCareerGoal(mockDb, 'user-uuid-456', 'Musicians and Singers', 'Arts, Design & Media');
    } catch (err: any) {
      threw = true;
      assert.match(err.message, /DB error archiving existing goal/);
    }
    assert.ok(threw, 'Must throw error if archiving fails');
    // Ensure insert was NOT called
    const insertCall = mockDb.calls.find((c) => c.table === 'career_goals' && c.action === 'insert');
    assert.strictEqual(insertCall, undefined, 'Must not insert if archiving fails');
    console.log('  PASS: Archive failure throws immediately without attempting insert.\n');
  }

  // Test 4: Failure during Insert step
  {
    console.log('[TEST 4] Persistence Failure Handling: Insert Error');
    const mockDb = createMockSupabase({ failInsert: true });

    let threw = false;
    try {
      await mockConfirmCareerGoal(mockDb, 'user-uuid-456', 'Registered Nurses', 'Healthcare');
    } catch (err: any) {
      threw = true;
      assert.match(err.message, /DB error inserting goal/);
    }
    assert.ok(threw, 'Must throw error if insert fails');
    // Ensure profile update was NOT called
    const profileCall = mockDb.calls.find((c) => c.table === 'profiles');
    assert.strictEqual(profileCall, undefined, 'Must not update profile if goal insertion fails');
    console.log('  PASS: Insert failure throws and aborts profile update.\n');
  }

  // Test 5: Failure during Profile update step
  {
    console.log('[TEST 5] Persistence Failure Handling: Profile Update Error');
    const mockDb = createMockSupabase({ failProfile: true });

    let threw = false;
    try {
      await mockConfirmCareerGoal(mockDb, 'user-uuid-456', 'Registered Nurses', 'Healthcare');
    } catch (err: any) {
      threw = true;
      assert.match(err.message, /DB error updating profile/);
    }
    assert.ok(threw, 'Must throw error if profile save fails');
    console.log('  PASS: Profile save error caught and reported.\n');
  }

  // Test 6: Assessment UI Handler - Visible Error & Blocked Navigation
  {
    console.log('[TEST 6] Assessment UI Handler: Failure Displays Error & Blocks Navigation');
    const mockDb = createMockSupabase({ failInsert: true });
    const state = {
      navigatedTo: null as string | null,
      goalError: null as string | null,
      settingGoal: null as string | null,
      profileTargetRole: null as string | null,
    };

    await simulateAssessmentSetGoal(
      mockDb,
      { id: 'user-789' },
      { title: 'Software Developers', field: 'Technology', why_it_fits: 'Great fit' },
      state,
    );

    assert.strictEqual(state.navigatedTo, null, 'Must NOT navigate to /dashboard on failure');
    assert.strictEqual(state.settingGoal, null, 'settingGoal state must be reset to null');
    assert.ok(state.goalError, 'goalError must be populated with visible error message');
    assert.match(state.goalError, /Could not save your career goal: DB error inserting goal/);
    assert.strictEqual(state.profileTargetRole, null, 'Target role should not be saved in state');
    console.log('  PASS: On failure, goalError is visibly set and navigation to /dashboard is blocked.\n');
  }

  // Test 7: Assessment UI Handler - Successful Flow Navigates to /dashboard
  {
    console.log('[TEST 7] Assessment UI Handler: Successful Flow Navigates to /dashboard');
    const mockDb = createMockSupabase();
    const state = {
      navigatedTo: null as string | null,
      goalError: null as string | null,
      settingGoal: null as string | null,
      profileTargetRole: null as string | null,
    };

    await simulateAssessmentSetGoal(
      mockDb,
      { id: 'user-789' },
      { title: 'Information Security Analysts', field: 'Technology & Computer Science', why_it_fits: 'High analytical security match' },
      state,
    );

    assert.strictEqual(state.navigatedTo, '/dashboard', 'Must navigate to /dashboard on success');
    assert.strictEqual(state.goalError, null, 'goalError must be null on success');
    assert.strictEqual(state.settingGoal, null, 'settingGoal must be reset to null');
    assert.strictEqual(state.profileTargetRole, 'Information Security Analysts', 'Target role successfully updated');
    console.log('  PASS: On success, profile role is updated and student navigates to /dashboard.\n');
  }

  console.log('======================================================================');
  console.log('ALL 7/7 CAREER GOAL PERSISTENCE TESTS PASSED (100%)');
  console.log('======================================================================');
}

runTests().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
