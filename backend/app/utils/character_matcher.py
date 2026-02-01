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

# Cache all characters list since database is static
_ALL_CHARACTERS_CACHE: List[str] = list(_CHARACTER_TYPE_MAP.keys())

def get_character_type(character_name: str) -> str:
    """Get the type of a character (O(1) lookup)"""
    return _CHARACTER_TYPE_MAP.get(character_name, "Unknown")
