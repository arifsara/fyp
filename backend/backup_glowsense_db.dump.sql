--
-- PostgreSQL database dump
--

\restrict Z2NOTYKVThbrdPnabkaZ8sXzjVwaQFEUJ1XgtASjB1sGDq2THM6uxceMsVNY3vz

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2025-12-09 22:55:28

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 230 (class 1259 OID 16470)
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    provider_id integer NOT NULL,
    service_id integer NOT NULL,
    booking_date timestamp with time zone NOT NULL,
    status character varying,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    end_date timestamp with time zone,
    google_calendar_event_id character varying,
    reminder_sent boolean DEFAULT false,
    time_slot_id integer,
    payment_status character varying DEFAULT 'unpaid'::character varying,
    payment_id integer
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16469)
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bookings_id_seq OWNER TO postgres;

--
-- TOC entry 5110 (class 0 OID 0)
-- Dependencies: 229
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- TOC entry 236 (class 1259 OID 16576)
-- Name: chat_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    session_state jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chat_sessions OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16575)
-- Name: chat_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_sessions_id_seq OWNER TO postgres;

--
-- TOC entry 5111 (class 0 OID 0)
-- Dependencies: 235
-- Name: chat_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_sessions_id_seq OWNED BY public.chat_sessions.id;


--
-- TOC entry 222 (class 1259 OID 16403)
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    email character varying NOT NULL,
    hashed_password character varying,
    full_name character varying,
    phone character varying,
    is_active boolean,
    google_id character varying,
    profile_picture character varying
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16402)
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO postgres;

--
-- TOC entry 5112 (class 0 OID 0)
-- Dependencies: 221
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- TOC entry 234 (class 1259 OID 16531)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    booking_id integer NOT NULL,
    customer_id integer NOT NULL,
    provider_id integer NOT NULL,
    amount character varying NOT NULL,
    currency character varying,
    payment_method character varying,
    stripe_payment_intent_id character varying,
    stripe_charge_id character varying,
    stripe_customer_id character varying,
    status character varying,
    failure_reason text,
    created_at timestamp with time zone DEFAULT now(),
    paid_at timestamp with time zone,
    refunded_at timestamp with time zone
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16530)
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- TOC entry 5113 (class 0 OID 0)
-- Dependencies: 233
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- TOC entry 226 (class 1259 OID 16431)
-- Name: portfolio_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.portfolio_items (
    id integer NOT NULL,
    provider_id integer NOT NULL,
    image_url character varying,
    video_url character varying,
    title character varying,
    description text,
    experience_details text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.portfolio_items OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16430)
-- Name: portfolio_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.portfolio_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.portfolio_items_id_seq OWNER TO postgres;

--
-- TOC entry 5114 (class 0 OID 0)
-- Dependencies: 225
-- Name: portfolio_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.portfolio_items_id_seq OWNED BY public.portfolio_items.id;


--
-- TOC entry 224 (class 1259 OID 16417)
-- Name: service_providers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_providers (
    id integer NOT NULL,
    email character varying NOT NULL,
    hashed_password character varying,
    full_name character varying,
    business_name character varying,
    phone character varying,
    city character varying,
    bio text,
    is_active boolean,
    cnic_id character varying,
    certificates text,
    business_license character varying,
    google_id character varying,
    profile_picture character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    profile_photo character varying,
    timezone character varying DEFAULT 'UTC'::character varying,
    google_calendar_id character varying,
    google_calendar_access_token text,
    google_calendar_refresh_token text
);


ALTER TABLE public.service_providers OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16416)
-- Name: service_providers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_providers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_providers_id_seq OWNER TO postgres;

--
-- TOC entry 5115 (class 0 OID 0)
-- Dependencies: 223
-- Name: service_providers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_providers_id_seq OWNED BY public.service_providers.id;


--
-- TOC entry 228 (class 1259 OID 16449)
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id integer NOT NULL,
    provider_id integer NOT NULL,
    name character varying NOT NULL,
    category character varying NOT NULL,
    description text,
    price character varying,
    duration character varying,
    availability_schedule json,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.services OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16448)
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_id_seq OWNER TO postgres;

--
-- TOC entry 5116 (class 0 OID 0)
-- Dependencies: 227
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- TOC entry 232 (class 1259 OID 16505)
-- Name: time_slots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.time_slots (
    id integer NOT NULL,
    service_id integer NOT NULL,
    slot_date timestamp with time zone NOT NULL,
    is_available boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.time_slots OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16504)
-- Name: time_slots_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.time_slots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.time_slots_id_seq OWNER TO postgres;

--
-- TOC entry 5117 (class 0 OID 0)
-- Dependencies: 231
-- Name: time_slots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.time_slots_id_seq OWNED BY public.time_slots.id;


--
-- TOC entry 238 (class 1259 OID 16596)
-- Name: user_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_messages (
    id integer NOT NULL,
    user_id integer NOT NULL,
    message text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    session_id integer
);


ALTER TABLE public.user_messages OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16595)
-- Name: user_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_messages_id_seq OWNER TO postgres;

--
-- TOC entry 5118 (class 0 OID 0)
-- Dependencies: 237
-- Name: user_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_messages_id_seq OWNED BY public.user_messages.id;


--
-- TOC entry 220 (class 1259 OID 16389)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying NOT NULL,
    hashed_password character varying NOT NULL,
    full_name character varying,
    is_active boolean
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16388)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5119 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4863 (class 2604 OID 16633)
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- TOC entry 4871 (class 2604 OID 16634)
-- Name: chat_sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_sessions ALTER COLUMN id SET DEFAULT nextval('public.chat_sessions_id_seq'::regclass);


--
-- TOC entry 4855 (class 2604 OID 16635)
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- TOC entry 4869 (class 2604 OID 16636)
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- TOC entry 4859 (class 2604 OID 16637)
-- Name: portfolio_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portfolio_items ALTER COLUMN id SET DEFAULT nextval('public.portfolio_items_id_seq'::regclass);


--
-- TOC entry 4856 (class 2604 OID 16638)
-- Name: service_providers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_providers ALTER COLUMN id SET DEFAULT nextval('public.service_providers_id_seq'::regclass);


--
-- TOC entry 4861 (class 2604 OID 16639)
-- Name: services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- TOC entry 4867 (class 2604 OID 16640)
-- Name: time_slots id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_slots ALTER COLUMN id SET DEFAULT nextval('public.time_slots_id_seq'::regclass);


--
-- TOC entry 4874 (class 2604 OID 16641)
-- Name: user_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_messages ALTER COLUMN id SET DEFAULT nextval('public.user_messages_id_seq'::regclass);


--
-- TOC entry 4854 (class 2604 OID 16642)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5096 (class 0 OID 16470)
-- Dependencies: 230
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bookings (id, customer_id, provider_id, service_id, booking_date, status, notes, created_at, end_date, google_calendar_event_id, reminder_sent, time_slot_id, payment_status, payment_id) FROM stdin;
1	1	1	1	2025-12-09 19:00:00+05	completed	\N	2025-12-08 18:47:35.695597+05	2025-12-09 19:40:00+05	\N	f	26	unpaid	\N
2	1	1	2	2025-12-08 15:00:00+05	cancelled	\N	2025-12-08 18:58:35.436613+05	2025-12-08 15:45:00+05	\N	f	433	unpaid	\N
3	1	1	2	2025-12-08 16:00:00+05	completed	\N	2025-12-08 20:45:48.670194+05	2025-12-08 16:45:00+05	\N	f	434	pending	2
5	1	1	2	2025-12-08 14:00:00+05	completed	\N	2025-12-08 21:16:46.14812+05	2025-12-08 14:45:00+05	\N	f	435	paid	1
4	1	1	2	2025-12-08 15:00:00+05	completed	\N	2025-12-08 20:47:06.73651+05	2025-12-08 15:45:00+05	\N	f	433	unpaid	\N
6	1	1	3	2025-12-08 14:00:00+05	completed	\N	2025-12-08 21:27:29.096575+05	2025-12-08 14:45:00+05	\N	f	441	paid	3
7	1	1	3	2025-12-08 14:30:00+05	completed	\N	2025-12-08 21:40:47.436479+05	2025-12-08 15:15:00+05	\N	f	442	paid	4
8	1	1	3	2025-12-08 14:00:00+05	completed	\N	2025-12-08 21:43:27.009621+05	2025-12-08 14:45:00+05	\N	f	441	unpaid	\N
9	1	1	3	2025-12-08 14:00:00+05	confirmed	\N	2025-12-08 21:58:08.495646+05	2025-12-08 14:45:00+05	\N	f	441	paid	5
10	1	1	3	2025-12-08 14:30:00+05	confirmed	\N	2025-12-08 22:19:14.471997+05	2025-12-08 15:15:00+05	\N	f	442	paid	6
11	1	1	2	2025-12-08 15:00:00+05	confirmed	\N	2025-12-09 01:22:05.117928+05	2025-12-08 15:45:00+05	\N	f	433	paid	7
12	1	1	3	2025-12-10 14:00:00+05	completed	\N	2025-12-09 15:53:17.30744+05	2025-12-10 14:45:00+05	\N	f	451	paid	8
\.


