/**
 * The translation dictionary — every user-facing string, in English and
 * Simplified Chinese.
 *
 * `dict.en` is the source of truth: its shape becomes the `Dict` type, and
 * `zh` is declared `: Dict`, so a missing OR misspelt translation is a compile
 * error. Strings are grouped by feature/namespace; parameterised strings are
 * small functions, e.g. `calculator.fromAgeThrough(30, 90)`. Money amounts are
 * passed in pre-formatted (via src/lib/format.ts), so currency stays one place.
 *
 * Read it in:
 *   - server components → `const t = await getDict()`  (see ./server)
 *   - client components → `const t = useDict()`         (see ./provider)
 */

const en = {
  metadata: {
    title: "FireGo — Will your savings last through retirement?",
    description:
      "A calm, honest retirement calculator. See how your savings grow, when you can retire, and whether the money lasts — no hype, no guesswork.",
  },

  language: {
    label: "Language",
    switchTo: (name: string) => `Switch language to ${name}`,
  },

  nav: {
    brandHome: "FireGo home",
    calculator: "Calculator",
    myPlans: "My plans",
    signIn: "Sign in",
    signOut: "Sign out",
    account: "Account",
  },

  home: {
    kicker: "Retirement, honestly",
    title: "Will your savings last through retirement?",
    subtitle:
      "See how your money grows, when you could retire, and whether it lasts — all in today's money, with no hype. Change anything and the answer updates instantly.",
  },

  footer: {
    disclaimer:
      "FireGo gives you projections, not promises. Real returns vary, markets fall as well as rise, and inflation is uncertain — treat every figure here as a careful estimate to plan around, not a guarantee.",
    copyright: (year: number) =>
      `© ${year} FireGo. For education and planning only — not financial advice.`,
  },

  calculator: {
    yourNumbers: "Your numbers",
    adjustHint: "Adjust anything — the results update instantly.",
    savingsOverTime: "Your savings over time",
    fromAgeThrough: (from: number, to: number) =>
      `From age ${from} through age ${to}.`,
  },

  inputs: {
    sectionTimeline: "Your timeline",
    sectionSaving: "Saving up",
    sectionGrowth: "Growth & inflation",
    sectionRetirement: "In retirement",

    currentAge: "Current age",
    retirementAge: "Retirement age",
    planToAge: "Plan until age",
    planToAgeHelper:
      "A planning horizon — how long the money may need to last.",

    currentSavings: "Current savings",
    monthlyContribution: "Monthly contribution",
    monthlyContributionHelper:
      "What you put away each month, in today's money.",
    monthlyIncome: "Monthly income (optional)",
    monthlyIncomeHelper:
      "Only used to work out your pension contribution below.",
    pension: "Pension / employer contribution",
    pensionHelper: "Of your monthly income (employer + employee).",
    yearlyIncrease: "Yearly contribution increase",
    yearlyIncreaseHelper: "Real raises above inflation. Leave at 0 if unsure.",

    expectedReturn: "Expected return (before inflation)",
    expectedReturnHelper: "A broad market average is often 5–8% a year.",
    inflation: "Inflation",
    inflationHelper: "How fast prices rise. Often around 2–3% a year.",

    desiredSpending: "Desired yearly spending",
    desiredSpendingHelper:
      "In today's money — what a year of retirement costs you now.",
    otherIncome: "Other yearly income (optional)",
    otherIncomeHelper:
      "Government pension, annuity, rent… reduces what savings must cover.",

    currency: "Currency",
    yearsSuffix: "yrs",
    pctSuffix: "%",
  },

  results: {
    ariaResults: "Your results",
    onTrack: "On track",
    fallsShort: "Falls short",

    lastsThroughAge: (age: number) => `Your savings last through age ${age}.`,
    leftOver: (amount: string, age: number) =>
      `You'd have roughly ${amount} left over at age ${age} — a comfortable margin.`,
    itsClose: "It's close — your savings cover your plan with little to spare.",
    runsOutAroundAge: (ageText: string) =>
      `Your savings run out around age ${ageText}.`,
    shortfallBody: (yearsText: string, planToAge: number) =>
      `That's about ${yearsText} short of your age-${planToAge} goal. Try saving a little more, spending less, or retiring later.`,

    statAtRetirement: "At retirement",
    statSavedByAge: (age: number) => `saved by age ${age}`,
    statMoneyLastsTo: "Money lasts to",
    statAgePlus: (age: number) => `Age ${age}+`,
    statAgeValue: (ageText: string) => `Age ${ageText}`,
    statFullPlan: "your full plan",
    statShort: (yearsText: string) => `${yearsText} short`,
    statCanSpend: "Can spend / year",
    statPerMoSustainably: (amount: string) => `≈ ${amount}/mo sustainably`,
    statRealReturn: "Real return",
    statPerYearAfterInflation: "a year, after inflation",
  },

  warnings: {
    inflationOutpacesReturn:
      "Your inflation rate is higher than your return, so money loses value in real terms over time.",
    retiredAlready:
      "Your retirement age is at or before your current age, so there's no time left to save — this shows the drawdown only.",
    incomeCoversSpending:
      "Your other retirement income already covers your spending, so your savings are never drawn down.",
  },

  spending: {
    perYr: "/ yr",
    title: "Desired vs. sustainable spending",
    desc: (planToAge: number) =>
      `What you want to spend each year, against the most your savings can keep up through age ${planToAge}.`,
    wantToSpend: "You want to spend",
    savingsSustain: "Your savings sustain",
    headroom: (perYear: string, perMonth: string) =>
      `${perYear}/year to spare — about ${perMonth}/month of headroom.`,
    shortfall: (perYear: string, perMonth: string) =>
      `${perYear}/year short — roughly ${perMonth}/month more than your savings can sustain.`,
  },

  charts: {
    panelAria: "Choose a chart",
    tabBalance: "Balance",
    tabBalanceHint: "Your total savings over your life.",
    tabComposition: "Composition",
    tabCompositionHint:
      "How much of the pot is your deposits vs. investment growth.",
    tabCashflow: "Cash flow",
    tabCashflowHint: "Money paid in each year, then drawn out in retirement.",
    tabScenarios: "Scenarios",
    tabScenariosHint: "How the plan changes if returns are higher or lower.",

    ageLabel: (age: number) => `Age ${age}`,
    retire: (age: number) => `Retire ${age}`,
    runsOut: "Runs out",
    phaseAccumulation: "Accumulation",
    phaseDrawdown: "Drawdown",

    yourDeposits: "Your deposits",
    investmentGrowth: "Investment growth",
    ofPotIsGrowth: (pct: number) => `${pct}% of the pot is growth`,

    noFlow: "No money in or out",
    paidIn: "Paid in",
    takenOut: "Taken out",
    paidInSaving: "Paid in (saving)",
    takenOutRetired: "Taken out (retired)",

    lowerReturns: "Lower returns",
    yourEstimate: "Your estimate",
    higherReturns: "Higher returns",
    lastsWholePlan: "lasts your whole plan",
    runsOutAtAge: (ageText: string) => `runs out ~age ${ageText}`,
    runsOutEarly: "runs out early",
    returnLabel: (pct: string) => `(${pct} return) — `,

    balanceAriaOk: (amount: string, retAge: number, planTo: number) =>
      `A chart showing your savings growing to ${amount} by age ${retAge}, then lasting through age ${planTo}.`,
    balanceAriaFail: (amount: string, retAge: number, depAge: string) =>
      `A chart showing your savings growing to ${amount} by age ${retAge}, then running out around age ${depAge}.`,
    compositionAria: (retAge: number, pct: number, amount: string) =>
      `A stacked chart splitting your savings into your own deposits and investment growth. By age ${retAge}, growth makes up about ${pct}% of your ${amount} pot.`,
    cashflowAria: (retAge: number, planTo: number) =>
      `A bar chart of yearly cash flow: contributions while saving up to age ${retAge}, then withdrawals through age ${planTo}.`,
    scenarioAria: (curAge: number, planTo: number) =>
      `A line chart comparing your savings at a lower, expected, and higher investment return, from age ${curAge} to ${planTo}.`,
  },

  breakdown: {
    show: "Show year-by-year breakdown",
    hide: "Hide year-by-year breakdown",
    colAge: "Age",
    colPhase: "Phase",
    colStart: "Start",
    colAdded: "Added",
    colGrowth: "Growth",
    colTakenOut: "Taken out",
    colEnd: "End",
    phaseSaving: "Saving",
    phaseDrawing: "Drawing",
  },

  disclaimer: {
    heading: "A few honest caveats",
    p1: "These are projections, not predictions. Real returns swing from year to year, and a run of bad years early in retirement (sequence-of-returns risk) can hurt more than the long-run average suggests.",
    p2: "Everything is shown in today's money so the figures stay intuitive. Inflation, taxes, and life rarely move in a straight line — treat this as a starting point and revisit it as things change.",
  },

  savePlan: {
    copyError: "Couldn't copy the link — copy it from the address bar instead.",
    defaultName: "My retirement plan",
    saveError: "Couldn't save. Please try again.",
    networkError: "Network problem — please try again.",
    headingUpdate: "Update this plan",
    headingSave: "Save this scenario",
    subAuthed: "Keep it in your dashboard to revisit later.",
    subUnauthed: "Sign in to keep your scenarios — your numbers come with you.",
    copied: "Copied",
    copyLink: "Copy link",
    planNamePlaceholder: "Plan name",
    update: "Update",
    savePlanBtn: "Save plan",
    signInToSave: "Sign in to save",
    saved: "Saved to your dashboard.",
  },

  auth: {
    loginError: "That email and password don't match. Please try again.",
    or: "or",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    registerError: "Couldn't create your account.",
    name: "Name",
    passwordHelper: "At least 8 characters.",
    createAccount: "Create account",
    continueWithGoogle: "Continue with Google",
  },

  authPages: {
    loginTitle: "Welcome back",
    loginDesc: "Sign in to save your scenarios and revisit them anytime.",
    newHere: "New here?",
    createAnAccount: "Create an account",
    registerTitle: "Create your account",
    registerDesc:
      "Free, and your numbers stay yours. Save as many plans as you like.",
    alreadyHave: "Already have an account?",
    signInLink: "Sign in",
  },

  dashboard: {
    title: "Your plans",
    subtitle: "Scenarios you've saved. Open one to revisit or adjust it.",
    newPlan: "New plan",
    emptyTitle: "No saved plans yet",
    emptyBody:
      'Build a scenario on the calculator, then hit "Save plan" to keep it here and come back to it anytime.',
    openCalculator: "Open the calculator",
    onTrack: "On track",
    short: "Short",
    retireAtPlanTo: (retAge: number, planTo: number) =>
      `Retire at ${retAge}, plan to ${planTo}`,
    atRetirement: "At retirement",
    moneyLastsTo: "Money lasts to",
    agePlus: (age: number) => `Age ${age}+`,
    ageValue: (ageText: string) => `Age ${ageText}`,
    savedScenario: "Saved scenario.",
    open: "Open",
    backToPlans: "Back to plans",
    detailSubtitle: "Adjust anything and hit Update to save your changes.",
  },

  deletePlan: {
    deleteAria: "Delete plan",
    delete: "Delete",
    cancel: "Cancel",
  },

  currencies: {
    RM: "Malaysian Ringgit (RM)",
    $: "US Dollar ($)",
    S$: "Singapore Dollar (S$)",
    "£": "British Pound (£)",
    "€": "Euro (€)",
    "¥": "Yen / Renminbi (¥)",
    "₹": "Indian Rupee (₹)",
    A$: "Australian Dollar (A$)",
  },

  format: {
    years: (n: number) => `${n} ${n === 1 ? "year" : "years"}`,
  },

  validation: {
    retirementBeforeCurrent: "Retirement age can't be before your current age.",
    planAfterRetirement: "Plan-until age has to be after your retirement age.",
    planNameRequired: "Give your plan a name.",
    nameRequired: "Tell us your name.",
    emailInvalid: "Enter a valid email address.",
    passwordMin: "Use at least 8 characters.",
    passwordMax: "That password is too long.",
  },

  api: {
    emailExists: "An account with that email already exists.",
    needSignIn: "You need to be signed in.",
    planNotFound: "Plan not found.",
  },
};

