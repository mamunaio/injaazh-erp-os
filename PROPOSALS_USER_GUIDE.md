# Smart Proposals - User Guide

## 📋 Table of Contents
1. [Creating a Proposal](#creating-a-proposal)
2. [Editing a Proposal](#editing-a-proposal)
3. [Sharing with Clients](#sharing-with-clients)
4. [Client Acceptance](#client-acceptance)

---

## 🎯 Creating a Proposal

### Step 1: Navigate to Proposals
- Click "Proposals" in the sidebar
- You'll see your proposals dashboard with stats

### Step 2: Create New Proposal
1. Click the **"+ Create Proposal"** button (top right)
2. Wait for the loading state (shows "Creating...")
3. You'll be automatically redirected to the editor

**What Happens Behind the Scenes:**
- A blank proposal is created in MongoDB
- Default values are set:
  - Title: "Untitled Proposal"
  - Client Name: "Client Name"
  - Status: "Draft"
  - Empty phases and investment arrays

---

## ✏️ Editing a Proposal

### Editor Layout

#### Header (Sticky)
- **Back Arrow**: Return to proposals list
- **Title Field**: Click to edit proposal title
- **Last Saved**: Shows timestamp of last save
- **Mark as Sent**: Changes status from Draft to Sent
- **Generate Link**: Copies public URL to clipboard
- **Save Draft**: Manual save button

#### Main Content

##### 1. Client Name
- Simple text input
- Required field
- Auto-saves on change

##### 2. Introduction
- Rich text editor with formatting toolbar
- Supports:
  - Headings (H1, H2)
  - Bold, Italic, Strikethrough
  - Bullet lists, Numbered lists
  - Blockquotes
  - Undo/Redo
- Auto-saves on change

##### 3. Scope of Work / Phases
- Click **"+ Add Phase"** to create new phase
- Each phase has:
  - **Title**: Phase name
  - **Description**: Phase details
  - **Deliverables**: List of deliverable items
    - Click "+ Add Deliverable" to add items
    - Click trash icon to remove items
- Click trash icon on phase to delete entire phase

##### 4. Investment Breakdown
- Click **"+ Add Item"** to create new line item
- Each item has:
  - **Description**: What the cost is for
  - **Cost**: Dollar amount
- Click trash icon to remove item
- **Total Investment**: Auto-calculated at bottom

### Auto-Save
- Triggers automatically 2 seconds after you stop typing
- Shows "Last saved" timestamp in header
- No need to manually save (but you can!)

---

## 📤 Sharing with Clients

### Step 1: Mark as Sent
1. Click **"Mark as Sent"** button in header
2. Status changes from "Draft" to "Sent"
3. `dateSent` is recorded in database

### Step 2: Generate Link
1. Click **"Generate Link"** button
2. Public URL is copied to clipboard
3. Button shows "Link Copied!" confirmation
4. Share this link with your client

**Public URL Format:**
```
https://yourdomain.com/p/[proposal-id]
```

**Example:**
```
https://yourdomain.com/p/664f8a9b2c1d3e4f5a6b7c8d
```

---

## 🎉 Client Acceptance

### Client View Features

#### What Clients See:
1. **Hero Header**
   - Proposal title
   - Client name
   - Total investment amount
   - Status badge (if accepted)

2. **Introduction Section**
   - Your formatted introduction text
   - Professional glassmorphism card design

3. **Scope of Work**
   - All phases with titles and descriptions
   - Deliverables listed for each phase
   - Clean, organized layout

4. **Investment Breakdown**
   - Line-by-line cost breakdown
   - Total investment prominently displayed

5. **Call-to-Action**
   - Large "Sign & Accept Proposal" button
   - Or "Proposal Accepted!" success message

#### Acceptance Flow:
1. Client clicks **"Sign & Accept Proposal"**
2. Button shows loading state: "Processing..."
3. Confetti animation plays 🎊
4. Status updates to "Accepted"
5. Success message displays
6. `dateAccepted` is recorded in database

#### Security Features:
- Draft proposals return 404 (not accessible)
- Only Sent, Viewed, or Accepted proposals are visible
- Clean URL with no ERP interface

---

## 💡 Tips & Best Practices

### Writing Proposals

1. **Title**: Be specific and professional
   - ✅ "Next.js E-commerce Platform Development"
   - ❌ "Website Project"

2. **Introduction**: Set the tone
   - Acknowledge client's needs
   - Show understanding of their business
   - Build excitement for the solution

3. **Phases**: Break down the work
   - Use clear, descriptive phase names
   - Include realistic deliverables
   - Show logical progression

4. **Investment**: Be transparent
   - Itemize costs clearly
   - Group related items
   - Show value, not just price

### Workflow Tips

1. **Save as Draft First**
   - Complete all sections before marking as "Sent"
   - Review for typos and accuracy
   - Check total investment calculation

2. **Use Auto-Save**
   - Don't worry about losing work
   - Auto-save triggers every 2 seconds
   - Manual save available if needed

3. **Generate Link Only When Ready**
   - Mark as "Sent" first
   - Then generate and share link
   - Draft proposals won't display to clients

4. **Track Status**
   - Draft: Still editing
   - Sent: Shared with client
   - Viewed: Client has opened it
   - Accepted: Client has signed
   - Rejected: Client declined

---

## 🎨 Design Features

### Light/Dark Mode
- Automatically follows system preference
- Toggle in topbar
- Consistent across all views

### Responsive Design
- Works on desktop, tablet, and mobile
- Optimized for all screen sizes
- Touch-friendly on mobile devices

### Animations
- Smooth transitions
- Framer Motion animations
- Confetti celebration on acceptance

---

## 🔒 Security & Privacy

### Draft Protection
- Draft proposals are not accessible via public URL
- Returns 404 if client tries to access
- Only you can see drafts in the editor

### Status Validation
- Can't accept a draft proposal
- Status changes are tracked with timestamps
- Audit trail in database

---

## 📊 Proposal Stats

### Dashboard Metrics
- **Active**: Proposals that are Sent or Viewed
- **Won This Month**: Total value of proposals accepted this month
- **Drafts**: Number of proposals still in draft status

### Individual Proposal
- Creation date
- Date sent (if applicable)
- Date accepted (if applicable)
- Current status
- Total value

---

## 🆘 Troubleshooting

### "Link Copied!" doesn't show
- Make sure you've marked the proposal as "Sent" first
- Try clicking the button again
- Check browser clipboard permissions

### Auto-save not working
- Check your internet connection
- Look for "Last saved" timestamp in header
- Try manual save with "Save Draft" button

### Client can't see proposal
- Verify proposal status is "Sent" (not "Draft")
- Check the URL is correct
- Ensure client has the full URL including `/p/`

### Total investment not calculating
- Make sure all cost fields have numbers
- Check for any empty investment items
- Try removing and re-adding the item

---

## 🎯 Quick Reference

| Action | Location | Result |
|--------|----------|--------|
| Create Proposal | Proposals page → "+ Create Proposal" | New blank proposal |
| Edit Title | Editor header → Click title | Inline editing |
| Add Phase | Scope section → "+ Add Phase" | New phase block |
| Add Investment | Investment section → "+ Add Item" | New cost line |
| Save | Auto-saves every 2 seconds | Updates database |
| Mark as Sent | Editor header → "Mark as Sent" | Status changes |
| Share Link | Editor header → "Generate Link" | Copies URL |
| Accept | Client view → "Sign & Accept" | Confetti + status update |

---

## 🎉 Success!

You now have a complete understanding of the Smart Proposals system. Create beautiful, professional proposals and close more deals! 🚀