--
-- TOC entry 5102 (class 0 OID 16576)
-- Dependencies: 236
-- Data for Name: chat_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_sessions (id, user_id, session_state, created_at, updated_at) FROM stdin;
1	1	{"context": {}, "messages": []}	2025-12-09 14:13:04.79095+05	2025-12-09 14:13:04.79095+05
2	1	{"context": {}, "messages": []}	2025-12-09 14:13:42.152792+05	2025-12-09 14:13:42.152792+05
3	1	{"context": {}, "messages": []}	2025-12-09 14:21:08.494949+05	2025-12-09 14:21:08.494949+05
4	1	{"context": {}, "messages": []}	2025-12-09 14:21:55.473824+05	2025-12-09 14:21:55.473824+05
5	1	{"context": {}, "messages": []}	2025-12-09 21:07:26.612439+05	2025-12-09 21:07:26.612439+05
\.


--
-- TOC entry 5088 (class 0 OID 16403)
-- Dependencies: 222
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, email, hashed_password, full_name, phone, is_active, google_id, profile_picture) FROM stdin;
1	amnaayyaz29@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$m5NSilHqPaf0/t/bG0OIEQ$NDiN/dn72C3KR7/SSqNTj+64XfMnNfM8AMYjDeYVzXU	Amna Ayyaz	03058277771	t	\N	\N
\.


--
-- TOC entry 5100 (class 0 OID 16531)
-- Dependencies: 234
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, booking_id, customer_id, provider_id, amount, currency, payment_method, stripe_payment_intent_id, stripe_charge_id, stripe_customer_id, status, failure_reason, created_at, paid_at, refunded_at) FROM stdin;
1	5	1	1	3.0	USD	\N	pi_3Sc77D3TuhY0MXqy1nH9NbpR	ch_3Sc77D3TuhY0MXqy1HdA4Cdg	\N	succeeded	\N	2025-12-08 21:16:46.421494+05	2025-12-08 21:20:32.654128+05	\N
2	3	1	1	3.0	USD	\N	pi_3Sc7C33TuhY0MXqy18N1tH38	\N	\N	pending	\N	2025-12-08 21:21:07.330166+05	\N	\N
3	6	1	1	2.0	USD	\N	pi_3Sc7HZ3TuhY0MXqy0bdNmlzE	ch_3Sc7HZ3TuhY0MXqy0ovv1Gik	\N	succeeded	\N	2025-12-08 21:27:29.260979+05	2025-12-08 21:29:45.958178+05	\N
4	7	1	1	2.0	USD	\N	pi_3Sc7VE3TuhY0MXqy0td1zvxo	ch_3Sc7VE3TuhY0MXqy0DpcWvSw	\N	succeeded	\N	2025-12-08 21:41:34.680972+05	2025-12-08 21:42:36.168616+05	\N
5	9	1	1	2.0	USD	\N	pi_3Sc7sQ3TuhY0MXqy0rnFJIwZ	ch_3Sc7sQ3TuhY0MXqy0MSsnYQj	\N	succeeded	\N	2025-12-08 22:05:33.629409+05	2025-12-08 22:05:44.779678+05	\N
6	10	1	1	2.0	USD	\N	pi_3Sc8LR3TuhY0MXqy0g5Zg6H9	ch_3Sc8LR3TuhY0MXqy05aReo4S	\N	succeeded	\N	2025-12-08 22:35:32.354425+05	2025-12-08 22:35:43.383954+05	\N
7	11	1	1	3.0	USD	\N	pi_3ScAy53TuhY0MXqy0uMY1pXu	ch_3ScAy53TuhY0MXqy0EjAhmOA	\N	succeeded	\N	2025-12-09 01:23:34.550576+05	2025-12-09 01:23:48.982279+05	\N
8	12	1	1	2.0	USD	\N	pi_3ScOYH3TuhY0MXqy0apRFpAH	ch_3ScOYH3TuhY0MXqy0sGWN8Nz	\N	succeeded	\N	2025-12-09 15:53:50.322215+05	2025-12-09 15:54:32.266882+05	\N
\.


--
-- TOC entry 5092 (class 0 OID 16431)
-- Dependencies: 226
-- Data for Name: portfolio_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.portfolio_items (id, provider_id, image_url, video_url, title, description, experience_details, created_at) FROM stdin;
1	1	/uploads/portfolio/images.png	\N	Bridal Makeup 	Makeup Artist	5yrs	2025-12-08 15:05:49.833839+05
\.


--
-- TOC entry 5090 (class 0 OID 16417)
-- Dependencies: 224
-- Data for Name: service_providers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_providers (id, email, hashed_password, full_name, business_name, phone, city, bio, is_active, cnic_id, certificates, business_license, google_id, profile_picture, created_at, profile_photo, timezone, google_calendar_id, google_calendar_access_token, google_calendar_refresh_token) FROM stdin;
2	f223324@cfd.nu.edu.pk	$argon2id$v=19$m=65536,t=3,p=4$u5eScg7B+F9rTUmJ8b4Xog$wh3By0go7B9qwLH+ck5NlRjfCX2EzNQWEiARBxzgtTQ	tayyaba	tayyaba salon	03216638400	lhr	bridal	t	33100567567654	/uploads/documents/HerrisCorner.pdf	/uploads/documents/HerrisCorner.pdf	\N	\N	2025-12-07 23:34:25.708224+05	\N	UTC	\N	\N	\N
1	f223273@cfd.nu.edu.pk	$argon2id$v=19$m=65536,t=3,p=4$f09p7X0P4RxDqNXae68VQg$iECMC92nbcLm4DSGUOVTxm94CyX21/mP31c7FQb3xEg	SP1	Sarah's Salon	03058277771	FSD	\N	t	\N	\N	\N	\N	\N	2025-12-07 23:31:46.488836+05	/uploads/profile/67395b1c-70da-427e-9811-2b9c44a08873.jpeg	UTC	\N	\N	\N
\.


--
-- TOC entry 5094 (class 0 OID 16449)
-- Dependencies: 228
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, provider_id, name, category, description, price, duration, availability_schedule, is_active, created_at) FROM stdin;
1	1	manicure	spa		10	40	null	t	2025-12-08 15:08:42.011967+05
2	1	HAIRCUT	hair	Haircut with blowdry	3	45	null	t	2025-12-08 18:53:35.367883+05
3	1	NailArt	nails		2	45	null	t	2025-12-08 21:25:58.760294+05
\.


