export type ResourceType = 'video' | 'course' | 'article' | 'practice' | 'project';

export interface Resource {
  title: string;
  type: ResourceType;
  hours: number;
  url?: string;
}

export interface Skill {
  id: string;
  title: string;
  summary: string;
  resources: Resource[];
}

export interface RoadmapStage {
  id: string;
  title: string;
  goal: string;
  skills: Skill[];
}

export interface Roadmap {
  key: string;
  role: string;
  stages: RoadmapStage[];
}

const SOFTWARE: RoadmapStage[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    goal: 'Write code and use the tools every developer needs.',
    skills: [
      {
        id: 'web-basics',
        title: 'How the web works · HTML & CSS',
        summary: 'Structure and style pages, understand requests and responses.',
        resources: [
          { title: 'MDN — Learn web development', type: 'article', hours: 10, url: 'https://developer.mozilla.org/en-US/docs/Learn' },
          { title: 'freeCodeCamp — Responsive Web Design', type: 'practice', hours: 12, url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/' },
        ],
      },
      {
        id: 'programming-fundamentals',
        title: 'Programming fundamentals with JavaScript',
        summary: 'Variables, control flow, functions, arrays, objects, DOM.',
        resources: [
          { title: 'javascript.info — The Modern JavaScript Tutorial', type: 'article', hours: 14, url: 'https://javascript.info/' },
          { title: 'freeCodeCamp — JavaScript Algorithms & Data Structures', type: 'practice', hours: 16, url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/' },
        ],
      },
      {
        id: 'git-cli',
        title: 'Version control with Git & GitHub',
        summary: 'Branches, commits, pull requests, resolving conflicts.',
        resources: [
          { title: 'Atlassian — Git tutorials', type: 'article', hours: 5, url: 'https://www.atlassian.com/git/tutorials' },
          { title: 'Push a small project to GitHub', type: 'project', hours: 3 },
        ],
      },
    ],
  },
  {
    id: 'core',
    title: 'Core skills',
    goal: 'Build real, full-stack applications.',
    skills: [
      {
        id: 'dsa',
        title: 'Data structures & algorithms',
        summary: 'Arrays, hashmaps, recursion, big-O, common patterns.',
        resources: [
          { title: 'GeeksforGeeks — Data Structures', type: 'article', hours: 12, url: 'https://www.geeksforgeeks.org/data-structures/' },
          { title: 'LeetCode — Easy problem set', type: 'practice', hours: 20, url: 'https://leetcode.com/problemset/' },
        ],
      },
      {
        id: 'frontend-framework',
        title: 'Front-end with React',
        summary: 'Components, state, hooks, data fetching, routing.',
        resources: [
          { title: 'react.dev — Learn React', type: 'article', hours: 14, url: 'https://react.dev/learn' },
          { title: 'Build a React app with an API', type: 'project', hours: 12 },
        ],
      },
      {
        id: 'backend-apis',
        title: 'Back-end & REST APIs',
        summary: 'HTTP, routing, auth, request validation, deployment.',
        resources: [
          { title: 'roadmap.sh — Backend developer path', type: 'article', hours: 8, url: 'https://roadmap.sh/backend' },
          { title: 'Build and deploy a REST API', type: 'project', hours: 14 },
        ],
      },
      {
        id: 'databases',
        title: 'Databases & SQL',
        summary: 'Schema design, queries, joins, indexes.',
        resources: [
          { title: 'SQLBolt — Interactive SQL lessons', type: 'practice', hours: 6, url: 'https://sqlbolt.com/' },
          { title: 'Add a database to your API', type: 'project', hours: 6 },
        ],
      },
    ],
  },
  {
    id: 'job-ready',
    title: 'Job-ready',
    goal: 'Be ready to apply and pass interviews.',
    skills: [
      {
        id: 'portfolio',
        title: 'Portfolio projects',
        summary: 'Two polished full-stack apps you can talk about in depth.',
        resources: [{ title: 'Ship 2 full-stack projects with README + live demo', type: 'project', hours: 30 }],
      },
      {
        id: 'system-design',
        title: 'System design basics',
        summary: 'Caching, load balancing, databases at scale, trade-offs.',
        resources: [{ title: 'System Design Primer (GitHub)', type: 'article', hours: 10, url: 'https://github.com/donnemartin/system-design-primer' }],
      },
      {
        id: 'interview-prep',
        title: 'Coding interview preparation',
        summary: 'Pattern practice and mock interviews.',
        resources: [
          { title: 'LeetCode — Top Interview 150', type: 'practice', hours: 20, url: 'https://leetcode.com/studyplan/top-interview-150/' },
          { title: 'Mock interviews on Pramp', type: 'practice', hours: 6, url: 'https://www.pramp.com/' },
        ],
      },
    ],
  },
];

const DATA: RoadmapStage[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    goal: 'Get comfortable working with data and numbers.',
    skills: [
      {
        id: 'spreadsheets',
        title: 'Spreadsheets (Excel / Google Sheets)',
        summary: 'Formulas, pivot tables, lookups, cleaning messy data.',
        resources: [
          { title: 'Google — Sheets training & help', type: 'article', hours: 6, url: 'https://support.google.com/docs/answer/6282736' },
          { title: 'Analyse a real dataset in a spreadsheet', type: 'project', hours: 4 },
        ],
      },
      {
        id: 'statistics',
        title: 'Statistics & probability',
        summary: 'Distributions, averages, variance, correlation, sampling.',
        resources: [{ title: 'Khan Academy — Statistics & Probability', type: 'course', hours: 16, url: 'https://www.khanacademy.org/math/statistics-probability' }],
      },
      {
        id: 'sql-basics',
        title: 'SQL for analysis',
        summary: 'SELECT, WHERE, GROUP BY, JOINs, subqueries.',
        resources: [
          { title: 'SQLBolt — Interactive SQL lessons', type: 'practice', hours: 6, url: 'https://sqlbolt.com/' },
          { title: 'Mode — SQL Tutorial', type: 'article', hours: 8, url: 'https://mode.com/sql-tutorial/' },
        ],
      },
    ],
  },
  {
    id: 'core',
    title: 'Core skills',
    goal: 'Analyse and visualise data end to end.',
    skills: [
      {
        id: 'python-data',
        title: 'Python for data analysis',
        summary: 'pandas, cleaning, grouping, merging, notebooks.',
        resources: [
          { title: 'Kaggle Learn — Python', type: 'course', hours: 7, url: 'https://www.kaggle.com/learn/python' },
          { title: 'Kaggle Learn — Pandas', type: 'course', hours: 8, url: 'https://www.kaggle.com/learn/pandas' },
        ],
      },
      {
        id: 'data-viz',
        title: 'Data visualisation',
        summary: 'Choosing charts, telling a story, dashboards.',
        resources: [
          { title: 'Kaggle Learn — Data Visualization', type: 'course', hours: 6, url: 'https://www.kaggle.com/learn/data-visualization' },
          { title: 'Build a dashboard from a dataset', type: 'project', hours: 8 },
        ],
      },
      {
        id: 'bi-tools',
        title: 'BI tools (Power BI / Looker Studio)',
        summary: 'Data models, measures, interactive reports.',
        resources: [
          { title: 'Microsoft Learn — Power BI', type: 'course', hours: 10, url: 'https://learn.microsoft.com/en-us/training/powerplatform/power-bi' },
          { title: 'Recreate a business report in a BI tool', type: 'project', hours: 6 },
        ],
      },
    ],
  },
  {
    id: 'job-ready',
    title: 'Job-ready',
    goal: 'Have a portfolio and be ready for analytics interviews.',
    skills: [
      {
        id: 'ml-intro',
        title: 'Intro to machine learning',
        summary: 'Train/test split, regression, classification, evaluation.',
        resources: [{ title: 'Kaggle Learn — Intro to Machine Learning', type: 'course', hours: 7, url: 'https://www.kaggle.com/learn/intro-to-machine-learning' }],
      },
      {
        id: 'projects',
        title: 'Portfolio analyses',
        summary: 'Two end-to-end analyses on real, messy data.',
        resources: [
          { title: 'Publish 2 end-to-end analyses (question → data → insight)', type: 'project', hours: 24 },
          { title: 'Enter a Kaggle competition', type: 'practice', hours: 10, url: 'https://www.kaggle.com/competitions' },
        ],
      },
      {
        id: 'case-prep',
        title: 'Analytics case & SQL interview prep',
        summary: 'Business cases, SQL under time pressure, metrics thinking.',
        resources: [{ title: 'LeetCode — SQL 50 study plan', type: 'practice', hours: 14, url: 'https://leetcode.com/studyplan/top-sql-50/' }],
      },
    ],
  },
];

