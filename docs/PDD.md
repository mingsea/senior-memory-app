# Senior Memory App — Product Design Document

| Field | Value |
|-------|-------|
| Document version | 2.0.0 |
| Last updated | 2026-04-12 |
| Status | Active development |

---

## Version history

| Version | Date | Summary |
|---------|------|---------|
| 1.0.0 | 2026-04-05 | Initial spec: goals, user roles, exercise catalogue, session flow |
| 1.1.0 | 2026-04-06 | Scaffolded Next.js project; auth, Prisma schema, 10 exercise stubs |
| 1.2.0 | 2026-04-07 | Fixed word-recall mismatch bug; randomised exercise order per session; recall delay → 15 s |
| 1.3.0 | 2026-04-08 | Added PatternMemory exercise; fixed TTS (Web Speech API unlock pattern); fixed user role |
| 1.4.0 | 2026-04-10 | Expanded all question banks (数字题 upgrade: add/sub/missing-number modes; SimpleSentences 5→25; LongTermRecall 7→25; NameItems 5→20; ColorCategory 3→10; MirrorActions 5→12; WORD_LISTS 6→20) |
| 1.5.0 | 2026-04-11 | Added PoemRecite exercise: 18 Tang/Song dynasty poems, line-by-line TTS recitation with encouragement |
| 2.0.0 | 2026-04-12 | Added photo labelling system and IdentifyPeople exercise: caregiver uploads family photos with structured metadata (people, year, location, activity); senior is shown photos with TTS questions and reveals answers |

---

## 1. Product overview

A Chinese-language cognitive training web app for elderly users with early-to-mid stage Alzheimer's disease, used daily under caregiver supervision.

**Core goals:**
- Slow cognitive decline through structured, enjoyable daily exercises
- Let family caregivers personalise the experience with family photos and records
- Operate on any device with a web browser — no app install required
- Simple, large UI designed for seniors with low tech literacy

**Primary users:**
- **Senior (老人):** the Alzheimer's patient who uses the training interface
- **Caregiver (家人/管理员):** family member who manages photos, settings, and reviews progress

---

## 2. Technical stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Next.js (App Router) | v16+ — `proxy.ts` instead of `middleware.ts` |
| Language | TypeScript | Strict mode |
| Database | SQLite via Prisma 7 | `@prisma/adapter-better-sqlite3`; `dev.db` at project root |
| Auth | Custom cookie sessions | HTTP-only cookie `smapp_session`, 7-day expiry, bcrypt PIN hashing |
| TTS | Web Speech API | zh-CN, rate 0.85; `unlockTTS()` called on first user gesture |
| Styling | Tailwind CSS | Custom classes: `senior-btn`, `senior-text-xl`, `choice-btn` |
| File uploads | Local filesystem | Saved to `public/uploads/{seniorId}/` |

---

## 3. Authentication & roles

### Accounts (seeded defaults)

| Username | PIN | Role |
|----------|-----|------|
| `user` | `0000` | SENIOR |
| `senior` | `0000` | SENIOR |
| `caregiver` | `1234` | CAREGIVER |

### Role routing

| Role | Landing page | Access |
|------|-------------|--------|
| SENIOR | `/home` | `/session` only |
| CAREGIVER | `/dashboard` | `/dashboard`, `/media`, `/settings` |

---

## 4. Data model

```
User
  id, username, pin (bcrypt), role, displayName
  seniorId? → User (self-referential caregiver→senior link)

AuthSession
  token (cookie value), userId, expiresAt

MediaItem
  seniorId, uploadedById
  url (local path under /uploads/)
  caption, peopleNames      — text labels
  year, location, activity  — structured photo metadata (added v2.0)
  type = "PHOTO"

TrainingSession
  seniorId, startedAt, endedAt, mood, completedExercises

ExerciseAttempt
  sessionId, exerciseType, skipped, scorePercent, responseData, mediaItemId?

ExerciseConfig
  exerciseType (unique), titleZh, descriptionZh, enabled, difficulty, configData
```

---

## 5. Session flow

1. Senior opens `/home` → taps "开始练习"
2. `/session` page renders `SessionRunner`
3. **Unlock phase** — single button tap calls `unlockTTS()` (satisfies browser gesture requirement) then `startSession()` server action
4. Server selects exercises: `DATE_ORIENTATION` always first (grounding), then 4 more randomly shuffled from enabled types
5. Exercises rendered one-by-one; each calls `onDone(skipped, score, data)` when complete
6. After all exercises: **mood check** (😊 / 😐 / 😔)
7. `completeSession()` records end time and mood; redirect to `/home`

---

## 6. Exercise catalogue

### 6.1 Date orientation (日期定向)
`DATE_ORIENTATION` · difficulty 1

Randomly picks 2–3 of: month, day, weekday, morning/afternoon. Each answered via large tap-target buttons. Score = fraction correct.

---

### 6.2 Number exercises (数字题)
`COUNTING` · difficulty 2

Randomly selects one mode per session (counting weighted 2×):

