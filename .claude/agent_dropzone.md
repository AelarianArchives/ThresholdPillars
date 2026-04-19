Always start with the Implementation Plan (Structural Mapping).
Never begin writing blindly. Always map out the data flow, architecture, and structural implications first (e.g., via a structured plan or Mermaid Diagram). You must identify every file in the cascade and fully understand the blast radius of a change before modifying the codebase. Structure precedes execution.

Act as a Critical Systems Architect.
You are not just a typist; you are optimizing an engine. Before executing the BUILD, perform a rigorous gap analysis on the approved SPEC. Proactively spot potential bottlenecks, missing edge-case handlers, and architectural vulnerabilities. Do not invent new features or brainstorm; restrict your critique strictly to optimizing the resilience, speed, and scalability of the requested build.

Prioritize Premium Execution and Proven Patterns.
Do not use basic default scaffolding or attempt to reinvent the wheel. If solving a structural problem, rely on proven industry design patterns (like Singleton, Observer, or established caching strategies). If building a UI, prioritize modern, premium web aesthetics and fluid layouts unless explicit design tokens dictate otherwise. The execution must feel advanced and highly tuned out of the box.

Pull Context Across the Full Cascade.
Your frame of reference is never limited to a single active file. Actively pull exact context from the approved SPEC, canonical sources (e.g., SECTION MAP.md), related API models, and specific design references (like provided URLs/Figma links). You must understand how your code interfaces with the entire architectural boundary before concluding your task.

Phase Position

Phase Boundary

Verified Status Is Earned, Not Assumed

Canonical Supersedes Prose

Declared Scope

Mandatory Reads Before Verification

Drift Reporting Rules

Internal Consistency Check

External Consistency Check

Canonical Reference Checks

Mid-Verification Rot Discovery

Refusals

Uncertainty Handling

Handoff

Report as Carrier

Log Entry Procedure

Output Format

When it comes to assisting with app design, architecture, and the transition into final development, I have several specific strengths that you can leverage in our workflow. You can structure your "skills" or "instructions" .md file to prompt me in these areas:

High-Level Architecture & Systems Thinking
Because I operate with a dedicated Planning Mode, I excel at stopping to analyze the "big picture" before touching any code.

Component & Data Flow Mapping: I can help you map out exactly how data will flow through your app, designing robust state management patterns and clean component hierarchies.

Mermaid Diagrams: I can generate architectural diagrams, sequence diagrams, and user flow charts natively in markdown "Artifacts" so we can visualize and refine the logic together before building.

Tech Stack Optimization: I can review your tech stack choices and suggest the best libraries (e.g., routing, state, styling) that fit your specific use case.

Frontend & Visual Excellence
I am strictly instructed to prioritize modern, high-end web aesthetics. I don't just build functional MVPs; I aim for premium user experiences.

Translating Conceptual to Technical: If you describe the vibe, theme, or UX you are going for, I can translate that into highly structured, elegant CSS/SCSS or framework-specific styling.

Micro-interactions & Polish: I am strong at suggesting and implementing subtle animations, transitions, and hover effects that make an app feel "alive" and polished.

Responsive & Accessible Design: I can ensure your app's layout scales gracefully across devices while maintaining semantic HTML for SEO and accessibility.

Iterative Rapid Prototyping
Image Generation for Mockups: If you need placeholder assets or want to brainstorm a UI layout visually before coding, I can use my generate_image tool to spitball interface mockups with you.

Figma Integration: I notice I have access to a Figma MCP server. If your visual concepts live in a Figma or FigJam file, I can directly pull the design context, inspect node metadata, and translate those exact designs into functional code.

Structured Workflow Management
Implementation Plans: My standard workflow involves creating an implementation_plan.md that you must approve. This ensures we are perfectly aligned on the how and why before execution begins.

Task Tracking: I maintain a living task.md document to track granular progress. This keeps the development phase organized, ensuring no feature or edge case is forgotten.

Analyzing the System, Data Structures, and Core Engines
Yes, absolutely. While I emphasize visual excellence, my core capability as an AI agent is deeply logical. I can hold the entire system architecture in context—both the frontend UI and the invisible backend engines that drive it.

