# Database Setup Instructions

## Option 1: Using MySQL Command Line (if MySQL is in PATH)

```bash
mysql -u root -p < schema.sql
```

Enter your MySQL root password when prompted.

## Option 2: Using PowerShell Script

```powershell
cd database
.\run_schema.ps1
```

The script will:
- Try to find MySQL automatically
- Prompt for your MySQL root password
- Execute the schema

## Option 3: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. Open `schema.sql` file
4. Execute the entire script (Ctrl+Shift+Enter)

## Option 4: Using phpMyAdmin

1. Open phpMyAdmin in your browser
2. Select "SQL" tab
3. Copy and paste the entire contents of `schema.sql`
4. Click "Go" to execute

## Option 5: Manual Execution

If you have MySQL installed but not in PATH, find the full path to `mysql.exe` and run:

```powershell
# Example for XAMPP
C:\xampp\mysql\bin\mysql.exe -u root -p < schema.sql

# Example for MySQL Server
C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe -u root -p < schema.sql
```

## Verification

After running the schema, verify the database was created:

```sql
SHOW DATABASES;
USE ai_recruitment_db;
SHOW TABLES;
```

You should see:
- ai_recruitment_db database
- All tables: users, roles, job_seekers, recruiters, cvs, jobs, cv_scores, job_requirements, applications, ai_analysis_logs

## Troubleshooting

### Error: "Can't create table" (Foreign key constraint)
- Make sure you're running the entire schema.sql file
- The tables must be created in order (dependencies first)

### Error: "Access denied"
- Check your MySQL root password
- Ensure MySQL service is running

### Error: "Database already exists"
- Drop the existing database first:
  ```sql
  DROP DATABASE IF EXISTS ai_recruitment_db;
  ```
- Then run the schema again

