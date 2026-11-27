export type InterestDomainId =
  | 'mathematics-statistics'
  | 'english-languages'
  | 'data-analytics'
  | 'computer-science-it'
  | 'medical-health-sciences'
  | 'engineering-technology'
  | 'natural-physical-sciences'
  | 'commerce-finance-economics'
  | 'arts-design-creativity'
  | 'psychology-social-sciences'
  | 'law-politics-public-service'
  | 'education-teaching';

export type ActivityDifficulty = 'foundational' | 'intermediate' | 'advanced';

export type EducationLevelFilter =
  | 'all'
  | 'class_10'
  | 'puc'
  | 'diploma'
  | 'undergraduate'
  | 'graduate';

export type ActivityInteractionType =
  | 'scenario_choice'
  | 'step_sequencer'
  | 'resource_allocation'
  | 'pattern_solver'
  | 'text_completion';

export interface ActivityOption {
  id: string;
  label: string;
  description?: string;
  feedbackInsight?: string;
}

export interface ActivityStep {
  id: string;
  text: string;
  hint?: string;
}

export interface AllocationItem {
  id: string;
  name: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: string;
  impactDescription: string;
}

export interface InteractiveActivity {
  id: string;
  title: string;
  shortDescription: string;
  interactionType: ActivityInteractionType;
  difficulty: ActivityDifficulty;
  recommendedLevels: EducationLevelFilter[];
  estimatedMinutes: number;
  contextScenario: string;
  taskPrompt: string;
  options?: ActivityOption[];
  sequenceItems?: ActivityStep[];
  correctSequenceIds?: string[];
  allocationItems?: AllocationItem[];
  totalAllocationLimit?: number;
  textBlanks?: {
    id: string;
    label: string;
    placeholder: string;
    options: string[];
  }[];
  explanationHint?: string;
  takeawayMessage: string;
}

export interface InterestDomain {
  id: InterestDomainId;
  name: string;
  tagline: string;
  description: string;
  badgeColor: string;
  iconName: string;
  relevantSubjectAreas: string[];
  subdomains: string[];
  relatedCareerAreas: string[];
  activities: InteractiveActivity[];
}

