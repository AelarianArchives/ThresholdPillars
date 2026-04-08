"""
Claude API client wrapper with agent identity tracking.

Every Claude API call in the application goes through this module.
Each call carries identity metadata: which agent is calling, what type
it is, and which running instance of the app made the request.

Business logic (tagger resolution, RAG pipeline, page-specific behavior)
is NOT owned by this module. Routes and services call through here;
they own their own prompt construction and response handling.
"""

import uuid
from dataclasses import dataclass

from anthropic import AsyncAnthropic

from backend.config import ANTHROPIC_API_KEY

# ---------------------------------------------------------------------------
# Shared constants
# ---------------------------------------------------------------------------

CLAUDE_MODEL: str = "claude-sonnet-4-20250514"

# Generated once per app startup. Every agent in this process shares the
# same instance_id, distinguishing this running instance from others.
INSTANCE_ID: str = str(uuid.uuid4())

# ---------------------------------------------------------------------------
# Agent identity
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class AgentIdentity:
    agent_id: str
    agent_type: str
    description: str


AGENT_REGISTRY: dict[str, AgentIdentity] = {
    "tagger": AgentIdentity(
        agent_id="tagger",
        agent_type="tagger",
        description="Tag routing, phase_state, originId, elarianAnchor on every deposit",
    ),
    "research_assistant": AgentIdentity(
        agent_id="research_assistant",
        agent_type="research",
        description="RAG pipeline and research queries",
    ),
    "int_parsing_partner": AgentIdentity(
        agent_id="int_parsing_partner",
        agent_type="intake",
        description="Batch intake parsing collaboration",
    ),
    "snm_structural_analysis": AgentIdentity(
        agent_id="snm_structural_analysis",
        agent_type="analysis",
        description="Spiritual/philosophical tradition structural mapping",
    ),
    "mtm_synthesis": AgentIdentity(
        agent_id="mtm_synthesis",
        agent_type="synthesis",
        description="Two-pass cross-Axis synthesis",
    ),
    "void_interpretation": AgentIdentity(
        agent_id="void_interpretation",
        agent_type="interpretation",
        description="Absence pattern analysis across Nexus outputs",
    ),
    "wsc_witness": AgentIdentity(
        agent_id="wsc_witness",
        agent_type="witness",
        description="Self-authored witness statement at session close",
    ),
    "artis_science_ping": AgentIdentity(
        agent_id="artis_science_ping",
        agent_type="computation",
        description="Science framing Layer 2 for Cosmology pages",
    ),
}

# ---------------------------------------------------------------------------
# Client (lazy initialization — created on first call)
# ---------------------------------------------------------------------------

_client: AsyncAnthropic | None = None


def _get_client() -> AsyncAnthropic:
    """Return the shared AsyncAnthropic client, creating it on first use.

    Raises RuntimeError if ANTHROPIC_API_KEY is not configured.
    """
    global _client
    if _client is None:
        if not ANTHROPIC_API_KEY:
            raise RuntimeError(
                "ANTHROPIC_API_KEY is not set in backend/.env — "
                "cannot make Claude API calls without a valid key"
            )
        _client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    return _client


async def call_claude(
    agent_id: str,
    system_prompt: str,
    messages: list[dict],
    *,
    context_block: str | None = None,
    model: str = CLAUDE_MODEL,
    max_tokens: int = 4096,
) -> dict:
    """Send a message to Claude with agent identity metadata.

    Parameters
    ----------
    agent_id:
        Key into AGENT_REGISTRY. Must be a registered agent.
    system_prompt:
        The system prompt for this agent's task.
    messages:
        Conversation messages in Anthropic API format.
    context_block:
        Optional additional context prepended to the system prompt.
        Used for section context, domain files, or RAG retrieval.
    model:
        Model to use. Defaults to CLAUDE_MODEL. Slot exists for future
        per-agent differentiation but is not used in V1.
    max_tokens:
        Maximum tokens in the response.

    Returns
    -------
    dict with keys: content (str), agent_id, agent_type, instance_id,
    model, usage (dict with input_tokens, output_tokens).

    Raises
    ------
    ValueError: if agent_id is not in AGENT_REGISTRY.
    anthropic.APIError: on API failures (caller handles).
    """
    if agent_id not in AGENT_REGISTRY:
        raise ValueError(
            f"Unknown agent_id '{agent_id}'. "
            f"Registered agents: {list(AGENT_REGISTRY.keys())}"
        )

    agent = AGENT_REGISTRY[agent_id]

    # Build system prompt with optional context block
    full_system = system_prompt
    if context_block:
        full_system = f"{context_block}\n\n---\n\n{system_prompt}"

    client = _get_client()
    response = await client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=full_system,
        messages=messages,
        metadata={"user_id": f"{agent.agent_id}:{INSTANCE_ID}"},
    )

    return {
        "content": response.content[0].text,
        "agent_id": agent.agent_id,
        "agent_type": agent.agent_type,
        "instance_id": INSTANCE_ID,
        "model": model,
        "usage": {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
        },
    }
