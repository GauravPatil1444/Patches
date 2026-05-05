import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Patches API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class PatchesRequest(BaseModel):
    size: int = 6
    min_patch_size: int = 2


class AnchorModel(BaseModel):
    r: int
    c: int
    type: str
    area: int
    number: Optional[int] = None


class PatchesResponse(BaseModel):
    size: int
    anchors: List[AnchorModel]


@app.get("/")
def root():
    return {"message": "Patches API — POST /generate-patches to play"}


@app.post("/generate-patches", response_model=PatchesResponse)
def generate_patches(req: PatchesRequest):
    grid_size = max(4, min(12, req.size))
    rects = []

    def split_rect(r, c, h, w, depth=0):
        area = h * w
        if area <= 6 or (area <= 12 and random.random() > 0.7) or depth > 10:
            rects.append({"r": r, "c": c, "h": h, "w": w})
            return

        split_horizontally = random.choice([True, False])
        if h < 3:
            split_horizontally = False
        if w < 3:
            split_horizontally = True

        if split_horizontally:
            split_at = random.randint(1, h - 1)
            split_rect(r, c, split_at, w, depth + 1)
            split_rect(r + split_at, c, h - split_at, w, depth + 1)
        else:
            split_at = random.randint(1, w - 1)
            split_rect(r, c, h, split_at, depth + 1)
            split_rect(r, c + split_at, h, w - split_at, depth + 1)

    split_rect(0, 0, grid_size, grid_size)

    anchors = []
    for idx, rect in enumerate(rects):
        icon_r = rect["r"] + random.randint(0, rect["h"] - 1)
        icon_c = rect["c"] + random.randint(0, rect["w"] - 1)

        if rect["h"] == rect["w"]:
            itype = "square"
        elif rect["h"] > rect["w"]:
            itype = "tall"
        else:
            itype = "wide"

        # ~30% chance to show the area number as a hint
        show_number = random.random() < 0.3
        area_val = rect["h"] * rect["w"]

        anchors.append(AnchorModel(
            r=icon_r,
            c=icon_c,
            type=itype,
            area=area_val,
            number=area_val if show_number else None,
        ))

    return PatchesResponse(size=grid_size, anchors=anchors)


@app.post("/validate-solution")
def validate_solution(data: dict):
    """
    Accepts { anchors, patches, size } and returns whether solution is valid.
    patches: [{r, c, h, w}]
    anchors: [{r, c, type, area}]
    """
    anchors = data.get("anchors", [])
    patches = data.get("patches", [])
    size = data.get("size", 6)

    if len(patches) != len(anchors):
        return {"valid": False, "reason": "Patch count doesn't match anchor count"}

    covered = [[False] * size for _ in range(size)]
    for p in patches:
        r, c, h, w = p["r"], p["c"], p["h"], p["w"]
        for dr in range(h):
            for dc in range(w):
                if covered[r + dr][c + dc]:
                    return {"valid": False, "reason": "Overlapping patches detected"}
                covered[r + dr][c + dc] = True

    for row in covered:
        if not all(row):
            return {"valid": False, "reason": "Grid not fully covered"}

    return {"valid": True, "reason": "Puzzle solved!"}
