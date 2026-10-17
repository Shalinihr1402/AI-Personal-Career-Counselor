/**
 * Journey-Aware Route Guard & Progression Test Suite
 *
 * Verifies:
 * 1. Journey status helper (getJourneyStatus) evidence evaluation.
 * 2. Unauthenticated access redirect to /login with origin state.
 * 3. Loading state spinner display without premature redirect loops.
 * 4. Stage 1 (New user / no onboarding) gated to /onboarding.
 * 5. Stage 2 (Onboarding done, no assessment) gated to /assessment.
 * 6. Stage 3 (Assessment done, no goal) gated from /dashboard, /roadmap, /today to /assessment.
 * 7. Stage 4 (All milestones complete) granted full access.
 * 8. Returning user login routing at each incomplete stage.
 */

import assert from 'node:assert';
import {
  getJourneyStatus,
  type Profile,
  type SavedAssessment,
  type CareerGoal,
} from './src/lib/profile';

// Simulate ProtectedRoute decision logic
function simulateProtectedRoute(
  auth: { user: { id: string } | null; loading: boolean; configured: boolean },
  profileState: {
    profile: Profile | null;
    assessment: SavedAssessment | null;
    activeGoal: CareerGoal | null;
    loading: boolean;
  },
  currentPath: string,
): { status: 'loading' | 'allowed' | 'redirect'; to?: string; state?: any } {
  if (auth.loading || (auth.user && profileState.loading)) {
    return { status: 'loading' };
  }

  if (!auth.configured) {
    return { status: 'allowed' };
  }

  if (!auth.user) {
    return { status: 'redirect', to: '/login', state: { from: currentPath } };
  }

  const { stage } = getJourneyStatus(
    profileState.profile,
    profileState.assessment,
    profileState.activeGoal,
  );

  // Stage 1: Incomplete onboarding
  if (stage === 'onboarding') {
    if (currentPath !== '/onboarding') {
      return { status: 'redirect', to: '/onboarding' };
    }
    return { status: 'allowed' };
  }

  // Stage 2: Incomplete assessment
  if (stage === 'assessment') {
    if (currentPath === '/assessment' || currentPath === '/onboarding') {
      return { status: 'allowed' };
    }
    return { status: 'redirect', to: '/assessment' };
  }

  // Stage 3: Completed assessment, no active career goal
  if (stage === 'goal') {
    const isGoalSelectionRoute =
      currentPath === '/assessment' ||
      currentPath === '/onboarding' ||
      currentPath.startsWith('/careers');

    if (!isGoalSelectionRoute) {
      return { status: 'redirect', to: '/assessment' };
    }
    return { status: 'allowed' };
  }

  // Stage 4: All milestones completed
  return { status: 'allowed' };
}

// Simulate Login navigation decision logic
function simulateLoginNavigation(
  profile: Profile | null,
  assessment: SavedAssessment | null,
  activeGoal: CareerGoal | null,
  explicitRedirect?: string,
): string {
  const status = getJourneyStatus(profile, assessment, activeGoal);
  return status.stage === 'complete'
    ? (explicitRedirect ?? '/dashboard')
    : status.nextRoute;
}

