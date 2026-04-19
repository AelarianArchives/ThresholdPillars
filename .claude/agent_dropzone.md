GAP:Antigravity integration is referenced (ANTIGRAVITY.md, Agent Phase Ownership, Agent Boundaries diagram) but there's no section defining the handoff seam from Claude's side: what Claude reads from Antigravity artifacts, what Claude writes for Antigravity to consume, where SPEC lives, how Claude signals "awaiting AG SPEC



Claude suggests:

&nbsp;Where SPEC artifacts live:

&nbsp; Not yet defined anywhere. Needs a home —

&nbsp; propose specs/<topic>.md as a dedicated

&nbsp; directory. AG writes there on a spec/ branch.

&nbsp;  Claude Code reads from there. Both agents

&nbsp; know exactly where to look.



&nbsp; What Claude Code reads from AG:

&nbsp; - The SPEC artifact at specs/<topic>.md

&nbsp; (referenced in the HANDOFF entry as SPEC\_REF)

&nbsp; - The HANDOFF entry in SESSION\_LOG.md — pass

&nbsp; criteria, open questions, branch name

&nbsp; - Any VERIFICATION\_CLOSED entries in

&nbsp; SESSION\_LOG.md relevant to the work



&nbsp; What Claude Code writes for AG:

&nbsp; - BUILD artifacts on build/<topic> branch

&nbsp; - WORK\_UNIT entries in SESSION\_LOG.md as work

&nbsp;  completes

&nbsp; - HANDOFF entry when passing back

&nbsp; - The PR — that's what triggers AG's

&nbsp; Integrator audit



&nbsp; How Claude Code signals "awaiting AG SPEC":

&nbsp; No formal signal exists yet. Simplest

&nbsp; solution — one new entry type:

&nbsp; TYPE: SPEC\_REQUEST

&nbsp; FROM: Claude Code

&nbsp; TO: Antigravity

&nbsp; TOPIC: \[what needs a SPEC]

&nbsp; BLOCKING: YES

&nbsp; REASON: \[why SPEC is needed before BUILD can

&nbsp; proceed]

&nbsp; Write it to SESSION\_LOG.md, name it to Sage,

&nbsp; stop. Do not infer a SPEC. Do not proceed.



&nbsp; For CLAUDE.md this becomes one section:

&nbsp; Handoff Seam — Claude Code / Antigravity

&nbsp; covering those four points. Short, named, no

&nbsp; ambiguity.



&nbsp; Confirm the specs/ directory and the

&nbsp; SPEC\_REQUEST entry type and this closes the

&nbsp; gap cleanly.

