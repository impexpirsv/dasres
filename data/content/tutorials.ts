import { createPublishedContent } from "./factory";

export const tutorials = [
  createPublishedContent({
    id: "tutorial-create-account", slug: "create-your-dasres-account", category: "tutorial",
    title: "Create your Dasres account",
    summary: "Set up a Dasres account, confirm the information you provide, and enter the dashboard for the first time.",
    excerpt: "A practical walkthrough of account registration and the first sign-in.",
    tags: ["account", "registration", "getting started"],
    seoTitle: "Create Your Dasres Account | Tutorial",
    seoDescription: "Learn how to register a Dasres account, choose secure credentials, and access your dashboard.",
    relatedArticles: ["tutorial-create-company-profile", "tutorial-create-expert-profile"],
    body: `## Before you begin

Use an email address you control and can continue to access. Choose a strong, unique password rather than reusing a password from another service. Dasres uses the name you enter to identify you inside the platform, so enter the name you want collaborators to recognize.

:::tip Check the address
Review the spelling of your email address before submitting the form. It is the credential you use to sign in.
:::

## Register the account

1. Open the registration page.
2. Enter your name, email address, and password.
3. Review the form for typing errors.
4. Submit the registration form once and wait for its response.

If a field is rejected, read the validation message and correct that field. Do not repeatedly submit while the first request is pending.

## Enter the dashboard

After successful registration, sign in with the same email address and password. The dashboard is the starting point for profiles, cases, proposals, projects, and support.

## Choose what to create next

A user account represents you as a person. Company and expert profiles are separate professional records. Create only the profile type that matches how you intend to participate, and provide accurate information that other users can evaluate.

:::note Keep access personal
Do not share account credentials. Collaborators should use their own accounts so actions remain attributable to the correct person.
:::` }),

  createPublishedContent({
    id: "tutorial-create-company-profile", slug: "create-your-company-profile", category: "tutorial",
    title: "Create your company profile",
    summary: "Build a clear company profile that gives potential collaborators enough context to evaluate your organization.",
    excerpt: "Prepare and publish an accurate company profile from your dashboard.",
    tags: ["company", "profile", "verification"],
    seoTitle: "Create a Dasres Company Profile | Tutorial",
    seoDescription: "Learn how to prepare, create, review, and maintain a professional company profile on Dasres.",
    relatedArticles: ["tutorial-create-account", "tutorial-create-first-case"],
    body: `## Prepare the information

Before opening the form, gather the company name, a concise description, location details, business category, contact information, and an appropriate logo if available. Use information the company is authorized to publish.

## Create the profile

1. Sign in and open the companies area in the dashboard.
2. Choose the action to create a company.
3. Complete the required fields and add useful optional context.
4. Upload a supported image only if you have permission to use it.
5. Review the complete form, then submit it once.

Write the description for a reader who has never encountered the company. Explain what it does, the markets or capabilities relevant to collaboration, and how it can contribute. Avoid vague superlatives and claims that cannot be supported.

## Review the result

Open the saved profile and check names, line breaks, contact information, and image quality. If changes are needed, use the profile editing flow rather than creating a duplicate.

:::warning Verification is not automatic proof
A profile and its displayed status should be interpreted in the context provided by Dasres. Users remain responsible for their own commercial due diligence.
:::

## Maintain the profile

Update the record when public contact information, capabilities, or other material details change. A current, specific profile is easier for other participants to understand than a long profile containing outdated information.` }),

  createPublishedContent({
    id: "tutorial-create-expert-profile", slug: "create-your-expert-profile", category: "tutorial",
    title: "Create your expert profile",
    summary: "Present your professional expertise, experience, and availability in a profile designed for trade collaboration.",
    excerpt: "Create an expert profile that communicates scope, experience, and credibility.",
    tags: ["expert", "profile", "professional"],
    seoTitle: "Create a Dasres Expert Profile | Tutorial",
    seoDescription: "Build an accurate Dasres expert profile with a clear professional focus and useful supporting detail.",
    relatedArticles: ["tutorial-create-account", "tutorial-submit-proposal"],
    body: `## Define your professional scope

Decide which services and subjects you can responsibly support. A focused profile is more useful than a broad list of unrelated skills. Prepare a short biography, relevant specialties, location information, and a suitable profile image if you choose to use one.

## Create the profile

1. Sign in and open the experts area in the dashboard.
2. Start a new expert profile.
3. Enter your professional details and areas of expertise.
4. Add an image only when you have the right to publish it.
5. Check every field and submit the form.

Use plain language and distinguish experience from formal qualifications. Do not imply licenses, certifications, memberships, or outcomes you cannot substantiate.

:::tip Write for matching
Describe the kinds of problems you can solve, the context in which you work, and any important limits. Specific language helps case owners judge relevance.
:::

## Check and maintain the profile

Review the saved page as another user would see it. Correct unclear wording and keep the information current. When considering a case, read its full scope before proposing work; a strong profile does not replace a proposal tailored to that case.

:::note Professional responsibility
Dasres helps participants collaborate. Each expert remains responsible for accurately representing their competence and for recognizing when specialist legal, customs, financial, or other regulated advice is required.
:::` }),

  createPublishedContent({
    id: "tutorial-create-first-case", slug: "create-your-first-trade-case", category: "tutorial",
    title: "Create your first trade case",
    summary: "Turn a trade-related need into a clear case that qualified participants can understand and evaluate.",
    excerpt: "Structure and submit a trade case with a useful scope, context, and expectations.",
    tags: ["case", "scope", "collaboration"],
    seoTitle: "Create Your First Trade Case | Dasres",
    seoDescription: "Learn how to scope, review, and submit a clear trade case through the Dasres dashboard.",
    relatedArticles: ["tutorial-create-company-profile", "tutorial-submit-proposal"],
    body: `## Define the outcome

Start with the result you need, not only the difficulty you face. Identify the subject, relevant goods or services, locations, timing, and the kind of expertise required. Separate confirmed facts from assumptions and questions.

## Protect sensitive information

Do not place passwords, payment credentials, unnecessary personal data, confidential pricing, or protected documents in a broadly visible description. Share information only through the appropriate workspace and only with people who need it.

:::warning Regulatory context varies
For customs, sanctions, tax, licensing, or legal questions, identify the jurisdictions involved without asserting that one rule applies everywhere. Ask an appropriately qualified professional to confirm current requirements.
:::

## Create the case

1. Open the new-case page from the dashboard.
2. Give the case a specific title.
3. Describe the background, desired outcome, constraints, and useful deliverables.
4. Complete the required classification, timing, and budget information shown by the form.
5. Review the summary and submit once.

## Evaluate the published case

Read the case after creation. Check whether a professional unfamiliar with your organization could understand the need and decide whether to propose. If the scope changes materially, communicate the change clearly rather than relying on private assumptions.

:::tip A useful scope is testable
Name the expected output—for example, a document review, classification analysis, supplier assessment, or workflow plan—and explain what would make it complete.
:::` }),

  createPublishedContent({
    id: "tutorial-submit-proposal", slug: "submit-a-proposal", category: "tutorial",
    title: "Submit a proposal",
    summary: "Respond to an open trade case with a focused proposal that explains approach, fit, timing, and commercial expectations.",
    excerpt: "Prepare and submit a proposal that responds directly to an open case.",
    tags: ["proposal", "case", "expert"],
    seoTitle: "Submit a Proposal on Dasres | Tutorial",
    seoDescription: "Learn how to assess an open case and submit a clear, relevant proposal through Dasres.",
    relatedArticles: ["tutorial-create-expert-profile", "tutorial-create-first-case", "tutorial-project-workflow"],
    body: `## Read the complete case

Open the case from the available cases area and review its scope, timing, context, and constraints. Confirm that your profile and experience are relevant. Identify questions that must be answered before you can commit to an approach.

## Build a case-specific response

A useful proposal explains your understanding of the need, the work you would perform, the expected output, assumptions, timing, and the commercial amount requested by the form. Address the case directly instead of pasting a generic biography.

:::note Be explicit about limits
State exclusions and dependencies. If the work requires current legal, customs, tax, or regulatory confirmation, explain how that confirmation will be obtained by an appropriately qualified party.
:::

## Submit the proposal

1. Confirm you are using the appropriate expert profile.
2. Complete the proposal fields shown on the case.
3. Recheck the amount, scope, and timing.
4. Submit once and wait for confirmation.

## After submission

The case owner may compare proposals before accepting one. Do not treat submission as acceptance, and do not begin work based solely on an unanswered proposal. Keep your profile information and availability current while the proposal is under consideration.

:::tip Make evaluation easy
Use short sections and concrete deliverables. A reader should be able to compare your scope and assumptions without inferring missing details.
:::` }),

  createPublishedContent({
    id: "tutorial-project-workflow", slug: "project-workflow-after-proposal-acceptance", category: "tutorial",
    title: "Project workflow after proposal acceptance",
    summary: "Understand how an accepted proposal becomes a project workspace for tasks, documents, messages, and progress.",
    excerpt: "Navigate the project workspace and keep delivery organized after proposal acceptance.",
    tags: ["project", "tasks", "documents", "workflow"],
    seoTitle: "Dasres Project Workflow After Acceptance",
    seoDescription: "Learn how to organize tasks, documents, messages, and progress after a Dasres proposal is accepted.",
    relatedArticles: ["tutorial-submit-proposal", "tutorial-create-first-case"],
    body: `## From proposal to workspace

After a proposal is accepted, use the resulting project workspace as the shared operational record for the engagement. Reconfirm the accepted scope, deliverables, participants, and assumptions before detailed work begins.

## Organize the work

Break the accepted outcome into clear tasks. Each task should describe one deliverable or decision, have an appropriate owner where available, and use dates or status deliberately. The board and project views present the same work in formats suited to planning and execution.

## Use messages and documents deliberately

Keep project-specific communication in the workspace so participants can follow decisions in context. Upload only relevant files, use descriptive filenames, and avoid exposing credentials or unnecessary personal information.

:::warning Check document visibility
Before uploading a confidential or sensitive file, confirm that the workspace and intended recipients are appropriate. Access controls do not remove the need for data minimization.
:::

## Maintain progress

Update task status when the underlying work changes, not merely to make the board appear current. Record important decisions, review attachments before approval, and surface blockers early. Avoid creating duplicate tasks for the same outcome.

## Complete responsibly

Before marking work complete, compare the delivered result with the accepted proposal and resolve outstanding tasks or questions. Preserve the workspace as a readable history of what was requested, decided, and delivered.

:::tip Use one source of truth
Reference the workspace when discussing changes. Scattered decisions in private channels make scope, responsibility, and completion harder to verify.
:::` }),
] as const;