const DESIGN: RoadmapStage[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    goal: 'Understand what makes a design work.',
    skills: [
      {
        id: 'design-principles',
        title: 'Visual design principles',
        summary: 'Hierarchy, spacing, contrast, alignment, consistency.',
        resources: [
          { title: 'Figma — Resource library', type: 'article', hours: 8, url: 'https://www.figma.com/resource-library/' },
          { title: 'Material Design — Guidelines', type: 'article', hours: 8, url: 'https://m3.material.io/' },
        ],
      },
      {
        id: 'figma',
        title: 'Figma from scratch',
        summary: 'Frames, components, auto-layout, styles.',
        resources: [
          { title: 'Figma — Help Center & Learn', type: 'article', hours: 6, url: 'https://help.figma.com/hc/en-us' },
          { title: 'Rebuild an existing app screen in Figma', type: 'project', hours: 6 },
        ],
      },
      {
        id: 'typography-color',
        title: 'Typography & colour',
        summary: 'Type scale, pairing, colour systems, accessibility.',
        resources: [
          { title: 'Smashing Magazine — Design articles', type: 'article', hours: 6, url: 'https://www.smashingmagazine.com/category/design/' },
          { title: 'Build a type scale and palette', type: 'practice', hours: 3, url: 'https://typescale.com/' },
        ],
      },
    ],
  },
  {
    id: 'core',
    title: 'Core skills',
    goal: 'Run a full design process.',
    skills: [
      {
        id: 'ux-process',
        title: 'UX process & user research',
        summary: 'Problem framing, interviews, journey maps, testing.',
        resources: [
          { title: 'Nielsen Norman Group — Articles', type: 'article', hours: 12, url: 'https://www.nngroup.com/articles/' },
          { title: 'Run 3 user interviews and synthesise', type: 'project', hours: 6 },
        ],
      },
      {
        id: 'wireframing',
        title: 'Wireframing & prototyping',
        summary: 'Low- to high-fidelity, interactive prototypes.',
        resources: [
          { title: 'Figma — Prototyping docs', type: 'article', hours: 5, url: 'https://help.figma.com/hc/en-us/articles/360040314193' },
          { title: 'Prototype a 5-screen flow', type: 'project', hours: 10 },
        ],
      },
      {
        id: 'design-systems',
        title: 'Design systems & components',
        summary: 'Reusable components, tokens, documentation.',
        resources: [
          { title: 'Material / Figma — Design system docs', type: 'article', hours: 6, url: 'https://m3.material.io/foundations' },
          { title: 'Build a mini design system', type: 'project', hours: 8 },
        ],
      },
    ],
  },
  {
    id: 'job-ready',
    title: 'Job-ready',
    goal: 'Have a portfolio that gets interviews.',
    skills: [
      {
        id: 'case-studies',
        title: 'Portfolio case studies',
        summary: 'Two to three deep case studies: problem, process, outcome.',
        resources: [{ title: 'Write 2–3 polished case studies', type: 'project', hours: 30 }],
      },
      {
        id: 'handoff',
        title: 'Design-to-dev handoff & HTML/CSS basics',
        summary: 'Specs, tokens, and enough code to speak developers’ language.',
        resources: [{ title: 'MDN — Learn web development (HTML/CSS)', type: 'article', hours: 8, url: 'https://developer.mozilla.org/en-US/docs/Learn' }],
      },
      {
        id: 'portfolio-site',
        title: 'Portfolio site',
        summary: 'Publish your work somewhere shareable.',
        resources: [{ title: 'Build and publish your portfolio site', type: 'project', hours: 10 }],
      },
    ],
  },
];

