- Add convex client tests to our sdk
- Move Pinned Message back to separate table


# Chat 
- Add inline code highlighting
- Replace Reaction Badges with Pills

# Features
- CMDK for quick actions
- File uploads with convex
- Readd last read message
- Call Feature
    - Start call in channel
    - Show active call in channel + show call history


# Fixes
- Some pages like root server not rerednering on sevrer switch
- Closing Image Dialog rerenders/refetches the whole page


- Fix convex client not seeming to be authed in route loaders
- Investigate previous cursor (maybe this guys solution helps https://discord.com/channels/1019350475847499849/1019350478817079338/1255262027731964016)



# Improvements 


- Delete Notification after it was seen (maybe just a simple cron cleanup job)
- Move all mutations to tanstack query




# Later 
- Add more presence types (away, busy)
- Improve mobile app UI and add settings in both web + mobile to mute Notifications

