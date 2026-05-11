# PakScorer Build Plan

PakScorer is a cricket platform where teams create profiles, manage players, challenge each other, join tournaments, and score matches live for public viewers.

## Core Hierarchy

```text
User
-> Team
-> Players
-> Match Requests
-> Matches
-> Innings
-> Overs
-> Balls
-> Live Score / Stats
```

Tournament hierarchy:

```text
User
-> Tournament
-> Team Applications
-> Approved Teams
-> Fixtures
-> Matches
-> Points Table
-> Winner
```

## User Roles

```text
App Admin
Team Admin
Tournament Organizer
Scorer
Viewer
```

## Numbered Build Plan

### 1. Create App Foundation

- Set up proper app structure.
- Add main layout.
- Add navigation/sidebar.
- Add dashboard page.
- Add basic styling.

### 2. Build Teams Module

- Create team profile.
- Edit team profile.
- View team profile.
- Add team logo, city, and captain.
- Show team stats placeholder.

### 3. Build Players Module

- Add player to team.
- Remove player.
- Edit player profile.
- Set player role.
- Select captain/wicketkeeper.
- Show player stats placeholder.

### 4. Build Match Request Module

- Team A sends request to Team B.
- Add match date, venue, overs, and format.
- Team B can accept request.
- Team B can reject request.
- Accepted request creates a scheduled match.

### 5. Build Match Setup Module

- Open scheduled match.
- Select playing XI for both teams.
- Select toss winner.
- Select batting first team.
- Set overs limit.
- Start match.

### 6. Build Live Scoring Module

- Score every ball.
- Add runs: 0, 1, 2, 3, 4, 6.
- Add extras: wide, no-ball, bye, leg bye.
- Add wicket.
- Undo last ball.
- End innings.
- End match.

### 7. Build Live Score Calculation

- Update team score.
- Update overs.
- Update wickets.
- Update batter stats.
- Update bowler stats.
- Update run rate.
- Update required run rate.
- Update last 6 balls.

### 8. Build Public Live Match Page

- Public match link.
- Live score display.
- Current batsmen.
- Current bowler.
- Last 6 balls.
- Full scorecard.
- Match result.

### 9. Build Tournament Module

- Create tournament.
- Add tournament name, venue, dates, and overs.
- Set tournament format.
- Open/close team applications.
- Show tournament dashboard.

### 10. Build Tournament Applications

- Team applies to tournament.
- Organizer accepts team.
- Organizer rejects team.
- Approved teams appear in tournament teams list.

### 11. Build Tournament Fixtures

- Create fixtures manually.
- Connect fixture to match.
- Show upcoming matches.
- Show completed matches.

### 12. Build Points Table

- Add win/loss/no-result points.
- Calculate net run rate later.
- Update table after each match.
- Show tournament standings.

### 13. Build Stats System

- Player batting stats.
- Player bowling stats.
- Team stats.
- Match stats.
- Tournament stats.

### 14. Add User Login

- Sign up/login.
- User owns team.
- Team admins manage team.
- Tournament organizer manages tournament.
- Scorer role controls scoring.

### 15. Connect Database

- Save teams.
- Save players.
- Save match requests.
- Save matches.
- Save balls.
- Save tournaments.
- Save stats.

### 16. Add Realtime Updates

- Scorer enters ball.
- Database saves ball.
- Public page updates automatically.
- Viewers see score without refreshing.

### 17. Polish UI

- Mobile responsive design.
- Better dashboard.
- Better scoring screen.
- Better team/tournament pages.
- 3D cricket animations.
- Loading and empty states.

### 18. Deploy

- Push to GitHub.
- Connect Cloudflare Pages.
- Add database environment variables.
- Test live website.

## Recommended First Build

The first useful version should focus on this sequence:

```text
1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 8
```

That gives PakScorer a working flow:

```text
Create team
-> Add players
-> Send match request
-> Accept match
-> Set up match
-> Score match live
-> Public viewers watch the score
```

## Match Scoring Logic

For every ball, the scorer records what happened.

Examples:

```text
Ball: 4 runs
-> Team score +4
-> Batter runs +4
-> Bowler runs conceded +4
-> Legal ball counted
```

```text
Ball: Wide
-> Team score +1
-> Bowler runs conceded +1
-> Legal ball not counted
```

```text
Ball: Wicket
-> Wickets +1
-> Batter marked out
-> New batter comes in
-> Legal ball counted unless wicket happens on wide/no-ball rule exception
```

## Live Update Logic

```text
Scorer adds ball
-> Ball saved in database
-> Score recalculated
-> Realtime update sent
-> Public match page updates automatically
```

Common viewers can watch:

- Live score.
- Current batsmen.
- Current bowler.
- Last 6 balls.
- Scorecard.
- Match result.

Common viewers cannot:

- Edit score.
- Create matches.
- Manage teams.
