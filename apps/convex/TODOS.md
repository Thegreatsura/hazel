- Rebuild the UI (Rethink some of the fetching i previously did)
- Add Convex R2 file serving (think important for saving on the convex bandwidth tax lol)



- Add isLoading and error state to createQuery
- Add error tuple to createMutation
- Add convex client tests to our sdk

- Move Pinned Message back to separate table

# Features
- Add Presence (online/offline)


# Improvements 
- Add local caching for messages 
- Delete Notification after it was seen (maybe just a simple cron cleanup job)
- Improve typing presence todo less calls