# Homepage backup

`tokenni-homepage.html` is a backup copy of the live custom homepage
(the `HomePageContent` option in the new-api database on the Tokenni server).
It is NOT part of the frontend build and is NOT deployed by Cloudflare Pages.

- Live source of truth: the `HomePageContent` option in `/opt/new-api/data/one-api.db`
- Local working copy: `~/workspace/tokenni-homepage.html` on the operator VM
- To apply this file to the live site: copy it to the server as
  `/tmp/tokenni-home.html` and run `/tmp/apply-homepage.py`, then
  `docker restart new-api` (the script backs up the database first).

Keep this file in sync whenever the homepage is edited.
