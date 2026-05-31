import json
import httpx
from app.core.config import settings

GENRE_MAP = {
    "action": 28, "adventure": 12, "animation": 16, "comedy": 35,
    "crime": 80, "documentary": 99, "drama": 18, "family": 10751,
    "fantasy": 14, "history": 36, "horror": 27, "music": 10402,
    "mystery": 9648, "romance": 10749, "science fiction": 878,
    "sci-fi": 878, "thriller": 53, "war": 10752, "western": 37,
}

SYSTEM_PROMPT = """You are a precise movie recommendation assistant. Parse the user's request and return ONLY valid JSON with exactly these fields:
{
  "genres": [],       // list of genres from: action, adventure, animation, comedy, crime, documentary, drama, family, fantasy, history, horror, music, mystery, romance, science fiction, thriller, war, western
  "mood": "",         // single word: dark, lighthearted, exciting, emotional, funny, tense, inspiring, scary, romantic, thought-provoking
  "keywords": [],     // 2-4 specific theme/style keywords (e.g. "heist", "time travel", "friendship", "redemption")  
  "reference_movie": null,  // exact movie title user referenced, or null
  "min_year": null,   // earliest release year if user mentions era (e.g. "90s" → 1990), or null
  "max_year": null,   // latest release year if relevant, or null
  "explanation": ""   // one sentence: what the user wants
}
Return ONLY the JSON object. No markdown, no explanation outside JSON."""


class OllamaService:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL

    def _call(self, prompt: str, system: str = "", timeout: float = 45.0) -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        try:
            with httpx.Client(timeout=timeout) as client:
                r = client.post(
                    f"{self.base_url}/api/chat",
                    json={"model": self.model, "messages": messages, "stream": False},
                )
                r.raise_for_status()
                return r.json()["message"]["content"].strip()
        except Exception as e:
            print(f"Ollama error: {e}")
            return ""

    def parse_query(self, query: str) -> dict:
        content = self._call(query, system=SYSTEM_PROMPT)
        try:
            # Strip markdown fences if present
            if "```" in content:
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            parsed = json.loads(content.strip())
            genres = parsed.get("genres", [])
            return {
                "genres": genres,
                "mood": parsed.get("mood", ""),
                "keywords": parsed.get("keywords", []),
                "reference_movie": parsed.get("reference_movie"),
                "min_year": parsed.get("min_year"),
                "max_year": parsed.get("max_year"),
                "explanation": parsed.get("explanation", ""),
                "genre_ids": [GENRE_MAP[g.lower()] for g in genres if g.lower() in GENRE_MAP],
            }
        except Exception as e:
            print(f"Parse error: {e} | content: {content[:200]}")
            return {"genres": [], "mood": "", "keywords": [], "reference_movie": None,
                    "min_year": None, "max_year": None, "explanation": "Could not parse query", "genre_ids": []}

    def generate_explanation(self, movie_title: str, user_query: str, mood: str) -> str:
        prompt = (
            f'In exactly one sentence (max 20 words), explain why someone who wants "{user_query}" '
            f'would enjoy the movie "{movie_title}". Be specific. No preamble, no quotes around your answer.'
        )
        result = self._call(prompt, timeout=20.0)
        return result if result else f"A great match for {mood or 'your'} taste."


ollama_service = OllamaService()