--
-- TOC entry 5098 (class 0 OID 16505)
-- Dependencies: 232
-- Data for Name: time_slots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.time_slots (id, service_id, slot_date, is_available, created_at) FROM stdin;
1	1	2025-12-08 10:00:00+05	t	2025-12-08 18:46:56.222013+05
2	1	2025-12-08 11:00:00+05	t	2025-12-08 18:46:56.222013+05
3	1	2025-12-08 12:00:00+05	t	2025-12-08 18:46:56.222013+05
4	1	2025-12-08 13:00:00+05	t	2025-12-08 18:46:56.222013+05
5	1	2025-12-08 14:00:00+05	t	2025-12-08 18:46:56.222013+05
6	1	2025-12-08 15:00:00+05	t	2025-12-08 18:46:56.222013+05
7	1	2025-12-08 16:00:00+05	t	2025-12-08 18:46:56.222013+05
8	1	2025-12-08 17:00:00+05	t	2025-12-08 18:46:56.222013+05
9	1	2025-12-08 18:00:00+05	t	2025-12-08 18:46:56.222013+05
10	1	2025-12-08 19:00:00+05	t	2025-12-08 18:46:56.222013+05
11	1	2025-12-08 20:00:00+05	t	2025-12-08 18:46:56.222013+05
12	1	2025-12-08 21:00:00+05	t	2025-12-08 18:46:56.222013+05
13	1	2025-12-08 22:00:00+05	t	2025-12-08 18:46:56.222013+05
14	1	2025-12-08 23:00:00+05	t	2025-12-08 18:46:56.222013+05
15	1	2025-12-09 00:00:00+05	t	2025-12-08 18:46:56.222013+05
16	1	2025-12-09 01:00:00+05	t	2025-12-08 18:46:56.222013+05
17	1	2025-12-09 10:00:00+05	t	2025-12-08 18:46:56.222013+05
18	1	2025-12-09 11:00:00+05	t	2025-12-08 18:46:56.222013+05
19	1	2025-12-09 12:00:00+05	t	2025-12-08 18:46:56.222013+05
20	1	2025-12-09 13:00:00+05	t	2025-12-08 18:46:56.222013+05
21	1	2025-12-09 14:00:00+05	t	2025-12-08 18:46:56.222013+05
22	1	2025-12-09 15:00:00+05	t	2025-12-08 18:46:56.222013+05
23	1	2025-12-09 16:00:00+05	t	2025-12-08 18:46:56.222013+05
24	1	2025-12-09 17:00:00+05	t	2025-12-08 18:46:56.222013+05
25	1	2025-12-09 18:00:00+05	t	2025-12-08 18:46:56.222013+05
26	1	2025-12-09 19:00:00+05	t	2025-12-08 18:46:56.222013+05
27	1	2025-12-09 20:00:00+05	t	2025-12-08 18:46:56.222013+05
28	1	2025-12-09 21:00:00+05	t	2025-12-08 18:46:56.222013+05
29	1	2025-12-09 22:00:00+05	t	2025-12-08 18:46:56.222013+05
30	1	2025-12-09 23:00:00+05	t	2025-12-08 18:46:56.222013+05
31	1	2025-12-10 00:00:00+05	t	2025-12-08 18:46:56.222013+05
32	1	2025-12-10 01:00:00+05	t	2025-12-08 18:46:56.222013+05
33	1	2025-12-10 10:00:00+05	t	2025-12-08 18:46:56.222013+05
34	1	2025-12-10 11:00:00+05	t	2025-12-08 18:46:56.222013+05
35	1	2025-12-10 12:00:00+05	t	2025-12-08 18:46:56.222013+05
36	1	2025-12-10 13:00:00+05	t	2025-12-08 18:46:56.222013+05
37	1	2025-12-10 14:00:00+05	t	2025-12-08 18:46:56.222013+05
38	1	2025-12-10 15:00:00+05	t	2025-12-08 18:46:56.222013+05
39	1	2025-12-10 16:00:00+05	t	2025-12-08 18:46:56.222013+05
40	1	2025-12-10 17:00:00+05	t	2025-12-08 18:46:56.222013+05
41	1	2025-12-10 18:00:00+05	t	2025-12-08 18:46:56.222013+05
42	1	2025-12-10 19:00:00+05	t	2025-12-08 18:46:56.222013+05
43	1	2025-12-10 20:00:00+05	t	2025-12-08 18:46:56.222013+05
44	1	2025-12-10 21:00:00+05	t	2025-12-08 18:46:56.222013+05
45	1	2025-12-10 22:00:00+05	t	2025-12-08 18:46:56.222013+05
46	1	2025-12-10 23:00:00+05	t	2025-12-08 18:46:56.222013+05
47	1	2025-12-11 00:00:00+05	t	2025-12-08 18:46:56.222013+05
48	1	2025-12-11 01:00:00+05	t	2025-12-08 18:46:56.222013+05
49	1	2025-12-15 10:00:00+05	t	2025-12-08 18:46:56.222013+05
50	1	2025-12-15 11:00:00+05	t	2025-12-08 18:46:56.222013+05
51	1	2025-12-15 12:00:00+05	t	2025-12-08 18:46:56.222013+05
52	1	2025-12-15 13:00:00+05	t	2025-12-08 18:46:56.222013+05
53	1	2025-12-15 14:00:00+05	t	2025-12-08 18:46:56.222013+05
54	1	2025-12-15 15:00:00+05	t	2025-12-08 18:46:56.222013+05
55	1	2025-12-15 16:00:00+05	t	2025-12-08 18:46:56.222013+05
56	1	2025-12-15 17:00:00+05	t	2025-12-08 18:46:56.222013+05
57	1	2025-12-15 18:00:00+05	t	2025-12-08 18:46:56.222013+05
58	1	2025-12-15 19:00:00+05	t	2025-12-08 18:46:56.222013+05
59	1	2025-12-15 20:00:00+05	t	2025-12-08 18:46:56.222013+05
60	1	2025-12-15 21:00:00+05	t	2025-12-08 18:46:56.222013+05
61	1	2025-12-15 22:00:00+05	t	2025-12-08 18:46:56.222013+05
62	1	2025-12-15 23:00:00+05	t	2025-12-08 18:46:56.222013+05
63	1	2025-12-16 00:00:00+05	t	2025-12-08 18:46:56.222013+05
64	1	2025-12-16 01:00:00+05	t	2025-12-08 18:46:56.222013+05
65	1	2025-12-16 10:00:00+05	t	2025-12-08 18:46:56.222013+05
66	1	2025-12-16 11:00:00+05	t	2025-12-08 18:46:56.222013+05
67	1	2025-12-16 12:00:00+05	t	2025-12-08 18:46:56.222013+05
68	1	2025-12-16 13:00:00+05	t	2025-12-08 18:46:56.222013+05
69	1	2025-12-16 14:00:00+05	t	2025-12-08 18:46:56.222013+05
70	1	2025-12-16 15:00:00+05	t	2025-12-08 18:46:56.222013+05
71	1	2025-12-16 16:00:00+05	t	2025-12-08 18:46:56.222013+05
72	1	2025-12-16 17:00:00+05	t	2025-12-08 18:46:56.222013+05
73	1	2025-12-16 18:00:00+05	t	2025-12-08 18:46:56.222013+05
74	1	2025-12-16 19:00:00+05	t	2025-12-08 18:46:56.222013+05
75	1	2025-12-16 20:00:00+05	t	2025-12-08 18:46:56.222013+05
76	1	2025-12-16 21:00:00+05	t	2025-12-08 18:46:56.222013+05
77	1	2025-12-16 22:00:00+05	t	2025-12-08 18:46:56.222013+05
78	1	2025-12-16 23:00:00+05	t	2025-12-08 18:46:56.222013+05
79	1	2025-12-17 00:00:00+05	t	2025-12-08 18:46:56.222013+05
80	1	2025-12-17 01:00:00+05	t	2025-12-08 18:46:56.222013+05
81	1	2025-12-17 10:00:00+05	t	2025-12-08 18:46:56.222013+05
82	1	2025-12-17 11:00:00+05	t	2025-12-08 18:46:56.222013+05
83	1	2025-12-17 12:00:00+05	t	2025-12-08 18:46:56.222013+05
84	1	2025-12-17 13:00:00+05	t	2025-12-08 18:46:56.222013+05
85	1	2025-12-17 14:00:00+05	t	2025-12-08 18:46:56.222013+05
86	1	2025-12-17 15:00:00+05	t	2025-12-08 18:46:56.222013+05
87	1	2025-12-17 16:00:00+05	t	2025-12-08 18:46:56.222013+05
88	1	2025-12-17 17:00:00+05	t	2025-12-08 18:46:56.222013+05
89	1	2025-12-17 18:00:00+05	t	2025-12-08 18:46:56.222013+05
90	1	2025-12-17 19:00:00+05	t	2025-12-08 18:46:56.222013+05
91	1	2025-12-17 20:00:00+05	t	2025-12-08 18:46:56.222013+05
92	1	2025-12-17 21:00:00+05	t	2025-12-08 18:46:56.222013+05
93	1	2025-12-17 22:00:00+05	t	2025-12-08 18:46:56.222013+05
94	1	2025-12-17 23:00:00+05	t	2025-12-08 18:46:56.222013+05
95	1	2025-12-18 00:00:00+05	t	2025-12-08 18:46:56.222013+05
96	1	2025-12-18 01:00:00+05	t	2025-12-08 18:46:56.222013+05
97	1	2025-12-22 10:00:00+05	t	2025-12-08 18:46:56.222013+05
98	1	2025-12-22 11:00:00+05	t	2025-12-08 18:46:56.222013+05
99	1	2025-12-22 12:00:00+05	t	2025-12-08 18:46:56.222013+05
100	1	2025-12-22 13:00:00+05	t	2025-12-08 18:46:56.222013+05
101	1	2025-12-22 14:00:00+05	t	2025-12-08 18:46:56.222013+05
102	1	2025-12-22 15:00:00+05	t	2025-12-08 18:46:56.222013+05
103	1	2025-12-22 16:00:00+05	t	2025-12-08 18:46:56.222013+05
104	1	2025-12-22 17:00:00+05	t	2025-12-08 18:46:56.222013+05
105	1	2025-12-22 18:00:00+05	t	2025-12-08 18:46:56.222013+05
106	1	2025-12-22 19:00:00+05	t	2025-12-08 18:46:56.222013+05
107	1	2025-12-22 20:00:00+05	t	2025-12-08 18:46:56.222013+05
108	1	2025-12-22 21:00:00+05	t	2025-12-08 18:46:56.222013+05
109	1	2025-12-22 22:00:00+05	t	2025-12-08 18:46:56.222013+05
110	1	2025-12-22 23:00:00+05	t	2025-12-08 18:46:56.222013+05
111	1	2025-12-23 00:00:00+05	t	2025-12-08 18:46:56.222013+05
112	1	2025-12-23 01:00:00+05	t	2025-12-08 18:46:56.222013+05
113	1	2025-12-23 10:00:00+05	t	2025-12-08 18:46:56.222013+05
114	1	2025-12-23 11:00:00+05	t	2025-12-08 18:46:56.222013+05
115	1	2025-12-23 12:00:00+05	t	2025-12-08 18:46:56.222013+05
116	1	2025-12-23 13:00:00+05	t	2025-12-08 18:46:56.222013+05
117	1	2025-12-23 14:00:00+05	t	2025-12-08 18:46:56.222013+05
118	1	2025-12-23 15:00:00+05	t	2025-12-08 18:46:56.222013+05
119	1	2025-12-23 16:00:00+05	t	2025-12-08 18:46:56.222013+05
120	1	2025-12-23 17:00:00+05	t	2025-12-08 18:46:56.222013+05
121	1	2025-12-23 18:00:00+05	t	2025-12-08 18:46:56.222013+05
122	1	2025-12-23 19:00:00+05	t	2025-12-08 18:46:56.222013+05
123	1	2025-12-23 20:00:00+05	t	2025-12-08 18:46:56.222013+05
124	1	2025-12-23 21:00:00+05	t	2025-12-08 18:46:56.222013+05
125	1	2025-12-23 22:00:00+05	t	2025-12-08 18:46:56.222013+05
126	1	2025-12-23 23:00:00+05	t	2025-12-08 18:46:56.222013+05
127	1	2025-12-24 00:00:00+05	t	2025-12-08 18:46:56.222013+05
128	1	2025-12-24 01:00:00+05	t	2025-12-08 18:46:56.222013+05
129	1	2025-12-24 10:00:00+05	t	2025-12-08 18:46:56.222013+05
130	1	2025-12-24 11:00:00+05	t	2025-12-08 18:46:56.222013+05
131	1	2025-12-24 12:00:00+05	t	2025-12-08 18:46:56.222013+05
132	1	2025-12-24 13:00:00+05	t	2025-12-08 18:46:56.222013+05
133	1	2025-12-24 14:00:00+05	t	2025-12-08 18:46:56.222013+05
134	1	2025-12-24 15:00:00+05	t	2025-12-08 18:46:56.222013+05
135	1	2025-12-24 16:00:00+05	t	2025-12-08 18:46:56.222013+05
136	1	2025-12-24 17:00:00+05	t	2025-12-08 18:46:56.222013+05
137	1	2025-12-24 18:00:00+05	t	2025-12-08 18:46:56.222013+05
138	1	2025-12-24 19:00:00+05	t	2025-12-08 18:46:56.222013+05
139	1	2025-12-24 20:00:00+05	t	2025-12-08 18:46:56.222013+05
140	1	2025-12-24 21:00:00+05	t	2025-12-08 18:46:56.222013+05
141	1	2025-12-24 22:00:00+05	t	2025-12-08 18:46:56.222013+05
142	1	2025-12-24 23:00:00+05	t	2025-12-08 18:46:56.222013+05
143	1	2025-12-25 00:00:00+05	t	2025-12-08 18:46:56.222013+05
144	1	2025-12-25 01:00:00+05	t	2025-12-08 18:46:56.222013+05
145	1	2025-12-29 10:00:00+05	t	2025-12-08 18:46:56.222013+05
146	1	2025-12-29 11:00:00+05	t	2025-12-08 18:46:56.222013+05
147	1	2025-12-29 12:00:00+05	t	2025-12-08 18:46:56.222013+05
148	1	2025-12-29 13:00:00+05	t	2025-12-08 18:46:56.222013+05
149	1	2025-12-29 14:00:00+05	t	2025-12-08 18:46:56.222013+05
150	1	2025-12-29 15:00:00+05	t	2025-12-08 18:46:56.222013+05
151	1	2025-12-29 16:00:00+05	t	2025-12-08 18:46:56.222013+05
152	1	2025-12-29 17:00:00+05	t	2025-12-08 18:46:56.222013+05
153	1	2025-12-29 18:00:00+05	t	2025-12-08 18:46:56.222013+05
154	1	2025-12-29 19:00:00+05	t	2025-12-08 18:46:56.222013+05
155	1	2025-12-29 20:00:00+05	t	2025-12-08 18:46:56.222013+05
156	1	2025-12-29 21:00:00+05	t	2025-12-08 18:46:56.222013+05
157	1	2025-12-29 22:00:00+05	t	2025-12-08 18:46:56.222013+05
158	1	2025-12-29 23:00:00+05	t	2025-12-08 18:46:56.222013+05
159	1	2025-12-30 00:00:00+05	t	2025-12-08 18:46:56.222013+05
160	1	2025-12-30 01:00:00+05	t	2025-12-08 18:46:56.222013+05
161	1	2025-12-30 10:00:00+05	t	2025-12-08 18:46:56.222013+05
162	1	2025-12-30 11:00:00+05	t	2025-12-08 18:46:56.222013+05
163	1	2025-12-30 12:00:00+05	t	2025-12-08 18:46:56.222013+05
164	1	2025-12-30 13:00:00+05	t	2025-12-08 18:46:56.222013+05
165	1	2025-12-30 14:00:00+05	t	2025-12-08 18:46:56.222013+05
166	1	2025-12-30 15:00:00+05	t	2025-12-08 18:46:56.222013+05
167	1	2025-12-30 16:00:00+05	t	2025-12-08 18:46:56.222013+05
168	1	2025-12-30 17:00:00+05	t	2025-12-08 18:46:56.222013+05
169	1	2025-12-30 18:00:00+05	t	2025-12-08 18:46:56.222013+05
170	1	2025-12-30 19:00:00+05	t	2025-12-08 18:46:56.222013+05
171	1	2025-12-30 20:00:00+05	t	2025-12-08 18:46:56.222013+05
172	1	2025-12-30 21:00:00+05	t	2025-12-08 18:46:56.222013+05
173	1	2025-12-30 22:00:00+05	t	2025-12-08 18:46:56.222013+05
174	1	2025-12-30 23:00:00+05	t	2025-12-08 18:46:56.222013+05
175	1	2025-12-31 00:00:00+05	t	2025-12-08 18:46:56.222013+05
176	1	2025-12-31 01:00:00+05	t	2025-12-08 18:46:56.222013+05
177	1	2025-12-31 10:00:00+05	t	2025-12-08 18:46:56.222013+05
178	1	2025-12-31 11:00:00+05	t	2025-12-08 18:46:56.222013+05
179	1	2025-12-31 12:00:00+05	t	2025-12-08 18:46:56.222013+05
180	1	2025-12-31 13:00:00+05	t	2025-12-08 18:46:56.222013+05
181	1	2025-12-31 14:00:00+05	t	2025-12-08 18:46:56.222013+05
182	1	2025-12-31 15:00:00+05	t	2025-12-08 18:46:56.222013+05
183	1	2025-12-31 16:00:00+05	t	2025-12-08 18:46:56.222013+05
184	1	2025-12-31 17:00:00+05	t	2025-12-08 18:46:56.222013+05
185	1	2025-12-31 18:00:00+05	t	2025-12-08 18:46:56.222013+05
186	1	2025-12-31 19:00:00+05	t	2025-12-08 18:46:56.222013+05
187	1	2025-12-31 20:00:00+05	t	2025-12-08 18:46:56.222013+05
188	1	2025-12-31 21:00:00+05	t	2025-12-08 18:46:56.222013+05
189	1	2025-12-31 22:00:00+05	t	2025-12-08 18:46:56.222013+05
190	1	2025-12-31 23:00:00+05	t	2025-12-08 18:46:56.222013+05
191	1	2026-01-01 00:00:00+05	t	2025-12-08 18:46:56.222013+05
192	1	2026-01-01 01:00:00+05	t	2025-12-08 18:46:56.222013+05
193	1	2026-01-05 10:00:00+05	t	2025-12-08 18:46:56.222013+05
194	1	2026-01-05 11:00:00+05	t	2025-12-08 18:46:56.222013+05
195	1	2026-01-05 12:00:00+05	t	2025-12-08 18:46:56.222013+05
196	1	2026-01-05 13:00:00+05	t	2025-12-08 18:46:56.222013+05
197	1	2026-01-05 14:00:00+05	t	2025-12-08 18:46:56.222013+05
198	1	2026-01-05 15:00:00+05	t	2025-12-08 18:46:56.222013+05
199	1	2026-01-05 16:00:00+05	t	2025-12-08 18:46:56.222013+05
200	1	2026-01-05 17:00:00+05	t	2025-12-08 18:46:56.222013+05
201	1	2026-01-05 18:00:00+05	t	2025-12-08 18:46:56.222013+05
202	1	2026-01-05 19:00:00+05	t	2025-12-08 18:46:56.222013+05
203	1	2026-01-05 20:00:00+05	t	2025-12-08 18:46:56.222013+05
204	1	2026-01-05 21:00:00+05	t	2025-12-08 18:46:56.222013+05
205	1	2026-01-05 22:00:00+05	t	2025-12-08 18:46:56.222013+05
206	1	2026-01-05 23:00:00+05	t	2025-12-08 18:46:56.222013+05
207	1	2026-01-06 00:00:00+05	t	2025-12-08 18:46:56.222013+05
208	1	2026-01-06 01:00:00+05	t	2025-12-08 18:46:56.222013+05
209	1	2026-01-06 10:00:00+05	t	2025-12-08 18:46:56.222013+05
210	1	2026-01-06 11:00:00+05	t	2025-12-08 18:46:56.222013+05
211	1	2026-01-06 12:00:00+05	t	2025-12-08 18:46:56.222013+05
212	1	2026-01-06 13:00:00+05	t	2025-12-08 18:46:56.222013+05
213	1	2026-01-06 14:00:00+05	t	2025-12-08 18:46:56.222013+05
214	1	2026-01-06 15:00:00+05	t	2025-12-08 18:46:56.222013+05
215	1	2026-01-06 16:00:00+05	t	2025-12-08 18:46:56.222013+05
216	1	2026-01-06 17:00:00+05	t	2025-12-08 18:46:56.222013+05
217	1	2026-01-06 18:00:00+05	t	2025-12-08 18:46:56.222013+05
218	1	2026-01-06 19:00:00+05	t	2025-12-08 18:46:56.222013+05
219	1	2026-01-06 20:00:00+05	t	2025-12-08 18:46:56.222013+05
220	1	2026-01-06 21:00:00+05	t	2025-12-08 18:46:56.222013+05
221	1	2026-01-06 22:00:00+05	t	2025-12-08 18:46:56.222013+05
222	1	2026-01-06 23:00:00+05	t	2025-12-08 18:46:56.222013+05
223	1	2026-01-07 00:00:00+05	t	2025-12-08 18:46:56.222013+05
224	1	2026-01-07 01:00:00+05	t	2025-12-08 18:46:56.222013+05
225	1	2026-01-07 10:00:00+05	t	2025-12-08 18:46:56.222013+05
226	1	2026-01-07 11:00:00+05	t	2025-12-08 18:46:56.222013+05
227	1	2026-01-07 12:00:00+05	t	2025-12-08 18:46:56.222013+05
228	1	2026-01-07 13:00:00+05	t	2025-12-08 18:46:56.222013+05
229	1	2026-01-07 14:00:00+05	t	2025-12-08 18:46:56.222013+05
230	1	2026-01-07 15:00:00+05	t	2025-12-08 18:46:56.222013+05
231	1	2026-01-07 16:00:00+05	t	2025-12-08 18:46:56.222013+05
232	1	2026-01-07 17:00:00+05	t	2025-12-08 18:46:56.222013+05
233	1	2026-01-07 18:00:00+05	t	2025-12-08 18:46:56.222013+05
234	1	2026-01-07 19:00:00+05	t	2025-12-08 18:46:56.222013+05
235	1	2026-01-07 20:00:00+05	t	2025-12-08 18:46:56.222013+05
236	1	2026-01-07 21:00:00+05	t	2025-12-08 18:46:56.222013+05
237	1	2026-01-07 22:00:00+05	t	2025-12-08 18:46:56.222013+05
238	1	2026-01-07 23:00:00+05	t	2025-12-08 18:46:56.222013+05
239	1	2026-01-08 00:00:00+05	t	2025-12-08 18:46:56.222013+05
240	1	2026-01-08 01:00:00+05	t	2025-12-08 18:46:56.222013+05
241	1	2026-01-12 10:00:00+05	t	2025-12-08 18:46:56.222013+05
242	1	2026-01-12 11:00:00+05	t	2025-12-08 18:46:56.222013+05
243	1	2026-01-12 12:00:00+05	t	2025-12-08 18:46:56.222013+05
244	1	2026-01-12 13:00:00+05	t	2025-12-08 18:46:56.222013+05
245	1	2026-01-12 14:00:00+05	t	2025-12-08 18:46:56.222013+05
246	1	2026-01-12 15:00:00+05	t	2025-12-08 18:46:56.222013+05
247	1	2026-01-12 16:00:00+05	t	2025-12-08 18:46:56.222013+05
248	1	2026-01-12 17:00:00+05	t	2025-12-08 18:46:56.222013+05
249	1	2026-01-12 18:00:00+05	t	2025-12-08 18:46:56.222013+05
250	1	2026-01-12 19:00:00+05	t	2025-12-08 18:46:56.222013+05
251	1	2026-01-12 20:00:00+05	t	2025-12-08 18:46:56.222013+05
252	1	2026-01-12 21:00:00+05	t	2025-12-08 18:46:56.222013+05
253	1	2026-01-12 22:00:00+05	t	2025-12-08 18:46:56.222013+05
254	1	2026-01-12 23:00:00+05	t	2025-12-08 18:46:56.222013+05
255	1	2026-01-13 00:00:00+05	t	2025-12-08 18:46:56.222013+05
256	1	2026-01-13 01:00:00+05	t	2025-12-08 18:46:56.222013+05
257	1	2026-01-13 10:00:00+05	t	2025-12-08 18:46:56.222013+05
258	1	2026-01-13 11:00:00+05	t	2025-12-08 18:46:56.222013+05
259	1	2026-01-13 12:00:00+05	t	2025-12-08 18:46:56.222013+05
260	1	2026-01-13 13:00:00+05	t	2025-12-08 18:46:56.222013+05
261	1	2026-01-13 14:00:00+05	t	2025-12-08 18:46:56.222013+05
262	1	2026-01-13 15:00:00+05	t	2025-12-08 18:46:56.222013+05
263	1	2026-01-13 16:00:00+05	t	2025-12-08 18:46:56.222013+05
264	1	2026-01-13 17:00:00+05	t	2025-12-08 18:46:56.222013+05
265	1	2026-01-13 18:00:00+05	t	2025-12-08 18:46:56.222013+05
266	1	2026-01-13 19:00:00+05	t	2025-12-08 18:46:56.222013+05
267	1	2026-01-13 20:00:00+05	t	2025-12-08 18:46:56.222013+05
268	1	2026-01-13 21:00:00+05	t	2025-12-08 18:46:56.222013+05
269	1	2026-01-13 22:00:00+05	t	2025-12-08 18:46:56.222013+05
270	1	2026-01-13 23:00:00+05	t	2025-12-08 18:46:56.222013+05
271	1	2026-01-14 00:00:00+05	t	2025-12-08 18:46:56.222013+05
272	1	2026-01-14 01:00:00+05	t	2025-12-08 18:46:56.222013+05
273	1	2026-01-14 10:00:00+05	t	2025-12-08 18:46:56.222013+05
274	1	2026-01-14 11:00:00+05	t	2025-12-08 18:46:56.222013+05
275	1	2026-01-14 12:00:00+05	t	2025-12-08 18:46:56.222013+05
276	1	2026-01-14 13:00:00+05	t	2025-12-08 18:46:56.222013+05
277	1	2026-01-14 14:00:00+05	t	2025-12-08 18:46:56.222013+05
278	1	2026-01-14 15:00:00+05	t	2025-12-08 18:46:56.222013+05
279	1	2026-01-14 16:00:00+05	t	2025-12-08 18:46:56.222013+05
280	1	2026-01-14 17:00:00+05	t	2025-12-08 18:46:56.222013+05
281	1	2026-01-14 18:00:00+05	t	2025-12-08 18:46:56.222013+05
282	1	2026-01-14 19:00:00+05	t	2025-12-08 18:46:56.222013+05
283	1	2026-01-14 20:00:00+05	t	2025-12-08 18:46:56.222013+05
284	1	2026-01-14 21:00:00+05	t	2025-12-08 18:46:56.222013+05
285	1	2026-01-14 22:00:00+05	t	2025-12-08 18:46:56.222013+05
286	1	2026-01-14 23:00:00+05	t	2025-12-08 18:46:56.222013+05
287	1	2026-01-15 00:00:00+05	t	2025-12-08 18:46:56.222013+05
288	1	2026-01-15 01:00:00+05	t	2025-12-08 18:46:56.222013+05
289	1	2026-01-19 10:00:00+05	t	2025-12-08 18:46:56.222013+05
290	1	2026-01-19 11:00:00+05	t	2025-12-08 18:46:56.222013+05
291	1	2026-01-19 12:00:00+05	t	2025-12-08 18:46:56.222013+05
292	1	2026-01-19 13:00:00+05	t	2025-12-08 18:46:56.222013+05
293	1	2026-01-19 14:00:00+05	t	2025-12-08 18:46:56.222013+05
294	1	2026-01-19 15:00:00+05	t	2025-12-08 18:46:56.222013+05
295	1	2026-01-19 16:00:00+05	t	2025-12-08 18:46:56.222013+05
296	1	2026-01-19 17:00:00+05	t	2025-12-08 18:46:56.222013+05
297	1	2026-01-19 18:00:00+05	t	2025-12-08 18:46:56.222013+05
298	1	2026-01-19 19:00:00+05	t	2025-12-08 18:46:56.222013+05
299	1	2026-01-19 20:00:00+05	t	2025-12-08 18:46:56.222013+05
300	1	2026-01-19 21:00:00+05	t	2025-12-08 18:46:56.222013+05
301	1	2026-01-19 22:00:00+05	t	2025-12-08 18:46:56.222013+05
302	1	2026-01-19 23:00:00+05	t	2025-12-08 18:46:56.222013+05
303	1	2026-01-20 00:00:00+05	t	2025-12-08 18:46:56.222013+05
304	1	2026-01-20 01:00:00+05	t	2025-12-08 18:46:56.222013+05
305	1	2026-01-20 10:00:00+05	t	2025-12-08 18:46:56.222013+05
306	1	2026-01-20 11:00:00+05	t	2025-12-08 18:46:56.222013+05
307	1	2026-01-20 12:00:00+05	t	2025-12-08 18:46:56.222013+05
308	1	2026-01-20 13:00:00+05	t	2025-12-08 18:46:56.222013+05
309	1	2026-01-20 14:00:00+05	t	2025-12-08 18:46:56.222013+05
310	1	2026-01-20 15:00:00+05	t	2025-12-08 18:46:56.222013+05
311	1	2026-01-20 16:00:00+05	t	2025-12-08 18:46:56.222013+05
312	1	2026-01-20 17:00:00+05	t	2025-12-08 18:46:56.222013+05
313	1	2026-01-20 18:00:00+05	t	2025-12-08 18:46:56.222013+05
314	1	2026-01-20 19:00:00+05	t	2025-12-08 18:46:56.222013+05
315	1	2026-01-20 20:00:00+05	t	2025-12-08 18:46:56.222013+05
316	1	2026-01-20 21:00:00+05	t	2025-12-08 18:46:56.222013+05
317	1	2026-01-20 22:00:00+05	t	2025-12-08 18:46:56.222013+05
318	1	2026-01-20 23:00:00+05	t	2025-12-08 18:46:56.222013+05
319	1	2026-01-21 00:00:00+05	t	2025-12-08 18:46:56.222013+05
320	1	2026-01-21 01:00:00+05	t	2025-12-08 18:46:56.222013+05
321	1	2026-01-21 10:00:00+05	t	2025-12-08 18:46:56.222013+05
322	1	2026-01-21 11:00:00+05	t	2025-12-08 18:46:56.222013+05
323	1	2026-01-21 12:00:00+05	t	2025-12-08 18:46:56.222013+05
324	1	2026-01-21 13:00:00+05	t	2025-12-08 18:46:56.222013+05
325	1	2026-01-21 14:00:00+05	t	2025-12-08 18:46:56.222013+05
326	1	2026-01-21 15:00:00+05	t	2025-12-08 18:46:56.222013+05
327	1	2026-01-21 16:00:00+05	t	2025-12-08 18:46:56.222013+05
328	1	2026-01-21 17:00:00+05	t	2025-12-08 18:46:56.222013+05
329	1	2026-01-21 18:00:00+05	t	2025-12-08 18:46:56.222013+05
330	1	2026-01-21 19:00:00+05	t	2025-12-08 18:46:56.222013+05
331	1	2026-01-21 20:00:00+05	t	2025-12-08 18:46:56.222013+05
332	1	2026-01-21 21:00:00+05	t	2025-12-08 18:46:56.222013+05
333	1	2026-01-21 22:00:00+05	t	2025-12-08 18:46:56.222013+05
334	1	2026-01-21 23:00:00+05	t	2025-12-08 18:46:56.222013+05
335	1	2026-01-22 00:00:00+05	t	2025-12-08 18:46:56.222013+05
336	1	2026-01-22 01:00:00+05	t	2025-12-08 18:46:56.222013+05
337	1	2026-01-26 10:00:00+05	t	2025-12-08 18:46:56.222013+05
338	1	2026-01-26 11:00:00+05	t	2025-12-08 18:46:56.222013+05
339	1	2026-01-26 12:00:00+05	t	2025-12-08 18:46:56.222013+05
340	1	2026-01-26 13:00:00+05	t	2025-12-08 18:46:56.222013+05
341	1	2026-01-26 14:00:00+05	t	2025-12-08 18:46:56.222013+05
342	1	2026-01-26 15:00:00+05	t	2025-12-08 18:46:56.222013+05
343	1	2026-01-26 16:00:00+05	t	2025-12-08 18:46:56.222013+05
344	1	2026-01-26 17:00:00+05	t	2025-12-08 18:46:56.222013+05
345	1	2026-01-26 18:00:00+05	t	2025-12-08 18:46:56.222013+05
346	1	2026-01-26 19:00:00+05	t	2025-12-08 18:46:56.222013+05
347	1	2026-01-26 20:00:00+05	t	2025-12-08 18:46:56.222013+05
348	1	2026-01-26 21:00:00+05	t	2025-12-08 18:46:56.222013+05
349	1	2026-01-26 22:00:00+05	t	2025-12-08 18:46:56.222013+05
350	1	2026-01-26 23:00:00+05	t	2025-12-08 18:46:56.222013+05
351	1	2026-01-27 00:00:00+05	t	2025-12-08 18:46:56.222013+05
352	1	2026-01-27 01:00:00+05	t	2025-12-08 18:46:56.222013+05
353	1	2026-01-27 10:00:00+05	t	2025-12-08 18:46:56.222013+05
354	1	2026-01-27 11:00:00+05	t	2025-12-08 18:46:56.222013+05
355	1	2026-01-27 12:00:00+05	t	2025-12-08 18:46:56.222013+05
356	1	2026-01-27 13:00:00+05	t	2025-12-08 18:46:56.222013+05
357	1	2026-01-27 14:00:00+05	t	2025-12-08 18:46:56.222013+05
358	1	2026-01-27 15:00:00+05	t	2025-12-08 18:46:56.222013+05
359	1	2026-01-27 16:00:00+05	t	2025-12-08 18:46:56.222013+05
360	1	2026-01-27 17:00:00+05	t	2025-12-08 18:46:56.222013+05
361	1	2026-01-27 18:00:00+05	t	2025-12-08 18:46:56.222013+05
362	1	2026-01-27 19:00:00+05	t	2025-12-08 18:46:56.222013+05
363	1	2026-01-27 20:00:00+05	t	2025-12-08 18:46:56.222013+05
364	1	2026-01-27 21:00:00+05	t	2025-12-08 18:46:56.222013+05
365	1	2026-01-27 22:00:00+05	t	2025-12-08 18:46:56.222013+05
366	1	2026-01-27 23:00:00+05	t	2025-12-08 18:46:56.222013+05
367	1	2026-01-28 00:00:00+05	t	2025-12-08 18:46:56.222013+05
368	1	2026-01-28 01:00:00+05	t	2025-12-08 18:46:56.222013+05
369	1	2026-01-28 10:00:00+05	t	2025-12-08 18:46:56.222013+05
370	1	2026-01-28 11:00:00+05	t	2025-12-08 18:46:56.222013+05
371	1	2026-01-28 12:00:00+05	t	2025-12-08 18:46:56.222013+05
372	1	2026-01-28 13:00:00+05	t	2025-12-08 18:46:56.222013+05
373	1	2026-01-28 14:00:00+05	t	2025-12-08 18:46:56.222013+05
374	1	2026-01-28 15:00:00+05	t	2025-12-08 18:46:56.222013+05
375	1	2026-01-28 16:00:00+05	t	2025-12-08 18:46:56.222013+05
376	1	2026-01-28 17:00:00+05	t	2025-12-08 18:46:56.222013+05
377	1	2026-01-28 18:00:00+05	t	2025-12-08 18:46:56.222013+05
378	1	2026-01-28 19:00:00+05	t	2025-12-08 18:46:56.222013+05
379	1	2026-01-28 20:00:00+05	t	2025-12-08 18:46:56.222013+05
380	1	2026-01-28 21:00:00+05	t	2025-12-08 18:46:56.222013+05
381	1	2026-01-28 22:00:00+05	t	2025-12-08 18:46:56.222013+05
382	1	2026-01-28 23:00:00+05	t	2025-12-08 18:46:56.222013+05
383	1	2026-01-29 00:00:00+05	t	2025-12-08 18:46:56.222013+05
384	1	2026-01-29 01:00:00+05	t	2025-12-08 18:46:56.222013+05
385	1	2026-02-02 10:00:00+05	t	2025-12-08 18:46:56.222013+05
386	1	2026-02-02 11:00:00+05	t	2025-12-08 18:46:56.222013+05
387	1	2026-02-02 12:00:00+05	t	2025-12-08 18:46:56.222013+05
388	1	2026-02-02 13:00:00+05	t	2025-12-08 18:46:56.222013+05
389	1	2026-02-02 14:00:00+05	t	2025-12-08 18:46:56.222013+05
390	1	2026-02-02 15:00:00+05	t	2025-12-08 18:46:56.222013+05
391	1	2026-02-02 16:00:00+05	t	2025-12-08 18:46:56.222013+05
392	1	2026-02-02 17:00:00+05	t	2025-12-08 18:46:56.222013+05
393	1	2026-02-02 18:00:00+05	t	2025-12-08 18:46:56.222013+05
394	1	2026-02-02 19:00:00+05	t	2025-12-08 18:46:56.222013+05
395	1	2026-02-02 20:00:00+05	t	2025-12-08 18:46:56.222013+05
396	1	2026-02-02 21:00:00+05	t	2025-12-08 18:46:56.222013+05
397	1	2026-02-02 22:00:00+05	t	2025-12-08 18:46:56.222013+05
398	1	2026-02-02 23:00:00+05	t	2025-12-08 18:46:56.222013+05
399	1	2026-02-03 00:00:00+05	t	2025-12-08 18:46:56.222013+05
400	1	2026-02-03 01:00:00+05	t	2025-12-08 18:46:56.222013+05
401	1	2026-02-03 10:00:00+05	t	2025-12-08 18:46:56.222013+05
402	1	2026-02-03 11:00:00+05	t	2025-12-08 18:46:56.222013+05
403	1	2026-02-03 12:00:00+05	t	2025-12-08 18:46:56.222013+05
404	1	2026-02-03 13:00:00+05	t	2025-12-08 18:46:56.222013+05
405	1	2026-02-03 14:00:00+05	t	2025-12-08 18:46:56.222013+05
406	1	2026-02-03 15:00:00+05	t	2025-12-08 18:46:56.222013+05
407	1	2026-02-03 16:00:00+05	t	2025-12-08 18:46:56.222013+05
408	1	2026-02-03 17:00:00+05	t	2025-12-08 18:46:56.222013+05
409	1	2026-02-03 18:00:00+05	t	2025-12-08 18:46:56.222013+05
410	1	2026-02-03 19:00:00+05	t	2025-12-08 18:46:56.222013+05
411	1	2026-02-03 20:00:00+05	t	2025-12-08 18:46:56.222013+05
412	1	2026-02-03 21:00:00+05	t	2025-12-08 18:46:56.222013+05
413	1	2026-02-03 22:00:00+05	t	2025-12-08 18:46:56.222013+05
414	1	2026-02-03 23:00:00+05	t	2025-12-08 18:46:56.222013+05
415	1	2026-02-04 00:00:00+05	t	2025-12-08 18:46:56.222013+05
416	1	2026-02-04 01:00:00+05	t	2025-12-08 18:46:56.222013+05
417	1	2026-02-04 10:00:00+05	t	2025-12-08 18:46:56.222013+05
418	1	2026-02-04 11:00:00+05	t	2025-12-08 18:46:56.222013+05
419	1	2026-02-04 12:00:00+05	t	2025-12-08 18:46:56.222013+05
420	1	2026-02-04 13:00:00+05	t	2025-12-08 18:46:56.222013+05
421	1	2026-02-04 14:00:00+05	t	2025-12-08 18:46:56.222013+05
422	1	2026-02-04 15:00:00+05	t	2025-12-08 18:46:56.222013+05
423	1	2026-02-04 16:00:00+05	t	2025-12-08 18:46:56.222013+05
424	1	2026-02-04 17:00:00+05	t	2025-12-08 18:46:56.222013+05
425	1	2026-02-04 18:00:00+05	t	2025-12-08 18:46:56.222013+05
426	1	2026-02-04 19:00:00+05	t	2025-12-08 18:46:56.222013+05
427	1	2026-02-04 20:00:00+05	t	2025-12-08 18:46:56.222013+05
428	1	2026-02-04 21:00:00+05	t	2025-12-08 18:46:56.222013+05
429	1	2026-02-04 22:00:00+05	t	2025-12-08 18:46:56.222013+05
430	1	2026-02-04 23:00:00+05	t	2025-12-08 18:46:56.222013+05
431	1	2026-02-05 00:00:00+05	t	2025-12-08 18:46:56.222013+05
432	1	2026-02-05 01:00:00+05	t	2025-12-08 18:46:56.222013+05
433	2	2025-12-08 15:00:00+05	t	2025-12-08 18:56:29.113147+05
434	2	2025-12-08 16:00:00+05	t	2025-12-08 18:56:29.113147+05
435	2	2025-12-08 14:00:00+05	t	2025-12-08 21:16:02.011152+05
436	2	2025-12-08 17:00:00+05	t	2025-12-08 21:16:02.011152+05
437	2	2025-12-08 18:00:00+05	t	2025-12-08 21:16:02.011152+05
438	2	2025-12-08 19:00:00+05	t	2025-12-08 21:16:02.011152+05
439	2	2025-12-08 20:00:00+05	t	2025-12-08 21:16:02.011152+05
440	2	2025-12-08 21:00:00+05	t	2025-12-08 21:16:02.011152+05
441	3	2025-12-08 14:00:00+05	t	2025-12-08 21:26:32.550452+05
442	3	2025-12-08 14:30:00+05	t	2025-12-08 21:26:32.550452+05
443	3	2025-12-15 14:00:00+05	t	2025-12-08 21:26:32.550452+05
444	3	2025-12-15 14:30:00+05	t	2025-12-08 21:26:32.550452+05
445	3	2025-12-22 14:00:00+05	t	2025-12-08 21:26:32.550452+05
446	3	2025-12-22 14:30:00+05	t	2025-12-08 21:26:32.550452+05
447	3	2025-12-29 14:00:00+05	t	2025-12-08 21:26:32.550452+05
448	3	2025-12-29 14:30:00+05	t	2025-12-08 21:26:32.550452+05
449	3	2026-01-05 14:00:00+05	t	2025-12-08 21:26:32.550452+05
450	3	2026-01-05 14:30:00+05	t	2025-12-08 21:26:32.550452+05
451	3	2025-12-10 14:00:00+05	t	2025-12-09 15:52:45.015672+05
452	3	2025-12-10 14:45:00+05	t	2025-12-09 15:52:45.015672+05
453	3	2025-12-10 15:30:00+05	t	2025-12-09 15:52:45.015672+05
454	3	2025-12-10 16:15:00+05	t	2025-12-09 15:52:45.015672+05
455	3	2025-12-17 14:00:00+05	t	2025-12-09 15:52:45.015672+05
456	3	2025-12-17 14:45:00+05	t	2025-12-09 15:52:45.015672+05
457	3	2025-12-17 15:30:00+05	t	2025-12-09 15:52:45.015672+05
458	3	2025-12-17 16:15:00+05	t	2025-12-09 15:52:45.015672+05
459	3	2025-12-24 14:00:00+05	t	2025-12-09 15:52:45.015672+05
460	3	2025-12-24 14:45:00+05	t	2025-12-09 15:52:45.015672+05
461	3	2025-12-24 15:30:00+05	t	2025-12-09 15:52:45.015672+05
462	3	2025-12-24 16:15:00+05	t	2025-12-09 15:52:45.015672+05
463	3	2025-12-31 14:00:00+05	t	2025-12-09 15:52:45.015672+05
464	3	2025-12-31 14:45:00+05	t	2025-12-09 15:52:45.015672+05
465	3	2025-12-31 15:30:00+05	t	2025-12-09 15:52:45.015672+05
466	3	2025-12-31 16:15:00+05	t	2025-12-09 15:52:45.015672+05
467	3	2026-01-07 14:00:00+05	t	2025-12-09 15:52:45.015672+05
468	3	2026-01-07 14:45:00+05	t	2025-12-09 15:52:45.015672+05
469	3	2026-01-07 15:30:00+05	t	2025-12-09 15:52:45.015672+05
470	3	2026-01-07 16:15:00+05	t	2025-12-09 15:52:45.015672+05
471	3	2026-01-14 14:00:00+05	t	2025-12-09 15:52:45.015672+05
472	3	2026-01-14 14:45:00+05	t	2025-12-09 15:52:45.015672+05
473	3	2026-01-14 15:30:00+05	t	2025-12-09 15:52:45.015672+05
474	3	2026-01-14 16:15:00+05	t	2025-12-09 15:52:45.015672+05
475	3	2026-01-21 14:00:00+05	t	2025-12-09 15:52:45.015672+05
476	3	2026-01-21 14:45:00+05	t	2025-12-09 15:52:45.015672+05
477	3	2026-01-21 15:30:00+05	t	2025-12-09 15:52:45.015672+05
478	3	2026-01-21 16:15:00+05	t	2025-12-09 15:52:45.015672+05
479	3	2026-01-28 14:00:00+05	t	2025-12-09 15:52:45.015672+05
480	3	2026-01-28 14:45:00+05	t	2025-12-09 15:52:45.015672+05
481	3	2026-01-28 15:30:00+05	t	2025-12-09 15:52:45.015672+05
482	3	2026-01-28 16:15:00+05	t	2025-12-09 15:52:45.015672+05
483	3	2026-02-04 14:00:00+05	t	2025-12-09 15:52:45.015672+05
484	3	2026-02-04 14:45:00+05	t	2025-12-09 15:52:45.015672+05
485	3	2026-02-04 15:30:00+05	t	2025-12-09 15:52:45.015672+05
486	3	2026-02-04 16:15:00+05	t	2025-12-09 15:52:45.015672+05
\.


