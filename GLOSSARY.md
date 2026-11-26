# Glossary

**Seed**: A subscribed RSS feed, identified by a unique name and a unique URL. _Avoid_: feed, source, subscription.

**Article**: One item published by a Seed. Each Article starts unread. _Avoid_: post, entry, item.

**Fetch**: Pulling a Seed's URL once and storing any Articles not seen before. Fetches normally run on a schedule. The wait between Fetches grows when a Seed has nothing new and shrinks when it does. _Avoid_: update, refresh, sync.

**Manual Fetch**: A Fetch the user starts for one Seed, ignoring its schedule. Its outcome affects the schedule the same way a scheduled Fetch does. UI label: "Fetch now".

**Log**: Timestamped messages the app records while running, such as Fetch progress and failures. Kept only until the app exits.
