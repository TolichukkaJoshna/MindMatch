# How to Start MindMatch Application

## Prerequisites
- MongoDB service must be running (already running ✓)
- Node.js installed

## Starting the Application

### Option 1: Start Both Servers Separately (Recommended)

#### Terminal 1 - Backend Server:
```bash
cd server
npm run dev
```
This will start the backend on http://localhost:5000

#### Terminal 2 - Frontend:
```bash
npm run dev
```
This will start the frontend on http://localhost:5173

### Option 2: Using Concurrently (if configured)
If you want to run both with one command, you can install `concurrently`:
```bash
npm install --save-dev concurrently
```

Then add this to the root `package.json` scripts:
```json
"dev:all": "concurrently \"npm run dev\" \"cd server && npm run dev\""
```

## Troubleshooting

### MongoDB Connection Error
If you see "Operation `users.findOne()` buffering timed out":
1. Check MongoDB service is running: `Get-Service -Name MongoDB`
2. If not running: `Start-Service -Name MongoDB`
3. Test connection: `mongosh mongodb://localhost:27017/mindmatch --eval "db.adminCommand('ping')"`

### Duplicate Index Warning
Already fixed! Indexes have been dropped and will be recreated automatically.

## Current Status
✅ MongoDB is running
✅ Duplicate indexes removed
✅ Connection timeout increased
✅ Database configuration updated
