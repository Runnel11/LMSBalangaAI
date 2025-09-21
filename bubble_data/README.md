# Bubble.io CSV Import Files

## 📋 **Three Options for Quiz/Questions**

### **Option 1: Fixed 4 Options (Original)**
Import: `levels.csv` → `lessons.csv` → `quizzes.csv` → `jobs.csv` → `community_posts.csv`
- Questions stored as JSON with exactly 4 options each

### **Option 2: Flexible Options as JSON (Recommended)**
Import: `levels.csv` → `lessons.csv` → `quizzes_flexible.csv` → `jobs.csv` → `community_posts.csv`
- Questions stored as JSON with variable number of options (3-5 options per question)

### **Option 3: Individual Question Records with Flexible Options**
Import: `levels.csv` → `lessons.csv` → `quizzes_simple.csv` → `questions_flexible.csv` → `jobs.csv` → `community_posts.csv`
- Questions stored as separate records with options as JSON array

## 🔧 **Bubble.io Import Instructions**

### **Step 1: Import Levels**
1. Go to **Data** tab → **App data**
2. Click **Level** data type
3. Click **Import CSV**
4. Upload `levels.csv`
5. Map columns: `title` → `title`, `description` → `description`, `order_index` → `order_index`

### **Step 2: Import Lessons**
1. Click **Lesson** data type
2. Click **Import CSV**
3. Upload `lessons.csv`
4. **Important**: For `level_id` column, map to existing Level records by ID
5. Map other columns accordingly

### **Step 3A: Import Quizzes (Option 1 - JSON Questions)**
1. Click **Quiz** data type
2. Click **Import CSV**
3. Upload `quizzes.csv`
4. **Important**: For `lesson_id` column, map to existing Lesson records by ID
5. The `questions` field contains JSON - import as text

### **Step 3B: Import Quizzes (Option 2 - Separate Questions)**
1. Click **Quiz** data type
2. Click **Import CSV**
3. Upload `quizzes_simple.csv`
4. **Important**: For `lesson_id` column, map to existing Lesson records by ID

### **Step 4A: Import Questions (Option 2 Only)**
1. Create **Question** data type with fields:
   - `quiz_id` (Quiz reference)
   - `question_text` (text)
   - `option_a` (text)
   - `option_b` (text)
   - `option_c` (text)
   - `option_d` (text)
   - `correct_answer` (number)
   - `order_index` (number)
2. Click **Import CSV**
3. Upload `questions.csv`
4. **Important**: For `quiz_id` column, map to existing Quiz records by ID

### **Step 5: Import Jobs**
1. Click **Job** data type
2. Click **Import CSV**
3. Upload `jobs.csv`
4. **Important**: For `required_level` column, map to existing Level records by ID
5. Map `is_active` as Yes/No field

### **Step 6: Import Community Posts**
1. Click **Community Post** data type (create if missing)
2. Click **Import CSV**
3. Upload `community_posts.csv`
4. Suggested fields for the data type and mapping:
   - `title` (text) → `title`
   - `author` (text) → `author` (or a User reference if you already have Users; if so, replace with user_id and map accordingly)
   - `category` (text) → `category`
   - `content` (text, long text) → `content`
   - `posted_at` (date) → `posted_at` (Bubble will detect ISO 8601)
   - `likes` (number) → `likes`
   - `replies` (number) → `replies`
   - `is_pinned` (yes/no) → `is_pinned`
   - `is_active` (yes/no) → `is_active`
5. Verify that dates import correctly (ISO 8601 like `2024-03-01T10:15:00Z`)
6. Privacy rules: allow read via Data API for version-test if you want to fetch posts in the app

## ⚠️ **Important Notes**

- **Questions Format**: The questions field in quizzes.csv contains escaped JSON strings
- **Foreign Keys**: Make sure to map level_id, lesson_id, and required_level to existing records
- **Boolean Fields**: is_active should be imported as TRUE/FALSE values
- **Order Matters**: Import in the specified order to avoid foreign key errors

## 🔍 **After Import Verification**

After importing, verify:
- 4 Levels created
- 8 Lessons created (2 per level)
- 8 Quizzes created (1 per lesson)
- 8 Jobs created (2 per level)
 - 10–15 Community Posts created (from `community_posts.csv`)

## 🚀 **Next Steps**

1. Enable Data API in Bubble Settings → API
2. Set privacy rules for each data type to allow API access
3. Run the endpoint test: `node test_bubble_endpoints.js`