--
-- TOC entry 5104 (class 0 OID 16596)
-- Dependencies: 238
-- Data for Name: user_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_messages (id, user_id, message, "timestamp", session_id) FROM stdin;
1	1	i need hairstylist	2025-12-09 14:13:04.8342+05	1
2	1	hair	2025-12-09 14:13:42.155156+05	2
3	1	I need a hairstylist	2025-12-09 14:21:08.515768+05	3
4	1	bridal	2025-12-09 14:21:55.485615+05	4
5	1	bridal	2025-12-09 21:07:26.63905+05	5
\.


--
-- TOC entry 5086 (class 0 OID 16389)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, hashed_password, full_name, is_active) FROM stdin;
1	amnaayyaz29@gmaill.com	$argon2id$v=19$m=65536,t=3,p=4$IYSwdm6NEcIYg9BaCwFA6A$gcDnF+g2YHd3ytEL9EHhcdH61iZTF6FngU9OYhLECFY	AMNA	t
\.


--
-- TOC entry 5120 (class 0 OID 0)
-- Dependencies: 229
-- Name: bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bookings_id_seq', 11, true);


--
-- TOC entry 5121 (class 0 OID 0)
-- Dependencies: 235
-- Name: chat_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_sessions_id_seq', 1, false);


--
-- TOC entry 5122 (class 0 OID 0)
-- Dependencies: 221
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 1, true);


