# BundlePitch.ai

This project is a prompt-generation app that uses Supabase for authentication and persistence. Users get **one free request** before needing to subscribe via Stripe.

## Database Structure

Create the following tables in Supabase:

### `requests`
- `id` UUID primary key (default `uuid_generate_v4()`)
- `user_id` UUID – foreign key to `auth.users.id`
- `prompt` text – the request payload
- `result` text – Claude response
- `created_at` timestamp with time zone default `now()`

Row level security should ensure that users can only insert and read their own rows.

### User metadata
Store subscription status in `auth.users.user_metadata` under an `is_subscribed` boolean field. The Stripe webhook updates this field when a checkout session completes.

## Migrating from MongoDB

The original prototype stored history in a MongoDB database. The API code has been updated to use the Supabase client instead. Replace any calls to the old `db` object with `supabase.table("copy_history")` as shown in [`backend/server.py`](backend/server.py).

1. Export your MongoDB collections to JSON (e.g., using `mongoexport`).
2. Import the JSON data into Supabase using the SQL editor or `psql`.
3. Update environment variables `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `backend/.env`.

## Running Locally

1. Install dependencies in both `backend/` and `frontend/`.
2. Provide the environment variables described in `.env` files.
3. Start the FastAPI server:
   ```bash
   uvicorn backend.server:app --reload
   ```
4. Start the React app:
   ```bash
   yarn --cwd frontend start
   ```
5. Optionally run the Node server for Stripe webhooks:
   ```bash
   node server/index.js
   ```

Once running, open `http://localhost:3000` to see the landing page.
