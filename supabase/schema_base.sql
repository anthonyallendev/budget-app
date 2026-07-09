-- Base schema for the live Supabase project (zocahmorepouynuoulkg), dumped 2026-07-09.
-- Captures everything NOT already covered by the two migration_*.sql files in this
-- directory (profiles, transactions, savings_goals, net_worth_*, leaderboard_scores,
-- referral_*, basiq_users, plaid_items, stripe_connect_accounts, ai_reports,
-- households/household_members, user_feature_data) — this was previously live-only,
-- with no source of truth checked into the repo.
--
-- This is a snapshot, not an applied migration — don't re-run it against the live DB.
-- To regenerate: `supabase login`, `supabase db dump --schema public -f supabase/schema_base.sql`
-- (requires a local pg_dump/Docker; see git history around 2026-07-09 for how to work
-- around that if neither is installed).

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."create_household"("p_name" "text" DEFAULT 'Our household'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_id   uuid;
  v_code text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if public.my_household_id() is not null then raise exception 'You are already in a household'; end if;
  v_code := upper(substr(md5(gen_random_uuid()::text), 1, 8));
  insert into households (name, owner_id, invite_code)
    values (coalesce(nullif(trim(p_name), ''), 'Our household'), auth.uid(), v_code)
    returning id into v_id;
  insert into household_members (household_id, user_id) values (v_id, auth.uid());
  return v_id;
end $$;


ALTER FUNCTION "public"."create_household"("p_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_household"() RETURNS json
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select json_build_object(
    'household', (
      select json_build_object(
        'id', h.id, 'name', h.name, 'invite_code', h.invite_code,
        'owner_id', h.owner_id, 'created_at', h.created_at)
      from households h where h.id = public.my_household_id()
    ),
    'members', (
      select coalesce(json_agg(json_build_object(
        'user_id', m.user_id,
        'joined_at', m.joined_at,
        'name', coalesce(nullif(p.full_name, ''), p.username, 'Member'),
        'username', p.username)), '[]'::json)
      from household_members m
      left join profiles p on p.id = m.user_id
      where m.household_id = public.my_household_id()
    )
  );
$$;


ALTER FUNCTION "public"."get_household"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."household_has_premium"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from household_members m
    join profiles p on p.id = m.user_id
    where m.household_id = public.my_household_id()
      and p.subscription_status = 'premium'
  );
$$;


ALTER FUNCTION "public"."household_has_premium"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."join_household"("p_code" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if public.my_household_id() is not null then raise exception 'You are already in a household'; end if;
  select id into v_id from households where invite_code = upper(trim(p_code));
  if v_id is null then raise exception 'Invalid invite code'; end if;
  insert into household_members (household_id, user_id) values (v_id, auth.uid());
  return v_id;
end $$;


ALTER FUNCTION "public"."join_household"("p_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leave_household"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  delete from household_members where user_id = auth.uid();
  -- remove empty households
  delete from households h
    where not exists (select 1 from household_members m where m.household_id = h.id);
end $$;


ALTER FUNCTION "public"."leave_household"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."my_household_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select household_id from household_members where user_id = auth.uid()
$$;


ALTER FUNCTION "public"."my_household_id"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."ai_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "month" "text" NOT NULL,
    "content" "text" NOT NULL,
    "model" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."basiq_users" (
    "user_id" "uuid" NOT NULL,
    "basiq_user_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."basiq_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."household_members" (
    "household_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."household_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."households" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" DEFAULT 'Our household'::"text" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "invite_code" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."households" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leaderboard_scores" (
    "user_id" "uuid" NOT NULL,
    "username" "text" NOT NULL,
    "streak_days" integer DEFAULT 0,
    "health_score" integer DEFAULT 0,
    "savings_pct" numeric(5,2) DEFAULT 0,
    "composite_score" numeric(5,2) DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."leaderboard_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."net_worth_entries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "category" "text" NOT NULL,
    "label" "text",
    "amount" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "net_worth_entries_type_check" CHECK (("type" = ANY (ARRAY['asset'::"text", 'liability'::"text"])))
);


ALTER TABLE "public"."net_worth_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."net_worth_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "snapshot_date" "date" NOT NULL,
    "assets" numeric DEFAULT 0,
    "liabilities" numeric DEFAULT 0,
    "net_worth" numeric DEFAULT 0
);


ALTER TABLE "public"."net_worth_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plaid_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "item_id" "text" NOT NULL,
    "access_token" "text" NOT NULL,
    "institution_name" "text",
    "cursor" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."plaid_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "date_of_birth" "date",
    "country" "text" DEFAULT 'Australia'::"text",
    "super_balance" numeric DEFAULT 0,
    "personal_savings" numeric DEFAULT 0,
    "monthly_contribution" numeric DEFAULT 0,
    "interest_rate" numeric DEFAULT 7,
    "desired_annual_income" numeric DEFAULT 0,
    "life_expectancy" integer DEFAULT 85,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "annual_salary" numeric DEFAULT 0,
    "mobile" "text",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "subscription_status" "text" DEFAULT 'free'::"text",
    "username" "text",
    "referred_by_code" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "code" "text" NOT NULL
);


ALTER TABLE "public"."referral_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_credits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "referral_id" "uuid",
    "amount_cents" integer DEFAULT 100 NOT NULL,
    "status" "text" DEFAULT 'available'::"text" NOT NULL,
    "stripe_balance_tx_id" "text",
    "paid_out_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."referral_credits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "referral_code" "text" NOT NULL,
    "unsubscribe_token" "text" DEFAULT ("gen_random_uuid"())::"text" NOT NULL,
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "reminder_count" integer DEFAULT 0,
    "last_reminder_at" timestamp with time zone,
    "subscribed" boolean DEFAULT true,
    "converted" boolean DEFAULT false
);


ALTER TABLE "public"."referral_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid" NOT NULL,
    "referred_user_id" "uuid",
    "status" "text" DEFAULT 'signed_up'::"text" NOT NULL,
    "credit_applied" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."savings_goals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "icon" "text" DEFAULT '🎯'::"text",
    "target" numeric NOT NULL,
    "saved" numeric DEFAULT 0,
    "target_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."savings_goals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_connect_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_account_id" "text" NOT NULL,
    "onboarding_complete" boolean DEFAULT false,
    "payouts_enabled" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stripe_connect_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "plaid_transaction_id" "text",
    "merchant_name" "text",
    "pending" boolean DEFAULT false,
    "currency_code" "text",
    "source" "text" DEFAULT 'manual'::"text",
    "basiq_transaction_id" "text",
    CONSTRAINT "transactions_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "transactions_type_check" CHECK (("type" = ANY (ARRAY['income'::"text", 'expense'::"text"])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_feature_data" (
    "user_id" "uuid" NOT NULL,
    "feature" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_feature_data" OWNER TO "postgres";


ALTER TABLE ONLY "public"."ai_reports"
    ADD CONSTRAINT "ai_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_reports"
    ADD CONSTRAINT "ai_reports_user_id_month_key" UNIQUE ("user_id", "month");



ALTER TABLE ONLY "public"."basiq_users"
    ADD CONSTRAINT "basiq_users_basiq_user_id_key" UNIQUE ("basiq_user_id");



ALTER TABLE ONLY "public"."basiq_users"
    ADD CONSTRAINT "basiq_users_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."household_members"
    ADD CONSTRAINT "household_members_pkey" PRIMARY KEY ("household_id", "user_id");



ALTER TABLE ONLY "public"."household_members"
    ADD CONSTRAINT "household_members_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."households"
    ADD CONSTRAINT "households_invite_code_key" UNIQUE ("invite_code");



ALTER TABLE ONLY "public"."households"
    ADD CONSTRAINT "households_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leaderboard_scores"
    ADD CONSTRAINT "leaderboard_scores_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."net_worth_entries"
    ADD CONSTRAINT "net_worth_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."net_worth_snapshots"
    ADD CONSTRAINT "net_worth_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."net_worth_snapshots"
    ADD CONSTRAINT "net_worth_snapshots_user_id_snapshot_date_key" UNIQUE ("user_id", "snapshot_date");



ALTER TABLE ONLY "public"."plaid_items"
    ADD CONSTRAINT "plaid_items_item_id_key" UNIQUE ("item_id");



ALTER TABLE ONLY "public"."plaid_items"
    ADD CONSTRAINT "plaid_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_unique" UNIQUE ("username");



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."referral_credits"
    ADD CONSTRAINT "referral_credits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_invites"
    ADD CONSTRAINT "referral_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_invites"
    ADD CONSTRAINT "referral_invites_referrer_id_email_key" UNIQUE ("referrer_id", "email");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referred_user_id_key" UNIQUE ("referred_user_id");



ALTER TABLE ONLY "public"."savings_goals"
    ADD CONSTRAINT "savings_goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_connect_accounts"
    ADD CONSTRAINT "stripe_connect_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stripe_connect_accounts"
    ADD CONSTRAINT "stripe_connect_accounts_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_basiq_transaction_id_key" UNIQUE ("basiq_transaction_id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_plaid_transaction_id_key" UNIQUE ("plaid_transaction_id");



ALTER TABLE ONLY "public"."user_feature_data"
    ADD CONSTRAINT "user_feature_data_pkey" PRIMARY KEY ("user_id", "feature");



ALTER TABLE ONLY "public"."ai_reports"
    ADD CONSTRAINT "ai_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."basiq_users"
    ADD CONSTRAINT "basiq_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."household_members"
    ADD CONSTRAINT "household_members_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."household_members"
    ADD CONSTRAINT "household_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."households"
    ADD CONSTRAINT "households_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leaderboard_scores"
    ADD CONSTRAINT "leaderboard_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."net_worth_entries"
    ADD CONSTRAINT "net_worth_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."net_worth_snapshots"
    ADD CONSTRAINT "net_worth_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."plaid_items"
    ADD CONSTRAINT "plaid_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_credits"
    ADD CONSTRAINT "referral_credits_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id");



ALTER TABLE ONLY "public"."referral_credits"
    ADD CONSTRAINT "referral_credits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."referral_invites"
    ADD CONSTRAINT "referral_invites_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."savings_goals"
    ADD CONSTRAINT "savings_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stripe_connect_accounts"
    ADD CONSTRAINT "stripe_connect_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_feature_data"
    ADD CONSTRAINT "user_feature_data_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users delete own transactions" ON "public"."transactions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users insert own transactions" ON "public"."transactions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage own entries" ON "public"."net_worth_entries" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage own goals" ON "public"."savings_goals" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage own plaid items" ON "public"."plaid_items" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users manage own snapshots" ON "public"."net_worth_snapshots" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users see own transactions" ON "public"."transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."ai_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."basiq_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "household read transactions" ON "public"."transactions" FOR SELECT USING ((("public"."my_household_id"() IS NOT NULL) AND ("user_id" IN ( SELECT "household_members"."user_id"
   FROM "public"."household_members"
  WHERE ("household_members"."household_id" = "public"."my_household_id"())))));