--
-- TOC entry 5123 (class 0 OID 0)
-- Dependencies: 233
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 7, true);


--
-- TOC entry 5124 (class 0 OID 0)
-- Dependencies: 225
-- Name: portfolio_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.portfolio_items_id_seq', 2, true);


--
-- TOC entry 5125 (class 0 OID 0)
-- Dependencies: 223
-- Name: service_providers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.service_providers_id_seq', 2, true);


--
-- TOC entry 5126 (class 0 OID 0)
-- Dependencies: 227
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.services_id_seq', 3, true);


--
-- TOC entry 5127 (class 0 OID 0)
-- Dependencies: 231
-- Name: time_slots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.time_slots_id_seq', 450, true);


--
-- TOC entry 5128 (class 0 OID 0)
-- Dependencies: 237
-- Name: user_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_messages_id_seq', 1, false);


--
-- TOC entry 5129 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- TOC entry 4897 (class 2606 OID 16483)
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- TOC entry 4918 (class 2606 OID 16589)
-- Name: chat_sessions chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4881 (class 2606 OID 16413)
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- TOC entry 4916 (class 2606 OID 16544)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 4892 (class 2606 OID 16441)
-- Name: portfolio_items portfolio_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portfolio_items
    ADD CONSTRAINT portfolio_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4889 (class 2606 OID 16427)
