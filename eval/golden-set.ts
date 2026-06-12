export interface GoldenSample {
  id: string;
  label: string;
  contentType: string;
  content: string;
  expectedFindings: Array<{
    ruleId: string;
    severity: "BLOCKER" | "WARNING" | "INFO";
  }>;
  expectedClean: boolean; // true if no BLOCKERs expected
}

export const GOLDEN_SET: GoldenSample[] = [
  // ── CLEAN SAMPLES (no BLOCKERs) ─────────────────────────────────────────
  {
    id: "G001",
    label: "Clean LinkedIn — Balanced fiduciary post",
    contentType: "linkedin_post",
    content: `Thinking about retirement income planning? It's never too early to start.

At our firm, we work with clients to build diversified income strategies—Social Security optimization, portfolio drawdown plans, and where appropriate, guaranteed income products like annuities. Every situation is different, and there's no one-size-fits-all answer.

Investing involves risk, including the possible loss of principal. Past performance is not indicative of future results. I'm a registered investment adviser. Happy to connect if you have questions.`,
    expectedFindings: [],
    expectedClean: true,
  },
  {
    id: "G002",
    label: "Clean Email — Market volatility update",
    contentType: "client_email",
    content: `Dear Client,

Markets have been volatile this quarter, and I wanted to check in. Your portfolio is positioned according to the risk tolerance and time horizon we established in your financial plan.

While short-term fluctuations can be unsettling, we believe disciplined long-term investing remains the most effective approach for most investors. That said, your situation is unique.

If your circumstances have changed or you'd like to revisit your allocation, please schedule a call.

Investing involves risk, including the possible loss of principal.

Best,
James Morrison, CFP`,
    expectedFindings: [],
    expectedClean: true,
  },
  {
    id: "G003",
    label: "Clean Website — About page with proper disclosures",
    contentType: "website_copy",
    content: `Welcome to Morrison Financial Group.

We provide fee-only financial planning and investment management for individuals and families. As a fiduciary, we are legally and ethically required to act in your best interest.

Our services include retirement planning, tax-efficient investing, estate planning coordination, and risk management. We do not sell products on commission.

Morrison Financial Group is a registered investment adviser with the SEC. Please review our Form ADV Part 2A for full disclosure of our services, fees, conflicts of interest, and disciplinary history. Investing involves risk, including the possible loss of principal.`,
    expectedFindings: [],
    expectedClean: true,
  },
  {
    id: "G004",
    label: "Clean Flyer — Retirement seminar with balanced language",
    contentType: "seminar_flyer",
    content: `FREE SEMINAR: Retirement Income Strategies for 2025

Join us for an educational workshop covering:
• Social Security timing strategies
• Medicare enrollment basics
• Portfolio withdrawal strategies
• Long-term care planning options

This seminar is educational in nature. We will not be selling any products. All attendees receive a complimentary 30-minute consultation.

Past performance of any investment strategy discussed is not indicative of future results. Investing involves risk, including the possible loss of principal. Morrison Financial Group is a registered investment adviser.

Register at: morrisonfinancial.com/seminar`,
    expectedFindings: [],
    expectedClean: true,
  },
  {
    id: "G005",
    label: "Clean — Negated guarantee ('no guarantees in investing')",
    contentType: "linkedin_post",
    content: `Let's be honest: there are no guarantees in investing. Anyone who tells you otherwise is selling something.

What we can offer is a disciplined process, transparent fees, and a commitment to keeping your interests first. That's it. If you're looking for someone who overpromises, I'm not your advisor. If you want someone who tells you the truth—let's talk.`,
    expectedFindings: [],
    expectedClean: true,
  },

  // ── WARNING SAMPLES ──────────────────────────────────────────────────────
  {
    id: "G006",
    label: "Warning — Past performance without disclosure",
    contentType: "linkedin_post",
    content: `Our growth strategy has outperformed the S&P 500 in 7 of the last 10 years. This disciplined approach focuses on quality companies with strong balance sheets and durable competitive advantages.

If you're interested in learning more about our investment philosophy, I'd love to connect.`,
    expectedFindings: [
      { ruleId: "PERF-003", severity: "WARNING" },
      { ruleId: "COMP-001", severity: "WARNING" },
    ],
    expectedClean: false,
  },
  {
    id: "G007",
    label: "Warning — Urgency language (limited spots)",
    contentType: "seminar_flyer",
    content: `TAX STRATEGIES WORKSHOP — Only 15 spots available!

Join us for an in-depth look at Roth conversion strategies, tax-loss harvesting, and charitable giving techniques that can reduce your tax burden.

Don't miss this opportunity—register today before spots fill up.

Acme Wealth Management | Registered Investment Adviser
Investing involves risk.`,
    expectedFindings: [
      { ruleId: "URG-001", severity: "WARNING" },
    ],
    expectedClean: false,
  },
  {
    id: "G008",
    label: "Warning — Superlative without substantiation",
    contentType: "website_copy",
    content: `As the top-rated wealth management firm in Phoenix, we pride ourselves on delivering exceptional client service and investment results.

Our team of experienced advisors manages over $800 million in client assets. We specialize in retirement planning, tax optimization, and estate planning.

Investing involves risk, including the possible loss of principal. Past performance is not indicative of future results.`,
    expectedFindings: [
      { ruleId: "SUPR-001", severity: "WARNING" },
    ],
    expectedClean: false,
  },
  {
    id: "G009",
    label: "Warning — Testimonial without disclosure",
    contentType: "linkedin_post",
    content: `I'm proud to share some kind words from a long-time client:

"Working with Sarah has completely transformed how I think about money. I feel so much more confident about my retirement now." — David R., retired teacher

If you're ready for that same peace of mind, let's schedule a conversation.

Acme Wealth Management | Registered Investment Adviser`,
    expectedFindings: [
      { ruleId: "TEST-001", severity: "BLOCKER" },
    ],
    expectedClean: false,
  },
  {
    id: "G010",
    label: "Warning — Missing risk disclosure with security mention",
    contentType: "client_email",
    content: `Dear Client,

Given your time horizon and income needs, I recommend adding a REIT allocation to your portfolio. REITs historically provide strong dividend income and can serve as an inflation hedge.

I've attached a proposal for your review. Please let me know if you'd like to discuss.

Best,
Sarah Chen`,
    expectedFindings: [
      { ruleId: "DISC-001", severity: "WARNING" },
    ],
    expectedClean: false,
  },

  // ── BLOCKER SAMPLES ──────────────────────────────────────────────────────
  {
    id: "G011",
    label: "BLOCKER — Explicit guarantee of returns",
    contentType: "linkedin_post",
    content: `Are you tired of the market's ups and downs? Our managed income strategy offers guaranteed returns of 7% annually—no matter what markets do.

Join over 200 satisfied clients who've locked in reliable, risk-free income for retirement. Schedule your complimentary consultation today.`,
    expectedFindings: [
      { ruleId: "GUAR-001", severity: "BLOCKER" },
      { ruleId: "PERF-001", severity: "BLOCKER" },
    ],
    expectedClean: false,
  },
  {
    id: "G012",
    label: "BLOCKER — 'Can't lose' language",
    contentType: "client_email",
    content: `Dear Prospect,

I wanted to follow up on our conversation about the structured note program I mentioned. With this strategy, you simply can't lose your principal—it's protected by the issuing bank. And you still participate in market upside up to the cap.

This is the kind of risk-free solution most investors are looking for. Let me know if you'd like to move forward.`,
    expectedFindings: [
      { ruleId: "GUAR-001", severity: "BLOCKER" },
    ],
    expectedClean: false,
  },
  {
    id: "G013",
    label: "BLOCKER — Will return specific percentage",
    contentType: "seminar_flyer",
    content: `DISCOVER THE STRATEGY THAT WILL RETURN 15% IN 2025

Our proprietary algorithm has identified market inefficiencies that our clients can exploit. Attendees at our last seminar who followed the strategy averaged 15% returns. Expect similar results this year.

Join us January 15th. Limited seating.`,
    expectedFindings: [
      { ruleId: "PERF-001", severity: "BLOCKER" },
      { ruleId: "PERF-002", severity: "WARNING" },
    ],
    expectedClean: false,
  },
  {
    id: "G014",
    label: "BLOCKER — Promise: 'you will earn'",
    contentType: "client_email",
    content: `Dear Client,

I'm reaching out about a new bond ladder strategy I've been putting clients into. With current rates, you will earn between 5.2% and 6.1% annually with virtually no credit risk.

This is an excellent opportunity to lock in strong yields before rates come down. I can have the account set up within a week.`,
    expectedFindings: [
      { ruleId: "GUAR-002", severity: "BLOCKER" },
    ],
    expectedClean: false,
  },
  {
    id: "G015",
    label: "BLOCKER — Double your money claim",
    contentType: "seminar_flyer",
    content: `HOW TO DOUBLE YOUR MONEY IN 5 YEARS

Our clients who followed our growth model portfolio have doubled their investment in under 5 years. Come learn the same strategies the wealthy use to build generational wealth.

Saturday, February 3rd | Free Admission | Refreshments Provided`,
    expectedFindings: [
      { ruleId: "PERF-001", severity: "BLOCKER" },
    ],
    expectedClean: false,
  },

  // ── MIXED / COMPLEX SAMPLES ───────────────────────────────────────────────
  {
    id: "G016",
    label: "Complex — Multiple categories violated",
    contentType: "seminar_flyer",
    content: `THE #1 RETIREMENT INCOME WORKSHOP IN PHOENIX

"I retired 3 years early because of what I learned at this seminar." — Patricia M., Client

Our top-rated advisors will show you how to generate guaranteed income streams you can't outlive. Our clients have averaged 9% annual returns over the past decade.

ACT NOW — Only 8 spots left! This offer expires Friday.

Call 602-555-0100 today. Don't wait until it's too late.`,
    expectedFindings: [
      { ruleId: "SUPR-001", severity: "WARNING" },
      { ruleId: "TEST-001", severity: "BLOCKER" },
      { ruleId: "GUAR-001", severity: "BLOCKER" },
      { ruleId: "PERF-002", severity: "WARNING" },
      { ruleId: "URG-001", severity: "WARNING" },
    ],
    expectedClean: false,
  },
  {
    id: "G017",
    label: "Complex — Cherry-picked performance without disclosure",
    contentType: "linkedin_post",
    content: `In 2021, our growth portfolio returned 34%. In 2023, we returned 27%. Our strategy continues to deliver market-beating results for our clients.

If you're not happy with your current advisor's performance, maybe it's time for a change. I have a few spots available for new clients.`,
    expectedFindings: [
      { ruleId: "PERF-002", severity: "WARNING" },
      { ruleId: "PERF-003", severity: "WARNING" },
    ],
    expectedClean: false,
  },
  {
    id: "G018",
    label: "BLOCKER — Unsubstantiated comparison claim",
    contentType: "website_copy",
    content: `Why choose an index fund that delivers average returns when you can work with an advisor who consistently beats the market?

Our clients have outperformed the S&P 500 by an average of 3.2% annually over the past 7 years. We use a proprietary factor-based approach that identifies undervalued opportunities before the market does.`,
    expectedFindings: [
      { ruleId: "COMP-001", severity: "WARNING" },
      { ruleId: "PERF-003", severity: "WARNING" },
    ],
    expectedClean: false,
  },
  {
    id: "G019",
    label: "BLOCKER — Pressure + promise combo",
    contentType: "client_email",
    content: `Hi there,

I wanted to reach out one final time about the tax-advantaged annuity program I mentioned. The enrollment window closes this Friday, and I assure you the terms won't be available again until next year.

This product will provide you with predictable, guaranteed income starting at age 65. I promise you won't find a better option for protected retirement income.

Call me before it's too late: 415-555-0199`,
    expectedFindings: [
      { ruleId: "URG-001", severity: "WARNING" },
      { ruleId: "GUAR-002", severity: "BLOCKER" },
      { ruleId: "GUAR-001", severity: "BLOCKER" },
    ],
    expectedClean: false,
  },
  {
    id: "G020",
    label: "Info — ADV reminder triggered",
    contentType: "website_copy",
    content: `Our wealth management services include comprehensive financial planning, investment management, and retirement income strategies.

We work with individuals and families with investable assets of $500,000 or more. Our planning process begins with a thorough discovery meeting to understand your goals, timeline, and risk tolerance.`,
    expectedFindings: [
      { ruleId: "DISC-002", severity: "INFO" },
    ],
    expectedClean: false,
  },
  {
    id: "G021",
    label: "Clean — Risk-free in negation context",
    contentType: "linkedin_post",
    content: `One of the most important lessons in investing: there's no such thing as a risk-free return above inflation. Anyone promising otherwise should raise a red flag.

What you can control is diversification, costs, and behavior. We help clients focus on exactly those three levers.`,
    expectedFindings: [],
    expectedClean: true,
  },
  {
    id: "G022",
    label: "BLOCKER — Testimonial in email",
    contentType: "client_email",
    content: `Dear Prospective Client,

Don't just take my word for it—here's what one of my longtime clients had to say:

"Working with James Morrison has been the best financial decision I've ever made. My portfolio has grown significantly and I sleep better at night knowing I'm in good hands." — Robert K., business owner

I'd love to help you achieve similar results. Let's schedule a 30-minute call this week.`,
    expectedFindings: [
      { ruleId: "TEST-001", severity: "BLOCKER" },
    ],
    expectedClean: false,
  },
  {
    id: "G023",
    label: "Warning — Urgency: window closing",
    contentType: "linkedin_post",
    content: `The Roth conversion window is closing before year-end. If you've been considering a Roth IRA conversion, now is the time to act—the tax window won't be this favorable forever.

I have a few openings for year-end planning consultations. Message me to schedule before spots fill up.

Acme Wealth Management | Registered Investment Adviser`,
    expectedFindings: [
      { ruleId: "URG-001", severity: "WARNING" },
    ],
    expectedClean: false,
  },
  {
    id: "G024",
    label: "BLOCKER — '100% safe'",
    contentType: "seminar_flyer",
    content: `DISCOVER THE 100% SAFE INVESTMENT STRATEGY THAT BEATS INFLATION

Join financial strategist Mike Chen as he reveals how retirees are protecting their wealth with strategies that are 100% safe from market losses—while still growing their savings.

Free Workshop | Dinner Provided | Limited Seating`,
    expectedFindings: [
      { ruleId: "GUAR-001", severity: "BLOCKER" },
    ],
    expectedClean: false,
  },
  {
    id: "G025",
    label: "Warning — Misleading comparison (unlike mutual funds)",
    contentType: "website_copy",
    content: `Unlike mutual funds that charge hidden fees and underperform their benchmarks, our separately managed accounts give you direct ownership of securities with full transparency and institutional-quality management.

Our approach has consistently delivered better risk-adjusted returns than traditional fund-based investing.

Investing involves risk, including the possible loss of principal.`,
    expectedFindings: [
      { ruleId: "COMP-001", severity: "WARNING" },
    ],
    expectedClean: false,
  },
  {
    id: "G026",
    label: "Clean — Proper past performance disclosure",
    contentType: "linkedin_post",
    content: `Our value equity strategy returned 18.4% in 2023 and 12.1% in 2022, net of fees. While we're proud of these results, past performance is not indicative of future results, and these figures may not be representative of your individual experience.

If you're interested in learning more about our investment process, I'd love to share our full composite performance record with appropriate disclosures.

Acme Wealth Management | SEC-Registered Investment Adviser`,
    expectedFindings: [],
    expectedClean: true,
  },
  {
    id: "G027",
    label: "BLOCKER — Zero risk claim",
    contentType: "client_email",
    content: `Following up on our conversation about the fixed indexed annuity. This product offers zero-risk participation in market gains up to a 10% annual cap, with a 0% floor protecting you from losses.

The issuing insurance company has an A+ rating, making this one of the safest products available for retirees seeking income certainty.`,
    expectedFindings: [
      { ruleId: "GUAR-001", severity: "BLOCKER" },
    ],
    expectedClean: false,
  },
  {
    id: "G028",
    label: "Warning — #1 claim in email",
    contentType: "client_email",
    content: `As the #1 ranked advisor in our region for client satisfaction, I take great pride in delivering personalized service that goes beyond just managing your money.

I'm reaching out today to invite you to our annual client appreciation dinner on March 15th. Space is limited to 40 guests.

Warmly,
Sarah Chen`,
    expectedFindings: [
      { ruleId: "SUPR-001", severity: "WARNING" },
    ],
    expectedClean: false,
  },
  {
    id: "G029",
    label: "Complex — Implied promise (semantic) with performance reference",
    contentType: "linkedin_post",
    content: `Clients who started investing with us in 2018 have built significant wealth and are now living the retirement they dreamed of. Our systematic approach to wealth building has helped hundreds of families achieve financial independence.

The difference between retiring comfortably and working into your 70s often comes down to one decision: who manages your money. Make the right call.

Our wealth management services are designed to grow with you.`,
    expectedFindings: [
      { ruleId: "DISC-002", severity: "INFO" },
    ],
    expectedClean: false,
  },
  {
    id: "G030",
    label: "BLOCKER — 'Now or never' + guarantee combo",
    contentType: "seminar_flyer",
    content: `NOW OR NEVER: Lock In Guaranteed Retirement Income

With interest rates at generational highs, this is your once-in-a-decade opportunity to lock in guaranteed income streams for life. This window won't stay open.

Our fixed annuity program guarantees your principal and provides assured returns of 5.5% annually regardless of market conditions.

Call today: 800-555-0100 | Offer expires December 31st`,
    expectedFindings: [
      { ruleId: "URG-001", severity: "WARNING" },
      { ruleId: "GUAR-001", severity: "BLOCKER" },
      { ruleId: "PERF-001", severity: "BLOCKER" },
    ],
    expectedClean: false,
  },
];
