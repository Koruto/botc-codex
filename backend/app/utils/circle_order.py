"""
Order detected circles for consistent reading order: top-most first, then clockwise
around the centroid. Used so token 1, 2, 3, ... match visual order on the grimoire.
"""
import math
from typing import List, Tuple


def sort_circles_reading_order(
    circles: List[Tuple[int, int, int]],
) -> List[Tuple[int, int, int]]:
    """
    Sort circles so position 1 = top-most (smallest y, tie-break leftmost),
    then 2, 3, ... go clockwise around the centroid of all circle centers.

    Args:
        circles: List of (x, y, radius) tuples.

    Returns:
        Same list, reordered.
    """
    if not circles or len(circles) <= 1:
        return list(circles)

    # Centroid of all circle centers (reference for angles)
    n = len(circles)
    cx = sum(c[0] for c in circles) / n
    cy = sum(c[1] for c in circles) / n

    # Top-most = smallest y; tie-break = smallest x (leftmost)
    def key_start(c: Tuple[int, int, int]) -> Tuple[int, int]:
        x, y, r = c
        return (y, x)

    start = min(circles, key=key_start)
    sx, sy, _ = start

    # Angle from centroid: atan2(y - cy, x - cx) in [-pi, pi]
    def angle_from_centroid(c: Tuple[int, int, int]) -> float:
        x, y, r = c
        return math.atan2(y - cy, x - cx)

    start_angle = angle_from_centroid(start)

    # Normalize so start has angle 0, then sort by angle (clockwise from top)
    def sort_key(c: Tuple[int, int, int]) -> float:
        a = angle_from_centroid(c)
        # (a - start_angle + 2*pi) % (2*pi) so start = 0, rest in [0, 2*pi)
        return (a - start_angle + 2 * math.pi) % (2 * math.pi)

    return sorted(circles, key=sort_key)