-- Name: service_providers service_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_providers
    ADD CONSTRAINT service_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 4895 (class 2606 OID 16461)
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- TOC entry 4907 (class 2606 OID 16514)
-- Name: time_slots time_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_slots
    ADD CONSTRAINT time_slots_pkey PRIMARY KEY (id);


--
-- TOC entry 4923 (class 2606 OID 16608)
-- Name: user_messages user_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_messages
    ADD CONSTRAINT user_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4879 (class 2606 OID 16399)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4898 (class 1259 OID 16573)
-- Name: idx_bookings_payment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_payment_id ON public.bookings USING btree (payment_id);


--
-- TOC entry 4899 (class 1259 OID 16574)
-- Name: idx_bookings_payment_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_payment_status ON public.bookings USING btree (payment_status);


--
-- TOC entry 4900 (class 1259 OID 16529)
-- Name: idx_bookings_time_slot_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_time_slot_id ON public.bookings USING btree (time_slot_id);


--
-- TOC entry 4919 (class 1259 OID 16621)
-- Name: idx_chat_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions USING btree (user_id);


--
-- TOC entry 4882 (class 1259 OID 16502)
-- Name: idx_customers_google_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_google_id ON public.customers USING btree (google_id) WHERE (google_id IS NOT NULL);


--
-- TOC entry 4908 (class 1259 OID 16562)
-- Name: idx_payments_booking_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_booking_id ON public.payments USING btree (booking_id);