async function runTests() {
  console.log('======================================================================');
  console.log('RUNNING JOURNEY-AWARE ROUTE GUARD & NAVIGATION TEST SUITE');
  console.log('======================================================================\n');

  const mockAssessment: SavedAssessment = {
    id: 'asm-1',
    code: 'ASE',
    scores: { R: 20, I: 40, A: 90, S: 70, E: 50, C: 10 },
    matches: [
      {
        title: 'Musicians and Singers',
        fit: 95,
        why_it_fits: 'Artistic alignment',
        day_to_day: 'Performing and rehearsing',
        key_skills: ['Music Composition', 'Singing'],
      },
    ],
    source: 'hybrid_vector',
    workStyle: {},
    createdAt: new Date().toISOString(),
  };

  const mockActiveGoal: CareerGoal = {
    id: 'goal-1',
    userId: 'user-1',
    careerTitle: 'Musicians and Singers',
    field: 'Arts, Design & Media',
    reason: 'Passionate about creative music composition',
    status: 'active',
    confirmedAt: new Date().toISOString(),
  };

  // Test 1: Journey status helper milestone evaluations
  {
    console.log('[TEST 1] Journey Status Progression Logic');
    // Case 1a: Uninitialized profile
    const s1 = getJourneyStatus(null, null, null);
    assert.strictEqual(s1.stage, 'onboarding');
    assert.strictEqual(s1.nextRoute, '/onboarding');

    // Case 1b: Profile with onboardingComplete = false
    const s2 = getJourneyStatus({ onboardingComplete: false, interests: [] } as any, null, null);
    assert.strictEqual(s2.stage, 'onboarding');
    assert.strictEqual(s2.nextRoute, '/onboarding');

    // Case 1c: Onboarding done, assessment null
    const s3 = getJourneyStatus({ onboardingComplete: true, interests: ['Music'] } as any, null, null);
    assert.strictEqual(s3.stage, 'assessment');
    assert.strictEqual(s3.nextRoute, '/assessment');

    // Case 1d: Onboarding done, assessment empty matches
    const s4 = getJourneyStatus({ onboardingComplete: true, interests: [] } as any, { matches: [] } as any, null);
    assert.strictEqual(s4.stage, 'assessment');
    assert.strictEqual(s4.nextRoute, '/assessment');

    // Case 1e: Assessment complete, but active goal missing
    const s5 = getJourneyStatus({ onboardingComplete: true, interests: [] } as any, mockAssessment, null);
    assert.strictEqual(s5.stage, 'goal');
    assert.strictEqual(s5.nextRoute, '/assessment');

    // Case 1f: Assessment complete, onboarding has targetRole, but no active row in career_goals
    // Must NOT bypass goal confirmation stage!
    const s6 = getJourneyStatus(
      { onboardingComplete: true, targetRole: 'Data Analyst', path: 'know_goal', interests: [] } as any,
      mockAssessment,
      null,
    );
    assert.strictEqual(s6.stage, 'goal');
    assert.strictEqual(s6.nextRoute, '/assessment');

    // Case 1g: Assessment complete, career_goals record is archived (not active)
    const s7 = getJourneyStatus(
      { onboardingComplete: true, interests: [] } as any,
      mockAssessment,
      { ...mockActiveGoal, status: 'archived' },
    );
    assert.strictEqual(s7.stage, 'goal');
    assert.strictEqual(s7.nextRoute, '/assessment');

    // Case 1h: All milestones complete
    const s8 = getJourneyStatus(
      { onboardingComplete: true, interests: [] } as any,
      mockAssessment,
      mockActiveGoal,
    );
    assert.strictEqual(s8.stage, 'complete');
    assert.strictEqual(s8.nextRoute, '/dashboard');

    console.log('  PASS: All 8 milestone status scenarios evaluated correctly.\n');
  }

  // Test 2: Unauthenticated Access & State Preservation
  {
    console.log('[TEST 2] Unauthenticated Access Protection');
    const auth = { user: null, loading: false, configured: true };
    const pState = { profile: null, assessment: null, activeGoal: null, loading: false };

    const r1 = simulateProtectedRoute(auth, pState, '/dashboard');
    assert.strictEqual(r1.status, 'redirect');
    assert.strictEqual(r1.to, '/login');
    assert.strictEqual(r1.state?.from, '/dashboard');

    const r2 = simulateProtectedRoute(auth, pState, '/assessment');
    assert.strictEqual(r2.status, 'redirect');
    assert.strictEqual(r2.to, '/login');
    assert.strictEqual(r2.state?.from, '/assessment');

    const r3 = simulateProtectedRoute(auth, pState, '/roadmap');
    assert.strictEqual(r3.status, 'redirect');
    assert.strictEqual(r3.to, '/login');
    assert.strictEqual(r3.state?.from, '/roadmap');

    console.log('  PASS: Unauthenticated users redirected to /login with target state saved.\n');
  }

  // Test 3: Loading States & Redirect Loop Prevention
  {
    console.log('[TEST 3] Loading State Handling & Redirect Loop Prevention');
    const authLoading = { user: null, loading: true, configured: true };
    const pState = { profile: null, assessment: null, activeGoal: null, loading: false };

    assert.strictEqual(simulateProtectedRoute(authLoading, pState, '/dashboard').status, 'loading');

    const profileLoading = { user: { id: 'u1' }, loading: false, configured: true };
    const pLoadingState = { profile: null, assessment: null, activeGoal: null, loading: true };
    assert.strictEqual(simulateProtectedRoute(profileLoading, pLoadingState, '/assessment').status, 'loading');

    console.log('  PASS: Loading states return spinner without premature redirection.\n');
  }

  // Test 4: Stage 1 (New User / Incomplete Onboarding) Route Guarding
  {
    console.log('[TEST 4] Stage 1: Incomplete Onboarding Gated Routes');
    const auth = { user: { id: 'u1' }, loading: false, configured: true };
    const pState = {
      profile: { onboardingComplete: false, interests: [] } as any,
      assessment: null,
      activeGoal: null,
      loading: false,
    };

    // Allowed
    assert.strictEqual(simulateProtectedRoute(auth, pState, '/onboarding').status, 'allowed');

    // Blocked
    const blockedRoutes = ['/assessment', '/dashboard', '/roadmap', '/today', '/careers', '/careers/software-developer'];
    for (const route of blockedRoutes) {
      const res = simulateProtectedRoute(auth, pState, route);
      assert.strictEqual(res.status, 'redirect', `Must block ${route}`);
      assert.strictEqual(res.to, '/onboarding', `Must redirect ${route} to /onboarding`);
    }

    console.log('  PASS: Stage 1 user can only access /onboarding; all other protected routes redirected.\n');
  }

  // Test 5: Stage 2 (Onboarding Complete, Assessment Missing) Route Guarding
  {
    console.log('[TEST 5] Stage 2: Incomplete Assessment Gated Routes');
    const auth = { user: { id: 'u1' }, loading: false, configured: true };
    const pState = {
      profile: { onboardingComplete: true, interests: ['Tech'] } as any,
      assessment: null,
      activeGoal: null,
      loading: false,
    };

    // Allowed
    assert.strictEqual(simulateProtectedRoute(auth, pState, '/assessment').status, 'allowed');
    assert.strictEqual(simulateProtectedRoute(auth, pState, '/onboarding').status, 'allowed');

    // Blocked
    const blockedRoutes = ['/dashboard', '/roadmap', '/today', '/careers', '/careers/software-developer'];
    for (const route of blockedRoutes) {
      const res = simulateProtectedRoute(auth, pState, route);
      assert.strictEqual(res.status, 'redirect', `Must block ${route}`);
      assert.strictEqual(res.to, '/assessment', `Must redirect ${route} to /assessment`);
    }

    console.log('  PASS: Stage 2 user gated to /assessment; dashboard/roadmap/today/careers redirected.\n');
  }

  // Test 6: Stage 3 (Assessment Complete, Goal Missing) Route Guarding
  {
    console.log('[TEST 6] Stage 3: Assessment Complete, Goal Missing');
    const auth = { user: { id: 'u1' }, loading: false, configured: true };
    const pState = {
      profile: { onboardingComplete: true, interests: ['Tech'] } as any,
      assessment: mockAssessment,
      activeGoal: null,
      loading: false,
    };

    // Allowed (goal selection & exploration routes)
    assert.strictEqual(simulateProtectedRoute(auth, pState, '/assessment').status, 'allowed');
    assert.strictEqual(simulateProtectedRoute(auth, pState, '/careers').status, 'allowed');
    assert.strictEqual(simulateProtectedRoute(auth, pState, '/careers/software-developer').status, 'allowed');
    assert.strictEqual(simulateProtectedRoute(auth, pState, '/onboarding').status, 'allowed');

    // Gated (require confirmed career goal)
    const gatedRoutes = ['/dashboard', '/roadmap', '/today'];
    for (const route of gatedRoutes) {
      const res = simulateProtectedRoute(auth, pState, route);
      assert.strictEqual(res.status, 'redirect', `Must block ${route}`);
      assert.strictEqual(res.to, '/assessment', `Must redirect ${route} to /assessment`);
    }

    console.log('  PASS: Stage 3 user can review matches & careers; dashboard/roadmap/today redirected to /assessment.\n');
  }

  // Test 7: Stage 4 (All Milestones Complete) Full Access
  {
    console.log('[TEST 7] Stage 4: All Milestones Complete (Full Access)');
    const auth = { user: { id: 'u1' }, loading: false, configured: true };
    const pState = {
      profile: { onboardingComplete: true, targetRole: 'Musicians and Singers', path: 'know_goal', interests: ['Music'] } as any,
      assessment: mockAssessment,
      activeGoal: mockActiveGoal,
      loading: false,
    };

    const allRoutes = ['/dashboard', '/roadmap', '/today', '/careers', '/careers/musician', '/assessment', '/onboarding'];
    for (const route of allRoutes) {
      const res = simulateProtectedRoute(auth, pState, route);
      assert.strictEqual(res.status, 'allowed', `All routes must be accessible in Stage 4: ${route}`);
    }

    console.log('  PASS: Stage 4 user granted full access across all application routes.\n');
  }

  // Test 8: Login & Returning User Routing by Milestone
  {
    console.log('[TEST 8] Returning User Login Routing at Each Incomplete Stage');

    // Case 8a: User with incomplete onboarding
    const dest1 = simulateLoginNavigation(
      { onboardingComplete: false, interests: [] } as any,
      null,
      null,
    );
    assert.strictEqual(dest1, '/onboarding');

    // Case 8b: User with completed onboarding, missing assessment
    const dest2 = simulateLoginNavigation(
      { onboardingComplete: true, interests: ['Tech'] } as any,
      null,
      null,
    );
    assert.strictEqual(dest2, '/assessment');

    // Case 8c: User with completed assessment, missing active goal
    const dest3 = simulateLoginNavigation(
      { onboardingComplete: true, interests: ['Tech'] } as any,
      mockAssessment,
      null,
    );
    assert.strictEqual(dest3, '/assessment');

    // Case 8d: User with completed milestones, no explicit redirect
    const dest4 = simulateLoginNavigation(
      { onboardingComplete: true, targetRole: 'Musician', interests: ['Music'] } as any,
      mockAssessment,
      mockActiveGoal,
    );
    assert.strictEqual(dest4, '/dashboard');

    // Case 8e: User with completed milestones, with explicit redirect
    const dest5 = simulateLoginNavigation(
      { onboardingComplete: true, targetRole: 'Musician', interests: ['Music'] } as any,
      mockAssessment,
      mockActiveGoal,
      '/today',
    );
    assert.strictEqual(dest5, '/today');

    // Case 8f: User with INCOMPLETE milestone, with explicit redirect to /dashboard
    // Must NOT bypass to /dashboard; must resume at incomplete step (/assessment)
    const dest6 = simulateLoginNavigation(
      { onboardingComplete: true, interests: ['Tech'] } as any,
      mockAssessment,
      null,
      '/dashboard',
    );
    assert.strictEqual(dest6, '/assessment');

    console.log('  PASS: Returning users navigate to their exact incomplete step; explicitRedirect safely checked.\n');
  }

  console.log('======================================================================');
  console.log('ALL 8/8 JOURNEY GUARD & ROUTE TESTS PASSED (100%)');
  console.log('======================================================================');
}

runTests().catch((e) => {
  console.error('Test execution failed:', e);
  process.exit(1);
});