ALTER TABLE "public"."household_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."households" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "leaderboard own write" ON "public"."leaderboard_scores" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "leaderboard public read" ON "public"."leaderboard_scores" FOR SELECT USING (true);



ALTER TABLE "public"."leaderboard_scores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "members read household" ON "public"."households" FOR SELECT USING (("id" = "public"."my_household_id"()));



CREATE POLICY "members read members" ON "public"."household_members" FOR SELECT USING (("household_id" = "public"."my_household_id"()));



ALTER TABLE "public"."net_worth_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."net_worth_snapshots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "own ai reports" ON "public"."ai_reports" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "own connect" ON "public"."stripe_connect_accounts" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "own credits" ON "public"."referral_credits" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "own feature data" ON "public"."user_feature_data" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "own invites" ON "public"."referral_invites" USING (("auth"."uid"() = "referrer_id"));



CREATE POLICY "own referral_codes" ON "public"."referral_codes" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "own referrals" ON "public"."referrals" FOR SELECT USING (("auth"."uid"() = "referrer_id"));



ALTER TABLE "public"."plaid_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referral_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referral_credits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referral_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."savings_goals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stripe_connect_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_feature_data" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_household"("p_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_household"("p_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_household"("p_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_household"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_household"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_household"() TO "service_role";



GRANT ALL ON FUNCTION "public"."household_has_premium"() TO "anon";
GRANT ALL ON FUNCTION "public"."household_has_premium"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."household_has_premium"() TO "service_role";



GRANT ALL ON FUNCTION "public"."join_household"("p_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."join_household"("p_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."join_household"("p_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."leave_household"() TO "anon";
GRANT ALL ON FUNCTION "public"."leave_household"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."leave_household"() TO "service_role";



GRANT ALL ON FUNCTION "public"."my_household_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."my_household_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."my_household_id"() TO "service_role";



GRANT ALL ON TABLE "public"."ai_reports" TO "anon";
GRANT ALL ON TABLE "public"."ai_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_reports" TO "service_role";



GRANT ALL ON TABLE "public"."basiq_users" TO "anon";
GRANT ALL ON TABLE "public"."basiq_users" TO "authenticated";
GRANT ALL ON TABLE "public"."basiq_users" TO "service_role";



GRANT ALL ON TABLE "public"."household_members" TO "anon";
GRANT ALL ON TABLE "public"."household_members" TO "authenticated";
GRANT ALL ON TABLE "public"."household_members" TO "service_role";



GRANT ALL ON TABLE "public"."households" TO "anon";
GRANT ALL ON TABLE "public"."households" TO "authenticated";
GRANT ALL ON TABLE "public"."households" TO "service_role";



GRANT ALL ON TABLE "public"."leaderboard_scores" TO "anon";
GRANT ALL ON TABLE "public"."leaderboard_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."leaderboard_scores" TO "service_role";



GRANT ALL ON TABLE "public"."net_worth_entries" TO "anon";
GRANT ALL ON TABLE "public"."net_worth_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."net_worth_entries" TO "service_role";



GRANT ALL ON TABLE "public"."net_worth_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."net_worth_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."net_worth_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."plaid_items" TO "anon";
GRANT ALL ON TABLE "public"."plaid_items" TO "authenticated";
GRANT ALL ON TABLE "public"."plaid_items" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."referral_codes" TO "anon";
GRANT ALL ON TABLE "public"."referral_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_codes" TO "service_role";



GRANT ALL ON TABLE "public"."referral_credits" TO "anon";
GRANT ALL ON TABLE "public"."referral_credits" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_credits" TO "service_role";



GRANT ALL ON TABLE "public"."referral_invites" TO "anon";
GRANT ALL ON TABLE "public"."referral_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_invites" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."savings_goals" TO "anon";
GRANT ALL ON TABLE "public"."savings_goals" TO "authenticated";
GRANT ALL ON TABLE "public"."savings_goals" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_connect_accounts" TO "anon";
GRANT ALL ON TABLE "public"."stripe_connect_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_connect_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_feature_data" TO "anon";
GRANT ALL ON TABLE "public"."user_feature_data" TO "authenticated";
GRANT ALL ON TABLE "public"."user_feature_data" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







