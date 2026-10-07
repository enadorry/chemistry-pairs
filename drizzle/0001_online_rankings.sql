CREATE TABLE `online_players` (
 `id` text PRIMARY KEY NOT NULL,
 `nickname` text NOT NULL,
 `nickname_key` text NOT NULL UNIQUE,
 `token_hash` text NOT NULL UNIQUE,
 `created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `online_runs` (
 `id` text PRIMARY KEY NOT NULL,
 `player_id` text NOT NULL REFERENCES `online_players`(`id`),
 `category` text NOT NULL,
 `pair_count` integer NOT NULL,
 `deck_json` text NOT NULL,
 `started_at` integer NOT NULL,
 `finished_at` integer,
 `duration_ms` integer,
 `score` integer,
 `moves` integer,
 `best_combo` integer
);
--> statement-breakpoint
CREATE INDEX `online_runs_leaderboard_idx` ON `online_runs` (`category`, `pair_count`, `finished_at`, `player_id`);