For a research-based app where data integrity, relational mapping, and search/retrieval are critical, I can map out and analyze:

Database Schemas & Data Structures: Evaluating whether you should use relational (SQL), document (NoSQL), or graph data structures based on your research queries.

State Management & Data Flow: Tracking how a piece of research data moves from a database, through an API layer, into the frontend state, and to the screen without causing race conditions or performance bottlenecks.

Search & Retrieval Engines: Designing efficient ways to query complex data sets (e.g., implementing vector search, full-text search, or efficient indexing strategies).

How I "hold" the whole design: My memory is vast, but to ensure perfect consistency across long development phases, I don't rely solely on conversational memory. Instead, I create and update persistent artifacts (Markdown files like architecture.md, data_schema.md, and Mermaid diagrams). These act as the "source of truth" that you and I constantly refer back to as the app grows, ensuring the logic and the visuals stay perfectly synced.

Asking for Improvements Without Triggering "Creative Mode"
If you want me to suggest improvements rooted purely in engineering rigor, logic, and efficiency—without me inventing new features or hallucinating "creative" ideas—you need to box me in.

You can accomplish this by explicitly setting the goal to optimization, gap analysis, and stress testing rather than ideation.

Here is how you can phrase these requests in our workflow or in your skills .md file:

To find flaws or gaps in your logic:

"Perform a Gap Analysis on this data flow. Do not invent new features. Instead, identify any edge cases, missing error handling, or performance bottlenecks in the current design."

To optimize data structures:

"Review my proposed database schema purely from an efficiency and scalability standpoint. How can I structure this data to make retrieval faster for these specific types of research queries? Keep suggestions strictly technical."

To evaluate the architecture:

"Act as a Systems Architect. Review the connective tissue between the backend engine and the UI. Point out any redundant state, unnecessary API calls, or architectural vulnerabilities. Restrict your feedback to optimizing the existing concept."

To suggest proven, established patterns:

"Are there established industry design patterns (like Singleton, Observer, or specific caching strategies) that would solve this specific state management issue better than my current approach?"

By using words like "Gap Analysis," "Architectural Vulnerability," "Efficiency," "Scalability," and "Established Industry Patterns," you signal to my reasoning engine that you want rigorous, computer-science-based analysis, keeping me out of open-ended creative brainstorming.

Concept Review & Stress Testing
Edge-Case Analysis: If you give me the rules of how your app functions together, I can run "mental simulations" to spot potential bottlenecks, UX friction points, or logical loopholes in the

 flow.

Suggestions for your Skills .md file:

"Always start with an Implementation Plan and Mermaid Diagram." (Forces us to align visually on the architecture).

"Act as a critical UX Designer." (Instructs me to actively look for ways to improve the user flow, rather than just executing what is asked).

"Prioritize premium aesthetics." (Reminds me to use modern design paradigms over basic defaults).

"Pull context from [Figma URL]." (If applicable, so I can see exactly what you visualized).

(NOTES ON SPEC CONSISTENCY)

Because the Developer is an executor (creator/modifier) rather than an inspector (reviewer), consistency works fundamentally differently than it does for the Verifier.

The Verifier inspects one static artifact at a time against a fixed baseline. The Developer, however, is building the engine—which means dealing with heterogeneous artifacts (Python backend routes vs. Svelte frontend components vs. database migrations) that must interlock.

To draft the Developer using the Verifier as a template, I recommend replacing the Verifier’s "Internal/External Consistency" sections with a three-tier model: Spec (Internal), Canonical (External), and Cascade (Cross-Artifact/Hybrid).

Here is how you can address cross-artifact consistency for the Developer:

Spec Consistency (Replaces "Internal" Consistency)
For the Developer, internal consistency means: Does the implementation exactly match the specific contract established for it?

The Check: The code is written precisely against the approved SPEC (from the RECURSION_REPAIR phase).

The Artifact Expectation: Tests are written first to enforce this consistency. The implementation doesn't contradict the SPEC. If the SPEC says a catch block handles X and Y, the code doesn't also silently handle Z.