export const INTEREST_DOMAINS: InterestDomain[] = [
  // 1. Mathematics & Statistics
  {
    id: 'mathematics-statistics',
    name: 'Mathematics & Statistics',
    tagline: 'Patterns, probability, and quantitative modeling',
    description:
      'Explore the language of logical patterns, mathematical abstractions, and real-world probability. Discover whether you enjoy deducing formulas, modeling risks, or unraveling complex numerical puzzles.',
    badgeColor: 'teal',
    iconName: 'Calculator',
    relevantSubjectAreas: ['Pure Mathematics', 'Applied Statistics', 'Discrete Mathematics', 'Trigonometry', 'Probability Theory'],
    subdomains: ['Discrete Math & Logic', 'Probability & Chance', 'Applied Calculus & Modeling', 'Statistical Inference & Patterns'],
    relatedCareerAreas: ['Actuarial Science', 'Quantitative Finance', 'Data Science & AI', 'Cryptographic Research', 'Operations Research'],
    activities: [
      {
        id: 'math-pattern-growth',
        title: 'Recursive Growth Pattern Mystery',
        shortDescription: 'Analyze a natural growth sequence and predict its next phase under non-linear conditions.',
        interactionType: 'pattern_solver',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'class_10', 'puc', 'diploma'],
        estimatedMinutes: 3,
        contextScenario:
          'A marine biology lab is tracking the cell division pattern of a rare bioluminescent algae. Each minute, clusters split and merge following this observed sequence of active nodes: 2, 6, 14, 30, 62...',
        taskPrompt: 'Which rule governs this sequence, and what will the node count be in the next minute?',
        options: [
          {
            id: 'rule_a',
            label: 'Rule: Multiply by 2 and add 2 (Next: 126 nodes)',
            description: 'n(t+1) = 2*n(t) + 2. Fits 2->6->14->30->62->126 perfectly.',
            feedbackInsight: 'You identified the recursive doubling and offset pattern quickly!',
          },
          {
            id: 'rule_b',
            label: 'Rule: Add consecutive powers of 3 (Next: 108 nodes)',
            description: 'Assumes arithmetic growth tied to cubic exponents.',
            feedbackInsight: 'Close, but notice the constant multiplier of 2 at each stage.',
          },
          {
            id: 'rule_c',
            label: 'Rule: Square the previous number minus 2 (Next: 144 nodes)',
            description: 'Quadratic progression assumption.',
            feedbackInsight: 'That growth rate would explode much faster than the observed numbers.',
          },
        ],
        explanationHint: 'Look at the difference between consecutive terms: +4, +8, +16, +32. What power of 2 comes next?',
        takeawayMessage:
          'Recognizing recurrence relations and growth curves is the backbone of algorithm complexity, quantitative financial modeling, and demographic forecasting.',
      },
      {
        id: 'math-probability-risk',
        title: 'The Quality Assurance Probability Dilemma',
        shortDescription: 'Calculate the probability of defective components and determine test strategies.',
        interactionType: 'scenario_choice',
        difficulty: 'intermediate',
        recommendedLevels: ['all', 'puc', 'diploma', 'undergraduate', 'graduate'],
        estimatedMinutes: 4,
        contextScenario:
          'A factory produces medical microchips. Machine A produces 70% of chips with a 1% defect rate. Machine B produces 30% of chips with a 5% defect rate. A randomly selected chip turns out to be defective.',
        taskPrompt: 'Before running expensive diagnostics, what is the probability that this defective chip came from Machine B?',
        options: [
          {
            id: 'prob_high',
            label: 'Over 65% chance it came from Machine B',
            description: 'Using Bayes theorem: P(B|Defect) = (0.30 * 0.05) / (0.70*0.01 + 0.30*0.05) = 0.015 / 0.022 ≈ 68.2%',
            feedbackInsight: 'Excellent Bayesian thinking! Even though B produces fewer chips, its higher defect rate dominates.',
          },
          {
            id: 'prob_half',
            label: 'Roughly 50% chance between Machine A and B',
            description: 'Assumes defects are evenly split due to offsetting production volumes.',
            feedbackInsight: 'Remember to weight the relative conditional probabilities using prior distribution.',
          },
          {
            id: 'prob_low',
            label: 'Under 35% chance because Machine A produces far more chips',
            description: 'Intuitive assumption heavily weighted on Machine A volume.',
            feedbackInsight: 'This is the base-rate fallacy! The higher defect rate of Machine B swings the posterior probability.',
          },
        ],
        explanationHint: 'Calculate total probability of defect: (0.70 * 0.01) + (0.30 * 0.05) = 0.007 + 0.015 = 0.022.',
        takeawayMessage:
          'Bayesian probability allows us to update beliefs in the face of new evidence, a cornerstone skill in actuarial science, clinical trials, and machine learning.',
      },
      {
        id: 'math-practical-optimization',
        title: 'The Shipping Container Geometry Optimizer',
        shortDescription: 'Find the optimal dimensions that minimize surface area material while guaranteeing volume.',
        interactionType: 'scenario_choice',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'class_10', 'puc', 'diploma'],
        estimatedMinutes: 3,
        contextScenario:
          'A parcel logistics company needs to design a closed rectangular cardboard box holding 1,000 cubic centimeters of volume. Cardboard cost is strictly proportional to surface area.',
        taskPrompt: 'Which geometric shape minimizes total cardboard surface area for a fixed volume?',
        options: [
          {
            id: 'opt_cube',
            label: 'A perfect cube (10 cm x 10 cm x 10 cm), surface area = 600 sq cm.',
            description: 'When all sides are equal, rectangular prisms minimize surface area per unit volume.',
            feedbackInsight: 'Spot on! Symmetry minimizes surface boundary area for any rectangular polyhedron.',
          },
          {
            id: 'opt_elongated',
            label: 'A flat elongated shape (50 cm x 10 cm x 2 cm), surface area = 1,240 sq cm.',
            description: 'Flat box that uses more than double the required cardboard.',
            feedbackInsight: 'Notice how spreading dimensions far apart drastically increases surface area.',
          },
          {
            id: 'opt_tall',
            label: 'A tall column shape (25 cm x 5 cm x 8 cm), surface area = 730 sq cm.',
            description: 'Intermediate shape with uneven aspect ratios.',
            feedbackInsight: 'Better than a flat box, but still uses 21% more cardboard than a cube.',
          },
        ],
        explanationHint: 'Calculate surface area: 2*(lw + lh + wh). When l=w=h=10, Area = 2*(100 + 100 + 100) = 600.',
        takeawayMessage:
          'Geometric optimization principles govern engineering packaging, structural civil design, biological cell volumes, and thermal efficiency.',
      },
    ],
  },

  // 2. English & Languages
  {
    id: 'english-languages',
    name: 'English & Languages',
    tagline: 'Narrative craftsmanship, linguistics, and rhetoric',
    description:
      'Investigate the power of words, syntax, rhetorical nuance, and creative storytelling. Discover your aptitude for persuasive writing, editorial clarity, and linguistic structure.',
    badgeColor: 'navy',
    iconName: 'BookOpen',
    relevantSubjectAreas: ['English Literature', 'Comparative Linguistics', 'Creative Writing', 'Journalism & Media', 'Rhetoric & Semiotics'],
    subdomains: ['Creative Fiction & Storytelling', 'Rhetoric & Persuasive Writing', 'Linguistic Syntax & Morphology', 'Editorial Polishing'],
    relatedCareerAreas: ['Publishing & Authorship', 'Corporate Communications', 'Speechwriting & Diplomacy', 'Technical Writing', 'Translation Studies'],
    activities: [
      {
        id: 'lang-editorial-polish',
        title: "The Editor's Precision Challenge",
        shortDescription: 'Transform cluttered bureaucratic language into clear, punchy, persuasive prose.',
        interactionType: 'scenario_choice',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'class_10', 'puc', 'diploma', 'undergraduate', 'graduate'],
        estimatedMinutes: 3,
        contextScenario:
          'A drafted community announcement reads: "It is incumbent upon all residential occupants to effectuate the cessation of motor vehicle parking along designated emergency egress thoroughfares in order to facilitate optimal municipal sanitation proceedings."',
        taskPrompt: 'Which editorial revision maintains the authority of the message while maximizing clarity and readability?',
        options: [
          {
            id: 'edit_clean',
            label: '“Please do not park on emergency access roads so municipal sweepers can clean our streets safely and on time.”',
            description: 'Direct active voice, friendly clarity, and preserves statutory purpose.',
            feedbackInsight: 'Superb editorial instinct. Plain language dramatically improves civic cooperation.',
          },
          {
            id: 'edit_formal',
            label: '“Vehicle parking is strictly forbidden on egress ways to allow street cleaners to proceed expeditiously.”',
            description: 'Slightly shorter but retains passive, cold bureaucratic tone.',
            feedbackInsight: 'Better than original, but still uses unnecessarily stiff terminology.',
          },
          {
            id: 'edit_blunt',
            label: '“No parking on roads or you will be towed during morning street cleaning.”',
            description: 'Overly aggressive and changes the core meaning to punitive threat.',
            feedbackInsight: 'A bit too abrupt; effective communication balances firmness with respectful tone.',
          },
        ],
        explanationHint: 'Ask yourself: What does the reader need to do immediately, and why does it help the community?',
        takeawayMessage:
          'Editorial precision is vital for journalists, communication directors, speechwriters, and lawyers who must distill complex ideas into compelling prose.',
      },
      {
        id: 'lang-story-arc',
        title: 'Branching Narrative: The Lighthouse Mystery',
        shortDescription: 'Choose sensory pacing and emotional resonance to craft an atmospheric story climax.',
        interactionType: 'text_completion',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'class_10', 'puc', 'diploma'],
        estimatedMinutes: 4,
        contextScenario:
          'You are writing the climax of a coastal mystery. The retired lighthouse keeper notices the beacon rotation has abruptly stopped during a gale storm.',
        taskPrompt: 'Select narrative choices that evoke suspense, atmosphere, and rhythmic suspense:',
        textBlanks: [
          {
            id: 'opening_pacing',
            label: 'Atmospheric Opening',
            placeholder: 'Choose opening imagery...',
            options: [
              'The great glass lantern died with a shuddering metallic clank, plunging the foam-battered reef into suffocating pitch.',
              'It got dark suddenly because the light bulb broke in the top room of the lighthouse.',
              'The electrical circuit disconnected as the storm reached maximum intensity across the shoreline.',
            ],
          },
          {
            id: 'character_reaction',
            label: 'Character Action',
            placeholder: 'Choose character action...',
            options: [
              'With fingers stiffened by salt spray, Thomas gripped the cast-iron spiral rail, counting sixty-four winding steps in the dark.',
              'Thomas walked upstairs to inspect the equipment and see if the fuse had blown.',
              'He decided to wait for morning rather than risk the dangerous stairs in the middle of the gale.',
            ],
          },
        ],
        explanationHint: 'Notice how strong verbs and visceral sensory details (salt spray, iron rail) pull the reader directly into the scene.',
        takeawayMessage:
          'Creative writers, screenwriters, and brand storytellers use cadence, pacing, and sensory anchor words to orchestrate audience emotion.',
      },
      {
        id: 'lang-rhetoric-speech',
        title: 'The Persuasive Keynote Architect',
        shortDescription: 'Structure rhetorical appeals (Ethos, Pathos, Logos) to win over a skeptical audience.',
        interactionType: 'step_sequencer',
        difficulty: 'intermediate',
        recommendedLevels: ['all', 'puc', 'undergraduate', 'graduate'],
        estimatedMinutes: 4,
        contextScenario:
          'You are addressing a town council meeting that is skeptical about funding a youth community center.',
        taskPrompt: 'Arrange these four speech segments into the most psychologically persuasive order:',
        sequenceItems: [
          { id: 'seq_ethos', text: '1. Establish Credibility & Shared Values (Ethos: acknowledge community history)' },
          { id: 'seq_pathos', text: '2. Human Impact & Emotional Story (Pathos: share a local student journey)' },
          { id: 'seq_logos', text: '3. Empirical Evidence & Cost Savings (Logos: show crime reduction & ROI data)' },
          { id: 'seq_call_to_action', text: '4. Clear, Unified Call to Action (Invite council to approve phase 1 pilot)' },
        ],
        correctSequenceIds: ['seq_ethos', 'seq_pathos', 'seq_logos', 'seq_call_to_action'],
        explanationHint: 'Classic classical rhetoric: First establish common ground (Ethos), awaken empathy (Pathos), satisfy logical intellect (Logos), then ask for commitment.',
        takeawayMessage:
          'Rhetorical structure empowers diplomats, leaders, debate champions, and public relations directors to turn skepticism into collaborative action.',
      },
    ],
  },

  // 3. Data & Analytics
  {
    id: 'data-analytics',
    name: 'Data & Analytics',
    tagline: 'Trends, anomalies, dashboards, and empirical reasoning',
    description:
      'Uncover hidden stories in raw figures, interpret visual dashboards, and separate signal from noise. Test your curiosity for investigative data sleuthing and strategic decision-making.',
    badgeColor: 'teal',
    iconName: 'BarChart2',
    relevantSubjectAreas: ['Exploratory Data Analysis', 'Business Intelligence', 'Data Storytelling', 'Applied Econometrics', 'Predictive Modeling'],
    subdomains: ['Anomaly Detection', 'Visual Metric Interpretation', 'Hypothesis Testing', 'Data-Driven Strategy'],
    relatedCareerAreas: ['Business Intelligence Analyst', 'Market Research Specialist', 'Growth Analytics Lead', 'Sports Performance Analyst', 'Supply Chain Optimizer'],
    activities: [
      {
        id: 'data-coffee-anomaly',
        title: 'The Coffee Shop Sales Mystery',
        shortDescription: 'Investigate unexpected revenue dips by cross-referencing multiple time-series factors.',
        interactionType: 'scenario_choice',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'class_10', 'puc', 'diploma'],
        estimatedMinutes: 4,
        contextScenario:
          'A downtown cafe noticed that on Tuesdays between 2:00 PM and 5:00 PM, beverage revenue drops by 45%, while foot traffic outside increases by 20%. Digital records show Wi-Fi connections in the shop spike to maximum capacity during these exact hours.',
        taskPrompt: 'As the data analyst, which hypothesis best explains this discrepancy and offers an actionable test?',
        options: [
          {
            id: 'hyp_laptop',
            label: 'Students/remote workers occupy tables for hours using Wi-Fi after purchasing only a single low-ticket tea, creating a seating capacity bottleneck.',
            description: 'Tests table turnover rate vs Wi-Fi session duration to verify revenue per table-hour.',
            feedbackInsight: 'Spot on! You linked high digital occupancy with low basket size and physical table congestion.',
          },
          {
            id: 'hyp_coffee',
            label: 'The coffee beans roasted on Tuesday afternoons are lower quality than other days.',
            description: 'Assumes product quality flaw exclusively on one afternoon.',
            feedbackInsight: 'Unlikely to explain the sudden foot-traffic surge and high Wi-Fi usage at the same time.',
          },
          {
            id: 'hyp_price',
            label: 'Competitors are lowering prices across town on Tuesdays.',
            description: 'External competitive pressure assumption.',
            feedbackInsight: 'Does not explain why people are still crowding inside the shop and filling up the Wi-Fi network.',
          },
        ],
        explanationHint: 'Compare: High foot traffic + Max Wi-Fi capacity vs. Low dollar sales. What happens when tables are full of non-paying or single-cup visitors?',
        takeawayMessage:
          'Data analysts synthesize physical metrics, digital logs, and behavioral patterns to diagnose business bottlenecks and recommend high-impact solutions.',
      },
      {
        id: 'data-chart-misrepresentation',
        title: 'The Truncated Axis Illusion',
        shortDescription: 'Identify how visual scaling tricks can make tiny differences look dramatic.',
        interactionType: 'scenario_choice',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'class_10', 'puc', 'diploma'],
        estimatedMinutes: 3,
        contextScenario:
          'A software company advertises: "Brand X outperforms Competitor Y by 300%!" Their bar chart shows Brand X standing 4 times taller than Competitor Y. On closer inspection, the Y-axis starts at 98.0% instead of 0%: Brand X scored 99.5%, and Competitor Y scored 98.5%.',
        taskPrompt: 'What is the true performance difference between Brand X and Competitor Y?',
        options: [
          {
            id: 'diff_true',
            label: 'The actual difference is only 1.0 percentage point (99.5% vs 98.5%); the truncated Y-axis exaggerated the visual gap.',
            description: 'Recognizing baseline truncation distortions in data visualization.',
            feedbackInsight: 'Sharp critical data literacy! Starting an axis near the peak exaggerates trivial variance into false mountains.',
          },
          {
            id: 'diff_huge',
            label: 'Brand X is genuinely 4 times faster because the physical bar height is 4 times taller.',
            description: 'Falling for the visual bar height illusion.',
            feedbackInsight: 'Always check the numbers on the axis, not just the height of the colored bar!',
          },
          {
            id: 'diff_unknown',
            label: 'It is impossible to tell without knowing server hardware specifications.',
            description: 'Overcomplicating straightforward percentage math.',
            feedbackInsight: 'The math is right on the chart: 99.5 minus 98.5 equals 1.0.',
          },
        ],
        explanationHint: 'Subtract: 99.5% - 98.5% = 1.0%. Does 1% difference justify claiming 300% superiority?',
        takeawayMessage:
          'Data visualization literacy protects companies, investors, and citizens from misleading visual manipulation and ungrounded claims.',
      },
      {
        id: 'data-metric-dashboard',
        title: 'Executive Metric Prioritization',
        shortDescription: 'Select the 3 most diagnostic metrics for measuring student retention in an online learning app.',
        interactionType: 'scenario_choice',
        difficulty: 'intermediate',
        recommendedLevels: ['all', 'puc', 'undergraduate', 'graduate'],
        estimatedMinutes: 3,
        contextScenario:
          'An EdTech startup wants to know whether students are genuinely learning and progressing, rather than just downloading content and disappearing.',
        taskPrompt: 'Which metric suite provides the truest signal of genuine learner engagement?',
        options: [
          {
            id: 'suite_engagement',
            label: 'Weekly Active Users (WAU), 7-Day Exercise Completion Rate, and Return Frequency.',
            description: 'Reflects repeated voluntary engagement and sustained learning habit formation.',
            feedbackInsight: 'Superb! These behavioral metrics measure habit and value realization, not vanity counts.',
          },
          {
            id: 'suite_vanity',
            label: 'Total App Store Downloads, Registered Accounts, and Instagram Followers.',
            description: 'Top-of-funnel acquisition metrics.',
            feedbackInsight: 'These are vanity metrics: someone can install the app and never open it again.',
          },
          {
            id: 'suite_static',
            label: 'Total PDF downloads and account age in days.',
            description: 'Static passive markers.',
            feedbackInsight: 'Does not tell you whether the student actually learned or completed the courses.',
          },
        ],
        explanationHint: 'Distinguish between "Vanity Metrics" (impressive on paper) and "Actionable Metrics" (measure real human behavior).',
        takeawayMessage:
          'Defining the right Key Performance Indicators (KPIs) separates great data consultants from mere report generators.',
      },
    ],
  },

  // 4. Computer Science & IT
  {
    id: 'computer-science-it',
    name: 'Computer Science & IT',
    tagline: 'Code architecture, computational thinking, and software systems',
    description:
      'Explore how software translates human intent into machine execution. Discover whether you enjoy debugging logic, organizing algorithmic sequences, and architecting digital platforms.',
    badgeColor: 'teal',
    iconName: 'Code',
    relevantSubjectAreas: ['Algorithm Design', 'Software Engineering', 'Computer Systems', 'Web & Cloud Technologies', 'Database Architecture'],
    subdomains: ['Algorithmic Logic', 'Debugging & Optimization', 'Systems Architecture', 'Cybersecurity & Networks'],
    relatedCareerAreas: ['Software Developer', 'Cloud Infrastructure Engineer', 'Cybersecurity Specialist', 'DevOps Architect', 'Mobile Systems Engineer'],
    activities: [
      {
        id: 'cs-sorting-robot',
        title: 'The Parcel Sorter Algorithm',
        shortDescription: 'Arrange the sequence of computational steps to organize packages by priority weight.',
        interactionType: 'step_sequencer',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'class_10', 'puc', 'diploma'],
        estimatedMinutes: 4,
        contextScenario:
          'An autonomous warehouse robot must inspect incoming conveyor items, filter out damaged boxes, scan priority barcodes, and route them to express delivery bays.',
        taskPrompt: 'Arrange these operations into the most computationally efficient pipeline:',
        sequenceItems: [
          { id: 'step_sensor', text: '1. Read infrared weight sensor to verify package is within safe threshold' },
          { id: 'step_camera', text: '2. Capture camera frame and detect barcode using edge-detection' },
          { id: 'step_db_query', text: '3. Query database with barcode to fetch priority routing flag' },
          { id: 'step_actuator', text: '4. Trigger mechanical diversion gate to route package to express bay' },
        ],
        correctSequenceIds: ['step_sensor', 'step_camera', 'step_db_query', 'step_actuator'],
        explanationHint: 'Notice how fast hardware checks (sensor) should happen before heavier database and mechanical actuation tasks.',
        takeawayMessage:
          'Algorithmic sequencing and pipeline optimization ensure distributed software runs reliably at scale without latency bottlenecks.',
      },
      {
        id: 'cs-cyber-phishing',
        title: 'The Threat Analyst: Spotting Phishing Spoofs',
        shortDescription: 'Inspect digital communication headers and URLs to identify spoofing vectors.',
        interactionType: 'scenario_choice',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'class_10', 'puc', 'diploma'],
        estimatedMinutes: 3,
        contextScenario:
          'An employee receives an urgent email: "Your bank account is locked! Click here immediately to verify credentials: https://secure-login.paypa1-security.com/auth". The sender name displays as "Official Bank Support".',
        taskPrompt: 'What is the giveaway forensic sign that this message is a malicious phishing attempt?',
        options: [
          {
            id: 'phish_domain',
            label: 'The domain name is a deceptive typosquat ("paypa1-security.com" with a number "1" instead of "l"), not the legitimate banking domain.',
            description: 'Domain syntax analysis and homograph spoof detection.',
            feedbackInsight: 'Eagle-eyed detection! Attackers routinely substitute number 1 for lowercase L to trick inattentive users.',
          },
          {
            id: 'phish_time',
            label: 'The email arrived on a Saturday afternoon when bank staff are off duty.',
            description: 'Heuristic timing observation.',
            feedbackInsight: 'Automated bank servers send security notices 24/7; timing alone is not proof of fraud.',
          },
          {
            id: 'phish_https',
            label: 'Because the URL uses https, it is guaranteed 100% safe and verified.',
            description: 'Misunderstanding of SSL/TLS certificates.',
            feedbackInsight: 'Common misconception! HTTPS encrypts the connection, but scammers can easily obtain free SSL certificates.',
          },
        ],
        explanationHint: 'Look closely at the spelling: pay-pa-1 (number 1 instead of letter L).',
        takeawayMessage:
          'Cybersecurity analysts combine network forensics, cryptography, and human psychology to safeguard digital infrastructure from breaches.',
      },
      {
        id: 'cs-debugging-detective',
        title: 'The Edge-Case Bug Detective',
        shortDescription: 'Spot the off-by-one boundary flaw in an automated seat allocation algorithm.',
        interactionType: 'scenario_choice',
        difficulty: 'intermediate',
        recommendedLevels: ['all', 'puc', 'undergraduate', 'graduate'],
        estimatedMinutes: 4,
        contextScenario:
          'A cinema booking service has 100 seats numbered 0 to 99. The developer wrote a reservation loop: `for (let i = 0; i <= seats.length; i++) { if (!seats[i].isBooked) return seats[i]; }`. During a midnight premiere, the booking engine crashed with a NullPointer / Out-of-Bounds error.',
        taskPrompt: 'What caused the crash and how should the loop condition be corrected?',
        options: [
          {
            id: 'fix_boundary',
            label: 'The loop condition uses `i <= seats.length`, which attempts to access seat index 100 (non-existent). Change to `i < seats.length`.',
            description: 'Classic off-by-one boundary vulnerability.',
            feedbackInsight: 'Bullseye! In 0-indexed arrays with 100 items, the valid indices are 0 to 99.',
          },
          {
            id: 'fix_zero',
            label: 'The loop should start at index 1 because seat 0 is reserved for the projection room.',
            description: 'Domain assumption that does not fix array boundary indexing.',
            feedbackInsight: 'Computer arrays almost always start at index 0. The issue is at the end boundary.',
          },
          {
            id: 'fix_boolean',
            label: 'The `!seats[i].isBooked` check should be replaced with a while loop to prevent crashes.',
            description: 'Refactoring suggestion that ignores the index overrun.',
            feedbackInsight: 'Changing loop style does not prevent accessing an array out of bounds.',
          },
        ],
        explanationHint: 'If an array has 100 items, what is the value of `seats.length`? What happens when `i == seats.length`?',
        takeawayMessage:
          'Debugging requires precision, boundary testing, and systematic reasoning—skills central to software engineering and cybersecurity verification.',
      },
    ],
  },

  // 5. Medical & Health Sciences
  {
    id: 'medical-health-sciences',
    name: 'Medical & Health Sciences',
    tagline: 'Diagnostics, physiology, public healthcare, and wellness',
    description:
      'Investigate the marvel of biological systems, disease prevention, and patient care. Discover if you enjoy diagnostic deduction, understanding human physiology, and improving community health.',
    badgeColor: 'teal',
    iconName: 'Activity',
    relevantSubjectAreas: ['Human Anatomy & Physiology', 'Biomedical Science', 'Epidemiology', 'Pharmacology', 'Public Healthcare'],
    subdomains: ['Clinical Diagnostics', 'Physiological Systems', 'Public Health & Prevention', 'Therapeutic Science'],
    relatedCareerAreas: ['Physician / Specialist', 'Clinical Researcher', 'Epidemiologist & Health Officer', 'Physical Therapist', 'Healthcare Technologist'],
    activities: [
      {
        id: 'med-body-systems',
        title: 'The Homeostasis Thermostat',
        shortDescription: 'Balance physiological responses when the human body undergoes extreme physical exertion.',
        interactionType: 'scenario_choice',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'class_10', 'puc', 'diploma'],
        estimatedMinutes: 3,
        contextScenario:
          'During a high-intensity 400-meter sprint on a sunny afternoon, a student runner\'s core temperature rises toward 38.5°C. The brain\'s hypothalamus immediately triggers automatic cooling reflexes.',
        taskPrompt: 'Which physiological combination naturally sheds heat to restore core equilibrium?',
        options: [
          {
            id: 'vasodilation_sweat',
            label: 'Vasodilation (blood vessels near the skin widen to radiate heat) combined with sweat gland evaporation.',
            description: 'Classic negative feedback loop that brings body temperature back to 37°C.',
            feedbackInsight: 'Perfect biological understanding! Evaporation of sweat absorbs heat while dilated surface capillaries radiate it away.',
          },
          {
            id: 'vasoconstriction_shivering',
            label: 'Vasoconstriction (narrowing skin vessels) combined with shivering skeletal muscles.',
            description: 'This is the body\'s heat-retention response to extreme cold, not heat.',
            feedbackInsight: 'That would trap heat inside and generate more warmth, worsening the runner\'s heat strain.',
          },
          {
            id: 'calcium_lock',
            label: 'Immediate cessation of perspiration to conserve bodily fluid.',
            description: 'Dangerous physiological failure that causes heat stroke.',
            feedbackInsight: 'Stopping sweat would cause core temperature to spike dangerously.',
          },
        ],
        explanationHint: 'Think about what you feel after running: red, flushed cheeks (capillaries widening) and sweat evaporating in the breeze.',
        takeawayMessage:
          'Physiologists, physical therapists, and sports medicine doctors study homeostatic feedback loops to optimize human performance and save lives.',
      },
      {
        id: 'med-clinic-diagnostic',
        title: 'The Clinic Diagnostic Detective',
        shortDescription: 'Review patient history, vitals, and lab clues to identify the underlying physiological condition.',
        interactionType: 'scenario_choice',
        difficulty: 'intermediate',
        recommendedLevels: ['all', 'puc', 'undergraduate', 'graduate'],
        estimatedMinutes: 4,
        contextScenario:
          'A 24-year-old marathon runner presents with sudden fatigue, muscle cramping, confusion, and low blood sodium (hyponatremia) after drinking 8 liters of plain distilled water during a 40-degree heatwave.',
        taskPrompt: 'What is the most likely physiological cause of the runner\'s symptoms?',
        options: [
          {
            id: 'diag_water_intox',
            label: 'Dilutional Hyponatremia (Water Intoxication): Excessive plain water without electrolyte replenishment diluted the body\'s extracellular sodium.',
            description: 'Fluid and electrolyte balance crisis in high endurance sports.',
            feedbackInsight: 'Excellent diagnostic insight! Sweating expels sodium; replenishing solely with water dilutes remaining salts.',
          },
          {
            id: 'diag_dehydration',
            label: 'Severe Dehydration: The runner needs 4 more liters of immediate plain water infusion.',
            description: 'Assumes symptoms mean more water is urgently needed.',
            feedbackInsight: 'Dangerous assumption! Giving more plain water in dilutional hyponatremia can cause cerebral edema.',
          },
          {
            id: 'diag_calcium',
            label: 'Bone density deficiency due to calcium absorption blockage.',
            description: 'Chronic skeletal issue that does not explain acute post-race disorientation.',
            feedbackInsight: 'Does not fit the acute timing and lab finding of severely low sodium.',
          },
        ],
        explanationHint: 'Notice: 8 liters of *plain* water in extreme heat where lots of salts were lost in sweat.',
        takeawayMessage:
          'Medical professionals evaluate complex homeostatic balance across fluids, organs, and electrolytes to make life-saving clinical decisions.',
      },
      {
        id: 'med-epidemiology-water',
        title: 'The Waterborne Outbreak Investigation',
        shortDescription: 'Trace epidemic infection vectors by cross-referencing geographical settlement maps and onset dates.',
        interactionType: 'scenario_choice',
        difficulty: 'intermediate',
        recommendedLevels: ['all', 'undergraduate', 'graduate'],
        estimatedMinutes: 4,
        contextScenario:
          'An unexpected cluster of acute gastrointestinal illness emerges in a district. Neighborhood A has 45 cases, Neighborhood B has 38 cases, while neighboring C has 0 cases. Neighborhoods A and B share Municipal Water Pump 4, while Neighborhood C uses Pump 7.',
        taskPrompt: 'As the public health officer, what is your most urgent and scientifically rigorous first intervention?',
        options: [
          {
            id: 'epi_test_pump',
            label: 'Issue an immediate boil-water notice for users of Pump 4, isolate the pump line for microbiological testing, and provide treated tanker water.',
            description: 'Precautionary principle targeting the shared common-source exposure vector.',
            feedbackInsight: 'Exemplary public health leadership! Swift targeted containment halts the transmission vector while lab cultures incubate.',
          },
          {
            id: 'epi_antibiotics_all',
            label: 'Distribute prophylactic antibiotics to every resident in all three neighborhoods regardless of symptoms.',
            description: 'Blanket antibiotic overuse promoting antimicrobial resistance without fixing contaminated water.',
            feedbackInsight: 'Indiscriminate antibiotic use causes widespread drug resistance and does not clean the contaminated water source.',
          },
          {
            id: 'epi_wait',
            label: 'Wait 14 days to see if infection numbers decline naturally before taking action.',
            description: 'Fatal delay that allows secondary household transmission to spread exponentially.',
            feedbackInsight: 'In infectious disease outbreaks, delay turns localized clusters into severe regional epidemics.',
          },
        ],
        explanationHint: 'Notice the common denominator: Neighborhoods A & B share Pump 4; Neighborhood C with 0 cases uses Pump 7.',
        takeawayMessage:
          'Epidemiologists and global health directors protect millions by isolating contagion pathways through rigorous field data and decisive intervention.',
      },
    ],
  },

  // 6. Engineering & Technology
  {
    id: 'engineering-technology',
    name: 'Engineering & Technology',
    tagline: 'Structures, mechanical systems, circuits, and real-world builds',
    description:
      'Apply scientific principles to solve physical challenges, optimize energy, and build resilient structures. Discover whether you thrive when designing bridges, circuits, machines, or robotics.',
    badgeColor: 'navy',
    iconName: 'Wrench',
    relevantSubjectAreas: ['Applied Mechanics', 'Circuit Theory', 'Materials Engineering', 'Structural Design', 'Robotics & Control'],
    subdomains: ['Structural & Civil Mechanics', 'Electronics & Mechatronics', 'Thermal & Fluid Systems', 'Materials Optimization'],
    relatedCareerAreas: ['Robotics Engineer', 'Structural / Civil Engineer', 'Hardware Architect', 'Aerospace Designer', 'Renewable Energy Specialist'],
    activities: [
      {
        id: 'eng-smart-greenhouse',
        title: 'The Automated Greenhouse Circuit',
        shortDescription: 'Sequence sensors, relays, and actuators to maintain optimal crop temperature automatically.',
        interactionType: 'step_sequencer',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'class_10', 'puc', 'diploma'],
        estimatedMinutes: 3,
        contextScenario:
          'You are designing a low-cost automated cooling circuit for a school greenhouse. When interior temperature exceeds 32°C, a cooling mist fan must engage safely.',
        taskPrompt: 'Arrange the control loop components in the correct signal flow order:',
        sequenceItems: [
          { id: 'seq_thermistor', text: '1. Thermistor sensor voltage changes as ambient temperature rises above 32°C' },
          { id: 'seq_comparator', text: '2. Microcontroller comparator checks sensor reading against preset threshold' },
          { id: 'seq_relay', text: '3. Low-voltage signal energizes the electromagnetic relay switch' },
          { id: 'seq_fan', text: '4. High-power AC motor drives the mist ventilation fan to circulate cool air' },
        ],
        correctSequenceIds: ['seq_thermistor', 'seq_comparator', 'seq_relay', 'seq_fan'],
        explanationHint: 'Follow the electrical signal: Physical measurement → Logical decision → Safe electrical isolation (relay) → Heavy mechanical work (fan).',
        takeawayMessage:
          'Mechatronics and IoT engineers link physical sensors with digital microcontrollers and high-power actuators to automate modern industries.',
      },
      {
        id: 'eng-bridge-stress',
        title: 'The Gorge Crossing Truss Challenge',
        shortDescription: 'Balance weight, material cost, and load distribution across an earthquake-prone river valley.',
        interactionType: 'scenario_choice',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'class_10', 'puc', 'diploma'],
        estimatedMinutes: 4,
        contextScenario:
          'You are designing a 60-meter railway bridge over a deep rocky gorge. The design must handle heavy train freight loads while withstanding high lateral crosswinds without collapsing.',
        taskPrompt: 'Which structural design principle offers the best load distribution and structural resilience?',
        options: [
          {
            id: 'truss_triangles',
            label: 'Truss Framework with Triangular Gussets: Distributes compressive and tensile forces across interlocking triangular nodes.',
            description: 'Triangles are geometrically rigid; unlike rectangles, their angles cannot deform without changing member length.',
            feedbackInsight: 'Correct engineering judgment! Triangles distribute stress evenly into tension and compression members.',
          },
          {
            id: 'truss_squares',
            label: 'Rectangular Grid Matrix with lightweight decorative beams.',
            description: 'Easier to build but prone to lateral shear deformation under side winds.',
            feedbackInsight: 'Rectangular frames require expensive diagonal bracing to prevent parallelogram collapse.',
          },
          {
            id: 'truss_cantilever',
            label: 'Single ultra-heavy unbraced solid steel beam spanning the full distance.',
            description: 'Excessive dead weight causing massive center sagging.',
            feedbackInsight: 'Solid beams become too heavy for their own support over long spans without truss hollow distribution.',
          },
        ],
        explanationHint: 'Why do cranes, roofs, and bridges everywhere use interlocking triangles instead of squares?',
        takeawayMessage:
          'Engineers choose geometries and materials that direct forces efficiently, maximizing strength while minimizing resource waste.',
      },
      {
        id: 'eng-drone-materials',
        title: 'Autonomous Drone Shell Material Selection',
        shortDescription: 'Evaluate tensile strength, density, and thermal conductivity for long-range surveillance drones.',
        interactionType: 'scenario_choice',
        difficulty: 'intermediate',
        recommendedLevels: ['all', 'diploma', 'undergraduate', 'graduate'],
        estimatedMinutes: 4,
        contextScenario:
          'An aerospace startup is designing a solar-assisted agricultural drone. Every extra 100 grams of frame weight reduces flight battery duration by 12 minutes. The frame must endure desert heat without warping.',
        taskPrompt: 'Which material provides the optimal strength-to-weight ratio and heat resilience?',
        options: [
          {
            id: 'mat_carbon',
            label: 'Carbon Fiber Reinforced Polymer (CFRP): Ultra-high strength-to-weight ratio with minimal thermal expansion.',
            description: 'Industry standard for high-performance aerospace structures requiring maximum rigidity and low mass.',
            feedbackInsight: 'Superb materials engineering! Carbon fiber keeps the drone lightweight while enduring vibrational stress.',
          },
          {
            id: 'mat_cast_iron',
            label: 'Cast Iron Alloy: Extremely rigid, cheap, and immune to high temperature.',
            description: 'Far too dense and heavy for any flying vehicle.',
            feedbackInsight: 'Cast iron is so heavy the drone would barely lift off the ground, quickly draining batteries.',
          },
          {
            id: 'mat_pvc',
            label: 'Standard PVC Plastic: Very inexpensive and easy to mold.',
            description: 'Low structural rigidity and deforms easily under desert solar heat.',
            feedbackInsight: 'PVC sags under hot sunlight and cracks under flight motor vibration.',
          },
        ],
        explanationHint: 'In flight vehicles, weight is the primary enemy: maximize strength per gram of material.',
        takeawayMessage:
          'Aerospace and mechanical engineers select materials by evaluating complex trade-offs between strength, density, thermal limits, and manufacturing cost.',
      },
    ],
  },

  // 7. Natural & Physical Sciences
  {
    id: 'natural-physical-sciences',
    name: 'Natural & Physical Sciences',
    tagline: 'Scientific inquiry, empirical research, and natural phenomena',
    description:
      'Investigate the fundamental laws of nature—from cosmic astrophysics and chemical reactions to ecosystem interdependencies. Test your curiosity for lab experimentation and scientific discovery.',
    badgeColor: 'teal',
    iconName: 'Compass',
    relevantSubjectAreas: ['Organic & Physical Chemistry', 'Classical & Modern Physics', 'Ecology & Environmental Biology', 'Earth & Planetary Sciences'],
    subdomains: ['Experimental Hypothesis Testing', 'Chemical Dynamics & Synthesis', 'Ecological Systems', 'Planetary & Climate Modeling'],
    relatedCareerAreas: ['Research Scientist', 'Environmental Ecologist', 'Astrophysicist', 'Materials Chemist', 'Conservation Specialist'],
    activities: [
      {
        id: 'sci-ecosystem-coral',
        title: 'The Coastal Reef Trophic Cascade',
        shortDescription: 'Trace what happens across an ocean food web when sea otter or predator populations drop.',
        interactionType: 'scenario_choice',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'class_10', 'puc', 'diploma'],
        estimatedMinutes: 3,
        contextScenario:
          'In a coastal kelp forest sanctuary, sea otters feed on sea urchins, which in turn feed on giant kelp. Kelp forests provide nurseries for hundreds of fish species. If illegal hunting removes the sea otters, what chain reaction occurs?',
        taskPrompt: 'Which cascade accurately models the ecological disruption?',
        options: [
          {
            id: 'cascade_collapse',
            label: 'Urchin populations explode due to lack of predation → Urchins overgraze and destroy the kelp forest → Fish lose their breeding habitat.',
            description: 'Trophic cascade leading to an "urchin barren" devoid of biodiversity.',
            feedbackInsight: 'Exact ecological insight! Keystone predators keep herbivore populations balanced so primary producers (kelp) thrive.',
          },
          {
            id: 'cascade_static',
            label: 'The kelp forest grows 10 times taller because otters are no longer swimming around it.',
            description: 'Misunderstands the role of herbivores in eating kelp.',
            feedbackInsight: 'Otters don\'t eat kelp; they eat urchins. Without otters, urchins devour the kelp down to bare rock.',
          },
          {
            id: 'cascade_fish_boom',
            label: 'Fish populations immediately triple because otters are gone.',
            description: 'Ignores that fish require kelp forests for protection and breeding.',
            feedbackInsight: 'Without the kelp forest habitat, juvenile fish cannot hide from predators or find food.',
          },
        ],
        explanationHint: 'Follow the food chain: Otter eats Urchin → Urchin eats Kelp → Kelp shelters Fish.',
        takeawayMessage:
          'Ecologists and environmental scientists model interdependent non-linear food webs to protect marine sanctuaries and restore endangered habitats.',
      },
      {
        id: 'sci-chemical-catalyst',
        title: 'The Catalyst Optimization Chamber',
        shortDescription: 'Test how temperature, pressure, and catalyst surface area affect reaction yield.',
        interactionType: 'scenario_choice',
        difficulty: 'intermediate',
        recommendedLevels: ['all', 'puc', 'diploma', 'undergraduate', 'graduate'],
        estimatedMinutes: 4,
        contextScenario:
          'In a clean-energy research laboratory, you are synthesizing green ammonia from nitrogen and hydrogen. The reaction is exothermic: N₂ + 3H₂ ⇌ 2NH₃ (ΔH < 0). You need to maximize the production rate while maintaining an optimal equilibrium yield.',
        taskPrompt: 'Applying Le Chatelier\'s principle, what operating conditions provide the best practical compromise?',
        options: [
          {
            id: 'cat_opt',
            label: 'Moderate-high temperature with a high-surface-area iron catalyst and high pressure.',
            description: 'High pressure shifts equilibrium toward fewer gas moles (NH₃); catalyst accelerates kinetics at moderate temperatures.',
            feedbackInsight: 'Brilliant mastery of chemical kinetics and thermodynamic equilibrium balance!',
          },
          {
            id: 'cat_cold',
            label: 'Extreme low temperature and low pressure without any catalyst.',
            description: 'Thermodynamically favors products, but the reaction rate is so slow nothing happens.',
            feedbackInsight: 'At very low temperatures, molecular collisions lack the activation energy to react in human timeframes.',
          },
          {
            id: 'cat_hot',
            label: 'Extreme ultra-high heat with low pressure.',
            description: 'Shifts equilibrium backwards toward the reactant gases N₂ and H₂.',
            feedbackInsight: 'Because the reaction is exothermic, extreme heat actually lowers the final percentage yield of ammonia.',
          },
        ],
        explanationHint: 'Remember Le Chatelier: Increasing pressure favors the side with fewer gas molecules (4 moles reactants vs 2 moles products).',
        takeawayMessage:
          'Physical scientists balance kinetic speed with thermodynamic equilibrium to pioneer synthetic fuels, pharmaceuticals, and sustainable materials.',
      },
    ],
  },

  // 8. Commerce, Finance & Economics
  {
    id: 'commerce-finance-economics',
    name: 'Commerce, Finance & Economics',
    tagline: 'Markets, financial strategy, capital allocation, and enterprise',
    description:
      'Explore how markets function, how capital creates economic value, and how smart budgets drive business innovation. Test your acumen for financial analysis, pricing models, and investment trade-offs.',
    badgeColor: 'navy',
    iconName: 'DollarSign',
    relevantSubjectAreas: ['Corporate Finance', 'Micro & Macroeconomics', 'Managerial Accounting', 'Capital Markets & Valuation', 'Entrepreneurship'],
    subdomains: ['Financial Modeling & Valuation', 'Market Pricing & Elasticity', 'Cash Flow & Runway Management', 'Investment Portfolio Strategy'],
    relatedCareerAreas: ['Investment Banker', 'Corporate CFO / Controller', 'Management Consultant', 'Venture Capital Analyst', 'FinTech Strategist'],
    activities: [
      {
        id: 'comm-price-elasticity',
        title: 'The City Bus Fare Elasticity Experiment',
        shortDescription: 'Determine whether raising or lowering ticket prices maximizes public transit revenue.',
        interactionType: 'scenario_choice',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'class_10', 'puc', 'diploma'],
        estimatedMinutes: 3,
        contextScenario:
          'A municipal bus service currently charges ₹20 per ticket and sells 10,000 tickets daily (Revenue = ₹2,00,000). A passenger survey reveals high price elasticity: an increase to ₹25 causes ridership to drop by 40% (to 6,000 daily passengers), while decreasing to ₹18 increases ridership by 25% (to 12,500 passengers).',
        taskPrompt: 'Which fare decision yields the highest total daily revenue for the city?',
        options: [
          {
            id: 'fare_lower',
            label: 'Lower the fare to ₹18: 12,500 tickets × ₹18 = ₹2,25,000 daily revenue (+₹25,000 increase).',
            description: 'When demand is elastic, lowering prices expands volume enough to grow total revenue.',
            feedbackInsight: 'Terrific economic calculation! In elastic markets, volume growth more than offsets a modest price cut.',
          },
          {
            id: 'fare_raise',
            label: 'Raise the fare to ₹25: 6,000 tickets × ₹25 = ₹1,50,000 daily revenue (-₹50,000 drop).',
            description: 'Severe revenue destruction due to passengers switching to bicycles or walking.',
            feedbackInsight: 'Notice how raising the price actually destroyed 25% of total revenue due to high rider elasticity.',
          },
          {
            id: 'fare_keep',
            label: 'Keep fare at ₹20: 10,000 tickets × ₹20 = ₹2,00,000.',
            description: 'Status quo that leaves ₹25,000 in potential daily gains on the table.',
            feedbackInsight: 'Keeping the status quo misses the revenue-maximizing sweet spot discovered in the survey.',
          },
        ],
        explanationHint: 'Compare total daily dollars: Fare × Ridership. ₹18 × 12,500 = ₹2,25,000 vs ₹25 × 6,000 = ₹1,50,000.',
        takeawayMessage:
          'Economists and business strategists analyze price elasticity of demand to set sustainable pricing, fund infrastructure, and maximize public welfare.',
      },
      {
        id: 'comm-startup-runway',
        title: 'The 6-Month Seed Capital Allocator',
        shortDescription: 'Distribute a ₹20 Lakh startup grant across Product R&D, Marketing, and Operations to reach break-even.',
        interactionType: 'resource_allocation',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'puc', 'diploma', 'undergraduate', 'graduate'],
        estimatedMinutes: 4,
        contextScenario:
          'Your sustainable eco-packaging venture won a ₹20 Lakh government innovation grant. You need to survive 6 months and acquire your first 50 corporate clients before seeking private venture capital.',
        taskPrompt: 'Allocate the ₹20 Lakh budget across key categories to achieve maximum runway and customer proof:',
        totalAllocationLimit: 20,
        allocationItems: [
          {
            id: 'alloc_rd',
            name: 'Product Engineering & Bio-Testing',
            min: 4,
            max: 12,
            step: 1,
            defaultValue: 8,
            unit: 'Lakhs',
            impactDescription: 'Ensures the packaging passes moisture and strength certifications.',
          },
          {
            id: 'alloc_sales',
            name: 'Direct B2B Sales & Pilot Outreach',
            min: 3,
            max: 10,
            step: 1,
            defaultValue: 7,
            unit: 'Lakhs',
            impactDescription: 'Funds field samples and meetings with retail chain procurement managers.',
          },
          {
            id: 'alloc_ops',
            name: 'Emergency Reserves & Legal/Patent',
            min: 2,
            max: 8,
            step: 1,
            defaultValue: 5,
            unit: 'Lakhs',
            impactDescription: 'Buffers against payment delays and protects proprietary mold designs.',
          },
        ],
        explanationHint: 'Notice how starving any one bucket creates risk: too little R&D means poor product; too little sales means no customers; no reserve means sudden insolvency.',
        takeawayMessage:
          'Financial leadership requires balancing disciplined cash-flow preservation with strategic investments that generate measurable ROI.',
      },
    ],
  },

  // 9. Arts, Design & Creativity
  {
    id: 'arts-design-creativity',
    name: 'Arts, Design & Creativity',
    tagline: 'Visual hierarchy, spatial aesthetics, UI/UX, and creative expression',
    description:
      'Express ideas through visual harmony, composition, human-centered product design, and creative storytelling. Discover whether you have a passion for visual communication, user experience, and aesthetic innovation.',
    badgeColor: 'teal',
    iconName: 'Palette',
    relevantSubjectAreas: ['Visual Arts & Composition', 'User Experience (UI/UX) Design', 'Typography & Visual Hierarchy', 'Industrial & Spatial Design'],
    subdomains: ['UI/UX Product Design', 'Graphic Design & Branding', 'Spatial & Environmental Design', 'Animation & Visual Storytelling'],
    relatedCareerAreas: ['Product Designer (UI/UX)', 'Brand Creative Director', 'Game Environment Artist', 'Architect / Spatial Designer', 'Motion Graphics Specialist'],
    activities: [
      {
        id: 'art-visual-hierarchy',
        title: 'The Visual Hierarchy Makeover',
        shortDescription: 'Organize typography, contrast, and focal elements to guide the viewer\'s eye effortlessly.',
        interactionType: 'scenario_choice',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'class_10', 'puc', 'diploma'],
        estimatedMinutes: 3,
        contextScenario:
          'You are designing the event poster for an international youth climate summit. The current poster has 12 lines of text all in the exact same size, weight, and bright red color, causing visual fatigue.',
        taskPrompt: 'Which design decision best establishes clear visual hierarchy and reader flow?',
        options: [
          {
            id: 'hier_contrast',
            label: 'Create 3 distinct levels: A bold punchy headline (Focal Point), clear time/venue subheadings, and generous whitespace with a high-contrast action button.',
            description: 'Guides the eye from big picture to specific detail using intentional scale and negative space.',
            feedbackInsight: 'Exact design mastery! Whitespace and typographic contrast create instant cognitive comfort.',
          },
          {
            id: 'hier_rainbow',
            label: 'Make each line of text a different bright rainbow color to ensure everything stands out.',
            description: 'When everything is emphasized, nothing stands out; causes sensory overload.',
            feedbackInsight: 'Classic beginner trap: when every element screams for attention, the viewer sees only visual noise.',
          },
          {
            id: 'hier_fill',
            label: 'Enlarge every word until it touches the margins to eliminate all empty space.',
            description: 'Eliminates whitespace, making the layout feel suffocating and unreadable.',
            feedbackInsight: 'Whitespace (negative space) is not empty space—it is an active design element that gives content room to breathe.',
          },
        ],
        explanationHint: 'The human eye naturally scans: 1. Largest high-contrast focal point → 2. Secondary anchor → 3. Fine details.',
        takeawayMessage:
          'Designers orchestrate attention, accessibility, and emotional response by mastering contrast, spatial balance, and typography.',
      },
      {
        id: 'art-color-harmony',
        title: 'Color Temperature & Brand Emotion',
        shortDescription: 'Match color harmony palettes to user trust, serenity, or energetic excitement.',
        interactionType: 'scenario_choice',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'class_10', 'puc', 'diploma'],
        estimatedMinutes: 3,
        contextScenario:
          'You are designing the visual identity for a meditation and sleep-assistance app. The goal is to help anxious users unwind before bed without circadian disruption.',
        taskPrompt: 'Which color palette best reinforces relaxation, biological calm, and nighttime comfort?',
        options: [
          {
            id: 'pal_cool',
            label: 'Deep indigo midnight blue, soft sage green, and muted lavender with low saturation and warm off-white text.',
            description: 'Cool, low-saturation hues reduce heart rate and avoid blue-light circadian stimulation.',
            feedbackInsight: 'Wonderful color psychology understanding! Cool, muted hues trigger parasympathetic rest.',
          },
          {
            id: 'pal_neon',
            label: 'Fluorescent neon yellow, bright electric orange, and crimson red.',
            description: 'High-energy alarm colors that increase adrenaline and eye strain.',
            feedbackInsight: 'High saturation warm colors stimulate urgency and adrenaline—the opposite of sleep preparation!',
          },
          {
            id: 'pal_stark',
            label: 'Pure stark white background with pitch black text at 100% blinding brightness.',
            description: 'Harsh high-glare contrast painful in dark bedrooms.',
            feedbackInsight: 'Blinding white screens in dark bedrooms trigger severe eye fatigue.',
          },
        ],
        explanationHint: 'Consider bedtime lighting: low contrast, soft night skies, and calming natural tones.',
        takeawayMessage:
          'Brand identity designers and UI/UX specialists leverage color theory, psychology, and ergonomics to craft deeply intuitive user experiences.',
      },
    ],
  },

  // 10. Psychology & Social Sciences
  {
    id: 'psychology-social-sciences',
    name: 'Psychology & Social Sciences',
    tagline: 'Cognition, human behavior, societal dynamics, and empathy',
    description:
      'Unravel the intricacies of the human mind, emotional drivers, cognitive biases, and social structures. Discover whether you are captivated by understanding why people think, feel, and cooperate the way they do.',
    badgeColor: 'navy',
    iconName: 'Users',
    relevantSubjectAreas: ['Cognitive Psychology', 'Social Anthropology', 'Behavioral Economics', 'Developmental Psychology', 'Organizational Sociology'],
    subdomains: ['Cognitive Biases & Decision Making', 'Team & Organizational Dynamics', 'Social Research & Fieldwork', 'Mental Health & Counseling'],
    relatedCareerAreas: ['Clinical / Counseling Psychologist', 'UX Researcher', 'Organizational Behavior Consultant', 'Behavioral Economist', 'Policy & Social Impact Analyst'],
    activities: [
      {
        id: 'psych-cognitive-bias',
        title: 'The Decision Bias Detective',
        shortDescription: 'Identify the psychological trap skewing consumer and managerial decisions.',
        interactionType: 'scenario_choice',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'class_10', 'puc', 'diploma'],
        estimatedMinutes: 4,
        contextScenario:
          'A university committee spent ₹10 Lakhs developing a student sports booking portal that only 2% of students use because everyone prefers an existing group chat. Even though an external consultant showed that abandoning the portal and moving to the free chat would save ₹5 Lakhs in annual server costs, the committee voted to invest another ₹8 Lakhs into the broken portal "because we have already put so much money into it."',
        taskPrompt: 'Which well-documented cognitive bias is driving the committee\'s decision?',
        options: [
          {
            id: 'bias_sunk_cost',
            label: 'The Sunk Cost Fallacy: Continuing an endeavor solely due to previously invested resources that cannot be recovered.',
            description: 'Irrational justification based on past non-refundable investments rather than future value.',
            feedbackInsight: 'Spot on! Sunk costs should be ignored in forward-looking decisions, yet human psychology hates admitting loss.',
          },
          {
            id: 'bias_halo',
            label: 'The Halo Effect: Believing a sports portal must be good because sports are healthy.',
            description: 'Generalizing one positive trait to unrelated aspects.',
            feedbackInsight: 'The core dilemma is about clinging to past money spent, not positive attribute transfer.',
          },
          {
            id: 'bias_bystander',
            label: 'The Bystander Effect: Assuming someone else will fix the server.',
            description: 'Diffusion of responsibility in groups.',
            feedbackInsight: 'The committee actively made a budget vote based on past investment; that is sunk cost.',
          },
        ],
        explanationHint: 'Notice the phrase: "because we have already put so much money into it." Past unrecoverable expenses should never justify bad future investments.',
        takeawayMessage:
          'Psychologists and behavioral researchers diagnose cognitive shortcuts to improve public health initiatives, design ethical products, and help people make better choices.',
      },
      {
        id: 'psych-team-conflict',
        title: 'The Cross-Functional Team Mediator',
        shortDescription: 'Analyze the differing motivational drivers of 3 team members to establish productive synergy.',
        interactionType: 'scenario_choice',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'class_10', 'puc', 'diploma'],
        estimatedMinutes: 3,
        contextScenario:
          'A student project team has stalled: Member A wants speed and immediate execution; Member B wants perfection and zero errors; Member C feels unheard and unmotivated because their design ideas were dismissed without review.',
        taskPrompt: 'As an organizational psychology mediator, what is the most constructive intervention?',
        options: [
          {
            id: 'med_align',
            label: 'Facilitate a structured alignment session: define minimum viable standards for Member B, set milestone deadlines for Member A, and assign creative design ownership to Member C.',
            description: 'Integrates diverse psychological needs into clear complementary team roles.',
            feedbackInsight: 'Superb mediation instinct! High-performing teams channel differing personality traits into specialized strengths.',
          },
          {
            id: 'med_force',
            label: 'Vote to remove Member C from the group so Member A and B can work uninterrupted.',
            description: 'Erodes psychological safety and destroys team trust.',
            feedbackInsight: 'Excluding dissenting voices harms team morale and leads to worse creative outcomes.',
          },
          {
            id: 'med_ignore',
            label: 'Tell everyone to stop complaining and let Member A do all the work alone.',
            description: 'Creates burnout and resentment.',
            feedbackInsight: 'Overburdening one member leads to burnout and defeats the purpose of collaborative learning.',
          },
        ],
        explanationHint: 'Notice: each member has a valid human concern (A: speed, B: quality, C: belonging/contribution).',
        takeawayMessage:
          'Organizational psychologists build psychological safety and empathy so diverse teams can achieve remarkable breakthroughs together.',
      },
    ],
  },

  // 11. Law, Politics & Public Service
  {
    id: 'law-politics-public-service',
    name: 'Law, Politics & Public Service',
    tagline: 'Statutory justice, civic governance, policy, and public ethics',
    description:
      'Engage with statutory rights, constitutional principles, policy trade-offs, and civic governance. Discover whether you thrive when debating justice, evaluating evidence, and formulating public policy.',
    badgeColor: 'teal',
    iconName: 'Shield',
    relevantSubjectAreas: ['Constitutional Law', 'Public Administration', 'International Relations', 'Statutory Interpretation', 'Civic Ethics'],
    subdomains: ['Constitutional Rights & Justice', 'Public Policy Formulation', 'Judicial Evidence & Argumentation', 'Civic Governance & Diplomacy'],
    relatedCareerAreas: ['Litigation & Corporate Lawyer', 'Civil Services Officer (IAS/IPS)', 'Public Policy Consultant', 'International Diplomat', 'Human Rights Advocate'],
    activities: [
      {
        id: 'law-civic-free-speech',
        title: 'The Campus Free Speech & Safety Dilemma',
        shortDescription: 'Balance constitutional expression with student safety and non-disruption rules.',
        interactionType: 'scenario_choice',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'class_10', 'puc', 'diploma'],
        estimatedMinutes: 3,
        contextScenario:
          'A group of students wants to hold an outdoor peaceful demonstration during lunch break protesting cafeteria food prices and plastic waste. The school administration is concerned about corridor hallway noise during ongoing senior exams in adjacent buildings.',
        taskPrompt: 'Which constitutional and administrative resolution respects student civic expression while protecting academic testing?',
        options: [
          {
            id: 'speech_reasonable_time',
            label: 'Allow the demonstration in the central courtyard under "Reasonable Time, Place, and Manner" guidelines, ensuring no bullhorns near exam halls.',
            description: 'Balances democratic freedom of expression with institutional mission without arbitrary suppression.',
            feedbackInsight: 'Masterful constitutional understanding! The doctrine of "Time, Place, and Manner" protects core speech rights while maintaining essential public order.',
          },
          {
            id: 'speech_total_ban',
            label: 'Expel all protest organizers and ban all student opinions permanently.',
            description: 'Authoritarian overreach violating basic civil rights.',
            feedbackInsight: 'Disproportionate punishment that violates natural justice and alienates the student community.',
          },
          {
            id: 'speech_disrupt_exam',
            label: 'Encourage students to march through the exam halls banging drums during the test.',
            description: 'Infringes on the rights of test-taking students.',
            feedbackInsight: 'Free speech does not protect actively disrupting other citizens\' rights and quiet examinations.',
          },
        ],
        explanationHint: 'Constitutional law asks: Can we protect the right to speak while protecting the right of others to quiet study?',
        takeawayMessage:
          'Legal scholars, judges, and civil administrators apply proportional constitutional balance to ensure democratic rights thrive harmoniously.',
      },
      {
        id: 'law-policy-dilemma',
        title: 'The Urban River Protection vs. Artisan Livelihood Policy',
        shortDescription: 'Weigh constitutional rights, environmental preservation, and economic welfare to draft balanced public policy.',
        interactionType: 'scenario_choice',
        difficulty: 'intermediate',
        recommendedLevels: ['all', 'puc', 'undergraduate', 'graduate'],
        estimatedMinutes: 4,
        contextScenario:
          'A historic community of 1,200 traditional textile dyers relies on an urban river for washing fabric using organic minerals. An environmental study finds increased sediment levels harming downstream drinking water. Dyeworks are the sole livelihood for 4,000 families, while downstream cities face water shortages.',
        taskPrompt: 'As a public policy analyst, which recommendation best balances statutory environmental laws with constitutional rights to livelihood?',
        options: [
          {
            id: 'policy_shared_plant',
            label: 'Establish a subsidized Common Effluent Treatment Plant (CETP) funded through municipal green bonds, allowing artisans to continue working under strict discharge monitoring.',
            description: 'Harmonizes statutory ecological compliance with socioeconomic equity and livelihood continuity.',
            feedbackInsight: 'Masterful policy formulation! You resolved the tension between environmental protection and human livelihood.',
          },
          {
            id: 'policy_immediate_ban',
            label: 'Immediately arrest all dyers and demolish workshops with zero compensation to maximize water purity.',
            description: 'Severe violation of procedural justice causing acute humanitarian crisis.',
            feedbackInsight: 'Excessively punitive: would trigger severe civic protests and violate fundamental constitutional rights to work.',
          },
          {
            id: 'policy_ignore',
            label: 'Deregulate the river entirely and let downstream residents buy bottled water.',
            description: 'Abandons statutory environmental duty and public health protection.',
            feedbackInsight: 'Fails the state\'s primary constitutional duty to protect public health and common-pool resources.',
          },
        ],
        explanationHint: 'Great policy leaders look for structural solutions (like shared water filtration) rather than forcing an all-or-nothing crisis.',
        takeawayMessage:
          'Public administrators, judges, and policy strategists weave together statutory statutes, economic reality, and human compassion to serve the public good.',
      },
    ],
  },

  // 12. Education & Teaching
  {
    id: 'education-teaching',
    name: 'Education & Teaching',
    tagline: 'Pedagogy, mentoring, instructional design, and knowledge sharing',
    description:
      'Discover the art of demystifying complex topics, igniting curiosity in learners, and designing empowering educational journeys. Explore your aptitude for teaching, mentoring, and curriculum innovation.',
    badgeColor: 'navy',
    iconName: 'GraduationCap',
    relevantSubjectAreas: ['Pedagogy & Didactics', 'Instructional Design', 'Educational Psychology', 'Curriculum Scaffolding', 'EdTech Innovation'],
    subdomains: ['Concept Demystification', 'Instructional Scaffolding', 'Differentiated Learning', 'Mentorship & Feedback Delivery'],
    relatedCareerAreas: ['Instructional Designer', 'University Professor / Lecturer', 'EdTech Product Specialist', 'Corporate Learning & Development Lead', 'STEM Curriculum Creator'],
    activities: [
      {
        id: 'edu-concept-analogy',
        title: 'Explain It to a 10-Year-Old Challenge',
        shortDescription: 'Demystify a complex technical topic using intuitive everyday analogies.',
        interactionType: 'scenario_choice',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'class_10', 'puc', 'diploma'],
        estimatedMinutes: 3,
        contextScenario:
          'A 10-year-old student asks you: "What is computer memory (RAM), and why does my tablet slow down when I open 20 games at once?"',
        taskPrompt: 'Which pedagogical explanation uses the most intuitive cognitive analogy?',
        options: [
          {
            id: 'ana_desk',
            label: '“Think of RAM like your study desk. Your school bag is the hard drive where all books stay. If you pile 20 heavy books open on your small desk at the same time, you have no room to write, and everything gets messy and slow!”',
            description: 'Relatable visual analogy grounded in a child\'s daily physical experience.',
            feedbackInsight: 'Inspiring pedagogical insight! The study desk vs backpack analogy creates instant conceptual clarity.',
          },
          {
            id: 'ana_technical',
            label: '“RAM stands for Random Access Memory, a volatile semiconductor memory operating at multiple gigahertz bandwidth with flip-flop circuits that lose data on power off.”',
            description: 'Jargon-heavy lecture that creates cognitive overload and intimidates the learner.',
            feedbackInsight: 'Accurate for an electronics engineer, but completely loses a young student.',
          },
          {
            id: 'ana_dismissive',
            label: '“It just means your tablet is old, so stop opening games.”',
            description: 'Dismisses curiosity and squashes the teachable moment.',
            feedbackInsight: 'Misses the golden opportunity to spark a child\'s interest in computing.',
          },
        ],
        explanationHint: 'Great educators connect the unfamiliar (volatile semiconductor storage) to the familiar (a study desk with open notebooks).',
        takeawayMessage:
          'Instructional designers and educators empower the next generation by translating intimidating concepts into engaging, digestible breakthroughs.',
      },
      {
        id: 'edu-lesson-scaffolding',
        title: 'The Progressive Inquiry Scaffolding Challenge',
        shortDescription: 'Sequence a science experiment lesson from concrete observation to abstract deduction.',
        interactionType: 'step_sequencer',
        difficulty: 'foundational',
        recommendedLevels: ['all', 'class_10', 'puc', 'undergraduate'],
        estimatedMinutes: 3,
        contextScenario:
          'You are preparing an inquiry-based lesson on plant photosynthesis for middle-school learners.',
        taskPrompt: 'Arrange these four instructional phases in the optimal pedagogical learning progression:',
        sequenceItems: [
          { id: 'scaf_observe', text: '1. Hands-on Discovery: Place water plants in sunlight vs darkness and observe bubbles' },
          { id: 'scaf_question', text: '2. Student Question Formulation: Ask learners why bubbles only form in light' },
          { id: 'scaf_explain', text: '3. Conceptual Bridging: Introduce oxygen generation and chlorophyll absorption' },
          { id: 'scaf_apply', text: '4. Synthesis Challenge: Ask students how deep-sea algae survive with less sunlight' },
        ],
        correctSequenceIds: ['scaf_observe', 'scaf_question', 'scaf_explain', 'scaf_apply'],
        explanationHint: 'Constructivist pedagogy: First observe a tangible phenomenon → Elicit student curiosity → Introduce formal theory → Apply to new situations.',
        takeawayMessage:
          'Curriculum developers and master educators structure progressive scaffolding so students discover scientific concepts actively rather than memorizing passively.',
      },
    ],
  },
];
