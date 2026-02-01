from typing import List, Dict


# Bad Moon Rising (BMR) character database
CHARACTER_DATABASE = {
    "Townsfolk": [
        "Grandmother", "Sailor", "Chambermaid", "Exorcist", "Innkeeper",
        "Gambler", "Gossip", "Courtier", "Professor", "Minstrel",
        "Tea Lady", "Pacifist", "Fool"
    ],
    "Outsiders": [
        "Tinker", "Moonchild", "Goon", "Lunatic"
    ],
    "Minions": [
        "Godfather", "Devil's Advocate", "Assassin", "Mastermind"
    ],
    "Demons": [
        "Zombuul", "Pukka", "Shabaloth", "Po"
    ]
}

# Create reverse lookup dictionary for O(1) character type lookup
# Built once at module load time for efficiency
_CHARACTER_TYPE_MAP: Dict[str, str] = {}
for char_type, char_list in CHARACTER_DATABASE.items():
    for character_name in char_list:
        _CHARACTER_TYPE_MAP[character_name] = char_type

# Ref-image filename stems (e.g. exorcist, devilsadvocate) -> display name for lookup
_REF_STEM_TO_DISPLAY: Dict[str, str] = {}
for character_name in _CHARACTER_TYPE_MAP:
    normalized = character_name.lower().replace(" ", "").replace("'", "")
    _REF_STEM_TO_DISPLAY[normalized] = character_name

# Cache all characters list since database is static
_ALL_CHARACTERS_CACHE: List[str] = list(_CHARACTER_TYPE_MAP.keys())


def get_character_type(character_name: str) -> str:
    """Get the type of a character (O(1) lookup). Accepts display name or ref-image stem (e.g. exorcist)."""
    display = _REF_STEM_TO_DISPLAY.get(character_name.lower().replace(" ", "").replace("'", ""), character_name)
    return _CHARACTER_TYPE_MAP.get(display, "Unknown")
