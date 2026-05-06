import sqlite3
import random
import uuid
import json
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Patches Competitive API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ADMIN_PASSWORD = "admin123"

# --- DATABASE SETUP ---
def init_db():
    conn = sqlite3.connect("patches_game.db")
    c = conn.cursor()
    
    c.execute("""
        CREATE TABLE IF NOT EXISTS active_grid (
            id INTEGER PRIMARY KEY CHECK (id = 1), 
            size INTEGER,
            anchors_json TEXT,
            version_id TEXT,
            created_at TEXT
        )
    """)
    
    c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='scores'")
    table_exists = c.fetchone()

    if table_exists:
        cursor = c.execute("PRAGMA table_info(scores)")
        columns = [row[1] for row in cursor.fetchall()]
        
        # Safely add any missing columns from our feature updates
        if 'grid_size' not in columns:
            c.execute("ALTER TABLE scores ADD COLUMN grid_size INTEGER")
        if 'session_id' not in columns:
            c.execute("ALTER TABLE scores ADD COLUMN session_id TEXT")
        if 'is_final' not in columns:
            c.execute("ALTER TABLE scores ADD COLUMN is_final INTEGER DEFAULT 0")
            
    else:
        c.execute("""
            CREATE TABLE scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                elapsed_seconds INTEGER,
                version_id TEXT,
                timestamp TEXT,
                grid_size INTEGER,
                session_id TEXT,
                is_final INTEGER DEFAULT 0
            )
        """)
        
    # Auto-restore legacy data
    c.execute("UPDATE scores SET is_final = 1 WHERE is_final = 0 AND name != 'Candidate'")
        
    conn.commit()
    conn.close()

init_db()

# --- MODELS ---
class AdminRotateReq(BaseModel):
    password: str
    size: int = 8

class ScoreSubmission(BaseModel):
    name: str
    elapsed_seconds: int
    version_id: str
    grid_size: int
    session_id: str
    is_final: bool

# --- CORE PUZZLE GENERATOR ---
def generate_bsp_puzzle(grid_size: int):
    grid_size = max(4, min(12, grid_size))
    rects = []

    def split_rect(r, c, h, w, depth=0):
        area = h * w
        if area <= 8 or (area <= 12 and random.random() > 0.5) or depth > 10:
            rects.append({"r": r, "c": c, "h": h, "w": w})
            return

        split_horizontally = random.choice([True, False])
        if h <= 2: split_horizontally = False
        if w <= 2: split_horizontally = True

        if split_horizontally:
            split_at = random.randint(min(2, h - 1), max(h - 2, 1))
            split_rect(r, c, split_at, w, depth + 1)
            split_rect(r + split_at, c, h - split_at, w, depth + 1)
        else:
            split_at = random.randint(min(2, w - 1), max(w - 2, 1))
            split_rect(r, c, h, split_at, depth + 1)
            split_rect(r, c + split_at, h, w - split_at, depth + 1)

    split_rect(0, 0, grid_size, grid_size)

    anchors = []
    for rect in rects:
        icon_r = rect["r"] + random.randint(0, rect["h"] - 1)
        icon_c = rect["c"] + random.randint(0, rect["w"] - 1)
        area_val = rect["h"] * rect["w"]

        if rect["h"] == rect["w"]: itype = "square"
        elif rect["h"] > rect["w"]: itype = "tall"
        else: itype = "wide"

        requires_number = True if (area_val <= 4 or random.random() > 0.4) else False

        anchors.append({
            "r": icon_r, "c": icon_c,
            "type": itype,
            "area": area_val,
            "number": area_val if requires_number else None,
        })
    return anchors

