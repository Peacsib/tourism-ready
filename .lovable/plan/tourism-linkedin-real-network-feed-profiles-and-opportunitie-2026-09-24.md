# Tourism LinkedIn: real Network, Feed, Profiles and Opportunities

## Important limit (please read)
LinkedIn does not let outside apps read its feed, other people's posts or anyone's connections. With your LinkedIn connection we can only:
- read **your own** LinkedIn profile, and
- **publish posts** to your LinkedIn from our app.

So our Network can't simply copy LinkedIn. Instead it fills up with real data from three sources:
1. **Real members of Tourism Workforce 2031**, with their posts, profiles and connections, all saved in our database.
2. **Real tourism professionals** found through Enrich (already connected), such as hotel managers and tour operators in Zimbabwe, whom members can invite.
3. **Your LinkedIn**: import your profile and share any post to LinkedIn with one tap.

All fake people, posts and jobs are removed.

## What gets built

### 1. Network home (LinkedIn-style, three columns)
- Left: your profile card (photo, headline, connection count, passport score), "Import from LinkedIn".
- Middle: **real feed** of member posts. Compose posts with text, photos, live speech and voice notes. Like, comment, and "Also post to LinkedIn".
- Right: "People you may know": real members plus real Enrich tourism professionals (Invite button).
- Nyanzvi Connect stays as a chat button that slides in from the side, instead of replacing the page.
- When the feed is new, it shows real Industry Discovery professionals and prompts members to write the first post. It never shows made-up content.

### 2. Profiles and connections
- Public member profile pages: about, experience, verified Skills Passport skills, posts.
- Connect, Accept/Ignore, and Message buttons. A "My network" page lists connections and pending invitations.

### 3. Opportunities (real)
- Employers (employer role) post real jobs and internships, stored in the database.
- Members apply with their Skills Passport attached. Employers see the applicants.
- There are no fake listings. Until employers post, the page shows "Be the first employer to post" plus live matching tips from Nyanzvi Careers.
- Optional later: pull real tourism jobs from a job-listing service. This needs a key from you.

### 4. Same treatment for Learning and Hubs
- Courses and hubs come from the database, managed by educators and admins, instead of the built-in sample list.

### 5. Speed
- The chat page now pre-loads while you read the welcome screen, so Start opens instantly. This is already done.

## Technical details
- New tables: posts, post_likes, post_comments, connections (requester, addressee, status), messages, jobs, job_applications, plus a public-safe members view. Each table gets GRANTs and RLS: members read public posts and profiles; only authors edit their own; employers manage their own jobs; applicants see their own applications.
- Storage bucket for post images (authenticated upload, public read).
- Server functions with `requireSupabaseAuth` handle writes. LinkedIn is reached through the connector gateway (`/v2/userinfo` for import, `/v2/ugcPosts` for sharing).
- "People you may know" reuses the existing Enrich discovery with its 24h cache.
- Remove PEOPLE, OPPORTUNITIES, COURSES and HUBS demo arrays and replace their uses with database queries. The Nyanzvi chat cards for people, jobs, courses and hubs switch to real rows.
- Build order: Network feed and profiles, then connections and messages, then Opportunities, then Learning and Hubs.