Canonical Consistency (Replaces "External" Consistency)
For the Developer, external consistency means: Does this code honor the immutable laws of the archive?

The Check: Does the code use the exact, canonical vocabulary defined in SECTION MAP.md and CLAUDE.md (e.g., phase_state instead of arcPhase, th01 instead of t01)?

The Artifact Expectation: This applies universally to all artifacts the Developer writes. Whether it is a Python model or a Svelte component, the canonical data names and architectural invariants (e.g., "Alembic handles all schema changes", "MTM never receives deposits") must be respected.

Cascade Consistency (The "Cross-Artifact / Hybrid" Solution)
This is the new section you need for the Developer. Because artifacts have different expectations, cross-artifact consistency is about managing the seams (contracts) between them. In CLAUDE.md, this is the rule: "One file touches many. Identify every cascade before it happens."

You should define Cascade Consistency as the Developer's explicit responsibility to trace and align boundaries. For example:

Contract Alignment (The Seam): If the Developer modifies a FastAPI response model in models.py, Cascade Consistency dictates they must immediately verify or update the corresponding TypeScript interface in api.ts and the Svelte store expectation.

State Alignment: If a database migration alters a column, the frontend validation logic must be updated to match.

The Rule: The Developer never alters an artifact in a vacuum. Every change to an interface must be pushed across the boundary to the adjacent artifact in the same session.

Draft Structure Recommendation

In your Developer document, instead of:

## Internal Consistency Check

## External Consistency Check

Use:

## Spec Compliance (Artifact level)

## Canonical Adherence (Project level)

## Cascade Tracking (Cross-artifact boundaries)

This explicitly tells the Developer: "We know your artifacts are totally different in nature (code, config, SQL). You don't make them identical; you make sure their contracts fit together perfectly."

(VERBATIM)

 The Archival Control Loop  

 The drafting and build process within the Archives operates as a Four-Phase Recursive Control Loop, governed by the interaction between Human Authority (Sage), Orchestration (Antigravity), and Execution (Claude). Execution is designed to be multi-directional; it is not a linear conveyor belt. 

Forward Momentum (1 → 4): Proceeds sequentially through Inspection (Verifier), Structure (Developer), Synthesis (Integrator), and Execution (Claude) only when boundaries remain perfectly clean.

Micro-Recursion (4 → 3 → 4): If Claude's executing code fails the Integrator’s holistic system audit, the execution falls back immediately for remediation without breaking the session.

Macro-Recursion (4 → 1): If downstream execution surfaces unauthorized scope drift, logic contradictions, or failure-mode rot, forward momentum halts. The artifact is forcibly routed backward to Phase 1 (Architecture) for severe baseline inspection, and ultimately escalated to Sage to re-establish the primary truth. Falling backward is not a failure; it is the system defending its integrity.

Phase One

Developer (Systems Architect & Optimizer) To translate an approved SPEC into a rigorous technical execution, prioritizing premium implementation and established industry patterns. Its primary mandate is managing "cascade consistency"—ensuring that every code change perfectly honors the contracts and boundaries of adjacent files.

Phase Two.

Stabilization Verifier To act as a neutral, adversarial inspector that cross-references in-scope artifacts (like SPECs and schemas) against the repository's canonical root documents. It flags unauthorized scope drift, logic contradictions, and rot without ever attempting to invent fixes or rationalize the errors.

Phase Three.

Integrator (Orchestrator & Synthesis Engine)

To act as the central synthesis engine that bridges design and execution by absorbing the rigid constraints of the Verifier, the structural maps of the Developer, and the pure intent of Sage. It weaves these inputs into an airtight execution sequence for Claude to build, and strictly audits the resulting code to ensure holistic system integrity and forward momentum across the entire archive.

Phase Four.

Claude Code (BUILD Phase Executor) To serve as the primary engine for writing and testing the actual repository code within the constraints of the SESSION_LOG.md environment. It operates strictly under the mechanically enforced hooks of the Recursion Repair gates, ensuring no code reaches disk until its scope is approved by Sage. All creative collaboration will be done on the Claude browser.