const GENERIC: RoadmapStage[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    goal: 'Build the basics every employer expects.',
    skills: [
      {
        id: 'communication',
        title: 'Communication skills',
        summary: 'Writing clearly, presenting, email and meeting etiquette.',
        resources: [{ title: 'Coursera — Improving Communication Skills', type: 'course', hours: 10, url: 'https://www.coursera.org/learn/wharton-communication-skills' }],
      },
      {
        id: 'digital-literacy',
        title: 'Core digital & office tools',
        summary: 'Docs, sheets, slides, collaboration tools.',
        resources: [{ title: 'Google / Microsoft — Productivity training', type: 'article', hours: 6, url: 'https://support.google.com/a/users/answer/9282664' }],
      },
      {
        id: 'domain-skill',
        title: 'Pick one technical skill for your field',
        summary: 'Choose a concrete skill aligned with your interests and start.',
        resources: [{ title: 'Choose a skill track and complete an intro course', type: 'project', hours: 12 }],
      },
    ],
  },
  {
    id: 'core',
    title: 'Core skills',
    goal: 'Turn learning into proof.',
    skills: [
      {
        id: 'portfolio',
        title: 'Portfolio / GitHub presence',
        summary: 'Two projects that show what you can do.',
        resources: [
          { title: 'GitHub — Getting started guides', type: 'article', hours: 4, url: 'https://docs.github.com/en/get-started' },
          { title: 'Publish 2 projects with documentation', type: 'project', hours: 16 },
        ],
      },
      {
        id: 'resume-linkedin',
        title: 'Resume & LinkedIn',
        summary: 'A results-focused resume and a complete LinkedIn profile.',
        resources: [
          { title: 'Novoresume — How to write a resume', type: 'article', hours: 4, url: 'https://novoresume.com/career-blog/how-to-write-a-resume' },
          { title: 'Rewrite your resume + LinkedIn profile', type: 'project', hours: 4 },
        ],
      },
      {
        id: 'aptitude',
        title: 'Aptitude & reasoning',
        summary: 'Quantitative, logical and verbal reasoning practice.',
        resources: [{ title: 'IndiaBix — Aptitude practice', type: 'practice', hours: 12, url: 'https://www.indiabix.com/' }],
      },
    ],
  },
  {
    id: 'job-ready',
    title: 'Job-ready',
    goal: 'Apply with confidence.',
    skills: [
      {
        id: 'interview',
        title: 'Interview preparation',
        summary: 'Behavioural answers, role-specific questions, mock rounds.',
        resources: [
          { title: 'Practice mock interviews (peer or platform)', type: 'practice', hours: 8, url: 'https://www.pramp.com/' },
          { title: 'Prepare 8 STAR-format stories', type: 'project', hours: 4 },
        ],
      },
      {
        id: 'networking',
        title: 'Networking & internships',
        summary: 'Reaching out, referrals, tracking applications.',
        resources: [{ title: 'Reach out to 10 people and apply to 10 roles', type: 'project', hours: 8 }],
      },
      {
        id: 'capstone',
        title: 'Capstone project',
        summary: 'One substantial project taken end to end.',
        resources: [{ title: 'Plan, build and present a capstone project', type: 'project', hours: 20 }],
      },
    ],
  },
];