--
-- TOC entry 4909 (class 1259 OID 16563)
-- Name: idx_payments_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_customer_id ON public.payments USING btree (customer_id);


--
-- TOC entry 4910 (class 1259 OID 16564)
-- Name: idx_payments_provider_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_provider_id ON public.payments USING btree (provider_id);


--
-- TOC entry 4911 (class 1259 OID 16566)
-- Name: idx_payments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_status ON public.payments USING btree (status);


--
-- TOC entry 4912 (class 1259 OID 16565)
-- Name: idx_payments_stripe_payment_intent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_stripe_payment_intent_id ON public.payments USING btree (stripe_payment_intent_id);


--
-- TOC entry 4885 (class 1259 OID 16503)
-- Name: idx_providers_google_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_providers_google_id ON public.service_providers USING btree (google_id) WHERE (google_id IS NOT NULL);


--
-- TOC entry 4902 (class 1259 OID 16523)
-- Name: idx_time_slots_available; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_time_slots_available ON public.time_slots USING btree (is_available) WHERE (is_available = true);


--
-- TOC entry 4903 (class 1259 OID 16521)
-- Name: idx_time_slots_service_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_time_slots_service_id ON public.time_slots USING btree (service_id);


--
-- TOC entry 4904 (class 1259 OID 16522)
-- Name: idx_time_slots_slot_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_time_slots_slot_date ON public.time_slots USING btree (slot_date);


