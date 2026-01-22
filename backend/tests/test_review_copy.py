import unittest
from pathlib import Path


# Ensure the backend root is on sys.path so `import app...` works when running tests directly.
BACKEND_ROOT = Path(__file__).resolve().parents[1]


class FakeLLMClient:
    def __init__(self):
        self.calls = []

    async def generate_json(self, prompt: str):
        self.calls.append(prompt)
        # First pass: pretend the model was permissive (we want our local kill-list logic to force rewrite).
        if len(self.calls) == 1:
            return {
                "is_generic": False,
                "score": 9,
                "improved_version": "Unlock your potential",
                "feedback": "Looks fine."
            }

        # Second pass: rewritten, concrete, includes metric.
        return {
            "score": 8,
            "improved_version": "Increase revenue by 20% in 30 days.",
            "feedback": "Replaced banned phrase with a concrete metric."
        }


class ReviewCopyTests(unittest.IsolatedAsyncioTestCase):
    async def test_banned_phrase_forces_rewrite(self):
        import sys
        sys.path.insert(0, str(BACKEND_ROOT))

        from app.services.llm_service import review_copy

        client = FakeLLMClient()
        result = await review_copy(client, "Unlock your potential")

        self.assertIsInstance(result, dict)
        self.assertTrue(result.get("is_generic"), "Banned phrase should force is_generic=true")

        improved = result.get("improved_version") or ""
        self.assertIn("20%", improved)
        self.assertNotIn("unlock", improved.lower())


if __name__ == "__main__":
    unittest.main()