const ROADMAPS: Record<string, { role: string; stages: RoadmapStage[] }> = {
  software: { role: 'Software Engineer', stages: SOFTWARE },
  data: { role: 'Data Analyst', stages: DATA },
  design: { role: 'UI/UX Designer', stages: DESIGN },
  generic: { role: 'your target role', stages: GENERIC },
};

export function pickRoadmapKey(role: string | undefined, interests: string[] = []): string {
  const r = (role ?? '').toLowerCase();
  if (/data|analyst|scientist|analytics|machine learning|\bml\b|\bai\b/.test(r)) return 'data';
  if (/design|\bux\b|\bui\b|graphic|product designer/.test(r)) return 'design';
  if (/developer|engineer|software|web|frontend|front-end|backend|back-end|full.?stack|programmer|coding/.test(r)) return 'software';
  if (interests.includes('Data & Numbers')) return 'data';
  if (interests.includes('Design & Creativity')) return 'design';
  if (interests.includes('Coding & Tech')) return 'software';
  return 'generic';
}

export function getRoadmap(role: string | undefined, interests: string[] = []): Roadmap {
  const key = pickRoadmapKey(role, interests);
  const base = ROADMAPS[key];
  return {
    key,
    role: role?.trim() || base.role,
    stages: base.stages,
  };
}

export function skillHours(skill: Skill): number {
  return skill.resources.reduce((sum, r) => sum + r.hours, 0);
}