# --- ENDPOINTS ---
@app.get("/active-puzzle")
def get_active_puzzle():
    conn = sqlite3.connect("patches_game.db")
    c = conn.cursor()
    c.execute("SELECT size, anchors_json, version_id FROM active_grid WHERE id = 1")
    row = c.fetchone()
    conn.close()

    if not row:
        anchors = generate_bsp_puzzle(8)
        version_id = str(uuid.uuid4())
        
        conn = sqlite3.connect("patches_game.db")
        c = conn.cursor()
        c.execute("INSERT INTO active_grid (id, size, anchors_json, version_id, created_at) VALUES (1, ?, ?, ?, ?)",
                  (8, json.dumps(anchors), version_id, datetime.now().isoformat()))
        conn.commit()
        conn.close()
        return {"size": 8, "anchors": anchors, "version_id": version_id}

    return {
        "size": row[0],
        "anchors": json.loads(row[1]),
        "version_id": row[2]
    }

@app.post("/admin/rotate")
def rotate_grid(req: AdminRotateReq):
    if req.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")

    new_anchors = generate_bsp_puzzle(req.size)
    new_version_id = str(uuid.uuid4())

    conn = sqlite3.connect("patches_game.db")
    c = conn.cursor()
    c.execute("""
        INSERT OR REPLACE INTO active_grid (id, size, anchors_json, version_id, created_at) 
        VALUES (1, ?, ?, ?, ?)
    """, (req.size, json.dumps(new_anchors), new_version_id, datetime.now().isoformat()))
    conn.commit()
    conn.close()

    return {"status": "success", "message": "Grid rotated successfully", "version_id": new_version_id}

@app.post("/submit-score")
def submit_score(data: ScoreSubmission):
    conn = sqlite3.connect("patches_game.db")
    c = conn.cursor()
    
    c.execute("SELECT version_id FROM active_grid WHERE id = 1")
    active_version = c.fetchone()[0]
    
    if data.version_id != active_version:
        conn.close()
        raise HTTPException(status_code=400, detail="This puzzle version has expired.")

    c.execute("SELECT id FROM scores WHERE session_id = ?", (data.session_id,))
    row = c.fetchone()

    if row:
        c.execute("""
            UPDATE scores 
            SET name = ?, elapsed_seconds = ?, is_final = ?, timestamp = ?
            WHERE session_id = ?
        """, (data.name[:20], data.elapsed_seconds, 1 if data.is_final else 0, datetime.now().isoformat(), data.session_id))
    else:
        c.execute("""
            INSERT INTO scores (name, elapsed_seconds, version_id, timestamp, grid_size, session_id, is_final) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (data.name[:20], data.elapsed_seconds, data.version_id, datetime.now().isoformat(), data.grid_size, data.session_id, 1 if data.is_final else 0))
        
    conn.commit()
    conn.close()
    
    return {"status": "saved"}

@app.get("/leaderboard")
def get_leaderboard():
    conn = sqlite3.connect("patches_game.db")
    c = conn.cursor()
    
    c.execute("SELECT version_id FROM active_grid WHERE id = 1")
    row = c.fetchone()
    if not row:
        return {"leaderboard": [], "total_games": 0}
        
    curr_version = row[0]
    
    # Counts ALL players who triggered the puzzle
    c.execute("SELECT COUNT(*) FROM scores WHERE version_id = ?", (curr_version,))
    total_games_row = c.fetchone()
    total_games = total_games_row[0] if total_games_row else 0
    
    # Only fetches finalized players for the public leaderboard
    c.execute("""
        SELECT s.name, s.elapsed_seconds, s.timestamp, s.grid_size 
        FROM scores s
        WHERE s.version_id = ? AND s.is_final = 1
        ORDER BY s.elapsed_seconds ASC, s.timestamp ASC 
        LIMIT 50
    """, (curr_version,))
    
    results = []
    for r in c.fetchall():
        m, s = divmod(r[1], 60)
        formatted_time = f"{m}:{str(s).zfill(2)}"
        results.append({
            "name": r[0],
            "time": formatted_time,
            "seconds": r[1],
            "date": r[2],
            "grid_size": f"({r[3]}x{r[3]})"
        })
        
    conn.close()
    return {"leaderboard": results, "total_games": total_games}