--
-- TOC entry 4920 (class 1259 OID 16620)
-- Name: idx_user_messages_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_messages_session_id ON public.user_messages USING btree (session_id);


--
-- TOC entry 4921 (class 1259 OID 16619)
-- Name: idx_user_messages_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_messages_user_id ON public.user_messages USING btree (user_id);


--
-- TOC entry 4901 (class 1259 OID 16499)
-- Name: ix_bookings_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_bookings_id ON public.bookings USING btree (id);


--
-- TOC entry 4883 (class 1259 OID 16414)
-- Name: ix_customers_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_customers_email ON public.customers USING btree (email);


--
-- TOC entry 4884 (class 1259 OID 16415)
-- Name: ix_customers_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_customers_id ON public.customers USING btree (id);


--
-- TOC entry 4913 (class 1259 OID 16561)
-- Name: ix_payments_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_payments_id ON public.payments USING btree (id);


--
-- TOC entry 4914 (class 1259 OID 16560)
-- Name: ix_payments_stripe_payment_intent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_payments_stripe_payment_intent_id ON public.payments USING btree (stripe_payment_intent_id);


--
-- TOC entry 4890 (class 1259 OID 16447)
-- Name: ix_portfolio_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_portfolio_items_id ON public.portfolio_items USING btree (id);


--
-- TOC entry 4886 (class 1259 OID 16428)
-- Name: ix_service_providers_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_service_providers_email ON public.service_providers USING btree (email);


--
-- TOC entry 4887 (class 1259 OID 16429)
-- Name: ix_service_providers_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_service_providers_id ON public.service_providers USING btree (id);


--
-- TOC entry 4893 (class 1259 OID 16467)
-- Name: ix_services_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_services_id ON public.services USING btree (id);


--
-- TOC entry 4905 (class 1259 OID 16520)
-- Name: ix_time_slots_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_time_slots_id ON public.time_slots USING btree (id);


--
-- TOC entry 4876 (class 1259 OID 16400)
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- TOC entry 4877 (class 1259 OID 16401)
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- TOC entry 4926 (class 2606 OID 16484)
-- Name: bookings bookings_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- TOC entry 4927 (class 2606 OID 16568)
-- Name: bookings bookings_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;


--
-- TOC entry 4928 (class 2606 OID 16489)
-- Name: bookings bookings_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.service_providers(id);


--
-- TOC entry 4929 (class 2606 OID 16494)
-- Name: bookings bookings_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- TOC entry 4930 (class 2606 OID 16524)
-- Name: bookings bookings_time_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_time_slot_id_fkey FOREIGN KEY (time_slot_id) REFERENCES public.time_slots(id) ON DELETE SET NULL;


--
-- TOC entry 4935 (class 2606 OID 16590)
-- Name: chat_sessions chat_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- TOC entry 4932 (class 2606 OID 16545)
-- Name: payments payments_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id);


--
-- TOC entry 4933 (class 2606 OID 16550)
-- Name: payments payments_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- TOC entry 4934 (class 2606 OID 16555)
-- Name: payments payments_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.service_providers(id);


--
-- TOC entry 4924 (class 2606 OID 16442)
-- Name: portfolio_items portfolio_items_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portfolio_items
    ADD CONSTRAINT portfolio_items_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.service_providers(id);


--
-- TOC entry 4925 (class 2606 OID 16462)
-- Name: services services_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.service_providers(id);


--
-- TOC entry 4931 (class 2606 OID 16515)
-- Name: time_slots time_slots_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.time_slots
    ADD CONSTRAINT time_slots_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- TOC entry 4936 (class 2606 OID 16614)
-- Name: user_messages user_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_messages
    ADD CONSTRAINT user_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON DELETE SET NULL;


--
-- TOC entry 4937 (class 2606 OID 16609)
-- Name: user_messages user_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_messages
    ADD CONSTRAINT user_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.customers(id) ON DELETE CASCADE;


-- Completed on 2025-12-09 22:55:28

--
-- PostgreSQL database dump complete
--

\unrestrict Z2NOTYKVThbrdPnabkaZ8sXzjVwaQFEUJ1XgtASjB1sGDq2THM6uxceMsVNY3vz