/** The shape every language must satisfy (English is the source of truth). */
export type Dict = typeof en;

const zh: Dict = {
  metadata: {
    title: "FireGo — 你的储蓄够花到退休吗？",
    description:
      "一个冷静、诚实的退休计算器。看看你的储蓄如何增长、何时可以退休，以及钱够不够花——不夸张，不靠猜。",
  },

  language: {
    label: "语言",
    switchTo: (name: string) => `切换语言为 ${name}`,
  },

  nav: {
    brandHome: "FireGo 首页",
    calculator: "计算器",
    myPlans: "我的方案",
    signIn: "登录",
    signOut: "退出登录",
    account: "账户",
  },

  home: {
    kicker: "退休，诚实以对",
    title: "你的储蓄够花到退休吗？",
    subtitle:
      "看看你的钱如何增长、何时可以退休，以及它够不够花——全部以今天的购买力计算，绝不夸大。改动任何数字，结果都会即时更新。",
  },

  footer: {
    disclaimer:
      "FireGo 提供的是预测，而非承诺。真实回报会波动，市场有涨有跌，通货膨胀也难以预料——请把这里的每个数字都当作用于规划的审慎估算，而不是保证。",
    copyright: (year: number) =>
      `© ${year} FireGo。仅供学习与规划之用——并非财务建议。`,
  },

  calculator: {
    yourNumbers: "你的数字",
    adjustHint: "随意调整——结果会即时更新。",
    savingsOverTime: "你的储蓄随时间的变化",
    fromAgeThrough: (from: number, to: number) => `从 ${from} 岁到 ${to} 岁。`,
  },

  inputs: {
    sectionTimeline: "你的时间线",
    sectionSaving: "积累阶段",
    sectionGrowth: "增长与通胀",
    sectionRetirement: "退休阶段",

    currentAge: "当前年龄",
    retirementAge: "退休年龄",
    planToAge: "规划到的年龄",
    planToAgeHelper: "一个规划期限——这笔钱可能需要支撑多久。",

    currentSavings: "当前储蓄",
    monthlyContribution: "每月投入",
    monthlyContributionHelper: "你每月存下的金额，以今天的购买力计算。",
    monthlyIncome: "每月收入（选填）",
    monthlyIncomeHelper: "仅用于计算下方的退休金供款。",
    pension: "退休金 / 雇主供款",
    pensionHelper: "占你每月收入的比例（雇主 + 雇员）。",
    yearlyIncrease: "每年投入增幅",
    yearlyIncreaseHelper: "高于通胀的实际加薪。不确定就保持 0。",

    expectedReturn: "预期回报（扣除通胀前）",
    expectedReturnHelper: "大盘平均通常为每年 5–8%。",
    inflation: "通货膨胀",
    inflationHelper: "物价上涨的速度。通常约为每年 2–3%。",

    desiredSpending: "期望的每年支出",
    desiredSpendingHelper: "以今天的购买力计算——现在过一年退休生活要花多少。",
    otherIncome: "其他每年收入（选填）",
    otherIncomeHelper: "政府退休金、年金、租金……可减少储蓄需要承担的部分。",

    currency: "货币",
    yearsSuffix: "岁",
    pctSuffix: "%",
  },

  results: {
    ariaResults: "你的结果",
    onTrack: "进展顺利",
    fallsShort: "可能不够",

    lastsThroughAge: (age: number) => `你的储蓄可以支撑到 ${age} 岁。`,
    leftOver: (amount: string, age: number) =>
      `到 ${age} 岁时你大约还会剩下 ${amount}——余裕相当充足。`,
    itsClose: "很接近——你的储蓄刚好够用，几乎没有余裕。",
    runsOutAroundAge: (ageText: string) => `你的储蓄大约在 ${ageText} 岁用尽。`,
    shortfallBody: (yearsText: string, planToAge: number) =>
      `这比你 ${planToAge} 岁的目标大约短缺 ${yearsText}。可以试着多存一点、少花一点，或推迟退休。`,

    statAtRetirement: "退休时",
    statSavedByAge: (age: number) => `到 ${age} 岁累计`,
    statMoneyLastsTo: "钱可支撑到",
    statAgePlus: (age: number) => `${age} 岁以上`,
    statAgeValue: (ageText: string) => `${ageText} 岁`,
    statFullPlan: "覆盖你的整个规划",
    statShort: (yearsText: string) => `短缺 ${yearsText}`,
    statCanSpend: "每年可支出",
    statPerMoSustainably: (amount: string) => `≈ 每月 ${amount}（可持续）`,
    statRealReturn: "实际回报",
    statPerYearAfterInflation: "每年，扣除通胀后",
  },

  warnings: {
    inflationOutpacesReturn:
      "你的通胀率高于回报率，因此随着时间推移，钱的实际价值会缩水。",
    retiredAlready:
      "你的退休年龄等于或早于当前年龄，已没有时间继续积累——这里只显示支取阶段。",
    incomeCoversSpending:
      "你的其他退休收入已经覆盖了支出，因此储蓄不会被动用。",
  },

  spending: {
    perYr: "/ 年",
    title: "期望支出 vs. 可持续支出",
    desc: (planToAge: number) =>
      `你想要的每年支出，与你的储蓄能支撑到 ${planToAge} 岁的最高支出对比。`,
    wantToSpend: "你想花的",
    savingsSustain: "储蓄能支撑的",
    headroom: (perYear: string, perMonth: string) =>
      `每年富余 ${perYear}——约相当于每月 ${perMonth} 的余裕。`,
    shortfall: (perYear: string, perMonth: string) =>
      `每年短缺 ${perYear}——比你的储蓄所能支撑的每月支出大约多出 ${perMonth}。`,
  },

  charts: {
    panelAria: "选择图表",
    tabBalance: "余额",
    tabBalanceHint: "你一生的储蓄总额。",
    tabComposition: "构成",
    tabCompositionHint: "储蓄中有多少是你的本金投入，多少是投资增长。",
    tabCashflow: "现金流",
    tabCashflowHint: "每年投入的钱，以及退休后取出的钱。",
    tabScenarios: "情景",
    tabScenariosHint: "回报更高或更低时，方案会如何变化。",

    ageLabel: (age: number) => `${age} 岁`,
    retire: (age: number) => `${age} 岁退休`,
    runsOut: "用尽",
    phaseAccumulation: "积累",
    phaseDrawdown: "支取",

    yourDeposits: "你的本金投入",
    investmentGrowth: "投资增长",
    ofPotIsGrowth: (pct: number) => `储蓄中 ${pct}% 来自增长`,

    noFlow: "没有资金进出",
    paidIn: "投入",
    takenOut: "取出",
    paidInSaving: "投入（积累）",
    takenOutRetired: "取出（退休）",

    lowerReturns: "较低回报",
    yourEstimate: "你的估算",
    higherReturns: "较高回报",
    lastsWholePlan: "可支撑整个规划",
    runsOutAtAge: (ageText: string) => `约在 ${ageText} 岁用尽`,
    runsOutEarly: "提前用尽",
    returnLabel: (pct: string) => `（${pct} 回报）—— `,

    balanceAriaOk: (amount: string, retAge: number, planTo: number) =>
      `一张图表，显示你的储蓄增长到 ${retAge} 岁时的 ${amount}，随后一直支撑到 ${planTo} 岁。`,
    balanceAriaFail: (amount: string, retAge: number, depAge: string) =>
      `一张图表，显示你的储蓄增长到 ${retAge} 岁时的 ${amount}，随后大约在 ${depAge} 岁用尽。`,
    compositionAria: (retAge: number, pct: number, amount: string) =>
      `一张堆叠图表，将你的储蓄分为本金投入和投资增长两部分。到 ${retAge} 岁时，增长约占你 ${amount} 储蓄的 ${pct}%。`,
    cashflowAria: (retAge: number, planTo: number) =>
      `一张每年现金流的柱状图：在 ${retAge} 岁之前积累时的投入，以及之后到 ${planTo} 岁的取出。`,
    scenarioAria: (curAge: number, planTo: number) =>
      `一张折线图，对比在较低、预期和较高投资回报下你的储蓄，从 ${curAge} 岁到 ${planTo} 岁。`,
  },

  breakdown: {
    show: "显示逐年明细",
    hide: "隐藏逐年明细",
    colAge: "年龄",
    colPhase: "阶段",
    colStart: "期初",
    colAdded: "投入",
    colGrowth: "增长",
    colTakenOut: "取出",
    colEnd: "期末",
    phaseSaving: "储蓄中",
    phaseDrawing: "支取中",
  },

  disclaimer: {
    heading: "几点诚实的提醒",
    p1: "这些是预测，而非预言。真实回报年年波动，而退休初期连续几年表现不佳（回报顺序风险）所造成的伤害，可能比长期平均所暗示的更大。",
    p2: "所有数字都以今天的购买力显示，以便直观理解。通胀、税收和生活很少沿直线发展——请把这当作一个起点，并随情况变化时不时回来更新。",
  },

  savePlan: {
    copyError: "无法复制链接——请改从地址栏复制。",
    defaultName: "我的退休方案",
    saveError: "保存失败，请重试。",
    networkError: "网络出现问题——请重试。",
    headingUpdate: "更新此方案",
    headingSave: "保存此情景",
    subAuthed: "保存到你的面板，方便日后回顾。",
    subUnauthed: "登录即可保存你的情景——你输入的数字会一并带过去。",
    copied: "已复制",
    copyLink: "复制链接",
    planNamePlaceholder: "方案名称",
    update: "更新",
    savePlanBtn: "保存方案",
    signInToSave: "登录以保存",
    saved: "已保存到你的面板。",
  },

  auth: {
    loginError: "邮箱和密码不匹配，请重试。",
    or: "或",
    email: "邮箱",
    password: "密码",
    signIn: "登录",
    registerError: "无法创建你的账户。",
    name: "姓名",
    passwordHelper: "至少 8 个字符。",
    createAccount: "创建账户",
    continueWithGoogle: "使用 Google 继续",
  },

  authPages: {
    loginTitle: "欢迎回来",
    loginDesc: "登录以保存你的情景，随时回来查看。",
    newHere: "第一次来？",
    createAnAccount: "创建账户",
    registerTitle: "创建你的账户",
    registerDesc: "免费，你的数字始终属于你。想保存多少方案都可以。",
    alreadyHave: "已经有账户了？",
    signInLink: "登录",
  },

  dashboard: {
    title: "我的方案",
    subtitle: "你保存的情景。打开任意一个即可回顾或调整。",
    newPlan: "新建方案",
    emptyTitle: "还没有保存的方案",
    emptyBody:
      "在计算器上建立一个情景，然后点击“保存方案”，把它留在这里随时回来查看。",
    openCalculator: "打开计算器",
    onTrack: "进展顺利",
    short: "不足",
    retireAtPlanTo: (retAge: number, planTo: number) =>
      `${retAge} 岁退休，规划到 ${planTo} 岁`,
    atRetirement: "退休时",
    moneyLastsTo: "钱可支撑到",
    agePlus: (age: number) => `${age} 岁以上`,
    ageValue: (ageText: string) => `${ageText} 岁`,
    savedScenario: "已保存的情景。",
    open: "打开",
    backToPlans: "返回方案列表",
    detailSubtitle: "随意调整，然后点击“更新”保存你的改动。",
  },

  deletePlan: {
    deleteAria: "删除方案",
    delete: "删除",
    cancel: "取消",
  },

  currencies: {
    RM: "马来西亚林吉特 (RM)",
    $: "美元 ($)",
    S$: "新加坡元 (S$)",
    "£": "英镑 (£)",
    "€": "欧元 (€)",
    "¥": "日元 / 人民币 (¥)",
    "₹": "印度卢比 (₹)",
    A$: "澳大利亚元 (A$)",
  },

  format: {
    years: (n: number) => `${n} 年`,
  },

  validation: {
    retirementBeforeCurrent: "退休年龄不能早于当前年龄。",
    planAfterRetirement: "规划到的年龄必须晚于退休年龄。",
    planNameRequired: "请给你的方案取个名字。",
    nameRequired: "请告诉我们你的名字。",
    emailInvalid: "请输入有效的邮箱地址。",
    passwordMin: "请至少使用 8 个字符。",
    passwordMax: "这个密码太长了。",
  },

  api: {
    emailExists: "该邮箱已注册账户。",
    needSignIn: "你需要先登录。",
    planNotFound: "未找到该方案。",
  },
};

export const dict: Record<"en" | "zh", Dict> = { en, zh };