| Mode | Example |
|------|---------|
| 正数 | 从1数到10，按步进 |
| 倒数 | 从10倒数到1 |
| 跳数 | 2, 4, 6, 8, 10 / 5, 10, 15, 20 |
| 加法 | 3 + 4 = ? (20-item pool, 3-choice MCQ) |
| 减法 | 9 - 3 = ? (20-item pool, 3-choice MCQ) |
| 缺数 | 2, ?, 6, 8 (12-item pool, 3-choice MCQ) |

---

### 6.3 Word recall (记三个词)
`REMEMBER_WORDS` · difficulty 2

Show 3 words → 15-second wait → 6-option recall grid (tap all correct). 20-item WORD_LISTS pool, 30-word distractor pool.

---

### 6.4 Name items (说出物品)
`NAME_ITEMS` · difficulty 1

Open-ended verbal prompt (e.g., "说三种水果"). 20 prompts across 8 categories. Senior taps "说出来了" when done; self-reported.

---

### 6.5 Conversation (简单对话)
`SIMPLE_SENTENCES` · difficulty 1

25 conversational questions across 4 themes: 日常生活, 饮食偏好, 家庭回忆, 身体感受. TTS reads question; senior answers aloud; taps "回答了" to continue.

---

### 6.6 Long-term recall (回忆往事)
`LONG_TERM_RECALL` · difficulty 1

25 reminiscence prompts across 4 themes: 童年记忆, 工作生活, 家庭故事, 节日风俗. Same free-answer format as above.

---

### 6.7 Colour / category sort (颜色分类)
`COLOR_CATEGORY` · difficulty 2

10 category prompts (水果, 蔬菜, 动物, 家具, 交通工具, 衣服, 文具, 厨具, 身体部位, 颜色). Each shows 6 items (3 correct + 3 distractors); tap all that belong.

---

### 6.8 Mirror actions (跟我做)
`MIRROR_ACTIONS` · difficulty 1

12 physical movements displayed as emoji + text. TTS demonstrates; senior mirrors. Taps "做完了" to advance. Good for motor + attention.

---

### 6.9 Pattern memory (图案记忆)
`PATTERN_MEMORY` · difficulty 2

3×3 grid; 3–4 cells light up for 5 seconds. Senior reproduces the pattern from memory.

---

### 6.10 Poem recitation (跟读古诗)
`POEM_RECITE` · difficulty 1

18 famous Tang/Song dynasty poems. Intro shows full poem text. Recite phase: TTS reads each line; senior reads along; taps "读完了" per line. Random encouragement message after each line. Progress bar.

**Poem list:** 静夜思, 春晓, 登鹳雀楼, 悯农, 咏鹅, 相思, 望庐山瀑布, 早发白帝城, 绝句, 江雪, 游子吟, 望天门山, 山行, 清明, 水调歌头(节选), 如梦令, 题西林壁, 元日

---

### 6.11 Identify family (认识家人) ✦ NEW in v2.0
`IDENTIFY_PEOPLE` · difficulty 1

Shows family photos uploaded by the caregiver. Asks up to 4 randomly-selected questions per session derived from photo metadata:

| Metadata field | Question asked |
|----------------|---------------|
| `peopleNames` | 照片里有谁？ |
| `year` | 这张照片是哪年拍的？ |
| `location` | 这是在哪里拍的？ |
| `activity` | 他们在做什么？ |

Senior taps "显示答案" to reveal; TTS reads the answer aloud. If no photos are uploaded, exercise skips automatically.

---

## 7. Caregiver features

### 7.1 Dashboard (`/dashboard`)
- Senior account info
- Cumulative session count + recent 5 sessions with mood
- Quick links to Photo Manager and Settings

### 7.2 Photo manager (`/media`) ✦ Updated in v2.0
Upload form fields:
- 照片说明 (caption)
- 照片中的人物 (comma-separated people names)
- 拍摄年份 (year)
- 拍摄地点 (location)
- 当时在做什么 (activity)

Photo list supports inline editing and deletion of all metadata fields.

### 7.3 Settings (`/settings`)
Enable/disable individual exercise types for the linked senior.

---

## 8. TTS design

All exercises use the shared `lib/tts.ts` module:
- `unlockTTS()` — fires a silent utterance inside the first user gesture to satisfy browser autoplay policy
- `speak(text)` — cancels current utterance, then speaks with `lang=zh-CN`, `rate=0.85`, `pitch=1`. Calls `resume()` after `cancel()` to work around Chrome's post-cancel suspended state bug.

---

## 9. Planned / future work

| Feature | Priority | Notes |
|---------|----------|-------|
| Progress charts for caregiver | Medium | Weekly score trends per exercise type |
| Caregiver push notifications | Low | Daily reminder if senior hasn't trained |
| Audio recording of senior responses | Low | For verbal exercises (SimpleSentences, NameItems) |
| More poems / folk songs | Low | Expand POEMS array; add 民歌 category |
| Face-region tagging on photos | Low | Draw boxes around people in IdentifyPeople |
| Multi-senior support per caregiver | Low | Currently one caregiver → one senior |
| PWA / offline support | Medium | Service worker for no-internet sessions |
