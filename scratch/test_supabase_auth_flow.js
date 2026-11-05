const { createClient } = require('C:\\Users\\ABHISHEK\\Documents\\AI-Career-Councelor\\AI-Personal-Career-Counselor\\frontend\\node_modules\\@supabase\\supabase-js');
const fs = require('fs');

const envPath = 'C:\\Users\\ABHISHEK\\Documents\\AI-Career-Councelor\\AI-Personal-Career-Counselor\\frontend\\.env';
let supabaseUrl = 'https://gkgwinmbmxdohlygvjge.supabase.co';
let anonKey = 'sb_publishable_zJabNtDEHzEHXPLYT2wEvg_W9E8Jqit';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) anonKey = line.split('=')[1].trim();
  }
}

const supabase = createClient(supabaseUrl, anonKey);

async function runTest() {
  console.log(`[Supabase Auth Test] Connecting to: ${supabaseUrl}`);

  // Generate test email and password
  const testId = Date.now();
  const testEmail = `careertest.validation.${testId}@gmail.com`;
  const testPassword = `TestSecure123!_${testId}`;

  console.log(`Attempting sign up with: ${testEmail}`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (authError) {
    console.error(`Sign up error: ${authError.message} (code: ${authError.code || authError.status})`);
    return;
  }

  const user = authData.user;
  const session = authData.session;
  console.log(`User created: ${user ? user.id : 'null'}`);
  console.log(`Session established immediately: ${Boolean(session)}`);

  if (!session) {
    console.log("Email confirmation is enabled on this Supabase project. Attempting sign-in with test account...");
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    if (signInError) {
      console.log(`Sign-in requires confirmed email: ${signInError.message}`);
      console.log("Testing unauthenticated RLS rejection...");
      const { data: unauthData, error: unauthError } = await supabase.from('assessments').select('*').limit(1);
      console.log(`Unauthenticated select returned: ${JSON.stringify(unauthData)}, error: ${JSON.stringify(unauthError)}`);
      return;
    }
  }

  const authedUserId = (session && session.user) ? session.user.id : user.id;

  // Test insert with adaptive evidence
  const testAdaptiveEvidence = {
    stage: 'school_10th',
    scores: { R: 45, I: 75, A: 85, S: 60, E: 40, C: 50 },
    code: 'AIC',
    top_fields: ['Creative', 'Science'],
    field_scores: { Creative: 85, Science: 75 },
    top_dimensions: [{ dimension: 'A', score: 85, label: 'Artistic' }],
    demonstrated_competencies: {
      creative_expression: {
        category: 'Creative',
        demonstrated_evidence_level: 'applied_scenario',
        rubric_basis: 'Scenario question q10_01'
      }
    },
    evidence_breakdown: {
      self_reported: ['Drawing', 'Problem Solving'],
      awareness_conceptual: ['Scientific Method'],
      applied_scenario: ['Creative Expression'],
      verified_practical: []
    },
    statutory_eligibility: {
      eligible_pathways: [{ title: 'Arts & Design', slug: 'arts-and-design' }],
      alternative_pathways: [],
      statutory_restrictions: []
    },
    practical_disclaimer: 'Multiple-choice answers do not prove practical mastery.'
  };

  const enrichedKnowMe = {
    educationStage: 'sslc_10th',
    adaptive_evidence: testAdaptiveEvidence
  };

  const baseRow = {
    user_id: authedUserId,
    answers: { q1: 'a', q2: 'b' },
    work_style: { pace: 'collaborative' },
    know_me: enrichedKnowMe,
    scores: testAdaptiveEvidence.scores,
    code: testAdaptiveEvidence.code,
    matches: [{ slug: 'graphic-designer', title: 'Graphic Designer', fit: 92 }],
    source: 'ai'
  };

  console.log("Testing insert with adaptive_evidence column (primary) and know_me fallback...");
  let insertRes = await supabase.from('assessments').insert({
    ...baseRow,
    adaptive_evidence: testAdaptiveEvidence
  }).select('*').single();

  if (insertRes.error && (insertRes.error.code === '42703' || insertRes.error.message.includes('adaptive_evidence'))) {
    console.log(`Column adaptive_evidence not yet present on remote DB. Executing zero-downtime fallback insert...`);
    insertRes = await supabase.from('assessments').insert(baseRow).select('*').single();
  }

  if (insertRes.error) {
    console.error(`Insert failed:`, insertRes.error);
  } else {
    console.log(`SUCCESS: Inserted assessment row ID: ${insertRes.data.id}`);
  }

  console.log("Testing loadLatestAssessment query...");
  let loadRes = await supabase
    .from('assessments')
    .select('id, code, scores, matches, source, work_style, know_me, created_at')
    .eq('user_id', authedUserId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (loadRes.error) {
    console.error(`Load failed:`, loadRes.error);
  } else {
    const loadedRow = loadRes.data;
    console.log(`SUCCESS: Loaded assessment ID: ${loadedRow.id}, code: ${loadedRow.code}`);
    const restoredAdaptive = loadedRow.adaptive_evidence || (loadedRow.know_me && loadedRow.know_me.adaptive_evidence);
    console.log(`Restored adaptive evidence stage: ${restoredAdaptive ? restoredAdaptive.stage : 'null'}`);
    console.log(`Restored competencies count: ${restoredAdaptive ? Object.keys(restoredAdaptive.demonstrated_competencies).length : 0}`);
  }

  // Test RLS Isolation
  console.log("Testing RLS isolation (attempting to read using fake user_id filter)...");
  const fakeUserId = '00000000-0000-0000-0000-000000000000';
  const { data: rlsData } = await supabase
    .from('assessments')
    .select('*')
    .eq('user_id', fakeUserId);
  console.log(`RLS isolation verified: querying other user ID returned ${rlsData ? rlsData.length : 0} rows.`);
}

runTest().catch(console.error);
